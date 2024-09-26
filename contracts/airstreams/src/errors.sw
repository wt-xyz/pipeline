library;

pub enum AccessError {
    // caller, owner
    CallerNotOwner: (Address, Address),
    // caller, pending owner
    CallerNotPendingOwner: (Address, Address),
    Paused: (),
    // current timestamp, stop time
    AirdropDone: (u64, u64),
    // current timestamp, start time
    AirdropActive: (u64, u64),
    // tree_index
    AlreadyClaimed: (u64),
    AlreadyInitialized: (),
}

pub enum VerificationError {
    // account_id
    AccountIdToLarge: (b256),
    // account_id, expected_account_id
    IncorrectAccount: (b256, b256),
    InvalidProof: (),
    // witness_index, 
    InvalidWitnessIndex: (u64),
}

pub enum InputError {
    // owner_input
    InvalidOwner: (Address),
    // claim_amount, remaining_vested_amount
    InvalidClaimAmount: (u64, u64),
    // vested_amount, previous_claim_amount
    InvalidVestedAmount: (u64, u64),
}
