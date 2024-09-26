library;

// SDKs are not properly interpreting errors with parameters
// Thus we are just using error names for this implementation
pub enum Error {
    // Stream ID
    NonExistentStream: (u64),
    // Start time, Stop time
    InvalidDates: (u64, u64),
    // Current timestamp, Start time
    DateTooEarly: (u64, u64),
    // Address
    SelfAddress: (Address),
    ZeroAddress: (),
    ZeroDeposit: (),
    // Stream ID
    StreamDoesNotExist: (u64),
    // Vault ID
    VaultDoesNotExist: (AssetId),
    // Sent asset, Actual asset
    NotReceiver: (AssetId, AssetId),
    InsufficientBalance: (u64, u64),
    InsufficientShares: (),
    // Cancellation time
    StreamAlreadyCancelled: (u64),
    // Address
    NotSender: (AssetId, AssetId),
    // Sent amount, Required amount
    NotEnoughCoins: (u64, u64),
    DepositsBlocked: (),
    // Received asset, actual asset
    InvalidAsset: (AssetId, AssetId),
    // Sent amount, required amount
    IncorrectDeposit: (u64, u64),
    NotCancellable: (),
}
