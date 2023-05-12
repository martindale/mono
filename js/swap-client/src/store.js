import { configureStore, getDefaultMiddleware } from '@reduxjs/toolkit';
import activitiesSlice from './slices/activitiesSlice';
import userSlice from './slices/userSlice';
import walletSlice from './slices/walletSlice';

export const store = configureStore({
  reducer: {
    activities: activitiesSlice,
    user: userSlice,
    wallet: walletSlice
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({
    serializableCheck: false,
  }),
});