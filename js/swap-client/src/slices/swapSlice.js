import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  amountBase: null,
	amountQuote: null,
	swapState: null,
	swapId: null,
	swapHash: null,
	secretSeekerId: null,
	secretHolderId: null,
	secret: null,
	request1: null,
	request2: null,
};

export const swapSlice = createSlice({
    name: 'swap',
    initialState,
    reducers: {
      setBase: (state, action) => { state.amountBase = action.payload; },
      setQuote: (state, action) => { state.amountQuote = action.payload; },
      setSwapState: (state, action) => { state.swapState = action.payload; },
      setSwapId: (state, action) => { state.swapId = action.payload; },
      setSwapHash: (state, action) => { state.swapHash = action.payload; },
      setSecretSeekerId: (state, action) => { state.secretSeekerId = action.payload; },
      setSecretHolderId: (state, action) => { state.secretHolderId = action.payload; },
      setSecret: (state, action) => { state.secret = action.payload; },
      setRequest1: (state, action) => { state.request1 = action.payload; },
      setRequest2: (state, action) => { state.request2 = action.payload; },
    }
  });
  
  export const { setBase, setQuote, setSwapState, setSwapId, setSwapHash, setSecretSeekerId, setSecretHolderId, setSecret, setRequest1, setRequest2 } = swapSlice.actions;
  
  export default swapSlice.reducer;
  