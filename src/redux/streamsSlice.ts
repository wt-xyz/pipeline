import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Stream } from "@/hooks/Streams";

// Define the type for your slice state
type PipelineState = {
  streams: Stream[];
};

// Set the initial state with the defined type
const initialState: PipelineState = {
  streams: [] as Stream[],
};

export const slice = createSlice({
  name: "streams",
  initialState,
  reducers: {
    setStreams: (state, action: PayloadAction<Stream[]>) => {
      state.streams = action.payload;
    },
  },
});

export const { setStreams } = slice.actions;
export default slice.reducer;
