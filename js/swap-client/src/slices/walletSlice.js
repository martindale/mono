import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  node: {
    title: 'Node',
    connected: false,
    data: null,
    balance: 0
  },
  wallet: {
    title: 'Wallet',
    connected: false,
    data: null,
    balance: 0
  }
};

export const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    setNodeData: (state, action) => {
      state.node.connected = true;
      state.node.data = action.payload;
    },
    setWalletData: (state, action) => {
      state.wallet.connected = true;
      state.wallet.data = action.payload;
    },
    setNodeBalance: (state, action) => {
      state.node.balance = action.payload;
    },
    setWalletBalance: (state, action) => {
      state.wallet.balance = action.payload;
    },
    clearNodeData: (state) => {
      state.node.connected = false;
      state.node.balance = 0;
      state.node.data = null;
    },
    clearWalletData: (state) => {
      state.wallet.connected = false;
      state.wallet.balance = 0;
      state.wallet.data = null;
    }
  }
});

export const {
  setNodeData,
  setWalletData,
  setNodeBalance,
  setWalletBalance, 
  clearNodeData,
  clearWalletData
} = walletSlice.actions;

export default walletSlice.reducer;