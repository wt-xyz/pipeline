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

storage {
    vesting_curve_registry: StorageMap<b256, VestingCurve> = StorageMap {},
}

/// VestingCurveStore is a singleton contract that stores the vesting curves for the token streaming contract
impl VestingCurveRegistry for Contract {
    #[storage(read, write)]
    fn register_vesting_curve(curve: VestingCurve) -> b256 {
        // if the curve already exists, return the existing id
        // hash the curve and check if it exists in the registry
        let curve_hash = sha256(curve);
        let existing_curve = storage.vesting_curve_registry.get(curve_hash).try_read();
        if existing_curve.is_none() {
            storage.vesting_curve_registry.insert(curve_hash, curve);
        }
        curve_hash
    }

    #[storage(read)]
    fn vested_amount(curve_id: b256, total_amount: u64, start_time: u64, end_time: u64, current_time: u64) -> u64 {
        let duration_percentage_e6 = (current_time - start_time) * E6 / (end_time - start_time);
        let vested_percentage_e6 = vested_percentage_e6(curve_id, duration_percentage_e6);
        (total_amount * vested_percentage_e6) / E6
    }


    #[storage(read)]
    fn vested_percentage_e6(curve_id: b256, duration_percentage_e6: u64) -> u64 {
        vested_percentage_e6(curve_id, duration_percentage_e6)
    }

    #[storage(read)]
    fn get_vesting_curve(curve_id: b256) -> VestingCurve {
        storage.vesting_curve_registry.get(curve_id).try_read().unwrap()
    }
}

#[storage(read)]
fn vested_percentage_e6(curve_id: b256, duration_percentage_e6: u64) -> u64 {
    // get the curve from the registry
    let curve = storage.vesting_curve_registry.get(curve_id).try_read();
    require(curve.is_some(), Error::VestingCurveNotFound);

    let curve = curve.unwrap();
    // calculate the vested percentage

    match curve {
        VestingCurve::Linear => {
            duration_percentage_e6
        },
        VestingCurve::PiecewiseLinear(PiecewiseLinearVestingCurve { breakpoint_count, breakpoints }) => {
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
    }
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