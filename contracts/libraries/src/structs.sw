library;

pub struct Breakpoint {
    pub duration_percentage_e6: u64,
    pub vested_percentage_e6: u64,
}

pub struct PiecewiseLinearVestingCurve {
    pub breakpoint_count: u8,
    pub breakpoints: [Breakpoint; 64],
}

pub enum VestingCurve {
    Linear: (),
    PiecewiseLinear: PiecewiseLinearVestingCurve,
}