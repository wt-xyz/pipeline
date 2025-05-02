library;

use ::structs::*;

// EVENTS
pub struct CancelStream {
    pub stream_id: u64,
    pub sender_asset: AssetId,
    pub receiver_asset: AssetId,
    pub unvested_recipient: Identity,
    pub unvested_balance: u64,
    pub vested_balance: u64,
}

pub struct CreateStream {
    pub stream_id: u64,
    pub sender: Identity,
    pub underlying_asset: AssetId,
    pub receiver: Identity,
    pub receiver_asset: AssetId,
    pub sender_asset: AssetId,
    pub deposit: u64,
    pub stream_size: u64,
    pub start_time: u64,
    pub stop_time: u64,
    pub configuration: StreamConfiguration,
    pub vesting_curve_id: b256,
}
