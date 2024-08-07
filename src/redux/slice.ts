import { createSlice } from '@reduxjs/toolkit';
import { CoinQuantity } from 'fuels';

const initialState = {
  coins: [] as CoinQuantity[],
  coinsWithInfo: [],
  coinInfo: [],
  globalStreams: []
}

export const slice = createSlice({
  name: 'pipeline',
  initialState,
  reducers: {
    setCoins: (state, action) => {
      state.coins = action.payload;
    },
    setCoinsWithInfo: (state, action) => {
      state.coinsWithInfo = action.payload;
    },
    setCoinInfo: (state, action) => {
      state.coinInfo = action.payload;
    },
    setGlobalStreams: (state, action) => {
      state.globalStreams = action.payload;
    },
  }
})

export const { setCoins, setCoinsWithInfo, setCoinInfo, setGlobalStreams } = slice.actions;

export default slice.reducer;