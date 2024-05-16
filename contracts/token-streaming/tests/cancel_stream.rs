#![warn(clippy::pedantic)]

mod utils;

use utils::*;

use std::time::Duration;

use anyhow::Result;
use assert_matches::assert_matches;
use fuels::{prelude::*, types::Identity};
use tai64::Tai64N;

async fn cancel_stream(
    instance: &Pipeline<WalletUnlocked>,
    stream: &Stream,
    stream_id: u64,
    sender_wallet: &WalletUnlocked,
    use_receiver_share: bool,
    cancellation_time_offset: Duration,
) -> Result<(u64, u64, u64, Stream)> {
    let sender_asset = stream.sender_asset;

    let vault_info = instance
        .methods()
        .get_vault_info(sender_asset)
        .simulate()
        .await?
        .value;

    let withdrawal_asset = if use_receiver_share {
        stream.receiver_asset
    } else {
        stream.sender_asset
    };

    let call_params = CallParameters::new(1, withdrawal_asset, 50_000);

    let previous_sender_balance = sender_wallet
        .get_asset_balance(&stream.underlying_asset)
        .await?;

    let provider = sender_wallet.try_provider()?;

    fast_forward_time(provider, cancellation_time_offset).await?;

    let amount_withdrawn = instance
        .methods()
        .withdraw(
            Identity::Address(sender_wallet.address().into()),
            stream.underlying_asset,
            vault_info.vault_sub_id,
        )
        .call_params(call_params)?
        .append_variable_outputs(1)
        .call()
        .await?
        .value;

    // check the current balance of the underlying_token for sender
    let current_sender_balance = sender_wallet
        .get_asset_balance(&stream.underlying_asset)
        .await?;

    let new_stream = instance.methods().get_stream(stream_id).call().await?.value;

    Ok((
        previous_sender_balance,
        amount_withdrawn,
        current_sender_balance,
        new_stream,
    ))
}

async fn cancel_stream_test(
    start_time_offset: Duration,
    duration: Duration,
    cancellation_time_offset: Duration,
    use_receiver_share: bool,
    configuration: Option<StreamConfiguration>,
) -> Result<()> {
    // create a stream
    // cancel the stream
    // check that the stream was updated with a cancellation time
    let (instance, _id, wallets) = get_contract_instance().await?;

    let sender_wallet = instance.account().clone();

    let (_, receiver_wallet, amount, _, _, underlying_asset) = get_default_stream_values(wallets)?;

    let start_time = Tai64N::now() + start_time_offset;

    // start the stream in the future
    let stream_creation_result = create_stream(
        &instance,
        &sender_wallet,
        &receiver_wallet,
        underlying_asset,
        amount,
        start_time,
        duration,
        None,
        configuration,
    )
    .await;

    let stream_info = stream_creation_result?;

    let (previous_sender_balance, amount_withdrawn, current_sender_balance, stream) =
        cancel_stream(
            &instance,
            &stream_info.1,
            stream_info.0,
            &sender_wallet,
            use_receiver_share,
            cancellation_time_offset,
        )
        .await?;

    // check that the stream was updated with a cancellation time
    assert!(stream.cancellation_time.is_some());

    // confirm that the amount withdrawn is equal to the change in balance
    assert_eq!(
        current_sender_balance,
        previous_sender_balance + amount_withdrawn
    );

    Ok(())
}

#[tokio::test]
async fn can_cancel_unstarted_stream() -> Result<()> {
    let start_time_offset = Duration::from_secs(2000);

    let duration = Duration::from_secs(100 * 60 * 60 * 24);

    let cancellation_time_offset = Duration::from_secs(0);

    cancel_stream_test(
        start_time_offset,
        duration,
        cancellation_time_offset,
        false,
        None,
    )
    .await?;

    Ok(())
}

#[tokio::test]
async fn cannot_cancel_stream_w_false_is_cancellable() -> Result<()> {
    let start_time_offset = Duration::from_secs(2000);

    let duration = Duration::from_secs(100 * 60 * 60 * 24);

    let cancellation_time_offset = Duration::from_secs(0);

    let cancel_result = cancel_stream_test(
        start_time_offset,
        duration,
        cancellation_time_offset,
        false,
        Some(StreamConfiguration {
            is_undercollateralized: false,
            is_cancellable: false,
        }),
    )
    .await;

    assert_matches!(
        cancel_result.unwrap_err().downcast_ref(),
        Some(fuels_core::types::errors::Error::Transaction(_))
    );

    Ok(())
}

#[tokio::test]
async fn can_cancel_undercollateralized_stream() -> Result<()> {
    let start_time_offset = Duration::from_secs(2000);

    let duration = Duration::from_secs(100 * 60 * 60 * 24);

    let cancellation_time_offset = Duration::from_secs(0);

    cancel_stream_test(
        start_time_offset,
        duration,
        cancellation_time_offset,
        false,
        Some(StreamConfiguration {
            is_undercollateralized: true,
            is_cancellable: true,
        }),
    )
    .await?;

    Ok(())
}

#[tokio::test]
async fn cannot_cancel_unstarted_stream_w_out_token() -> Result<()> {
    let start_time_offset = Duration::from_secs(2000);
    let duration = Duration::from_secs(100 * 60 * 60 * 24);
    let cancellation_time_offset = Duration::from_secs(0);

    let cancel_result = cancel_stream_test(
        start_time_offset,
        duration,
        cancellation_time_offset,
        true,
        None,
    )
    .await;

    assert_matches!(
        cancel_result.unwrap_err().downcast_ref(),
        Some(fuels_core::types::errors::Error::Provider(s)) if s.contains("not enough coins to fit the target")
    );

    Ok(())
}

#[tokio::test]
async fn can_cancel_started_stream() -> Result<()> {
    let start_time_offset = Duration::from_secs(100);
    let duration = Duration::from_secs(100 * 60 * 60 * 24);
    let cancellation_time_offset = Duration::from_secs(1000);

    cancel_stream_test(
        start_time_offset,
        duration,
        cancellation_time_offset,
        false,
        None,
    )
    .await?;

    Ok(())
}

#[tokio::test]
async fn cannot_cancel_started_stream_w_out_token() -> Result<()> {
    let start_time_offset = Duration::from_secs(100);
    let duration = Duration::from_secs(100 * 60 * 60 * 24);
    let cancellation_time_offset = Duration::from_secs(1000);

    let cancel_result = cancel_stream_test(
        start_time_offset,
        duration,
        cancellation_time_offset,
        true,
        None,
    )
    .await;

    assert_matches!(
        cancel_result.unwrap_err().downcast_ref(),
        Some(fuels_core::types::errors::Error::Provider(s)) if s.contains("not enough coins to fit the target")
    );

    Ok(())
}

#[tokio::test]
async fn can_cancel_completed_stream() -> Result<()> {
    let start_time_offset = Duration::from_secs(60);
    let duration = Duration::from_secs(100 * 60 * 60 * 24);
    let cancellation_time_offset = start_time_offset + duration + Duration::from_secs(1);

    cancel_stream_test(
        start_time_offset,
        duration,
        cancellation_time_offset,
        false,
        None,
    )
    .await?;

    Ok(())
}

#[tokio::test]
async fn cannot_cancel_completed_stream_w_out_token() -> Result<()> {
    let start_time_offset = Duration::from_secs(60);
    let duration = Duration::from_secs(100 * 60 * 60 * 24);
    let cancellation_time_offset = start_time_offset + duration + Duration::from_secs(1);

    let cancel_result = cancel_stream_test(
        start_time_offset,
        duration,
        cancellation_time_offset,
        true,
        None,
    )
    .await;

    assert_matches!(
        cancel_result.unwrap_err().downcast_ref(),
        Some(fuels_core::types::errors::Error::Provider(s)) if s.contains("not enough coins to fit the target")
    );

    Ok(())
}

#[tokio::test]
async fn cannot_cancel_already_cancelled_stream() -> Result<()> {
    let start_time_offset = Duration::from_secs(60);
    let duration = Duration::from_secs(100 * 60 * 60 * 24);
    let cancellation_time_offset = start_time_offset + Duration::from_secs(1);
    let second_cancellation_time_offset = cancellation_time_offset + Duration::from_secs(1);

    let (instance, _id, wallets) = get_contract_instance().await?;

    let sender_wallet = instance.account().clone();

    let (_, receiver_wallet, amount, start_time, _, underlying_asset) =
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
    )
    .await?;

    cancel_stream(
        &instance,
        &stream,
        stream_id,
        &sender_wallet,
        false,
        cancellation_time_offset,
    )
    .await?;

    // try to cancel the stream again
    let second_cancel_result = cancel_stream(
        &instance,
        &stream,
        stream_id,
        &sender_wallet,
        false,
        second_cancellation_time_offset,
    )
    .await;

    assert_matches!(
        second_cancel_result.unwrap_err().downcast_ref(),
        Some(fuels_core::types::errors::Error::Provider(s)) if s.contains("not enough coins to fit the target")
    );

    Ok(())
}
