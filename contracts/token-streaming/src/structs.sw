library;

// STRUCTS
pub struct Stream {
    deposit: u64,
    // This rate needs to be multiplied by 10^10 to preserve precision, 
    rate_per_second_e_10: u256,
    stream_size: u64,
    vested_withdrawn_amount: u64,
    start_time: u64,
    stop_time: u64,
    underlying_asset: AssetId,
    receiver_asset: AssetId,
    sender_asset: AssetId,
    cancellation_time: Option<u64>,
    configuration: StreamConfiguration,
}

pub enum SenderOrReceiver {
    Sender: (),
    Receiver: (),
}

// vault info used to store information about a specific vault, this does not include anything that should be meta data
pub struct VaultInfo {
    // Vault sub id
    vault_sub_id: SubId,
    // the asset type being managed by the vault
    asset: AssetId,
    stream_id: u64,
    sender_or_receiver: SenderOrReceiver,
}

pub struct StreamConfiguration {
    is_cancellable: bool,
    is_undercollateralized: bool,
}
