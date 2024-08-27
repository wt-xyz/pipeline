import { configureStore } from "@reduxjs/toolkit";
import coinsSlice from "./coinsSlice";
import streamsSlice from "./streamsSlice";
import sendingOrReceivingSlice from "./sendingOrReceivingSlice";
import timezoneSlice from "./timezoneSlice";

export const store = configureStore({
  reducer: {
    coins: coinsSlice,
    streams: streamsSlice,
    sendingOrReceiving: sendingOrReceivingSlice,
    timezone: timezoneSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["coins/setCoins"],
        ignoredPaths: ["coins.coins"],
      },
    }),
});

// Define the RootState type based on the store
export type RootState = ReturnType<typeof store.getState>;
