#![warn(clippy::pedantic)]

use std::time::Duration;

use abigen_bindings::pipeline_mod::libraries::structs::VestingCurve;
use anyhow::{Context, Result};
use chrono::{DateTime, Utc};
use fuels::{
    accounts::provider,
    prelude::*,
    types::{ContractId, Identity},
};
use tai64::Tai64N;

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

pub async fn get_contract_instance(
) -> Result<(Pipeline<WalletUnlocked>, ContractId, Vec<WalletUnlocked>)> {
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

    println!("vesting_curve_id: {:?}", &vesting_curve_id);

    let id = Contract::load_from(
        "./out/debug/token-streaming.bin",
        LoadConfiguration::default().with_configurables(configurables),
    )?
    .deploy(&deployment_wallet, TxPolicies::default())
    .await?;

    println!("id: {:?}", id);

    let instance = Pipeline::new(id.clone(), sender_wallet);

    Ok((instance, id.into(), wallets))
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

    let stream = instance.methods().get_stream(stream_id).call().await?.value;

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
