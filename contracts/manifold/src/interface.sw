library;

use ::structs::SignatureType;

abi ManifoldAbi {
    /// Claim an airdrop allocation
    /// @param claim_amount - The amount to claim
    /// @param total_amount - The total amount of the airdrop (used to verify the merkle proof)
    /// @param idenity - The account to claim for (fuel address, evm address)
    /// @param tree_index - The index of the allocation in the merkle tree
    /// @param proof - The merkle proof
    /// @param recipient - The recipient identity of the tokens
    /// @param signature_type - The type of signature used, evm or fuel
    ///
    /// Not listed as a parameter but if the signature type is evm, then the witness[witness_index] must be the evm signature from a evm connector signer
    ///
    /// @return The amount claimed
    #[storage(read, write)]
    fn claim(
        claim_amount: u64,
        total_amount: u64,
        identity: b256,
        tree_index: u64,
        proof: Vec<b256>,
        recipient: Identity,
        signature_type: SignatureType,
    ) -> u64;

    #[storage(read)]
    fn amount_claimed(tree_index: u64) -> u64;

    #[storage(read)]
    fn percentage_vested_e6() -> u64;

    /// Get end time of the airdrop
    ///
    /// @return The end time of the airdrop in Tai64 format
    fn end_time() -> u64;

    /// Get the merkle root of the airdrop
    ///
    /// @return The merkle root
    fn merkle_root() -> b256;

    /// Get the owner of the contract
    /// Owner has special permissions to pause the contract, transfer ownership and clawback funds
    ///
    /// @return The owner identity
    #[storage(read)]
    fn owner() -> Option<Identity>;

    /// Start the transfer of ownership of the contract
    /// Only the owner can initiate an ownership transfer
    /// For transfer to be completed the new owner must confirm ownership
    ///
    /// @param new_owner - The new owner identity
    #[storage(read, write)]
    fn initiate_transfer_ownership(new_owner: Identity);

    /// Confirm the transfer of ownership of the contract
    /// Only the new owner can confirm ownership
    /// Current owner must have initiated the transfer
    ///
    #[storage(read, write)]
    fn confirm_transfer_ownership();

    /// Initialize the contract
    /// Sets the storage slot for owner to the value of the configurable constant
    /// Only callable once
    #[storage(read, write)]
    fn initialize();

    /// Get the paused state of the contract
    /// If the contract is paused, no claims can be made
    ///
    /// @return True if paused, false otherwise
    #[storage(read)]
    fn is_paused() -> bool;

    /// Set the paused state of the contract
    /// Only the owner can pause the contract
    ///
    /// @param paused - The new paused state
    #[storage(read, write)]
    fn set_paused(paused: bool);

    /// Clawback all unclaimed funds from the contract to a recipient
    /// Only the owner can clawback funds
    ///
    /// @param recipient - The recipient identity to clawback to
    ///
    /// @return The amount clawed back
    #[storage(read)]
    fn clawback(recipient: Identity, asset_id: AssetId) -> u64;
}
