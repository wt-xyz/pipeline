library;

pub enum Error {
    VestingCurveNotFound: (),
    InvalidVestingCurve: (),
    // TODO: remove test
    TestError: (u64, u64)
}
