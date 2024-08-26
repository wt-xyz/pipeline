import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { CoinQuantity } from "fuels";

// Define the type for your slice state
type PipelineState = {
  coins: CoinQuantity[];
};

// Set the initial state with the defined type
const initialState: PipelineState = {
  coins: [] as CoinQuantity[],
};

export const slice = createSlice({
  name: "coins",
  initialState,
  reducers: {
    setCoins: (state, action: PayloadAction<CoinQuantity[]>) => {
      state.coins = action.payload;
    },
  },
});

export const { setCoins } = slice.actions;
export default slice.reducer;
