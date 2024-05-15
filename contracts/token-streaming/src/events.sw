library;

// EVENTS
pub struct CancelStream {
    stream_id: u64,
    sender_asset: AssetId,
    receiver_asset: AssetId,
    unvested_recipient: Identity,
    unvested_balance: u64,
    vested_balance: u64,
}

pub struct CreateStream {
    stream_id: u64,
    sender: Identity,
    underlying_asset: AssetId,
    receiver: Identity,
    receiver_asset: AssetId,
    sender_asset: AssetId,
    deposit: u64,
    stream_size: u64,
    start_time: u64,
    stop_time: u64,
}
