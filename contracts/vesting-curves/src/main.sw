contract;

mod errors;

use ::errors::Error;

use std::{hash::*};
use libraries::{
    constants::E6,
    interface::VestingCurveRegistry,
    structs::{
        VestingCurve,
        PiecewiseLinearVestingCurve,
        Breakpoint
    }
};

trait Verify {
    fn verify(self) -> bool;
}

impl Hash for VestingCurve {
    fn hash(self, ref mut state: Hasher) {
        match self {
            VestingCurve::Linear => {
                // Add a prefix hash for Linear variant
                "LinearVestingCurve".hash(state);
            },
            VestingCurve::PiecewiseLinear(PiecewiseLinearVestingCurve { breakpoint_count, breakpoints }) => {
                // Add a prefix hash for PiecewiseLinear variant
                "PiecewiseLinearVestingCurve".hash(state);
                // Hash the length of the vector
                breakpoint_count.hash(state);
                // Hash each element in the vector
                let mut i: u64 = 0;
                while i < u64::from(breakpoint_count) {
                    let breakpoint = breakpoints[i];
                    breakpoint.duration_percentage_e6.hash(state);
                    breakpoint.vested_percentage_e6.hash(state);
                    i += 1;
                }
            },
        }
    }
}

impl Verify for VestingCurve {
    fn verify(self) -> bool {
        match self {
            VestingCurve::Linear => {
                true
            },
            VestingCurve::PiecewiseLinear(PiecewiseLinearVestingCurve { breakpoint_count, breakpoints }) => {
                let mut i = 0;
                while i < u64::from(breakpoint_count) {
                    let breakpoint = breakpoints[i];
                    if i > 0 {
                        // the duration percentage and vesting percentage must be non-decreasing
                        let previous_breakpoint = breakpoints[i - 1];
                        if breakpoint.duration_percentage_e6 < previous_breakpoint.duration_percentage_e6 {
                            return false;
                        }
                        if breakpoint.vested_percentage_e6 < previous_breakpoint.vested_percentage_e6 {
                            return false;
                        }
                    }

                    if breakpoint.duration_percentage_e6 > 100 * E6 {
                        return false;
                    }
                    if breakpoint.vested_percentage_e6 > 100 * E6 {
                        return false;
                    }
                    i += 1;
                }
                true
            },
        }
    }
}

storage {
    vesting_curve_registry: StorageMap<b256, VestingCurve> = StorageMap {},
}

/// VestingCurveStore is a singleton contract that stores the vesting curves for the token streaming contract
impl VestingCurveRegistry for Contract {
    #[storage(read, write)]
    fn register_vesting_curve(curve: VestingCurve) -> b256 {
        // if the curve already exists, return the existing id
        // hash the curve and check if it exists in the registry
        log(131313);
        let curve_hash = sha256(curve);
        let existing_curve = storage.vesting_curve_registry.get(curve_hash).try_read();
        if existing_curve.is_none() {
            require(curve.verify(), Error::InvalidVestingCurve);
            storage.vesting_curve_registry.insert(curve_hash, curve);
        }
        curve_hash
    }

    #[storage(read)]
    fn vested_amount(curve_id: b256, total_amount: u64, start_time: u64, end_time: u64, current_time: u64) -> u64 {
        let curve = get_curve(curve_id);
        vested_amount(curve, total_amount, start_time, end_time, current_time)
    }


    #[storage(read)]
    fn vested_percentage_e6(curve_id: b256, duration_percentage_e6: u64) -> u64 {
        let curve = get_curve(curve_id);
        vested_percentage_e6(curve, duration_percentage_e6)
    }

    #[storage(read)]
    fn get_vesting_curve(curve_id: b256) -> VestingCurve {
        storage.vesting_curve_registry.get(curve_id).try_read().unwrap()
    }
}

fn vested_amount(curve: VestingCurve, total_amount: u64, start_time: u64, end_time: u64, current_time: u64) -> u64 {
    if (current_time < start_time) {
        return 0;
    }
    let duration_percentage_e6 = (current_time - start_time) * E6 / (end_time - start_time);
    let vested_percentage_e6 = vested_percentage_e6(curve, duration_percentage_e6);

    (total_amount * vested_percentage_e6) / E6
}

fn vested_percentage_e6(curve: VestingCurve, duration_percentage_e6: u64) -> u64 {
    let percentage = match curve {
        VestingCurve::Linear => {
            duration_percentage_e6
        },
        VestingCurve::PiecewiseLinear(PiecewiseLinearVestingCurve { breakpoint_count, breakpoints }) => {
            // at end of stream always return 100%
            if duration_percentage_e6 == 100 * E6 {
                return 100 * E6;
            }

            // calculate the vested percentage
            // first step is to find the correct breakpoint
            // first find the last breakpoint that is less than or equal to than the duration_percentage_e6
            let breakpoint = find_previous_breakpoint(breakpoints, breakpoint_count, duration_percentage_e6);

            // Then calculate the vested percentage between the start and end breakpoint
            if breakpoint.is_none() {
                return 0;
            }

            let breakpoint = breakpoint.unwrap();
            let breakpoint_index = u8::try_from(breakpoint.1).unwrap();

            // if it is the last breakpoint, return the vested_percentage_e6
            if breakpoint_index == breakpoint_count - 1 {
                return breakpoint.0.vested_percentage_e6;
            }

            // get the start and end of the section
            let start_of_section = breakpoint.0;
            let end_of_section = breakpoints[u64::from(breakpoint_index) + 1];

            // first get the duration of the section that is completed
            let completed_duration_in_section_e6 = duration_percentage_e6 - start_of_section.duration_percentage_e6;

            // get the total duration of the section
            let total_section_duration_e6 = end_of_section.duration_percentage_e6 - start_of_section.duration_percentage_e6;

            // get the percentage vesting that should happen the section that is vested
            let total_vested_percentage_in_section_e6 = end_of_section.vested_percentage_e6 - start_of_section.vested_percentage_e6;

            // calculate the vested percentage in the section
            let vested_percentage_in_section_e6 = (completed_duration_in_section_e6 * total_vested_percentage_in_section_e6) / total_section_duration_e6;

            // add the vested percentage of the section to the total vested percentage
            start_of_section.vested_percentage_e6 + vested_percentage_in_section_e6
        }
    };
    // percentage can never be greater than 100%
    if percentage > 100 * E6 {
        return 100 * E6;
    }
    percentage
}

#[storage(read)]
fn get_curve(curve_id: b256) -> VestingCurve {
    let curve = storage.vesting_curve_registry.get(curve_id).try_read();
    require(curve.is_some(), Error::VestingCurveNotFound);

    curve.unwrap()
}

// // Find the largest value in the vector that is less than or equal to the target
// // If multiple values are equal, the second occurrence is returned
fn find_previous_breakpoint(breakpoints: [Breakpoint; 64], breakpoint_count: u8, target: u64) -> Option<(Breakpoint, u64)> {
    if breakpoint_count == 0 {
        return None;
    }

    let mut low = 0;
    let mut high = u64::from(breakpoint_count - 1);
    let mut result = None;

    while low <= high {
        let mid = low + (high - low) / 2;
        let mid_breakpoint = breakpoints[mid];

        if mid_breakpoint.duration_percentage_e6 <= target {
            // Found a candidate; move to the right half to find a larger candidate
            result = Some((mid_breakpoint, mid));
            low = mid + 1;
        } else {
            // Move to the left half
            if mid == 0 {
                break; // Prevent underflow;
            }
            high = mid - 1;
        }
    }

    result
}

#[test]
fn test_linear_vesting_curve_percentage() {
    let curve = VestingCurve::Linear;
    let duration_percentage_e6 = 1 * E6;
    let vested_percentage_e6 = vested_percentage_e6(curve, duration_percentage_e6);
    assert_eq(vested_percentage_e6, duration_percentage_e6);
}

#[test]
fn test_linear_vesting_curve_amount() {
    let curve = VestingCurve::Linear;
    let total_amount = 1 * E6;
    let start_time = 0;
    let end_time = 1 * E6;
    let current_time = 500_000;
    let vested_amount = vested_amount(curve, total_amount, start_time, end_time, current_time);
    assert_eq(vested_amount, 500_000);
}

fn default_breakpoints() -> [Breakpoint; 64] {
    [Breakpoint { duration_percentage_e6: 0, vested_percentage_e6: 0 }; 64]
}

fn create_piecewise_linear_vesting_curve(_breakpoints: Vec<Breakpoint>) -> VestingCurve {
    let breakpoint_count = _breakpoints.len();
    let mut breakpoints = default_breakpoints();

    let mut i = 0;
    while i < breakpoint_count {
        breakpoints[i] = _breakpoints.get(i).unwrap();
        i += 1;
    }

    let curve = PiecewiseLinearVestingCurve {
        breakpoint_count: u8::try_from(breakpoint_count).unwrap(),
        breakpoints: breakpoints,
    };

    VestingCurve::PiecewiseLinear(curve)
}


fn piecewise_linear_vesting_curve_percentage_test_helper(
    _breakpoints: Vec<Breakpoint>,
    duration_percentage_e6: u64,
    expected_vested_percentage_e6: u64,
) {
    let curve = create_piecewise_linear_vesting_curve(_breakpoints);
    let vested_percentage_e6 = vested_percentage_e6(curve, duration_percentage_e6);
    assert_eq(vested_percentage_e6, expected_vested_percentage_e6);
}

#[test]
fn piecewise_linear_vesting_curve_verify_descending_duration() {
    let mut breakpoints_vector = Vec::new();

    breakpoints_vector.push(Breakpoint { duration_percentage_e6: 0, vested_percentage_e6: 0 });
    breakpoints_vector.push(Breakpoint { duration_percentage_e6: 50 * E6, vested_percentage_e6: 25 * E6});
    breakpoints_vector.push(Breakpoint { duration_percentage_e6: 49 * E6, vested_percentage_e6: 100 * E6});

    let curve = create_piecewise_linear_vesting_curve(breakpoints_vector);
    assert(!curve.verify());
}

#[test]
fn piecewise_linear_vesting_curve_verify_descending_vesting() {
    let mut breakpoints_vector = Vec::new();

    breakpoints_vector.push(Breakpoint { duration_percentage_e6: 0, vested_percentage_e6: 0 });
    breakpoints_vector.push(Breakpoint { duration_percentage_e6: 50 * E6, vested_percentage_e6: 25 * E6});
    breakpoints_vector.push(Breakpoint { duration_percentage_e6: 100 * E6, vested_percentage_e6: 24 * E6});

    let curve = create_piecewise_linear_vesting_curve(breakpoints_vector);

    let duration_percentage_e6 = 0;

    assert(!curve.verify());
}

#[test]
fn piecewise_linear_vesting_curve_simple_linear() {
    let mut breakpoints_vector = Vec::new();

    breakpoints_vector.push(Breakpoint { duration_percentage_e6: 0, vested_percentage_e6: 0 });
    breakpoints_vector.push(Breakpoint { duration_percentage_e6: 100 * E6, vested_percentage_e6: 100 * E6});

    let duration_1 = 50 * E6;
    let vested_1 = 50 * E6;

    piecewise_linear_vesting_curve_percentage_test_helper(breakpoints_vector, duration_1, vested_1);
}

#[test]
fn piecewise_linear_vesting_curve_verify_2_vesting_cliffs_then_linear() {
    let mut breakpoints_vector = Vec::new();

    breakpoints_vector.push(Breakpoint { duration_percentage_e6: 0, vested_percentage_e6: 0 });
    breakpoints_vector.push(Breakpoint { duration_percentage_e6: 0, vested_percentage_e6: 10 * E6});
    breakpoints_vector.push(Breakpoint { duration_percentage_e6: 30 * E6, vested_percentage_e6: 10 * E6});
    breakpoints_vector.push(Breakpoint { duration_percentage_e6: 30 * E6, vested_percentage_e6: 30 * E6});
    breakpoints_vector.push(Breakpoint { duration_percentage_e6: 100 * E6, vested_percentage_e6: 100 * E6});

    let duration_1 = 0;
    let duration_2 = 29_999_999;
    let duration_3 = 30 * E6;
    let duration_4 = 40 * E6;
    let vested_1 = 10 * E6;
    let vested_2 = 10 * E6;
    let vested_3 = 30 * E6;
    let vested_4 = 40 * E6;


    piecewise_linear_vesting_curve_percentage_test_helper(breakpoints_vector, duration_1, vested_1);
    piecewise_linear_vesting_curve_percentage_test_helper(breakpoints_vector, duration_2, vested_2);
    piecewise_linear_vesting_curve_percentage_test_helper(breakpoints_vector, duration_3, vested_3);
}

#[test]
fn piecewise_linear_vesting_curve_no_100() {
    let mut breakpoints_vector = Vec::new();

    breakpoints_vector.push(Breakpoint { duration_percentage_e6: 0, vested_percentage_e6: 0 });
    breakpoints_vector.push(Breakpoint { duration_percentage_e6: 100 * E6, vested_percentage_e6: 90 * E6});

    let duration_percentage_e6 = 100 * E6;
    let expected_vested_percentage_e6 = 100 * E6;
    piecewise_linear_vesting_curve_percentage_test_helper(breakpoints_vector, duration_percentage_e6, expected_vested_percentage_e6);
}