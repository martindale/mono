import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  activities: []
};

export const activitiesSlice = createSlice({
  name: 'activities',
  initialState,
  reducers: {
    addSwapItem: (state, action) => {
      state.activities.push({
        ...action.payload,
        status: 1
      });
    },
    updateSwapStatus: (state, action) => {
      // state.activities.filter(activity => activity.swapId === action.payload.index)[0].status = action.payload.status;

      // secretHash
      // console.log("activitiesSlice: state.activiies")
      // console.log(state.activities.filter(activity => {
      //   console.log("activity.secretHash", activity.secretHash);
      //   activity.secretHash == action.payload.secretHash})[0])
      console.log("activitiesSlice: action.payload.secretHash", action.payload.secretHash)
      const toUpdate =state.activities.filter(activity => activity.secretHash == action.payload.secretHash);
      if(toUpdate.length > 0) toUpdate[0].status = action.payload.status;
    },
    removeLatestSwap: (state, action) => {
      state.activities.pop();
    },
    cancelSwap: (state, action) => {
      state.activities.splice(action.payload, 1);
    },
    updateSwapInfo: (state, action) => {
      state.activities.filter(activity => activity.swapId === action.payload.index)[0][action.payload.field] = action.payload.info;
    }
  }
});
  
export const { 
  addSwapItem, 
  updateSwapStatus, 
  removeLatestSwap,
  cancelSwap,
  updateSwapInfo
} = activitiesSlice.actions;
  
export default activitiesSlice.reducer;
