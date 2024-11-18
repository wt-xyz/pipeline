use catalyst_merkle::{AirstreamMerkleTree, MerkleTree, User};
use chrono::{DateTime, Days, Utc};
use fuels::{
    prelude::*,
    types::{Bits256, Identity},
};
use tai64::Tai64;

abigen!(
    Contract(
        name = "Airstreams",
        abi = "contracts/airstreams/out/debug/airstreams-abi.json",
    ),
    Contract(
        name = "VestingCurveRegistry",
        abi = "contracts/vesting-curves/out/debug/vesting-curves-abi.json",
    ),
);

struct DeployParams {
    // users
    users: Vec<User>,
    // initial owner address
    owner: Identity,
    // start time
    start_datetime_unix: DateTime<Utc>,
    // end time
    end_datetime_unix: DateTime<Utc>,
    // vesting curve
    vesting_curve: VestingCurve,
    // vesting curve registry id
    // if None, then deploy a new vesting curve registry
    vesting_curve_registry_id: Option<ContractId>,
    // asset id
    asset_id: AssetId,
    // deployer wallet
    deployer: WalletUnlocked,
}

// TODO make this generic over the contract deployment trait
pub struct AirstreamContract {
    pub contract_id: ContractId,
    pub instance: Airstreams<WalletUnlocked>,
}

pub struct VestingCurveRegistryContract {
    pub contract_id: ContractId,
    pub instance: VestingCurveRegistry<WalletUnlocked>,
}

pub struct Deployment {
    // airstreams contract id
    pub airstream: AirstreamContract,
    // vesting curve registry id
    pub vesting_curve_registry: VestingCurveRegistryContract,
    // deployment configurables
    // Some overlap from deploy params, but some values are derived
    pub configurables: DeploymentConfigurables,
    // deploy params
    pub params: DeployParams,
}

pub struct DeploymentConfigurables {
    pub vesting_curve_registry_id: ContractId,
    pub start_time: u64,
    pub end_time: u64,
    pub asset_id: AssetId,
    pub owner: Identity,
    pub vesting_curve: VestingCurve,
    pub merkle_root: Bits256,
    pub num_leaves: u64,
    pub merkle_tree: MerkleTree,
}

pub struct DeploymentBuilder {
    params: DeployParams,
}

/// Assign default values to the deploy params
/// These defaults require significant changes for a working deployment
impl Default for DeployParams {
    fn default() -> Self {
        Self {
            users: Vec::new(),
            owner: Identity::Address(Address::from([0u8; 32])),
            start_datetime_unix: Utc::now().checked_add_days(Days::new(1)).unwrap(),
            end_datetime_unix: Utc::now().checked_add_days(Days::new(50)).unwrap(),
            vesting_curve: VestingCurve::Linear,
            vesting_curve_registry_id: None,
            asset_id: AssetId::from([0u8; 32]),
            deployer: WalletUnlocked::new_random(None),
        }
    }
}

impl Default for DeploymentBuilder {
    fn default() -> Self {
        Self {
            params: DeployParams::default(),
        }
    }
}

/// Builder for deploying airstreams contracts
impl DeploymentBuilder {
    pub fn with_users(mut self, users: Vec<User>) -> Self {
        self.params.users = users;
        self
    }

    pub fn with_owner(mut self, owner: Identity) -> Self {
        self.params.owner = owner;
        self
    }

    pub fn with_times(
        mut self,
        start_time_unix: DateTime<Utc>,
        end_time_unix: DateTime<Utc>,
    ) -> Self {
        self.params.start_datetime_unix = start_time_unix;
        self.params.end_datetime_unix = end_time_unix;
        self
    }

    pub fn with_vesting_curve(mut self, curve: VestingCurve) -> Self {
        self.params.vesting_curve = curve;
        self
    }

    pub fn with_asset(mut self, asset_id: AssetId) -> Self {
        self.params.asset_id = asset_id;
        self
    }

    pub fn with_deployer(mut self, wallet: WalletUnlocked) -> Self {
        self.params.deployer = wallet;
        self
    }

    pub async fn deploy(self) -> Result<Deployment> {
        // for deployment we need to do the following:
        // 1. deploy vesting curve registry if not provided
        // 2. calculate the merkle root of the allocations
        // 3. deploy airstreams contract

        // 1. Deploy vesting curve registry if not provided
        let vesting_curve_registry_id = match self.params.vesting_curve_registry_id {
            Some(id) => id,
            None => Contract::load_from(
                "../vesting-curves/out/debug/vesting-curves.bin",
                LoadConfiguration::default(),
            )?
            .deploy(&self.params.deployer, TxPolicies::default())
            .await?
            .into(),
        };

        let vesting_curve_registry_instance =
            VestingCurveRegistry::new(vesting_curve_registry_id, self.params.deployer.clone());

        // 2. Calculate the merkle root of the allocations
        let merkle_tree = AirstreamMerkleTree::create_from_users(&self.params.users).tree;

        let merkle_root = merkle_tree.root();

        // convert times to tai64
        let start_time = Tai64::from_unix(self.params.start_datetime_unix.timestamp());
        let end_time = Tai64::from_unix(self.params.end_datetime_unix.timestamp());

        let deployment_configurables = DeploymentConfigurables {
            vesting_curve_registry_id,
            start_time: start_time.0,
            end_time: end_time.0,
            asset_id: self.params.asset_id,
            owner: self.params.owner,
            vesting_curve: self.params.vesting_curve.clone(),
            merkle_root: Bits256(merkle_root),
            num_leaves: self.params.users.len() as u64,
            merkle_tree,
        };

        // 3. Deploy airstreams contract
        let airstreams_configurables = AirstreamsConfigurables::default()
            .with_VESTING_CURVE_REGISTRY_ID(vesting_curve_registry_id)?
            .with_START_TIME(deployment_configurables.start_time)?
            .with_END_TIME(deployment_configurables.end_time)?
            .with_ASSET(self.params.asset_id)?
            .with_INITIAL_OWNER(Some(deployment_configurables.owner))?
            .with_VESTING_CURVE(deployment_configurables.vesting_curve.clone())?
            .with_MERKLE_ROOT(deployment_configurables.merkle_root)?
            .with_NUM_LEAVES(deployment_configurables.num_leaves)?;

        let airstreams_contract_id = Contract::load_from(
            "./out/debug/airstreams.bin",
            LoadConfiguration::default().with_configurables(airstreams_configurables),
        )?
        .deploy(&self.params.deployer, TxPolicies::default())
        .await?
        .into();

        let instance = Airstreams::new(airstreams_contract_id, self.params.deployer.clone());

        // airstream contract must be initialized to register the vesting curve
        instance
            .methods()
            .initialize()
            .with_contract_ids(&[vesting_curve_registry_id.into()])
            .call()
            .await?;

        Ok(Deployment {
            airstream: AirstreamContract {
                contract_id: airstreams_contract_id,
                instance,
            },
            vesting_curve_registry: VestingCurveRegistryContract {
                contract_id: vesting_curve_registry_id,
                instance: vesting_curve_registry_instance,
            },
            configurables: deployment_configurables,
            params: self.params,
        })
    }
}

// Example usage in tests
#[cfg(test)]
#[tokio::test]
async fn test_deployment() -> Result<()> {
    use chrono::Days;

    let wallet = launch_provider_and_get_wallet().await?;

    let current_datetime = Utc::now();
    let start_time = current_datetime
        .checked_add_days(Days::new(1))
        .expect("Failed to add days to get start time");
    let end_time = current_datetime
        .checked_add_days(Days::new(50))
        .expect("Failed to add days to get end time");

    let deployment = DeploymentBuilder::default()
        .with_users(vec![User {
            wallet_address_string: "0x1234567890abcdef".to_string(),
            allocation: 1000,
        }])
        .with_owner(wallet.address().into())
        .with_deployer(wallet.clone())
        .with_times(start_time, end_time)
        .with_vesting_curve(VestingCurve::Linear)
        .deploy()
        .await?;

    let owner = deployment
        .airstream
        .instance
        .methods()
        .owner()
        .call()
        .await?
        .value
        .unwrap();

    assert_eq!(owner, Identity::Address(wallet.address().into()));

    let claimed_amount = deployment
        .airstream
        .instance
        .methods()
        .amount_claimed(0)
        .call()
        .await?
        .value;

    assert_eq!(claimed_amount, 0);

    // Now you can use deployment.airstreams_id, deployment.instance, etc.
    Ok(())
}

/// Test proof generation
#[cfg(test)]
#[tokio::test]
async fn test_proof_generation_fuel_address() -> Result<()> {
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
