import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { CoinQuantity } from "fuels";
import { CoinWithInfo } from "@/hooks/useCoins";
import { Stream } from "@/hooks/Streams";

// Define the type for your slice state
type PipelineState = {
  coins: CoinQuantity[];
  coinsWithInfo: CoinWithInfo[];
  globalStreams: Stream[];
  sendingOrReceiving: string;
  timezone: string | null;
};

// Set the initial state with the defined type
const initialState: PipelineState = {
  coins: [] as CoinQuantity[],
  coinsWithInfo: [] as CoinWithInfo[],
  globalStreams: [] as Stream[],
  sendingOrReceiving: "",
  timezone: null,
};

export const slice = createSlice({
  name: "pipeline",
  initialState,
  reducers: {
    setCoins: (state, action: PayloadAction<CoinQuantity[]>) => {
      state.coins = action.payload;
    },
    setCoinsWithInfo: (state, action: PayloadAction<CoinWithInfo[]>) => {
      state.coinsWithInfo = action.payload;
    },
    setGlobalStreams: (state, action: PayloadAction<Stream[]>) => {
      state.globalStreams = action.payload;
    },
    setSendingOrReceiving: (state, action: PayloadAction<string>) => {
      state.sendingOrReceiving = action.payload;
    },
    setTimezone: (state, action: PayloadAction<string | null>) => {
      state.timezone = action.payload;
    },
  },
});

export const {
  setCoins,
  setCoinsWithInfo,
  setGlobalStreams,
  setSendingOrReceiving,
  setTimezone,
} = slice.actions;

export default slice.reducer;
