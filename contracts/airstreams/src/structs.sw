library;

pub struct FuelSignatureType {}

pub struct EVMSignatureType {
    pub witness_index: u64,
}

pub enum SignatureType {
    FUEL: FuelSignatureType,
    EVM: EVMSignatureType,
}
