#![warn(clippy::pedantic)]

mod utils;

use utils::*;

use anyhow::Result;
use fuels::prelude::*;

#[tokio::test]
async fn can_get_contract_id_and_two_wallets() -> Result<()> {
    let (instance, id, wallets) = get_contract_instance().await?;

    assert_eq!(id, instance.contract_id().into());
    assert_eq!(wallets.len(), 2);
    // Now you have an instance of your contract you can use to test each function

    Ok(())
}

#[tokio::test]
async fn can_fast_forward_time() -> Result<()> {
    let (_instance, _id, wallets) = get_contract_instance().await?;

    let (sender_wallet, _receiver_wallet, _amount, _start_time, duration, _underlying_asset) =
        get_default_stream_values(wallets)?;

    // check that the current timestamp
    let provider = sender_wallet.try_provider()?;
    let current_time = provider.latest_block_time().await?;

    // push forward the time
    fast_forward_time(provider, duration / 2).await?;

    let new_time = provider.latest_block_time().await?;

    assert!(new_time > current_time);

    Ok(())
}
