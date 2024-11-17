use catalyst_merkle::{create_merkle_root, User};
use fuels::{
    prelude::*,
    types::{Bits256, Identity},
};

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
    start_time: u64,
    // end time
    end_time: u64,
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
struct AirstreamContract {
    contract_id: ContractId,
    instance: Airstreams<WalletUnlocked>,
}

struct VestingCurveRegistryContract {
    contract_id: ContractId,
    instance: VestingCurveRegistry<WalletUnlocked>,
}

struct Deployment {
    // airstreams contract id
    airstream: AirstreamContract,
    // vesting curve registry id
    vesting_curve_registry: VestingCurveRegistryContract,
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
            start_time: 0,
            end_time: 0,
            vesting_curve: VestingCurve::Linear,
            vesting_curve_registry_id: None,
            asset_id: AssetId::from([0u8; 32]),
            deployer: WalletUnlocked::new_random(None),
        }
    }
}

/// Builder for deploying airstreams contracts
impl DeploymentBuilder {
    pub fn new() -> Self {
        Self {
            params: DeployParams::default(),
        }
    }

    pub fn with_users(mut self, users: Vec<User>) -> Self {
        self.params.users = users;
        self
    }

    pub fn with_owner(mut self, owner: Identity) -> Self {
        self.params.owner = owner;
        self
    }

    pub fn with_times(mut self, start_time: u64, end_time: u64) -> Self {
        self.params.start_time = start_time;
        self.params.end_time = end_time;
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
        let merkle_root = create_merkle_root(&self.params.users).root();

        // 3. Deploy airstreams contract
        let airstreams_configurables = AirstreamsConfigurables::default()
            .with_VESTING_CURVE_REGISTRY_ID(vesting_curve_registry_id)?
            .with_START_TIME(self.params.start_time)?
            .with_END_TIME(self.params.end_time)?
            .with_ASSET(self.params.asset_id)?
            .with_INITIAL_OWNER(Some(self.params.owner))?
            .with_VESTING_CURVE(self.params.vesting_curve)?
            .with_MERKLE_ROOT(Bits256(merkle_root))?
            .with_NUM_LEAVES(self.params.users.len() as u64)?;

        let airstreams_contract_id = Contract::load_from(
            "./out/debug/airstreams.bin",
            LoadConfiguration::default().with_configurables(airstreams_configurables),
        )?
        .deploy(&self.params.deployer, TxPolicies::default())
        .await?
        .into();

        let instance = Airstreams::new(airstreams_contract_id, self.params.deployer);

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
        })
    }
}

// Example usage in tests
#[cfg(test)]
#[tokio::test]
async fn test_deployment() -> Result<()> {
    let wallet = launch_provider_and_get_wallet().await?;

    let deployment = DeploymentBuilder::new()
        .with_users(vec![User {
            wallet_address: "0x1234567890abcdef".to_string(),
            allocation: 1000,
        }])
        .with_owner(wallet.address().into())
        .with_deployer(wallet.clone())
        .with_times(100, 200)
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
    // Now you can use deployment.airstreams_id, deployment.instance, etc.
    Ok(())
}
