library;

pub struct EVMSignatureType {
    pub witness_index: u64,
}

pub enum SignatureType {
    Fuel: (),
    Evm: EVMSignatureType,
}

pub struct Allocation {
    pub identity: b256,
    pub amount: u64,
}
