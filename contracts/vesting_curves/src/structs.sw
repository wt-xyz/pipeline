// enum for the different types of vesting curves
enum VestingCurve {
    Linear {
        start_time: u64,
        end_time: u64,
    },
    PiecewiseLinear {
        breakpoints: Vec<(u64, u64)>,
    },
}
