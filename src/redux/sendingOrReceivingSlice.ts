import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// Define the type for your slice state
type PipelineState = {
  sendingOrReceiving: string;
};

// Set the initial state with the defined type
const initialState: PipelineState = {
  sendingOrReceiving: "",
};

export const slice = createSlice({
  name: "sendingOrReceiving",
  initialState,
  reducers: {
    setSendingOrReceiving: (state, action: PayloadAction<string>) => {
      state.sendingOrReceiving = action.payload;
    },
  },
});

export const { setSendingOrReceiving } = slice.actions;
export default slice.reducer;
