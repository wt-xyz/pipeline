use std::str::FromStr;

use anyhow::Result;
use fuel_merkle::common::Bytes32;
use fuels::types::{bech32::Bech32Address, Bits256, U256};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::string::String;

pub use fuel_merkle::binary::in_memory::MerkleTree;

#[derive(Serialize, Deserialize, Debug)]
pub struct User {
    pub wallet_address_string: String,
    pub allocation: u64,
}

impl Allocation {
    pub fn hash(&self) -> [u8; 32] {
        let mut hasher = Sha256::default();
        hasher.update(self.identity.0.as_slice());
        hasher.update(Bits256(U256::from(self.amount).into()).0.as_slice());
        hasher.finalize().into()
    }
}

#[derive(Debug)]
pub struct Allocation {
    pub identity: Bits256,
    pub amount: u64,
}

impl From<&User> for Allocation {
    fn from(user: &User) -> Self {
        // check if the wallet address is a bech32 address
        let identity = if user.wallet_address_string.starts_with("fuel") {
            Bits256(
                Bech32Address::from_str(&user.wallet_address_string)
                    .unwrap()
                    .hash()
                    .into(),
            )
        } else {
            hex_str_to_bytes(&user.wallet_address_string).unwrap()
        };

        Allocation {
            identity,
            amount: user.allocation,
        }
    }
}

pub struct AirstreamMerkleTree {
    pub tree: MerkleTree,
}

impl AirstreamMerkleTree {
    pub fn create_from_users(users: &Vec<User>) -> Self {
        Self {
            tree: create_merkle_tree(users),
        }
    }
}

pub fn hex_str_to_bytes(hex: &str) -> Result<Bits256> {
    // to_lowercase
    let hex = hex.to_lowercase();

    if hex.len() % 2 != 0 {
        anyhow::bail!("Hexadecimal string must have an even length");
    }

    // strip the 0x prefix if it exists
    let hex = hex.strip_prefix("0x").unwrap_or(&hex);

    // extend the hex string to 64 characters with trailing zeros
    let padded_hex = format!("{:0>64}", hex);

    let b256 = Bits256::from_hex_str(&padded_hex)?;
    Ok(b256)
}

fn create_merkle_tree(values: &Vec<User>) -> MerkleTree {
    let mut tree = MerkleTree::new();

    for x in values {
        let allocation = Allocation::from(x);
        let digest = allocation.hash();
        tree.push(&digest[..]);
    }

    tree
}

fn get_users_proof(values: &Vec<User>, proofs: Vec<u64>) -> (Vec<Vec<Bytes32>>, String) {
    let tree = create_merkle_tree(values);
    let mut res = vec![];

    for x in proofs.into_iter() {
        let proof = tree.prove(x).unwrap();
        res.push(proof.1);
    }

    (res, format!("0x{}", hex::encode(tree.root())))
}
