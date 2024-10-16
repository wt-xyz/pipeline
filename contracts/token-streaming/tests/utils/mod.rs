#![warn(clippy::pedantic)]

use std::time::Duration;

use abigen_bindings::pipeline_mod::libraries::structs::VestingCurve;
use anyhow::{Context, Result};
use chrono::{DateTime, Utc};
use fuels::{
    accounts::provider,
    prelude::*,
    programs::contract::Regular,
    types::{ContractId, Identity},
};
use tai64::{Tai64, Tai64N};

pub const DEFAULT_START_OFFSET: Duration = Duration::from_secs(60);

// Load abi from json
abigen!(
    Contract(
        name = "Pipeline",
        abi = "contracts/token-streaming/out/debug/token-streaming-abi.json",
    ),
    Contract(
        name = "VestingCurve",
        abi = "contracts/vesting_curves/out/debug/vesting-curves-abi.json"
    )
);

pub async fn get_contract_instance() -> Result<(
    Pipeline<WalletUnlocked>,
    ContractId,
    Vec<WalletUnlocked>,
    ContractId,
)> {
    // Launch a local network and deploy the contract
    let mut wallets = launch_custom_provider_and_get_wallets(
        WalletsConfig::new(
            Some(4),             /* Single wallet */
            Some(1),             /* Single coin (UTXO) */
            Some(1_000_000_000), /* Amount per coin */
        ),
        None,
        None,
    )
    .await?;
    let deployment_wallet = wallets.pop().context("Missing deployment wallet")?;

    let sender_wallet = wallets.pop().context("Missing sender wallet")?;

    let vesting_curve_id = Contract::load_from(
        "../vesting_curves/out/debug/vesting-curves.bin",
        LoadConfiguration::default(),
    )?
    .deploy(&deployment_wallet, TxPolicies::default())
    .await?;

    let configurables = PipelineConfigurables::default()
        .with_VESTING_CURVE_REGISTRY(vesting_curve_id.clone().into())?;

    let id = Contract::load_from(
        "./out/debug/token-streaming.bin",
        LoadConfiguration::default().with_configurables(configurables),
    )?
    .deploy(&deployment_wallet, TxPolicies::default())
    .await?;

    let instance = Pipeline::new(id.clone(), sender_wallet);

    Ok((instance, id.into(), wallets, vesting_curve_id.into()))
}

pub async fn create_stream(
    instance: &Pipeline<WalletUnlocked>,
    sender_wallet: &WalletUnlocked,
    receiver_wallet: &WalletUnlocked,
    underlying_asset: AssetId,
    amount: u64,
    start_time: Tai64N,
    duration: Duration,
    stream_size: Option<u64>,
    configuration: Option<StreamConfiguration>,
) -> Result<(u64, Stream)> {
    let sender_wallet_address = Identity::Address(sender_wallet.address().into());
    let receiver_wallet_address = Identity::Address(receiver_wallet.address().into());

    let call_params = CallParameters::new(amount, underlying_asset, 100_000);

    // create a stream
    let stream_creation_result = instance
        .methods()
        .create_stream(
            sender_wallet_address,
            receiver_wallet_address,
            start_time.0 .0,
            (start_time + duration).0 .0,
            stream_size.unwrap_or(amount),
            configuration.unwrap_or(StreamConfiguration {
                is_undercollateralized: false,
                is_cancellable: true,
                vesting_curve: VestingCurve::Linear,
            }),
        )
        .call_params(call_params)?
        .with_variable_output_policy(VariableOutputPolicy::Exactly(2))
        .determine_missing_contracts(Some(5))
        .await?
        .call()
        .await?;

    let stream_id = stream_creation_result.value;

    let stream_result = instance.methods().get_stream(stream_id).call().await;

    let stream = stream_result?.value;

    Ok((stream_id, stream))
}

pub fn get_default_stream_values(
    mut wallets: Vec<WalletUnlocked>,
) -> Result<(
    WalletUnlocked,
    WalletUnlocked,
    u64,
    Tai64N,
    Duration,
    AssetId,
)> {
    let sender_wallet = wallets.pop().context("Missing sender wallet")?;
    let receiver_wallet = wallets.pop().context("Missing receiver wallet")?;
    let amount = 1_000_000_u64;
    let start_time = Tai64N::now() + DEFAULT_START_OFFSET;

    let duration = Duration::from_secs(100 * 60 * 60 * 24);
    let underlying_asset = AssetId::zeroed();

    Ok((
        sender_wallet,
        receiver_wallet,
        amount,
        start_time,
        duration,
        underlying_asset,
    ))
}

pub async fn _fast_forward_to_time(
    provider: &provider::Provider,
    new_time: Option<DateTime<Utc>>,
) -> Result<()> {
    provider.produce_blocks(3, new_time).await?;

    Ok(())
}

pub async fn fast_forward_time(
    provider: &provider::Provider,
    increased_duration: Duration,
) -> Result<()> {
    let current_time = provider
        .latest_block_time()
        .await?
        .context("Missing block time")?;
    let date_time = chrono::DateTime::from_timestamp(
        current_time.timestamp() + increased_duration.as_secs() as i64,
        0,
    );

    provider.produce_blocks(3, date_time).await?;

    Ok(())
}

pub fn datetime_to_tai64n(date_time: DateTime<Utc>) -> Tai64N {
    Tai64N::from(Tai64::from_unix(date_time.timestamp()))
}

pub fn tai64n_to_datetime(value: Tai64N) -> DateTime<Utc> {
    DateTime::from_timestamp(value.0.to_unix(), value.1).unwrap()
}

pub fn try_tai64n_to_datetime(value: Tai64N) -> Result<DateTime<Utc>> {
    DateTime::from_timestamp(value.0.to_unix(), value.1)
        .context("Failed to convert Tai64N to DateTime<Utc>")
}

pub fn taiu64_to_tai64n(value: u64) -> Tai64N {
    Tai64N::from(Tai64 { 0: value })
}
