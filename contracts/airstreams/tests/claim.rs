mod utils;

use crate::utils::eth_signer::EthSigner;
use airstreams::deploy::DeploymentBuilder;
use catalyst_merkle::{hex_str_to_bytes, User};
use fuels::prelude::*;
use fuels::types::{Bits256, Identity};

#[tokio::test]
async fn test_proof_generation_fuel_address() -> Result<()> {
    use airstreams::deploy::SignatureType;

    let wallet = launch_provider_and_get_wallet().await?;

    let total_claim_amount = 1000;
    let identity_string = wallet.address().to_string();
    let identity: Bits256 = Bits256(wallet.address().hash().into());
    let tree_index = 0;
    let recipient = Identity::Address(wallet.address().into());

    let deployment = DeploymentBuilder::default()
        .with_users(vec![User {
            wallet_address_string: identity_string,
            allocation: total_claim_amount,
        }])
        .with_deployer(wallet.clone())
        .with_asset(AssetId::BASE)
        .deploy()
        .await?;

    let merkle_tree = deployment.configurables.merkle_tree;

    let proof = merkle_tree.prove(0).unwrap();

    // should fail due to zero claim being transferred
    let result = deployment
        .airstream
        .instance
        .methods()
        .claim(
            0,
            total_claim_amount,
            identity,
            tree_index,
            proof.1.into_iter().map(Bits256).collect(),
            recipient,
            SignatureType::Fuel,
        )
        .with_contract_ids(&[deployment.vesting_curve_registry.contract_id.into()])
        .call()
        .await;

    assert!(result.is_err());
    // assert that the error message has the reason "failed transfer to address"
    assert!(result
        .err()
        .unwrap()
        .to_string()
        .contains("failed transfer to address"));

    Ok(())
}

#[tokio::test]
async fn test_claim_with_eth_signature() -> Result<()> {
    let wallet = launch_provider_and_get_wallet().await?;

    let eth_wallet = EthSigner::random();
    let recipient = Identity::Address(wallet.address().into());
    let identity_string = eth_wallet.address_string.clone();
    let identity: Bits256 = hex_str_to_bytes(&identity_string).unwrap();
    let total_claim_amount = 1000;
    let claim_amount = 100;
    let tree_index = 0;

    let deployment = DeploymentBuilder::default()
        .with_users(vec![User {
            wallet_address_string: identity_string.clone(),
            allocation: total_claim_amount,
        }])
        .with_deployer(wallet.clone())
        .with_asset(AssetId::BASE)
        .deploy()
        .await?;

    let merkle_tree = deployment.configurables.merkle_tree.clone();
    let proof = merkle_tree.prove(tree_index).unwrap();

    let call_handler = deployment
        .airstream
        .instance
        .methods()
        .claim(
            claim_amount,
            total_claim_amount,
            identity,
            tree_index,
            proof.1.into_iter().map(Bits256).collect(),
            recipient,
            airstreams::deploy::SignatureType::Evm(airstreams::deploy::EVMSignatureType {
                witness_index: 1,
            }),
        )
        .with_contract_ids(&[deployment.vesting_curve_registry.contract_id.into()])
        .with_tx_policies(
            TxPolicies::default()
                .with_witness_limit(144)
                .with_script_gas_limit(100_000),
        );

    let tx = call_handler.build_tx().await?;

    let message: [u8; 32] = *tx.id(wallet.provider().unwrap().chain_id());

    let witness = eth_wallet.sign_message(&message).unwrap();

    let mut tx = tx.clone();

    // add a witness to the tx
    let _ = tx.append_witness(witness)?;

    let tx_status = wallet
        .provider()
        .unwrap()
        .send_transaction_and_await_commit(tx)
        .await?;

    let result = call_handler.get_response_from(tx_status);

    assert!(result.is_err());

    // assert that the error message has the reason "failed transfer to address"
    assert!(result
        .err()
        .unwrap()
        .to_string()
        .contains("failed transfer to address"));

    Ok(())
}
