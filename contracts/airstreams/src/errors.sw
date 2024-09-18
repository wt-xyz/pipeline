library;

pub enum AccessError {
    CallerNotOwner: (),
    CallerNotPendingOwner: (),
    Paused: (),
    AirdropDone: (),
    AirdropActive: (),
    AlreadyClaimed: (),
    AlreadyInitialized: (),
}

pub enum VerificationError {
    AccountIdToLarge: (),
    IncorrectAccount: (),
    InvalidProof: (),
    NoSigner: (),
    InvalidWitnessIndex: (),
}

pub enum InputError {
    InvalidOwner: (),
    InvalidClaimAmount: (),
    InvalidVestedAmount: (),
}
