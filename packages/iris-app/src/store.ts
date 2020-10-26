import { Action, configureStore, ThunkAction } from "@reduxjs/toolkit";

import project from "./state/project";

const store = configureStore({
  reducer: { project },
  devTools: process.env.NODE_ENV !== "production",
});

export type RootState = ReturnType<typeof store.getState>;

export type AppThunk = ThunkAction<void, RootState, null, Action<string>>;

export default store;