#![warn(clippy::pedantic)]

mod utils;

use utils::*;

use anyhow::{Context, Result};
use fuels::{
    prelude::*,
    types::{Bits256, Identity},
};

// Receiver can fully withdraw from streams
#[tokio::test]
async fn receiver_can_fully_withdraw_from_stream() -> Result<()> {
    let (instance, _id, wallets, vesting_contract_id) = get_contract_instance().await?;

    let receiver_wallet = instance.account().clone();

    // same sender and receiver
    let (sender_wallet, _receiver_wallet, amount, start_time, duration, underlying_asset) =
        get_default_stream_values(wallets)?;

    let (stream_id, stream) = create_stream(
        &instance,
        &sender_wallet,
        &receiver_wallet,
        underlying_asset,
        amount,
        start_time,
        duration,
        None,
        None,
        vesting_contract_id,
    )
    .await?;

    let receiver_asset = stream.receiver_asset;

    let vault_info = instance
        .methods()
        .get_vault_info(receiver_asset)
        .simulate(Execution::StateReadOnly)
        .await?
        .value;

    // check the current balance of the underlying_token for receiver
    let receiver_current_balance = receiver_wallet.get_asset_balance(&underlying_asset).await?;

    let provider = receiver_wallet.try_provider()?;

    fast_forward_time(provider, duration / 2).await?;

    let stream_expected_balance = instance
        .methods()
        .max_withdrawable(underlying_asset, vault_info.vault_sub_id)
        .with_contract_ids(&[vesting_contract_id.into()])
        .call()
        .await?
        .value;

    assert!(stream_expected_balance.unwrap() > 0);

    println!("stream_expected_balance: {:?}", stream_expected_balance);

    let call_params = CallParameters::new(1, receiver_asset, 100_000);

    let amount_withdrawn = instance
        .methods()
        .withdraw(
            Identity::Address(receiver_wallet.address().into()),
            underlying_asset,
            vault_info.vault_sub_id,
        )
        .call_params(call_params)?
        .with_variable_output_policy(VariableOutputPolicy::Exactly(2))
        .with_contract_ids(&[vesting_contract_id.into()])
        .call()
        .await?
        .value;

    println!("amount_withdrawn: {:?}", amount_withdrawn);

    let receiver_balance = receiver_wallet.get_asset_balance(&underlying_asset).await?;

    // confirm that the amount withdrawn is equal to the change in balance
    assert_eq!(
        receiver_balance,
        receiver_current_balance + amount_withdrawn
    );

    // check that the stream was updated
    let stream = instance.methods().get_stream(stream_id).call().await?.value;

    assert_eq!(stream.vested_withdrawn_amount, amount_withdrawn);

    Ok(())
}

async fn get_withdrawable_depositable_managed_assets(
    instance: &Pipeline<WalletUnlocked>,
    underlying_asset: AssetId,
    vault_id: Bits256,
    wallet_address: Identity,
    vesting_contract_id: ContractId,
) -> Result<(u64, u64, u64)> {
    let max_withdrawable = instance
        .methods()
        .max_withdrawable(underlying_asset, vault_id)
        .with_contract_ids(&[vesting_contract_id.into()])
        .call()
        .await?
        .value
        .context("Missing max withdrawable")?;

    let max_depositable = instance
        .methods()
        .max_depositable(wallet_address, underlying_asset, vault_id)
        .with_contract_ids(&[vesting_contract_id.into()])
        .call()
        .await?
        .value
        .context("Missing max depositable")?;

    let managed_assets = instance
        .methods()
        .managed_assets(underlying_asset, vault_id)
        .call()
        .await?
        .value;

    Ok((max_withdrawable, max_depositable, managed_assets))
}

#[tokio::test]
#[ignore = "This test is failing, due to fuels rs updates"]
async fn can_call_max_functions_on_stream() -> Result<()> {
    let (instance, _id, wallets, vesting_contract_id) = get_contract_instance().await?;

    let (sender_wallet, receiver_wallet, amount, start_time, duration, underlying_asset) =
        get_default_stream_values(wallets)?;

    let (_stream_id, stream) = create_stream(
        &instance,
        &sender_wallet,
        &receiver_wallet,
        underlying_asset,
        amount,
        start_time,
        duration,
        None,
        None,
        vesting_contract_id,
    )
    .await?;

    // push forward the time
    let provider = sender_wallet.try_provider()?;

    fast_forward_time(provider, duration / 2).await?;

    let receiver_asset = stream.receiver_asset;
    let sender_asset = stream.sender_asset;

    // we need to fetch the sender and receiver assets
    let vault_info_receiver = instance
        .methods()
        .get_vault_info(receiver_asset)
        .simulate(Execution::StateReadOnly)
        .await?
        .value;

    let vault_info_sender = instance
        .methods()
        .get_vault_info(sender_asset)
        .simulate(Execution::StateReadOnly)
        .await?
        .value;

    let vault_id_receiver = vault_info_receiver.vault_sub_id;
    let vault_id_sender = vault_info_sender.vault_sub_id;

    let (max_withdrawable_sender, max_depositable_sender, managed_assets_sender) =
        get_withdrawable_depositable_managed_assets(
            &instance,
            underlying_asset,
            vault_id_sender,
            Identity::Address(receiver_wallet.address().into()),
            vesting_contract_id,
        )
        .await?;

    let (max_withdrawable_receiver, max_depositable_receiver, managed_assets_receiver) =
        get_withdrawable_depositable_managed_assets(
            &instance,
            underlying_asset,
            vault_id_receiver,
            Identity::Address(receiver_wallet.address().into()),
            vesting_contract_id,
        )
        .await?;

    assert!(max_withdrawable_sender > 0);
    assert_eq!(max_depositable_sender, 0);
    assert_eq!(managed_assets_sender, max_withdrawable_sender);

    assert!(max_withdrawable_receiver > 0);
    assert_eq!(max_depositable_receiver, 0);
    assert_eq!(managed_assets_receiver, max_withdrawable_receiver);

    Ok(())
}
