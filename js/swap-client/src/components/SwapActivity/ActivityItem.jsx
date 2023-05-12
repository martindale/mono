import React from 'react';
import { Button, Container, Grid, Icon } from 'semantic-ui-react';
import { useAppDispatch } from '../../hooks';
import { getStringFromDate, SWAP_STATUS } from '../../utils/helpers';
import styles from '../styles/ActivityItem.module.css'
import { cancelSwap } from '../../slices/activitiesSlice';
import { useNavigate } from 'react-router-dom';

export const ActivityItem = ({ activity, index, onShowDetails }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  
  const onCancelSwap = (e) => {
    e.stopPropagation();
    dispatch(cancelSwap(index));
  }
  
  return (
    <Grid.Row className={styles.itemContainer} onClick={e => onShowDetails(index)}>
      <Grid.Column width={1}>
        <Icon name="random" />
      </Grid.Column>
      <Grid.Column width={10}>
        <Grid.Row>
          { SWAP_STATUS[activity.status] }
        </Grid.Row>
        <Grid.Row>
          { activity.baseQuantity + ' ' + 
          activity.baseAsset + ' > ' + 
          activity.quoteQuantity + ' ' + 
          activity.quoteAsset }
        </Grid.Row>
      </Grid.Column>
      <Grid.Column width={4} className='right'>
        <Grid.Row>
          { getStringFromDate(activity.createdDate) }
        </Grid.Row>
        <Grid.Row>
          { activity.status < 4 && <Button secondary onClick={onCancelSwap} className={styles.cancelBtn}>
            Cancel
          </Button> }
        </Grid.Row>
      </Grid.Column>
    </Grid.Row>
  );
};
