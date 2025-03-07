import { calculateVestingInfo } from "@/components/Charts/vesting-utils";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "./store";
import { initialData } from "@/utils/vesting-data-utils";

export type vestingState = {
  vestingInfo: ReturnType<typeof calculateVestingInfo>[];
  streamData: {
    streamStartDate?: number;
    streamEndDate?: number;
    streamSize?: number;
  };
};

const initialState: vestingState = {
  vestingInfo: [],
  streamData: {
    streamStartDate: initialData.startDate.getTime(),
    streamEndDate: initialData.endDate.getTime(),
    streamSize: 1,
  },
};

export const slice = createSlice({
  name: "vesting",
  initialState,
  reducers: {
    setVestingInfo: (
      state,
      action: PayloadAction<ReturnType<typeof calculateVestingInfo>[]>,
    ) => {
      state.vestingInfo = action.payload;
    },
    setStreamData: (
      state,
      action: PayloadAction<vestingState["streamData"]>,
    ) => {
      if (action.payload.streamEndDate) {
        state.streamData.streamEndDate = action.payload.streamEndDate;
      }
      if (action.payload.streamStartDate) {
        state.streamData.streamStartDate = action.payload.streamStartDate;
      }
      if (action.payload.streamSize) {
        state.streamData.streamSize = action.payload.streamSize;
      }
    },
  },
});

export const { setVestingInfo, setStreamData } = slice.actions;

export const selectVestingInfo = (state: RootState) =>
  state.vesting.vestingInfo;
export const selectStreamData = (state: RootState) => state.vesting.streamData;

export default slice.reducer;
