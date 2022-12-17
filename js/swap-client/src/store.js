import { configureStore } from '@reduxjs/toolkit';
import swapSlice from './slices/swapSlice';

export const store = configureStore({
  reducer: {
    swap: swapSlice
  }
});