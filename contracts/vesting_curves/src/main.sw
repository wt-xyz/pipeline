contract;

use structs::VestingCurve;

storage {
    vesting_curve_id: u64 = 0,
    vesting_curve_registry: StorageMap<u64, VestingCurve> = StorageMap {},
}


/// VestingCurveStore is a singleton contract that stores the vesting curves for the token streaming contract
impl VestingCurveRegistry for Contract {
    fn register_vesting_curve(curve: VestingCurve) -> u64 {
        // if the curve already exists, return the existing id
        // hash the curve and check if it exists in the registry
        let curve_hash = sha256(curve);
        let existing_curve = self.vesting_curve_registry.get(curve_hash);
        if existing_curve.is_none() {
            self.vesting_curve_registry.insert(curve_hash, curve);
        } 
        curve_id
    }

    fn vested_percentage_e10(curve_id: u64, percentage_duration_e10: u64) -> u64 {
        // get the curve from the registry
        let curve = self.vesting_curve_registry.get(curve_id);
        if curve.is_none() {
            return 0;
        }

        let curve = curve.unwrap();
        // calculate the vested percentage

        let vested_percentage = match curve {
            VestingCurve::Linear { start_time, end_time } => {
                // calculate the vested percentage
                let vested_percentage = percentage_duration_e10 / (end_time - start_time);
                vested_percentage
            },
            VestingCurve::PiecewiseLinear { breakpoints } => {
                // calculate the vested percentage
                // first step is to find the correct breakpoint
                // first find the first breakpoint that is greater than the percentage_duration_e10
                let end_breakpoint = breakpoints.iter().find(|(time, _)| time > &percentage_duration_e10);
                // this is the end breakpoint for this section
                // Then step back one breakpoint to get the start breakpoint

                // Then calculate the vested percentage between the start and end breakpoint

                if breakpoint.is_none() {
                    return 0;
                }
                let breakpoint = breakpoint.unwrap();
                // calculate the vested percentage
                let vested_percentage = breakpoint.1;
                vested_percentage
            }
        }
        vested_percentage
    }
}