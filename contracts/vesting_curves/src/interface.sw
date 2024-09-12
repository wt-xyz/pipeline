/// VestingCurveStore

abi VestingCurveRegistry {
    fn vested_percentage_e10(curve_id: u64, percentage_duration_e10: u64) -> u64;

    fn register_vesting_curve(curve: VestingCurve) -> u64;
}
