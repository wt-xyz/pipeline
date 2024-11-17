contract;

mod events;
mod structs;
mod errors;
mod interface;

use ::events::{CancelStream, CreateStream};
use ::structs::{SenderOrReceiver, Stream, VaultInfo, StreamConfiguration};
use libraries::{
    interface::VestingCurveRegistry,
    structs::VestingCurve
};

use ::errors::{Error};
use ::interface::Pipeline;
// Standard interfaces

use standards::{
    src20::SRC20,
    src6::{
        SRC6, Withdraw, Deposit
    }
};

use std::{
    asset::transfer,
    auth::msg_sender,
    block::timestamp,
    call_frames::{
        msg_asset_id,
    },
    convert::{
        TryFrom
    },
    constants::{
        ZERO_B256,
    },
    context::{
        msg_amount,
    },
    hash::{
        Hash,
        sha256,
    },
    logging::log,
    storage::storage_string::*,
    string::String,
    primitive_conversions::u64::*
};

configurable {
    // vesting curve registry contract address
    VESTING_CURVE_REGISTRY: ContractId = ContractId::zero(),
}

storage {
    // SRC-20 related storage
    total_assets: u64 = 0,
    total_supply: StorageMap<AssetId, u64> = StorageMap {},
    // SRC-6 related storage
    vault_info: StorageMap<AssetId, VaultInfo> = StorageMap {},
    // storage slots not related to standards
    streams: StorageMap<u64, Stream> = StorageMap::<u64, Stream> {},
}

impl Pipeline for Contract {
    /// Returns the details of a stream by it's id
    ///
    /// # Arguments
    ///
    /// * `stream_id` - The id of the stream
    ///
    #[storage(read)]
    fn get_stream(stream_id: u64) -> Stream {
        return get_stream(stream_id);
    }

    /// Returns the details of a stream by it's share asset id and the stream id
    ///
    /// # Arguments
    ///
    /// * `vault_share_asset_id` - The share asset id of the vault
    ///
    #[storage(read)]
    fn get_stream_by_vault_share_id(vault_share_asset_id: AssetId) -> (Stream, u64) {
        let vault_info = get_vault_info(vault_share_asset_id);
        let stream = get_stream(vault_info.stream_id);
        (stream, vault_info.stream_id)
    }

    /// Returns the details of a vault by it's share asset id
    ///
    /// # Arguments
    ///
    /// * `vault_share_asset_id` - The share asset id of the vault
    ///
    #[storage(read)]
    fn get_vault_info(share_asset_id: AssetId) -> VaultInfo {
        return get_vault_info(share_asset_id);
    }


    /// Withdraw a certain amount from a specific stream
    /// Only callable by providing one receiver share asset 
    /// Returns the amount of shares that have be withdrawn from a given vault
    ///
    /// # Arguments
    ///
    /// * `receiver` - The contract or account that will receive the withdrawn tokens
    /// * `amount` - The amount of shares to be withdrawn
    /// 
    /// # Call Params
    /// * `amount` - Must be one to verify ownership of the receiver share asset
    /// * `asset_id` - The receiver share asset
    #[payable]
    #[storage(read, write)]
    fn partial_withdraw_from_stream(receiver: Identity, amount: u64) -> u64 {
        partial_withdraw_from_stream(receiver, amount)
    }

    /// Cancel a stream and return the unvested balance to the sender
    /// Only callable by providing one sender share asset
    /// Returns the amount of shares that have be withdrawn from a given vault
    ///
    /// # Arguments
    ///
    /// * `unvested_recipient` - The contract or account that will receive the unvested tokens
    ///
    /// # Call Params
    /// * `amount` - Must be one to verify ownership of the sender share asset
    /// * `asset_id` - The sender share asset
    #[payable]
    #[storage(read, write)]
    fn cancel_stream(unvested_recipient: Identity) -> u64 {
        cancel_stream(unvested_recipient)
    }

    /// Create a new stream
    /// Returns the id of the new stream
    ///
    /// The underlying asset is received
    /// A new stream is created
    /// Two new vaults are created, one for the sender and one for the receiver
    /// The sender and receiver share assets are minted and sent to the sender and receiver respectively
    ///
    /// # Arguments
    ///
    /// * `sender_share_recipient` - The contract or account that will receive the sender share tokens
    /// * `receiver_share_recipient` - The contract or account that will receive the receiver share tokens
    /// * `start_time` - The time at which the stream will start
    /// * `stop_time` - The time at which the stream will stop
    /// * `stream_size` - The total amount of assets to be distributed over the period
    /// * `configuration` - Variables determining if a stream is cancellable or not
    ///
    /// # Call Params
    /// * `amount` - The amount of the underlying asset to be deposited
    /// * `asset_id` - The underlying asset
    #[payable]
    #[storage(read, write)]
    fn create_stream(
        sender_share_recipient: Identity,
        receiver_share_recipient: Identity,
        start_time: u64,
        stop_time: u64,
        stream_size: u64,
        configuration: StreamConfiguration,
    ) -> u64 {

        create_stream(sender_share_recipient, receiver_share_recipient, start_time, stop_time, stream_size, configuration)
        // get the asset_id
    }

    /// Returns the underlying asset of a given vault by its share asset
    ///
    /// # Arguments
    ///
    /// * `vault_share_asset` - The share asset id of the vault
    ///
    #[storage(read)]
    fn underlying_asset(vault_share_asset: AssetId) -> AssetId {
        let vault_info = get_vault_info(vault_share_asset);
        return vault_info.asset
    }

    #[storage(read)]
    fn is_solvent(stream_id: u64) -> bool {
      is_solvent(stream_id)
    }

    #[storage(read)]
    fn vested_amount(stream_id: u64) -> u64 {
        let stream = get_stream(stream_id);

        vested_amount(stream)
    }
}

impl SRC20 for Contract {
    /// Returns the total number of different assets minted by the contract
    #[storage(read)]
    fn total_assets() -> u64 {
        storage.total_assets.try_read().unwrap_or(0)
    }
    /// Returns the total supply of a given asset
    ///
    /// # Arguments
    ///
    /// * `asset` - The asset id of the asset
    ///
    #[storage(read)]
    fn total_supply(asset: AssetId) -> Option<u64> {
      storage.total_supply.get(asset).try_read()
    }

    /// Returns the name of a given asset
    ///
    /// # Arguments
    ///
    /// * `asset` - The asset id of the asset
    ///
    #[storage(read)]
    fn name(asset: AssetId) -> Option<String> {
        // FIXME placeholder
        let sender_or_receiver = get_sender_or_receiver(asset);
         match(sender_or_receiver){
          Some(SenderOrReceiver::Sender) => Some(String::from_ascii_str("Pipeline Stream Sending Token")),
          Some(SenderOrReceiver::Receiver) => Some(String::from_ascii_str("Pipeline Stream Receiving Token")),
          None => None,
        }
    }

    /// Returns the symbol of a given asset
    ///
    /// # Arguments
    ///
    /// * `asset` - The asset id of the asset
    ///
    #[storage(read)]
    fn symbol(asset: AssetId) -> Option<String> {
        // FIXME placeholder
        let sender_or_receiver = get_sender_or_receiver(asset);
        match(sender_or_receiver){
          Some(SenderOrReceiver::Sender) => Some(String::from_ascii_str("sPipeline")),
          Some(SenderOrReceiver::Receiver) => Some(String::from_ascii_str("rPipeline")),
          None => None,
        }
    }


    /// Returns 0 for the number of decimals for any asset as they are all NFTs
    ///
    /// # Arguments
    ///
    /// * `asset` - The asset id of the asset
    ///
    #[storage(read)]
    fn decimals(_asset: AssetId) -> Option<u8> {
        Some(0u8)
    }
}

impl SRC6 for Contract {
    /// Deposits are blocked in this contract
    /// Thus this is a function defined to comply with SRC-6 but it will always throw an error
    #[payable]
    #[storage(read, write)]
    fn deposit(receiver: Identity, vault_sub_id: SubId) -> u64 {
        // if it's not undercollateralized we can not make a deposit
        // get the stream by vault SubId
        let vault_share_id = vault_asset_id(vault_sub_id);
        let vault_info = get_vault_info(vault_share_id);
        let mut stream = get_stream(vault_info.stream_id);
        require(stream.configuration.is_undercollateralized, Error::DepositsBlocked);

        // check that the asset is correct
        let deposit_asset = msg_asset_id();
        require(deposit_asset == stream.underlying_asset, Error::InvalidAsset((deposit_asset, stream.underlying_asset)));

        // make the deposit
        let deposited_amount = msg_amount();

        let deposit_allowance = stream.stream_size - stream.deposit;

        require(deposit_allowance >= deposited_amount, Error::IncorrectDeposit((deposited_amount, deposit_allowance)));

        // EFFECTS
        stream.deposit = stream.deposit + deposited_amount;

        storage.streams.insert(vault_info.stream_id, stream);

        // INTERACTIONS
        // No changes need to be made, we are always consuming the entire UTXO
        log(Deposit {
            caller: msg_sender().unwrap(),
            underlying_asset: stream.underlying_asset,
            receiver: receiver,
            vault_sub_id: vault_sub_id,
            deposited_amount: deposited_amount,
            minted_shares: 0,
        });

        deposited_amount
    }

    /// Withdraw from the stream
    /// Calling this with a sender share asset will cancel the stream and return unvested tokens
    /// Calling this with a receiver share asset will withdraw the full amount of vested tokens
    /// 
    /// # Arguments
    ///
    /// * `receiver` - The contract or account that will receive the withdrawn tokens
    /// * `underlying_asset` - The asset id of the underlying asset
    /// * `vault_sub_id` - The sub id of the vault
    ///
    /// # Call Params
    /// * `amount` - Must be one to verify ownership of the receiver or sender share asset
    /// * `asset_id` - The receiver or sender share asset
    #[payable]
    #[storage(read, write)]
    fn withdraw(
        receiver: Identity,
        _underlying_asset: AssetId,
        _vault_sub_id: SubId,
    ) -> u64 {
        // withdraw for sender should result in stream cancellation
        let share_asset = msg_asset_id();

        // This check was removed as it doesn't actually gate this operation at all
        // let share_id = vault_asset_id(vault_sub_id);
        // require(share_id == share_asset, Error::InvalidAsset);

        let sender_or_receiver = get_sender_or_receiver(share_asset).unwrap();

        // different functions based on if it is a sender or a receiver
        match (sender_or_receiver) {
            SenderOrReceiver::Receiver => full_withdraw_from_stream(receiver),
            SenderOrReceiver::Sender => cancel_stream(receiver),
        }
    }

    /// Returns the balance of a given vault
    /// If the vault is a sender, the balance is the remaining unvested balance that can be withdrawn on cancellation
    /// If the vault is a receiver, the balance is the remaining vested balance that can be withdrawn
    /// 
    ///
    /// # Arguments
    ///
    /// * `underlying_asset` - The asset id of the underlying asset
    /// * `vault_sub_id` - The sub id of the vault
    ///
    #[storage(read)]
    fn managed_assets(_underlying_asset: AssetId, vault_sub_id: SubId) -> u64 {
        let share_asset = vault_asset_id(vault_sub_id);
        balance_of(share_asset)
    }

    /// Returns the maximum depositable amount for a given vault and receiver of share assets
    /// In V1 this deposits are disabled so this function will always return 0
    /// It is implemented to comply with the SRC-6 standard
    ///
    /// # Arguments
    ///
    /// * `receiver` - The contract or account that will receive the deposited tokens
    /// * `underlying_asset` - The asset id of the underlying asset
    /// * `vault_sub_id` - The sub id of the vault
    ///
    #[storage(read)]
    fn max_depositable(
        _receiver: Identity,
        _underlying_asset: AssetId,
        vault_sub_id: SubId,
    ) -> Option<u64> {
        let share_asset = vault_asset_id(vault_sub_id);

        match storage.vault_info.get(share_asset).try_read() {
            Some(vault_info) => {
                // Check the condition for early return
                if let SenderOrReceiver::Receiver = vault_info.sender_or_receiver  {
                    return Some(0);
                }

                let stream = get_stream(vault_info.stream_id);

                // Check the condition for undercollateralization
                if !stream.configuration.is_undercollateralized {
                    Some(0)
                } else {
                    Some(stream.stream_size - stream.deposit)
                }
            },
            None => None, // Directly return None if vault_info does not exist
        }
    }

    /// Returns the maximum withdrawable amount for a given vault
    /// This differs from the managed_assets
    ///
    /// # Arguments
    ///
    /// * `underlying_asset` - The asset id of the underlying asset
    /// * `vault_sub_id` - The sub id of the vault
    #[storage(read)]
    fn max_withdrawable(_underlying_asset: AssetId, vault_sub_id: SubId) -> Option<u64> {
        // calculate share asset id from vault sub id
        let share_asset = vault_asset_id(vault_sub_id);
        Some(balance_of(share_asset))
    }

}

#[storage(read, write)]
fn create_stream(sender_share_recipient: Identity, receiver_share_recipient: Identity, start_time: u64, stop_time: u64, stream_size: u64, configuration: StreamConfiguration) -> u64 {
        let underlying_asset = msg_asset_id();

        // get the amount of coins sent
        let deposit = msg_amount();

        // no stop time before start time
        require(start_time < stop_time, Error::InvalidDates((start_time, stop_time)));

        // no zero stream_size
        require(stream_size > 0, Error::ZeroDeposit);

        require(stream_size == deposit || configuration.is_undercollateralized && deposit <= stream_size , Error::IncorrectDeposit((deposit, stream_size)));



        let vesting_curve_registry = abi(VestingCurveRegistry, VESTING_CURVE_REGISTRY.into());
        let vesting_curve_id = vesting_curve_registry.register_vesting_curve(configuration.vesting_curve);

        // get and increment stream id
        let stream_id = storage.total_assets.try_read().unwrap_or(0);

        // create two new vaults, one for the sender tokens and one for the receiver token
        let receiver_sub_id = sha256(stream_id);
        let receiver_share_asset = vault_asset_id(receiver_sub_id);

        let receiver_vault_info = VaultInfo {
            vault_sub_id: receiver_sub_id,
            asset: receiver_share_asset,
            stream_id: stream_id,
            sender_or_receiver: SenderOrReceiver::Receiver,
        };
        storage
            .vault_info
            .insert(receiver_share_asset, receiver_vault_info);

        // Sender vault id will be odd
        let sender_sub_id = sha256(stream_id + 1);
        let sender_share_asset = vault_asset_id(sender_sub_id);
        let sender_vault_info = VaultInfo {
            vault_sub_id: sender_sub_id,
            asset: sender_share_asset,
            stream_id: stream_id,
            sender_or_receiver: SenderOrReceiver::Sender,
        };
        storage
            .vault_info
            .insert(sender_share_asset, sender_vault_info);

        // log a deposit of all of the tokens into the sender vault
        log(Deposit {
            caller: msg_sender().unwrap(),
            receiver: sender_share_recipient,
            underlying_asset: underlying_asset,
            vault_sub_id: sender_sub_id,
            deposited_amount: deposit,
            minted_shares: 1,
        });

        // log a deposit of all of the tokens into the receiver vault
        // This is always 0 as the receiver starts with no assets
        log(Deposit {
            caller: msg_sender().unwrap(),
            receiver: receiver_share_recipient,
            underlying_asset: underlying_asset,
            vault_sub_id: receiver_sub_id,
            deposited_amount: 0,
            minted_shares: 1,
        });

        log(CreateStream {
          stream_id: stream_id,
          sender: sender_share_recipient,
          receiver: receiver_share_recipient,
          sender_asset: sender_share_asset,
          receiver_asset: receiver_share_asset,
          underlying_asset,
          start_time,
          stop_time,
          configuration,
          deposit,
          stream_size,
          vesting_curve_id,
        });

        // create new stream
        let stream = Stream {
            sender_asset: sender_share_asset,
            receiver_asset: receiver_share_asset,
            deposit,
            stream_size,
            underlying_asset: underlying_asset,
            start_time,
            stop_time,
            vested_withdrawn_amount: 0,
            cancellation_time: None,
            configuration,
            vesting_curve_id,
        };

        // add stream to storage
        storage.streams.insert(stream_id, stream);

        // INTERACTIONS
        // mint the receiver token
        mint(
            receiver_share_recipient,
            receiver_share_asset,
            receiver_sub_id,
            1,
        );

        // mint the sender token
        mint(sender_share_recipient, sender_share_asset, sender_sub_id, 1);

        stream_id
}

#[storage(read, write)]
pub fn mint(
    receiver: Identity,
    asset_id: AssetId,
    vault_sub_id: SubId,
    amount: u64,
) {
    use std::asset::mint_to;

    let supply = storage.total_supply.get(asset_id).try_read();
    // Only increment the number of assets minted by this contract if it hasn't been minted before.
    if supply.is_none() {
        storage.total_assets.write(storage.total_assets.read() + 1);
    }
    storage
        .total_supply
        .insert(asset_id, supply.unwrap_or(0) + amount);
    mint_to(receiver, vault_sub_id, amount);
}

#[storage(read, write)]
pub fn burn(asset_id: AssetId, vault_sub_id: SubId, amount: u64) {
    require(
        std::context::this_balance(asset_id) >= amount,
        Error::NotEnoughCoins((std::context::this_balance(asset_id), amount)),
    );
    // If we pass the check above, we can assume it is safe to unwrap.
    let supply = storage.total_supply.get(asset_id).try_read().unwrap();
    storage.total_supply.insert(asset_id, supply - amount);
    std::asset::burn(vault_sub_id, amount);
}

// PURE FUNCTIONS
/// Returns an AssetId for a vault from from it's associated sub id
/// 
/// # Arguments
///
/// * `vault_sub_id` - The sub id of the vault
///
fn vault_asset_id(vault_sub_id: SubId) -> AssetId {
    let share_asset_id = AssetId::new(ContractId::this(), vault_sub_id);
    share_asset_id
}

// READ ONLY FUNCTIONS
/// Returns whether a share asset id is from a vault that is a sender or a receiver
///
/// # Arguments
///
/// * `share_asset_id` - The asset id of the vault
#[storage(read)]
fn get_sender_or_receiver(share_asset_id: AssetId) -> Option<SenderOrReceiver> {
    let vault_info = get_vault_info_option(share_asset_id);
    match(vault_info){
      Some(vault) => Some(vault.sender_or_receiver),
      None => None,
    }
}

/// Returns the stream associated with a given stream id
///
/// # Arguments
///
/// * `stream_id` - The id of the stream
///
#[storage(read)]
fn get_stream(stream_id: u64) -> Stream {
    // get the stream from the storage structure
    let stream = storage.streams.get(stream_id).try_read();
    require(stream.is_some(), Error::StreamDoesNotExist(stream_id));
    return stream.unwrap();
}

/// Returns the vault info associated with a given vault asset id
///
/// # Arguments
///
/// * `vault_asset_id` - The asset id of the vault
///
#[storage(read)]
fn get_vault_info(vault_asset_id: AssetId) -> VaultInfo {
    let vault_info = storage.vault_info.get(vault_asset_id).try_read();
    require(
        vault_info
            .is_some(),
        Error::VaultDoesNotExist(vault_asset_id),
    );
    return vault_info.unwrap();
}

/// Returns the vault info associated with a given vault asset id
///
/// # Arguments
///
/// * `vault_asset_id` - The asset id of the vault
///
#[storage(read)]
fn get_vault_info_option(vault_asset_id: AssetId) -> Option<VaultInfo> {
    let vault_info = storage.vault_info.get(vault_asset_id).try_read();
    return vault_info;
}

/// Returns the amount of billable time that has passed for a given stream
/// If the stream has been cancelled, the time between start and the cancellation is returned
///
/// # Arguments
///
/// * `stream_id` - The id of the stream
///
fn delta_of(stream: Stream, block_timestamp: u64) -> u64 {

    if let Some(cancellation_time) = stream.cancellation_time {
        if cancellation_time < stream.stop_time {
            return cancellation_time - stream.start_time;
        }
    }

    if block_timestamp < stream.start_time {
        0
    } else if block_timestamp > stream.stop_time {
        stream.stop_time - stream.start_time
    } else {
        block_timestamp - stream.start_time
    }
}

/// Returns the balance of a given vault
/// If the vault is a sender, the balance is the remaining unvested balance that can be withdrawn on cancellation
/// If the vault is a receiver, the balance is the remaining vested balance that can be withdrawn
///
/// # Arguments
///
/// * `vault_share_asset_id` - The asset id of the vault
///
#[storage(read)]
fn balance_of(vault_share_asset_id: AssetId) -> u64 {
  let vault_info = get_vault_info(vault_share_asset_id);

  let stream = get_stream(vault_info.stream_id);

  let vested_amount = vested_amount(stream);

  match(vault_info.sender_or_receiver){
    SenderOrReceiver::Sender => {
      if vested_amount > stream.deposit {
        0_u64
      } else {
        stream.deposit - vested_amount
      }
    },
    SenderOrReceiver::Receiver => {
      if vested_amount > stream.deposit {
        stream.deposit - stream.vested_withdrawn_amount
      } else {
        vested_amount - stream.vested_withdrawn_amount
      }
    }
  }
}

/// Returns the vested amount of a given stream
///
/// # Arguments
///
/// * `stream` - The stream to calculate the vested amount for
///
/// # Returns
///
fn vested_amount(stream: Stream) -> u64 {
  let block_timestamp = timestamp();

  let vesting_curve_registry = abi(VestingCurveRegistry, VESTING_CURVE_REGISTRY.into());

  let vested_amount = vesting_curve_registry.vested_amount(stream.vesting_curve_id, stream.stream_size, stream.start_time, stream.stop_time, block_timestamp);

  return vested_amount;
}


/// Returns true if the stream is insolvent
/// if the owed balance of the vault is greater than the available vested balance the stream is considered insolvent
///
/// # Arguments
///
/// * `stream_id` the id of the stream to check solvency 
///
/// > Note If rate_per_second < 1 then this function will return true, even after the last valid token accrual for 1/rate_per_seconds,

#[storage(read)]
fn is_solvent(stream_id: u64) -> bool {
  let stream = get_stream(stream_id);

  let vested_amount = vested_amount(stream);

  vested_amount <= stream.deposit
}


// MUTABLE FUNCTIONS
/// Withdraw a certain amount from a specific stream
/// Only callable by providing one receiver share asset 
/// Returns the amount of shares that have be withdrawn from a given vault
///
/// # Arguments
///
/// * `receiver` - The contract or account that will receive the withdrawn tokens
/// * `amount` - The amount of shares to be withdrawn
/// 
/// # Call Params
/// * `amount` - Must be one to verify ownership of the receiver share asset
/// * `asset_id` - The receiver share asset
#[payable]
#[storage(read, write)]
fn partial_withdraw_from_stream(receiver: Identity, amount: u64) -> u64 {
    let vault_share_asset = msg_asset_id();

    // get the amount of shares sent
    let shares = msg_amount();


    let vault_info = get_vault_info(vault_share_asset);

    // get the stream
    let mut stream = get_stream(vault_info.stream_id);

    // ensure that the token sent, is the receiver_asset
    require(
        vault_share_asset == stream
            .receiver_asset,
        Error::NotReceiver((vault_share_asset, stream.receiver_asset)),
    );

    require(shares == 1, Error::InsufficientShares);

    // get the receiver balance of the stream
    let receiver_balance = balance_of(vault_share_asset);

    // ensure that the amount is less than or equal to the receiver balance
    require(
        amount <= receiver_balance,
        Error::InsufficientBalance((receiver_balance, amount)),
    );

    // EFFECTS
    // Add withdrawn amount to stream
    stream.vested_withdrawn_amount = stream.vested_withdrawn_amount + amount;

    storage.streams.insert(vault_info.stream_id, stream);

    // require(false, Error::ZeroDeposit);
    // INTERACTIONS
    // transfer the amount to the receiver
    transfer(receiver, stream.underlying_asset, amount);
    // transfer the share asset back to the 
    transfer(msg_sender().unwrap(), vault_share_asset, 1);

    log(Withdraw {
        caller: msg_sender().unwrap(),
        receiver: receiver,
        underlying_asset: stream.underlying_asset,
        vault_sub_id: vault_info.vault_sub_id,
        withdrawn_amount: amount,
        burned_shares: 1,
    });


    amount
}

/// Cancel a stream and return the unvested balance to the sender
/// Only callable by providing one sender share asset
/// Returns the amount of shares that have be withdrawn from a given vault
///
/// # Arguments
///
/// * `unvested_recipient` - The contract or account that will receive the unvested tokens
///
/// # Call Params
/// * `amount` - Must be one to verify ownership of the sender share asset
/// * `asset_id` - The sender share asset
#[payable]
#[storage(read, write)]
fn cancel_stream(unvested_recipient: Identity) -> u64 {
    let sender_share_asset = msg_asset_id();

    // get the amount of shares sent
    let shares = msg_amount();

    let sender_vault_info = get_vault_info(sender_share_asset);


    let mut stream = get_stream(sender_vault_info.stream_id);

    require(
      stream.configuration.is_cancellable,
      Error::NotCancellable
    );

    // This is an ugly hack, but for some reason when doing the following: which should be functionally equivalent:
    // require(stream.cancellation_time.is_none(), Error::StreamAlreadyCancelled(stream.cancellation_time.unwrap()));
    // the program reverts with a 0 when it is none as if
    // It seems as though the unwrap of cancellation time is being evaluated prior to the require statement evaluating to false;

    match stream.cancellation_time {
        Some(_cancellation_time) => {
            // this requirement greater than 0 is just a sanity check
            require(_cancellation_time > 0, Error::StreamAlreadyCancelled(_cancellation_time));
        },
        None => {},
    }

    let receiver_share_asset = stream.receiver_asset;

    require(
        sender_share_asset == stream
            .sender_asset,
        Error::NotSender((sender_share_asset, stream.sender_asset)),
    );
    require(shares == 1, Error::InsufficientShares);

    // Mark the vaults as cancelled
    stream.cancellation_time = Some(timestamp());
    storage.streams.insert(sender_vault_info.stream_id, stream);



    // INTERACTIONS
    // get the balances of the stream
    let sender_balance = balance_of(sender_share_asset);
    let receiver_balance = balance_of(receiver_share_asset);

    // send the appropriate amount of tokens to the sender
    if (sender_balance > 0){
        transfer(unvested_recipient, stream.underlying_asset, sender_balance);
    }

    burn(sender_share_asset, sender_vault_info.vault_sub_id, 1);

    log(CancelStream {
        stream_id: sender_vault_info.stream_id,
        sender_asset: sender_share_asset,
        receiver_asset: receiver_share_asset,
        unvested_recipient: unvested_recipient,
        unvested_balance: sender_balance,
        vested_balance: receiver_balance,
    });

    log(Withdraw {
        caller: msg_sender().unwrap(),
        receiver: unvested_recipient,
        underlying_asset: stream.underlying_asset,
        vault_sub_id: sender_vault_info.vault_sub_id,
        withdrawn_amount: sender_balance,
        burned_shares: 1,
    });

    sender_balance
}

/// Withdraw the full amount from a stream
/// Only callable by providing one receiver share asset
/// Returns the amount of shares that have be withdrawn from a given vault
///
/// # Arguments
///
/// * `receiver` - The contract or account that will receive the withdrawn tokens
///
/// # Call Params
/// * `amount` - Must be one to verify ownership of the receiver share asset
/// * `asset_id` - The receiver share asset
#[payable]
#[storage(read, write)]
fn full_withdraw_from_stream(receiver: Identity) -> u64 {
    let vault_share_asset = msg_asset_id();
    let amount = balance_of(vault_share_asset);
    partial_withdraw_from_stream(receiver, amount)
}

