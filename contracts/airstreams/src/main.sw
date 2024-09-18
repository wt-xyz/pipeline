contract;

mod structs;
mod interface;
mod events;
mod errors;
mod personal_sign;

use structs::{
    EVMSignatureType,
    FuelSignatureType,
    SignatureType,
};
use ::interface::AirstreamAbi;
use ::events::{
    ClaimEvent,
    ClawbackEvent,
    OwnershipTransferEvent,
    OwnershipTransferInitiatedEvent,
    PauseChangeEvent,
};
use ::errors::{AccessError, VerificationError, InputError};
use ::personal_sign::personal_sign_hash;
use libraries::{
    interface::VestingCurveRegistry,
    constants::E6,
    structs::VestingCurve,
};
use std::{
    address::Address,
    asset::transfer,
    block::timestamp,
    constants::ZERO_B256,
    context::this_balance,
    hash::{
        Hash,
        Hasher,
        keccak256,
        sha256,
    },
    identity::Identity,
    tx::{
        tx_id,
        tx_witness_data,
    },
    vm::evm::ecr::ec_recover_evm_address,
};
use sway_libs::merkle::binary_proof::{leaf_digest, verify_proof};

configurable {
    MERKLE_ROOT: b256 = ZERO_B256,
    ASSET: AssetId = AssetId::from(ZERO_B256),
    START_TIME: u64 = 0,
    END_TIME: u64 = 0,
    NUM_LEAVES: u64 = 0,
    INITIAL_OWNER: Option<Identity> = Option::None,
    VESTING_CURVE_REGISTRY_ID: ContractId = ContractId::zero(),
    VESTING_CURVE: VestingCurve = VestingCurve::Linear,
}

storage {
    owner: Option<Identity> = Option::None,
    pending_owner: Option<Identity> = Option::None,
    claims: StorageMap<u64, u64> = StorageMap {},
    is_paused: bool = false,
    is_initialized: bool = false,
    vesting_curve_id: b256 = ZERO_B256,
}

impl AirstreamAbi for Contract {
    #[storage(read, write)]
    fn claim(
        claim_amount: u64,
        total_claim_amount: u64,
        identity: b256,
        tree_index: u64,
        proof: Vec<b256>,
        recipient: Identity,
        signature_type: SignatureType,
    ) -> u64 {

        can_claim();

        // Contract should not be paused, not past the end date, and the tree_index should be unclaimed
        // Check the validity of the signatures based on type
        match signature_type {
            SignatureType::EVM(EVMSignatureType{witness_index}) => {
                // recover the signer address from the signature
                // signature is personal signed hash of tx_id signed by the evm connector signer
                let witness_data = tx_witness_data(witness_index);
                require(witness_data.is_some(), VerificationError::InvalidWitnessIndex);
                let recovered_identity = ec_recover_evm_address(witness_data.unwrap(), personal_sign_hash(tx_id())).unwrap();
                require(identity == recovered_identity.into(), VerificationError::IncorrectAccount);
            }
            SignatureType::FUEL => {
                // verify the regular fuel signature
                let sender_b256: b256 = match (msg_sender().unwrap()) {
                    Identity::Address(address) => {
                        address.into()
                    },
                    Identity::ContractId(contract_id) => {
                        contract_id.into()
                    }
                };
                require(identity == sender_b256, VerificationError::IncorrectAccount);
            }
        }

        // Verify the merkle proof
        let leaf_hash = _get_leaf_hash(identity, claim_amount);

        let merkle_proof_result = verify_proof(
            tree_index,
            leaf_digest(leaf_hash),
            MERKLE_ROOT,
            NUM_LEAVES,
            proof,
        );

        require(merkle_proof_result, VerificationError::InvalidProof);

        let previous_claim_amount = storage.claims.get(tree_index).try_read().unwrap_or(0);

        let vesting_curve_id = storage.vesting_curve_id.read();
        let vesting_curve_registry = abi(VestingCurveRegistry, VESTING_CURVE_REGISTRY_ID.into());
        let vested_amount = vesting_curve_registry.vested_amount(vesting_curve_id, total_claim_amount, timestamp(), START_TIME, END_TIME);

        require(vested_amount >= previous_claim_amount, InputError::InvalidVestedAmount);

        let remaining_vested_amount = vested_amount - previous_claim_amount;

        require(remaining_vested_amount >= claim_amount, InputError::InvalidClaimAmount);

        // mark the index as partially claimed
        storage.claims.insert(tree_index, previous_claim_amount + claim_amount);

        // Transfer the funds to the recipient
        transfer(recipient, ASSET, claim_amount);

        log(ClaimEvent {
            amount: claim_amount,
            claimer: identity,
            tree_index,
            to: recipient,
        });

        claim_amount
    }

    #[storage(read)]
    fn amount_claimed(tree_index: u64) -> u64 {
        let fallback_value: u64 = 0;
        storage.claims.get(tree_index).try_read().unwrap_or(fallback_value)
    }

    #[storage(read)]
    fn percentage_vested_e6() -> u64 {
        let vesting_curve_registry = abi(VestingCurveRegistry, VESTING_CURVE_REGISTRY_ID.into());
        let vesting_curve_id = storage.vesting_curve_id.read();
        vesting_curve_registry.vested_amount(vesting_curve_id, 100*E6, timestamp(), START_TIME, END_TIME)
    }

    fn end_time() -> u64 {
        END_TIME
    }
    fn merkle_root() -> b256 {
        MERKLE_ROOT
    }
    #[storage(read)]
    fn owner() -> Option<Identity> {
        _owner()
    }
    #[storage(read, write)]
    fn initiate_transfer_ownership(new_owner: Identity) {
        // Only the owner can transfer ownership
        only_owner();

        // Require that new_owner is not 0 address
        require(
            new_owner != Identity::Address(Address::from(ZERO_B256)),
            InputError::InvalidOwner,
        );

        storage.pending_owner.write(Some(new_owner));
        log(OwnershipTransferInitiatedEvent {
            from: _owner(),
            to: new_owner,
        })
    }
    #[storage(read, write)]
    fn confirm_transfer_ownership(){
        // only the pending owner can confirm the transfer
        only_pending_owner();

        let old_owner = _owner().unwrap();

        let new_owner = storage.pending_owner.read().unwrap();

        storage.owner.write(Some(new_owner));
        storage.pending_owner.write(None);
        log(OwnershipTransferEvent {
            from: old_owner,
            to: new_owner,
        })
    }

    #[storage(read)]
    fn is_paused() -> bool {
        _is_paused()
    }
    #[storage(read, write)]
    fn set_paused(paused: bool) {
        // Only the owner can pause the contract
        only_owner();
        storage.is_paused.write(paused);
        log(PauseChangeEvent {
            is_paused: paused,
        })
    }
    #[storage(read)]
    fn clawback(recipient: Identity, asset_id: AssetId) -> u64 {
        // Only the owner can clawback funds
        only_owner();

        let balance = this_balance(asset_id);

        // Transfer the remaining funds to the recipient
        transfer(recipient, asset_id, balance);

        log(ClawbackEvent {
            asset_id: asset_id,
            amount: balance,
            to: recipient,
        });

        balance
    }

    #[storage(read, write)]
    fn initialize() {
        // initialize can only be called once
        only_uninitialized();

        // get the vesting curve_id from the vesting curve registry
        let vesting_curve_registry = abi(VestingCurveRegistry, VESTING_CURVE_REGISTRY_ID.into());
        let vesting_curve_id = vesting_curve_registry.register_vesting_curve(VESTING_CURVE);
        storage.vesting_curve_id.write(vesting_curve_id);

        // Copy the initial owner and signer values to storage
        storage.owner.write(INITIAL_OWNER);
        storage.is_initialized.write(true);
    }
}

#[storage(read)]
fn _owner() -> Option<Identity> {
    storage.owner.read()
}

#[storage(read)]
fn can_claim(){
    require(!_is_paused(), AccessError::Paused);
    require(_is_airdrop_active(), AccessError::AirdropDone);
}

#[storage(read)]
fn only_owner() {
    require(
        _owner()
            .unwrap() == msg_sender()
            .unwrap(),
        AccessError::CallerNotOwner,
    )
}

#[storage(read)]
fn only_pending_owner() {
    require(
        storage.pending_owner.read().unwrap() == msg_sender().unwrap(),
        AccessError::CallerNotPendingOwner,
    )
}

#[storage(read)]
fn _is_initialized() -> bool {
    storage.is_initialized.try_read().unwrap_or(false)
}

#[storage(read)]
fn only_uninitialized() {
    require(!_is_initialized(), AccessError::AlreadyInitialized)
}

#[storage(read)]
fn _is_paused() -> bool {
    storage.is_paused.try_read().unwrap_or(true)
}

fn _is_airdrop_active() -> bool {
    let current_timestamp = timestamp();
    current_timestamp <= END_TIME
}

fn _get_leaf_hash(identity: b256, amount: u64) -> b256 {
    let leaf_params = (identity, amount);
    sha256(leaf_params)
}