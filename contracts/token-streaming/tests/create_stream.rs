#![warn(clippy::pedantic)]

mod utils;

use std::time::Duration;

use abigen_bindings::pipeline_mod::libraries::structs::VestingCurve;
use utils::*;

use anyhow::{Context, Result};
use assert_matches::assert_matches;
use fuels::prelude::*;
use rstest::rstest;

const SECS_IN_A_DAY: u64 = 86_400;

#[tokio::test]
// create a stream
async fn can_create_stream() -> Result<()> {
    let (instance, _id, wallets, _) = get_contract_instance().await?;

    let (sender_wallet, receiver_wallet, amount, start_time, duration, underlying_asset) =
        get_default_stream_values(wallets)?;

    let (_, stream) = create_stream(
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

    assert_eq!(stream.underlying_asset, underlying_asset);

    let sender_asset = stream.sender_asset;
    let receiver_asset = stream.receiver_asset;

    assert_ne!(sender_asset, receiver_asset);

    // check the sender's balance of sender_asset
    let sender_balance = sender_wallet.get_asset_balance(&sender_asset).await?;

    // check the receiver's balance of receiver_asset
    let receiver_balance = receiver_wallet.get_asset_balance(&receiver_asset).await?;

    // ensure that both have received the correct amount of assets
    assert_eq!(receiver_balance, 1);
    assert_eq!(sender_balance, 1);

    // check the asset_ids and that the sender and receiver are correct

    Ok(())
}

#[tokio::test]
async fn can_create_multiple_streams() -> Result<()> {
    let (instance, _id, wallets, _) = get_contract_instance().await?;

    let (sender_wallet, receiver_wallet, amount, start_time, duration, underlying_asset) =
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

    let (stream_id_2, stream_2) = create_stream(
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

    assert_ne!(stream_id, stream_id_2);
    assert_ne!(stream.sender_asset, stream_2.sender_asset);
    assert_ne!(stream.receiver_asset, stream_2.receiver_asset);

    Ok(())
}

#[tokio::test]
async fn can_get_name_and_symbol() -> Result<()> {
    let (instance, _id, wallets, _) = get_contract_instance().await?;

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
    )
    .await?;

    let receiver_symbol = instance
        .methods()
        .symbol(stream.receiver_asset)
        .simulate(Execution::StateReadOnly)
        .await?
        .value;
    let receiver_name = instance
        .methods()
        .name(stream.receiver_asset)
        .simulate(Execution::StateReadOnly)
        .await?
        .value;
    let sender_symbol = instance
        .methods()
        .symbol(stream.sender_asset)
        .simulate(Execution::StateReadOnly)
        .await?
        .value;
    let sender_name = instance
        .methods()
        .name(stream.sender_asset)
        .simulate(Execution::StateReadOnly)
        .await?
        .value;

    assert_eq!(receiver_symbol, Some("rPipeline".to_string()));
    assert_eq!(
        receiver_name,
        Some("Pipeline Stream Receiving Token".to_string())
    );
    assert_eq!(sender_symbol, Some("sPipeline".to_string()));
    assert_eq!(
        sender_name,
        Some("Pipeline Stream Sending Token".to_string())
    );

    Ok(())
}

#[tokio::test]
async fn cannot_create_fully_collateralized_stream_without_full_deposit() -> Result<()> {
    let (instance, _id, wallets, _) = get_contract_instance().await?;

    let (sender_wallet, receiver_wallet, amount, start_time, duration, underlying_asset) =
        get_default_stream_values(wallets)?;

    let create_stream_result = create_stream(
        &instance,
        &sender_wallet,
        &receiver_wallet,
        underlying_asset,
        amount,
        start_time,
        duration,
        Some(amount - 10),
        Some(StreamConfiguration {
            is_undercollateralized: false,
            is_cancellable: true,
            vesting_curve: VestingCurve::Linear,
        }),
    )
    .await;

    assert_matches!(
        create_stream_result.unwrap_err().downcast_ref(),
        Some(fuels::types::errors::Error::Transaction(_))
    );

    Ok(())
}

#[rstest]
#[case::same_value(100_000, 100_000)]
#[case::one_less(100_000, 99_999)]
#[case::zero_deposit(100_000, 0)]
#[case::one_deposit(100_000, 1)]
#[tokio::test]
async fn can_create_undercollateralized_stream(
    #[case] stream_size: u64,
    #[case] deposit: u64,
) -> Result<()> {
    let (instance, _id, wallets, _) = get_contract_instance().await?;

    let (sender_wallet, receiver_wallet, _, start_time, duration, underlying_asset) =
        get_default_stream_values(wallets)?;

    let configuration = Some(StreamConfiguration {
        is_cancellable: true,
        is_undercollateralized: true,
        vesting_curve: VestingCurve::Linear,
    });
    // start the stream in the future
    let (_stream_id, _stream) = create_stream(
        &instance,
        &sender_wallet,
        &receiver_wallet,
        underlying_asset,
        deposit,
        start_time,
        duration,
        Some(stream_size),
        configuration,
    )
    .await?;

    Ok(())
}

#[rstest]
#[case::one_more(100_000, 100_001)]
#[case::small_size(1, 100_000)]
#[tokio::test]
async fn cannot_create_undercollateralized_stream_with_invalid_params(
    #[case] stream_size: u64,
    #[case] deposit: u64,
) -> Result<()> {
    let (instance, _id, wallets, _) = get_contract_instance().await?;

    let (sender_wallet, receiver_wallet, _, start_time, duration, underlying_asset) =
        get_default_stream_values(wallets)?;

    let configuration = Some(StreamConfiguration {
        is_cancellable: true,
        is_undercollateralized: true,
        vesting_curve: VestingCurve::Linear,
    });
    // start the stream in the future
    let create_stream_result = create_stream(
        &instance,
        &sender_wallet,
        &receiver_wallet,
        underlying_asset,
        deposit,
        start_time,
        duration,
        Some(stream_size),
        configuration,
    )
    .await;

    let error = create_stream_result.unwrap_err();
    let raw_error = error.downcast_ref::<Error>();

    assert_matches!(
        raw_error,
        Some(fuels::types::errors::Error::Transaction(_))
    );

    Ok(())
}

#[rstest]
#[case::yesterday_part(1, 2, 0.5)]
#[case::last_week_part(7, 14, 0.5)]
#[case::last_week_done(7, 6, 1f32)]
#[case::last_month_part(30, 60, 0.5)]
#[case::last_month_done(30, 29, 1f32)]
#[tokio::test]
async fn can_create_streams_in_past(
    #[case] days_ago: u64,
    #[case] duration: u64,
    #[case] expected_portion: f32,
) -> Result<()> {
    let (instance, _id, wallets, _) = get_contract_instance().await?;

    let (sender_wallet, receiver_wallet, amount, start_time, _, underlying_asset) =
        get_default_stream_values(wallets)?;

    let start_time = start_time - Duration::from_secs(days_ago * SECS_IN_A_DAY);

    let duration = Duration::from_secs(duration * SECS_IN_A_DAY);

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
    )
    .await?;

    #[allow(clippy::cast_possible_truncation)]
    let expected_amount_to_receive = (amount as f32 * expected_portion) as u64;

    // we need to fetch the sender and receiver assets
    let vault_info_receiver = instance
        .methods()
        .get_vault_info(stream.receiver_asset)
        .simulate(Execution::StateReadOnly)
        .await?
        .value;
    let vault_id_receiver = vault_info_receiver.vault_sub_id;

    let max_withdrawable = instance
        .methods()
        .max_withdrawable(underlying_asset, vault_id_receiver)
        .determine_missing_contracts(Some(5))
        .await?
        .call()
        .await?
        .value
        .context("Missing max withdrawable")?;

    // 0.1% margin of error for rounding
    let diff = (max_withdrawable as i128 - expected_amount_to_receive as i128).abs();
    assert!(diff <= (expected_amount_to_receive as f32 * 0.001) as i128);

    Ok(())
}

#[rstest]
#[case::fully_collateralized_solvent_half(1_000_000, 1_000_000, 1, 2, true)]
#[case::half_collateralized_solvent_half(1_000_000, 500_000, 1, 2, true)]
#[case::half_collateralized_insolvent_two_third(1_000_000, 500_000, 2, 3, false)]
#[case::under_half_collateralized_insolvent_half(1_000_000, 499_998, 1, 2, false)]
#[case::fully_collateralized_solvent_tenth(1, 1, 1, 10, true)]
#[ignore = "Broken fuels rs, resulting in OutOfGas for subtraction OP"]
#[tokio::test]
async fn can_get_accurate_solvency_report(
    #[case] stream_size: u64,
    #[case] deposit: u64,
    #[case] duration_numerator: u32,
    #[case] duration_denominator: u32,
    #[case] should_be_solvent: bool,
) -> Result<()> {
    let (instance, _id, wallets, _) = get_contract_instance().await?;

    let (sender_wallet, receiver_wallet, _, start_time, duration, underlying_asset) =
        get_default_stream_values(wallets)?;

    let configuration = Some(StreamConfiguration {
        is_cancellable: true,
        is_undercollateralized: true,
        vesting_curve: VestingCurve::Linear,
    });
    // start the stream in the future
    let (stream_id, _stream) = create_stream(
        &instance,
        &sender_wallet,
        &receiver_wallet,
        underlying_asset,
        deposit,
        start_time,
        duration,
        Some(stream_size),
        configuration,
    )
    .await?;

    let provider = sender_wallet.try_provider()?;
    fast_forward_time(
        provider,
        DEFAULT_START_OFFSET + (duration * duration_numerator / duration_denominator),
    )
    .await?;

    let is_solvent_result = instance.methods().is_solvent(stream_id).call().await;

    let is_solvent = is_solvent_result?.value;

    assert_eq!(is_solvent, should_be_solvent);

    Ok(())
}
