library;

// SDKs are not properly interpreting errors with parameters
// Thus we are just using error names for this implementation
pub enum Error {
    NonExistentStream: (),
    InvalidDates: (),
    DateTooEarly: (),
    SelfAddress: (),
    ZeroAddress: (),
    ZeroDeposit: (),
    StreamDoesNotExist: (),
    VaultDoesNotExist: (),
    NotReceiver: (),
    InsufficientBalance: (),
    InsufficientShares: (),
    StreamAlreadyCancelled: (),
    NotSender: (),
    NotEnoughCoins: (),
    DepositsBlocked: (),
    InvalidAsset: (),
    IncorrectDeposit: (),
    NotCancellable: (),
}
