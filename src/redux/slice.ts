import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  coins: []
}

export const slice = createSlice({
  name: 'pipeline',
  initialState,
  reducers: {
    setCoins: (state, action) => {
      state.coins = action.payload;
    },
  }
})

export const { setCoins } = slice.actions;

export default slice.reducer;