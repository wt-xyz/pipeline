import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// Define the type for your slice state
type PipelineState = {
  timezone: string | null;
};

// Set the initial state with the defined type
const initialState: PipelineState = {
  timezone: null,
};

export const slice = createSlice({
  name: "timezone",
  initialState,
  reducers: {
    setTimezone: (state, action: PayloadAction<string | null>) => {
      state.timezone = action.payload;
    },
  },
});

export const { setTimezone } = slice.actions;
export default slice.reducer;
