import React, { useEffect, useState } from 'react';
import {
  Button,
  Grid,
  Icon
} from 'semantic-ui-react';
import { useAppDispatch, useAppSelector } from "../../hooks.js";
import { signIn, signOut } from '../../slices/userSlice.js';
import { clearNodeData, clearWalletData } from '../../slices/walletSlice';
import styles from '../styles/SwapHome.module.css';

export const ConnectionComponent = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.user);
  const activities = useAppSelector(state => state.activities);
  const secret = useAppSelector(state => state.secret);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [swapActivities, setSwapActivities] = useState(activities);
  const log = (message, obj, debug = true) => {
    if (debug) {
     console.log(message)
     console.log(obj)
    }
  }

  const logOut = () => {
    dispatch(signOut());
    dispatch(clearNodeData());
    dispatch(clearWalletData());
    // return Promise.all([alice.disconnect(), bob.disconnect()]);
    return Promise.all([user.user.disconnect()])
  }


  useEffect(() => {
    setSwapActivities(activities);
  }, [activities])


  return (
    <Grid.Row className='space-between'>
      <Grid.Column >
        <h4><Icon name='stop' className={styles.allSystemOk}/>All systems ok!</h4>
      </Grid.Column>
    </Grid.Row>
  );
}
