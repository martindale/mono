import React, { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import RectangleRoundedIcon from '@mui/icons-material/RectangleRounded'
import { activitiesStore } from '../../syncstore/activitiesstore.js'
import { userStore } from '../../syncstore/userstore.js'
import { walletStore } from '../../syncstore/walletstore.js'

export const ConnectionComponent = () => {
  const user = useSyncExternalStore(userStore.subscribe, () => userStore.currentState)
  const activities = useSyncExternalStore(activitiesStore.subscribe, () => activitiesStore.currentState)
  const [swapActivities, setSwapActivities] = useState(activities)

  const logOut = useCallback(() => {
    // dispatch(signOut());
    walletStore.dispatch({ type: 'CLEAR_NODE_DATA' })
    walletStore.dispatch({ type: 'CLEAR_WALLET_DATA' })
    // return Promise.all([alice.disconnect(), bob.disconnect()]);
    return Promise.all([user.user.disconnect()])
  }, [walletStore])

  useEffect(() => {
    setSwapActivities(activities)
  }, [activities])

  return (
    <h4 className='flex-center lightgreen'><RectangleRoundedIcon />&nbsp;All systems ok!</h4>
  )
}
