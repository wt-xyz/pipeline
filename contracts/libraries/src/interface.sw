library;

use ::structs::VestingCurve;

abi VestingCurveRegistry {
    #[storage(read)]
    fn vested_percentage_e6(curve_id: b256, duration_percentage_e6: u64) -> u64;

    #[storage(read)]
    fn vested_amount(curve_id: b256, total_amount: u64, start_time: u64, end_time: u64, current_time: u64) -> u64;

    #[storage(read, write)]
    fn register_vesting_curve(curve: VestingCurve) -> b256;

    #[storage(read)]
    fn get_vesting_curve(curve_id: b256) -> VestingCurve;
}