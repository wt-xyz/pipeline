library;

use ::structs::*;

/// ABI defining methods for a token streaming contract 
/// 
/// The contract is designed to allow for the creation of streams of tokens, which can be withdrawn from by the recipient
/// at any time. The sender can also cancel the stream, which will return the unvested tokens to the sender.
/// 
abi Pipeline {
    /// Returns the stream with the given id
    ///
    /// # Arguments
    ///
    /// * `stream_id` - The id of the stream to return.
    #[storage(read)]
    fn get_stream(stream_id: u64) -> Stream;

    /// Returns the stream with the given vault share id, and the stream id
    ///
    /// # Arguments
    ///
    /// * `vault_share_id` - The id of the vault share to return.
    #[storage(read)]
    fn get_stream_by_vault_share_id(vault_share_id: AssetId) -> (Stream, u64);

    /// Returns the vault info for the given vault share id
    #[storage(read)]
    fn get_vault_info(vault_share_id: AssetId) -> VaultInfo;

    /// Creates a new stream
    ///
    /// Returns the id of the new stream
    /// 
    /// #  Arguments
    ///
    /// * `sender_share_recipient` - The identity that the sender share will be sent to
    /// * `receiver_share_recipient` - The identity that the receiver share will be sent to
    /// * `start_time` - The time at which the stream will start
    /// * `stop_time` - The time at which the stream will stop
    /// * `vesting_curve` - The vesting curve to use for the stream
    #[storage(read, write), payable]
    fn create_stream(sender_share_recipient: Identity, receiver_share_recipient: Identity, start_time: u64, stop_time: u64, deposit: u64, configuration: StreamConfiguration) -> u64;

    /// Withdraws a specified number of tokens from a stream
    ///
    /// Returns the number of tokens withdrawn
    /// 
    /// # Arguments
    ///
    /// * `receiver` - The identity that the withdrawn tokens will be sent to
    /// * `amount` - The amount of tokens to withdraw
    /// 
    /// # Call Params
    ///
    /// * `asset_id` - The id of share asset to withdraw from
    /// * `amount` - The amount of share tokens to redeem
    #[payable]
    #[storage(read, write)]
    fn partial_withdraw_from_stream(
        receiver: Identity,
        amount: u64,
    ) -> u64;

    /// Cancels a stream, returning the unvested tokens to a specified identity
    ///
    /// Returns the number of tokens returned to the sender
    ///
    /// # Arguments
    ///
    /// * `unvested_receiver` - The identity that the unvested tokens will be sent to
    ///
    /// # Call Params
    ///
    /// * `asset_id` - The id of the vault share to redeem
    /// * `amount` - The number of tokens to redeem
    #[payable]
    #[storage(read, write)]
    fn cancel_stream(unvested_receiver: Identity) -> u64;

    /// Returns the underlying asset for a given vault share id
    ///
    /// # Arguments
    ///
    /// * `vault_share_id` - The id of the vault share to return the underlying asset for
    #[storage(read)]
    fn underlying_asset(vault_share_id: AssetId) -> AssetId;

    /// Returns whether or not the stream is solvent
    ///
    /// # Arguments
    ///
    /// * `stream_id` - The stream to check the solvency of
    #[storage(read)]
    fn is_solvent(stream_id: u64) -> bool;

    /// Returns the total amount vested
    ///
    /// # Arguments
    ///
    /// * `stream_id` - The stream to check the total vested amount of
    #[storage(read)]
    fn vested_amount(stream_id: u64) -> u64;
}
