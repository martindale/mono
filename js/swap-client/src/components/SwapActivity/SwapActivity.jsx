import React from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { 
  Button, 
  Grid,
  Divider, 
  Modal
} from 'semantic-ui-react'
import { useNavigate } from 'react-router-dom';
import { ActivityItem } from './ActivityItem';
import { useState } from 'react';
import styles from '../styles/SwapActivity.module.css';
import { SWAP_STATUS } from '../../utils/helpers';
import { cancelSwap } from '../../slices/activitiesSlice';

export const SwapActivity = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const activities = useAppSelector(state => state.activities.activities);
  const [open, setOpen] = useState(false);
  const [showIndex, setShowIndex] = useState(-1);

  const onShowDetails = (index) => {
    setShowIndex(index);
    setOpen(true);
    console.log("this is activities item : " + showIndex);
  };
  
  const onCancelSwap = (index) => {
    setShowIndex(-1);
    //dispatch(cancelSwap(index));
  }
  
  return (
    <>
      { /*<Button color='google plus' style={{}} onClick={e => navigate('/')}>
        <Icon name='hand point align-left' /> Back to Home
      </Button>*/ }
      <Grid className={styles.activitiesContainer}>
        <Grid.Row className={styles.activitiesHeader}>
          <h3>Activity</h3>
        </Grid.Row>
        { 
          activities.slice(0).reverse().map((row, index) => 
            <>
              <Divider />
              <ActivityItem activity={row} index={index} onShowDetails={onShowDetails}/>
            </>)
        }
        {
          activities.length === 0 && <div className={styles.blankMessage}>Your swaps will appear here</div>
        }
      </Grid>
      {showIndex!=-1 && <Modal
        dimmer={'blurring'}
        open={open}
        onClose={() => setOpen(false)}
        className={styles.activitiesModal}
      >
        <Modal.Header>Swap Information</Modal.Header>
        <Modal.Content>
          
          {/* <Grid.Row key={activities[showIndex].swapId}> */}
            <div singleLine>
              { SWAP_STATUS[activities[showIndex].status] }
            </div>
            <div>Swap id: {activities[showIndex].swapId}</div>
            <div>ts: {activities[showIndex].ts}</div>
            <div>uid:{activities[showIndex].uid}</div>
            <div>type: {activities[showIndex].type}</div>
            <div>side: {activities[showIndex].side}</div>
            <div>hash: {activities[showIndex].hash}</div>
            <div>Base Asset: {activities[showIndex].baseAsset}</div>
            <div>Base Quantity: {activities[showIndex].baseQuantity}</div>
            <div>Base Network: {activities[showIndex].baseNetwork}</div>
            <div>Quote Asset: {activities[showIndex].quoteAsset}</div>
            <div>Quote Quantity: {activities[showIndex].quoteQuantity}</div>
            <div>Quote Network: {activities[showIndex].quoteNetwork}</div>
            <div>Status: {activities[showIndex].status}</div>
            {/* <div>{activities[showIndex].secretSeekerId}</div>
            <div>{activities[showIndex].secretHolderId}</div> */}
          {/* </Grid.Row> */}
        </Modal.Content>
        <Modal.Actions>
          { activities[showIndex].status !== 5 && 
            <Button.Group horizontal>
              <Button color='facebook' onClick={e => onContinueSwap(showIndex)}>Modify</Button>
              <Button color='facebook' onClick={e => onCancelSwap(showIndex)}>Cancel</Button>
            </Button.Group>
          }
          <Button.Group horizontal>
            <Button onClick={() => setOpen(false)}>
              Close
            </Button>
          </Button.Group>
        </Modal.Actions>
      </Modal>}
    </>
  );
}
