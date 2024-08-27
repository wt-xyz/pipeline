import {
  createSlice,
  createEntityAdapter,
  PayloadAction,
} from "@reduxjs/toolkit";
import { CoinQuantity } from "fuels";
import { RootState } from "./store";

// Create a type that extends CoinQuantity to include an `id` field
export type CoinQuantityWithId = Omit<CoinQuantity, "amount"> & {
  id: string;
  amount: string;
};

const coinsAdapter = createEntityAdapter<CoinQuantityWithId>({
  // Assume the `id` field in your CoinQuantity is named `id`. If not, adjust this selector accordingly.
  // selectId: (coin) => coin.assetId,
});

const initialState = coinsAdapter.getInitialState();

export const slice = createSlice({
  name: "coins",
  initialState,
  reducers: {
    setCoins: (state, action: PayloadAction<CoinQuantity[]>) => {
      coinsAdapter.setAll(
        state,
        action.payload.map((coin) => ({
          ...coin,
          id: coin.assetId, // Map assetId to id
          amount: coin.amount.toString(), // Convert BN to string
        })),
      );
    },
    addCoin: (state, action: PayloadAction<CoinQuantity>) => {
      coinsAdapter.addOne(state, {
        ...action.payload,
        id: action.payload.assetId, // Map assetId to id
        amount: action.payload.amount.toString(), // Convert BN to string
      });
    },
    updateCoin: (state, action: PayloadAction<CoinQuantity>) => {
      coinsAdapter.updateOne(state, {
        id: action.payload.assetId, // Use assetId as id
        changes: {
          ...action.payload,
          amount: action.payload.amount.toString(), // Convert BN to string
        },
      });
    },
    removeCoin: (state, action: PayloadAction<string>) => {
      coinsAdapter.removeOne(state, action.payload);
    },
  },
});

// Export the actions
export const { setCoins, addCoin, updateCoin, removeCoin } = slice.actions;

// Export the reducer
export default slice.reducer;

export const {
  selectById: selectCoinById,
  selectIds: selectCoinIds,
  selectEntities: selectCoinEntities,
  selectAll: selectAllCoins,
  selectTotal: selectTotalCoins,
} = coinsAdapter.getSelectors((state: RootState) => state.coins);
