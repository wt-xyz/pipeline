use alloy::{
    primitives::U256,
    signers::{local::PrivateKeySigner, SignerSync},
};
use anyhow::Result;
use fuels::tx::Witness;

pub struct EthSigner {
    pub address_string: String,
    private_key_signer: PrivateKeySigner,
}

impl EthSigner {
    pub fn random() -> Self {
        let private_key_signer = PrivateKeySigner::random();
        let address = private_key_signer.address();
        let address_string = address.to_string();

        Self {
            address_string,
            private_key_signer,
        }
    }

    pub fn sign_message(&self, message: &[u8]) -> Result<Witness> {
        let signature = self.private_key_signer.sign_message_sync(message)?;

        let r = U256::from(signature.r());
        let s = U256::from(signature.s());
        let v = if signature.v() { 1u8 } else { 0u8 };

        let compact_signature = create_compact_signature(r, s, v)?;
        Ok(compact_signature)
    }
}

const CURVE_ORDER: U256 = U256::from_be_slice(&[
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xba, 0xae, 0xdc, 0xe6, 0xaf, 0x48, 0xa0, 0x3b,
    0xbf, 0xd2, 0x5e, 0x8c, 0xd0, 0x36, 0x41, 0x41, 0x82, 0x5b, 0xed, 0xc5, 0x60, 0x80, 0xe1, 0x1a,
]);

fn create_compact_signature(r: U256, s: U256, v: u8) -> Result<Witness> {
    // Ensure s is in the lower half of the curve order
    let mut s_low = s;
    let mut v_adjusted = v;
    if s >= CURVE_ORDER / U256::from(2) {
        s_low = CURVE_ORDER - s;
        v_adjusted ^= 1; // Flip between 0 and 1
    }

    // Encode v in the most significant bit of s
    let mut s_bytes: [u8; 32] = s_low.to_be_bytes();
    if v_adjusted == 1 {
        s_bytes[0] |= 0x80; // Set the most significant bit of the first byte
    }

    // Serialize r and modified s into a 64-byte compact signature
    let r_bytes: [u8; 32] = r.to_be_bytes();

    let mut compact_signature = [0u8; 64];
    compact_signature[..32].copy_from_slice(&r_bytes);
    compact_signature[32..].copy_from_slice(&s_bytes);

    Ok(Witness::from(compact_signature.to_vec()))
}
