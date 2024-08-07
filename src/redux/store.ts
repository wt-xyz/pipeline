import { configureStore } from '@reduxjs/toolkit';
import slice from './slice';

export const store = configureStore({
  reducer: {
    pipeline: slice
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['pipeline/setCoins', 'pipeline/setCoinsWithInfo', 'pipeline/setCoinInfo'],
        ignoredPaths: ['pipeline.coins', 'pipeline.coinsWithInfo', 'pipeline.coinInfo'],
      },
    }),
})