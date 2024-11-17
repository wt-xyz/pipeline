use fuel_merkle::{binary::in_memory::MerkleTree, common::Bytes32};
use fuels::types::{Bits256, U256};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

#[derive(Serialize, Deserialize, Debug)]
pub struct User {
    pub wallet_address: String,
    pub allocation: u64,
}

#[derive(Debug)]
pub struct Allocation {
    pub identity: Bits256,
    pub amount: u64,
}

impl From<User> for Allocation {
    fn from(user: User) -> Self {
        Allocation {
            identity: hex_str_to_bytes(&user.wallet_address).unwrap(),
            amount: user.allocation,
        }
    }
}

pub fn hex_str_to_bytes(hex: &str) -> Result<Bits256, &'static str> {
    if hex.len() % 2 != 0 {
        return Err("Hexadecimal string must have an even length");
    }

    let b256 = Bits256::from_hex_str(hex).map_err(|_| "Invalid hexadecimal digit")?;
    Ok(b256)
}

pub fn create_merkle_root(values: &Vec<User>) -> MerkleTree {
    let mut tree = MerkleTree::new();

    for x in values {
        let mut hasher = Sha256::default();
        let val = U256::from(x.allocation);

        hasher.update(x.wallet_address.as_bytes());
        hasher.update(Bits256(val.into()).0.as_slice());

        let digest = hasher.finalize();

        tree.push(&digest[..]);
    }

    tree
}

pub fn get_users_proof(values: &Vec<User>, proofs: Vec<u64>) -> (Vec<Vec<Bytes32>>, String) {
    let tree = create_merkle_root(values);
    let mut res = vec![];

    for x in proofs.into_iter() {
        let proof = tree.prove(x).unwrap();
        res.push(proof.1);
    }

    (res, format!("0x{}", hex::encode(tree.root())))
}
