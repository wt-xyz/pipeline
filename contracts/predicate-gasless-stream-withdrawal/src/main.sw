predicate;

use std::{
  b512::B512,
  constants::ZERO_B256,
  ecr::ec_recover_address,
  hash::{
    Hash,
    sha256,
  },
  inputs::{
    Input,
    input_asset_id,
    input_coin_owner,
    input_count,
    input_type,
  },
  outputs::{
      Output,
      output_asset_id,
      output_count,
      output_type,
      output_asset_to
  },
  tx::{
      tx_id,
      tx_script_bytecode_hash,
      tx_script_length,
      tx_witness_data,
      tx_witnesses_count,
  },
};


configurable {
  ADMIN: Address = Address::from(ZERO_B256),
  EXPECTED_SCRIPT_BYTECODE_HASH: b256 = ZERO_B256,
  STREAMING_CONTRACT_ID: ContractId = ContractId::from(ZERO_B256),
  // Limit for use on a specific asset
  STREAM_ID: u64 = 0_u64,
}

const GTF_INPUT_CONTRACT_CONTRACT_ID = 0x113;

fn main(admin_witness_index: Option<u64>) -> bool {
  // ADMIN CHECK
  // If the signer is the admin then they can do whatever they want with it
  if (check_admin(admin_witness_index)){
    return true;
  } 
   // SCRIPT CHECK
  // If not an admin we need top fulfill the following
  // The script bytecode must match
  if (!matches_script(EXPECTED_SCRIPT_BYTECODE_HASH)){
    return false;
  }


  // CHECK THE INPUTS
  // Gas input included
  // Streaming ContractId included
  // Receiver or Sender token included
  if (!valid_inputs()){
    return false;
  }


  // CHECK THE OUTPUTS
  // Gas needs to go back to the predicate
  // Gas change output -> predicate
  // No eth coin output
  if (!valid_outputs()){
    return false;
  }


  return true;

}

// TODO duplicated from contract
fn vault_asset_id(vault_sub_id: SubId) -> AssetId {
    let share_asset_id = AssetId::new(ContractId::this(), vault_sub_id);
    share_asset_id
}

fn predicate_address() -> Address {
    let predicate_index = asm(r1) {
        gm r1 i3;
        r1: u64
    };
    input_coin_owner(predicate_index).unwrap()
}

fn input_contract_id(index: u64) -> Option<ContractId> {
    match input_type(index) {
        Input::Contract => {
            let addr_ptr = __gtf::<raw_ptr>(index, GTF_INPUT_CONTRACT_CONTRACT_ID);
            // Why do I have to add 2?
            Some(addr_ptr.add::<u64>(2).read::<ContractId>())
        },
        _ => None,
    }
}

fn check_admin(admin_witness_index: Option<u64>) -> bool {
    let is_admin = if let Some(index) = admin_witness_index {
        let signature: B512 = tx_witness_data(index);
        if let Ok(signer_address) = ec_recover_address(signature, sha256(tx_id())) {
            signer_address == ADMIN
        } else {
            false
        }
    } else {
        false
    };

    is_admin
}

fn matches_script(expected_script_bytecode_hash: b256) -> bool {
  if (tx_script_length() > 0) {
    let script_bytecode_hash: b256 = tx_script_bytecode_hash();
    script_bytecode_hash == expected_script_bytecode_hash
  } else {
    false
  }
}


fn valid_inputs() -> bool {
  let base_asset = AssetId::from(ZERO_B256);
  // Derive the expected receiver and sender tokens
  // TODO This should be a library method used by both the script and the contract
  let receiver_sub_id = sha256(STREAM_ID);
  let sender_sub_id = sha256(STREAM_ID + 1);
  let receiver_asset = vault_asset_id(receiver_sub_id);
  let sender_asset = vault_asset_id(sender_sub_id);

  let num_inputs = input_count().as_u64();
  let mut i = 0;

  let mut receiver_token_was_included = false;
  let mut sender_token_was_included = false;

  while i < num_inputs {
    match input_type(i){
      // The streaming contract needs to be the only contract included
      Input::Contract => {
        let contract_id = input_contract_id(i).unwrap();
        if (contract_id != STREAMING_CONTRACT_ID){
          return false;
        }
      },
      // Only receiver, sender and gas tokens should be included
      Input::Coin => {
        let asset_id = input_asset_id(i).unwrap();
        if asset_id == receiver_asset {
          receiver_token_was_included = true;
        } else if asset_id == sender_asset {
          sender_token_was_included = true;
        } else if asset_id != base_asset {
          return false;
        }
      },
      Input::Message => {
        return false;
      }
    }

    i = i + 1;
  }

// Either the receiver or sender token MUST be included
  sender_token_was_included || receiver_token_was_included
}


fn valid_outputs() -> bool {
  let num_outputs = output_count();
  let mut returns_eth_to_predicate = false;
  let predicate_addr = predicate_address();

  let mut i = 0;

  while i < num_outputs {
    match output_type(i) {
      Output::Coin => {
        // ETH must not be returned to anyone other than the predicate and for now that is only done through change
        let asset_id = output_asset_id(i).unwrap();
        if asset_id == AssetId::from(ZERO_B256) {
          return false;
        }
      },
      Output::Change => {
        // Change can only be ETH for gas
        let asset_id = output_asset_id(i).unwrap();
        if (asset_id != AssetId::from(ZERO_B256)) {
            return false;
        }
        let to = Address::from(output_asset_to(i).unwrap());
        // Change must go back to predicate
        if (to != predicate_addr) {
            return false;
        }
        returns_eth_to_predicate = true;
      },
      Output::Variable => (),
      Output::Contract => (),
    }

    i = i + 1;
  }
  returns_eth_to_predicate
}
