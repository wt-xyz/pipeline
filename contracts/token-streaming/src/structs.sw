library;

use libraries::structs::VestingCurve;

// STRUCTS
pub struct Stream {
    pub deposit: u64,
    pub stream_size: u64,
    pub vested_withdrawn_amount: u64,
    pub start_time: u64,
    pub stop_time: u64,
    pub underlying_asset: AssetId,
    pub receiver_asset: AssetId,
    pub sender_asset: AssetId,
    pub cancellation_time: Option<u64>,
    pub configuration: StreamConfiguration,
    pub vesting_curve_id: b256,
}

pub enum SenderOrReceiver {
    Sender: (),
    Receiver: (),
}

// vault info used to store information about a specific vault, this does not include anything that should be meta data
pub struct VaultInfo {
    // Vault sub id
    pub vault_sub_id: SubId,
    // the asset type being managed by the vault
    pub asset: AssetId,
    pub stream_id: u64,
    pub sender_or_receiver: SenderOrReceiver,
}

pub struct StreamConfiguration {
    pub is_cancellable: bool,
    pub is_undercollateralized: bool,
    pub vesting_curve: VestingCurve,
}
