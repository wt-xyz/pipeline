import { configureStore } from "@reduxjs/toolkit";
import slice from "./slice";

export const store = configureStore({
  reducer: {
    pipeline: slice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          "pipeline/setCoins",
          "pipeline/setCoinsWithInfo",
          "pipeline/setCoinInfo",
          "pipeline/setGlobalStreams",
        ],
        ignoredPaths: [
          "pipeline.coins",
          "pipeline.coinsWithInfo",
          "pipeline.coinInfo",
          "pipeline.globalStreams",
        ],
      },
    }),
});

// Define the RootState type based on the store
export type RootState = ReturnType<typeof store.getState>;
