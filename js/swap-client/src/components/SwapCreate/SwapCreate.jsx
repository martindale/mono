import React, { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { Box, Grid, Stack, Button, IconButton, Divider, Popover, Switch, FormControlLabel } from '@mui/material'
import { getBTCPrice, getETHPrice } from '../../utils/apis'
import styles from '../../styles/SwapCreate.module.css'
import { SwapAmountItem } from './SwapAmountItem'
import { hashSecret, fromWei, fromSats, toWei, toSats, log } from '../../utils/helpers'
import { DemoSwap } from './DemoSwap'
import SettingsIcon from '@mui/icons-material/Settings'
import SettingsEthernetIcon from '@mui/icons-material/SettingsEthernet'
import classNames from 'classnames'
import CloseIcon from '@mui/icons-material/Close'
import { toast } from 'react-toastify'
import { activitiesStore } from '../../syncstore/activitiesstore'
import { userStore } from '../../syncstore/userstore'
import { walletStore } from '../../syncstore/walletstore'
import { SWAP_PAIRS } from '../../config/swap_pairs'

export const SwapCreate = () => {
  const globalWallet = useSyncExternalStore(walletStore.subscribe, () => walletStore.currentState)
  const ASSET_TYPES = globalWallet.assets
  const mock = false

  const [baseQuantity, setBaseQuantity] = useState(0)
  const [quoteQuantity, setQuoteQuantity] = useState(0)
  const [baseAsset, setBaseAsset] = useState(0)
  const [quoteAsset, setQuoteAsset] = useState(1)
  const [limitOrder, setLimitOrder] = useState(true)
  const [settingModalOpen, setSettingModalOpen] = useState(false)
  const [secret, setSecret] = useState(null)
  const [anchorEl, setAnchorEl] = React.useState(null)
  const [orderSecret, setOrderSecret] = useState(null)
  const [curPrices, setCurPrices] = useState({
    BTC: 0,
    ETH: 0,
    fetching: true
  })

  const activities = useSyncExternalStore(activitiesStore.subscribe, () => activitiesStore.currentState)
  const user = useSyncExternalStore(userStore.subscribe, () => userStore.currentState)
  const nodeConnected = globalWallet.assets[0].connected
  const walletConnected = globalWallet.assets[1].connected
  const node = globalWallet.assets[0]
  const wallet = globalWallet.assets[1]
  const useAdditionalInput = globalWallet.useAdditionalInput

  const substrname = useCallback((name) => {
    return name
    // return name.substring(0, name.indexOf('--'));
  }, [])
  const notify = useCallback(() => toast.error(
    'Balance Limit Exceeded!',
    {
      theme: 'colored',
      autoClose: 1000
    }
  ), [])

  const handleClickSetting = useCallback((e) => {
    // setLimitOrder(!limitOrder);
    setAnchorEl(e.currentTarget)
    setSettingModalOpen(!settingModalOpen)
  }, [settingModalOpen])

  const getBalance = useCallback(async () => {
    const { balances } = await user.user.getBalance(user.user.credentials)
    if (balances[0].lightning) dispatch(setNodeBalance(fromSats(balances[0].lightning.balance)))
  }, [user])

  const logOut = useCallback(() => {
    dispatch(signOut())
    dispatch(clearNodeData())
    dispatch(clearWalletData())
    setOpen(false)
    return Promise.all([user.user.disconnect()])
  }, [user])

  useEffect(() => {
    const core = async () => {
      const btc = await getBTCPrice()
      const eth = await getETHPrice()
      setCurPrices({
        BTC: btc,
        ETH: eth,
        fetching: false
      })
    }
    core()
    setSecret(null)
    setOrderSecret(null)
  }, [])

  useEffect(() => { // when user is logged in, connect to ws
    // log("useEffect {user, orderSecret}", { user, orderSecret });
    if (user.isLoggedIn) {
      try {
        log('user', user)
        const connected = user.user.connect()
      } catch (error) {
        // console.warn(`sorry an error occurred, due to ${error.message} `);
        // logOut();
      }
    };

    return () => { // clean up function to clear user connection from ws
      if (user.isLoggedIn) user.user.disconnect()
      log('useEffect cleanup')
    }
  }, [user])

  const getSwapPairId = (activity, swap) => {
    /**
     * Function to match swap pair with activity item
     * -----------------------------------------
     * base: 0 if current activity is from base, 1 if current activity is from quote, otherwise -1
     * curUser: user object of current user in this swap
     * nor: normal swap, true if the curUser is this user and orderId matches activity orderId
     * index: index of swap pair
     * next: next step id of swap process
     * f means flag which is used temporarily in distinguishing variable names
     */
    let nor, base, index, nextSt
    SWAP_PAIRS.forEach((pair, idx) => {
      let fBase = -1
      if (pair.base === activity.baseAsset && pair.quote === activity.quoteAsset) fBase = 0
      else if (pair.base === activity.quoteAsset && pair.quote === activity.baseAsset) fBase = 1
      if (fBase == -1) return

      let fNor, curUser
      if ((fBase == 0 && pair.base === pair.seeker) || (fBase == 1 && pair.base === pair.holder)) curUser = swap.secretSeeker
      if ((fBase == 1 && pair.base === pair.seeker) || (fBase == 0 && pair.base === pair.holder)) curUser = swap.secretHolder

      // TODO: right now only checking activity item with the same status
      // fNor = (user.user.id === substrname(curUser.id) && activity.secretHash === swap.secretHash);

      nextSt = pair.process[pair.process.indexOf(activity.status) + 1]
      // nor = fNor;
      nor = true
      base = fBase
      index = idx
    })
    return {
      fNor: nor,
      fBase: base,
      fIndex: index,
      fNext: nextSt
    }
  }

  useEffect(() => {
    if (!user.user) return
    // log("user.user.id", user.user.id);
    activities.forEach(activity => {
      if (activity.status === 0) {
        log('swapState: swap begins ', activity.status)
        // setTimeout(() => {
        activitiesStore.dispatch({ type: 'UPDATE_SWAP_STATUS', payload: { secretHash: activity.secretHash, status: 1 } })
        log('swapState: swap iter: activity.secretHash  ', activity.secretHash)
        log('swapState: swap iter: activity.status  ', activity.status)
        // }, 50);
      }
    })
    user.user.on('created', swap => {
      log('swap.created event', swap)
      console.log('swap.created event', activities, swap)
      activities.forEach(activity => {
        const { fNor, fBase, fIndex, fNext } = getSwapPairId(activity, swap)
        if (activity.status !== 1 || !fNor) return
        // log("orderSecret in swap.opening !!!!!!!!!!!!!!!!!!!!!!!!!!! shouldn't be null", orderSecret)

        log('activity.secret', activity)

        if (fIndex === 0) { // Check if BTC-ETH swap
          // TODO: temp fix for single swap / order in orderbook at any given moment

          // if(activity.status !== 1 || user.user.id !== swap.secretSeeker.id || activity.secretHash !== swap.secretSeeker.hash) return;
          // //log("swapState: swap order request sent ", swapState)

          if (user.user.id === swap.secretSeeker.id) {
            log('swap.created event received', swap)
            const network = swap.secretSeeker.network['@type'].toLowerCase()

            const credentials = user.user.credentials

            log('swapOpen (secretSeeker) requested, sent settingSwapState to 2')
            user.user.swapOpen(swap, { ...credentials })

            // TODO: right now only checking activity item with the same status
            activitiesStore.dispatch({ type: 'UPDATE_SWAP_STATUS', payload: { secretHash: activity.secretHash, status: fNext } })
          // activitiesStore.dispatch({ type: 'UPDATE_SWAP_STATUS', payload: {secretHash: swap.secretHash, status: fNext} });
          }
        } else {
          if (user.user.id == substrname(swap.secretHolder.id) && orderSecret != null) {
            user.user.swapOpen({
              swap: {
                id: swap.id,
                swapHash: swap.secretHash
              },
              party: {
                id: swap.secretHolder.id,
                state:
                                        {
                                          isSecretHolder: swap.secretHolder.isSecretHolder,
                                          secret: activity.secret,
                                          swapCreationResponder: swap.secretHolder.isSecretHolder
                                        }
              },
              opts: {

              }
            }).then(data => {
              log('response from swapOpenV2', data)
            })
            log('swapOpen (secretHolder) requested, sent settingSwapState to 2', swap.id)

            // TODO: right now only checking activity item with the same status
            activitiesStore.dispatch({ type: 'UPDATE_SWAP_STATUS', payload: { secretHash: activity.secretHash, status: fNext } })
            // activitiesStore.dispatch({ type: 'UPDATE_SWAP_STATUS', payload: {orderId: swap.secretHolder.orderId, status: fNext} });
          } else {
          // TODO: right now only checking activity item with the same status
            activitiesStore.dispatch({ type: 'UPDATE_SWAP_STATUS', payload: { secretHash: activity.secretHash, status: fNext } })
            // activitiesStore.dispatch({ type: 'UPDATE_SWAP_STATUS', payload: {orderId: swap.secretSeekerer.orderId, status: 2} });
          }
        }
      })
    })

    user.user.on('opening', swap => {
      activities.forEach(activity => {
        const { fNor, fBase, fIndex, fNext } = getSwapPairId(activity, swap)

        console.log(fNor, fIndex, fNext)
        if (!fNor) return
        log('swapState: swap order request sent ', swap.status)

        if (fIndex === 0) {
          const network = swap.secretSeeker.network['@type'].toLowerCase()
          const credentials = user.user.credentials
          if (user.user.id === swap.secretHolder.id) { user.user.swapOpen(swap, { ...credentials, secret }) }
          log('swapOpen (secretHolder) requested, settingSwapState to 2')

          // TODO: right now only checking activity item with the same status
          activitiesStore.dispatch({ type: 'UPDATE_SWAP_STATUS', payload: { secretHash: activity.secretHash, status: fNext } })
          // activitiesStore.dispatch({ type: 'UPDATE_SWAP_STATUS', payload: {orderId: swap.secretHolder.orderId, status: fNext} });
        } else {
          if (activity.status !== 2 || user.user.id == substrname(swap.secretSeeker.id)) {
            log('swap.opening event received', swap)
            // const network = swap.secretHolder.network['@type'].toLowerCase();
            // const credentials = user.user.credentials;

            user.user.swapOpenV2({
              swap: {
                id: swap.id,
                swapHash: swap.secretHash
              },
              party: {
                id: swap.secretSeeker.id,
                state:
                                        {
                                          isSecretHolder: swap.secretSeeker.isSecretHolder,
                                          secret: activity.secret,
                                          swapCreationResponder: swap.secretSeeker.isSecretHolder
                                        }
              },
              opts: {

              }
            })
            log('swapOpen (secretSeeker) requested, sent settingSwapState to 3')

            // TODO: right now only checking activity item with the same status
            activitiesStore.dispatch({ type: 'UPDATE_SWAP_STATUS', payload: { secretHash: activity.secretHash, status: fNext } })
            // activitiesStore.dispatch({ type: 'UPDATE_SWAP_STATUS', payload: {orderId: swap.secretSeeker.orderId, status: fNext} });
          } else {
            // TODO: right now only checking activity item with the same status
            activitiesStore.dispatch({ type: 'UPDATE_SWAP_STATUS', payload: { secretHash: activity.secretHash, status: fNext } })
            // activitiesStore.dispatch({ type: 'UPDATE_SWAP_STATUS', payload: {orderId: swap.secretHolder.orderId, status: 3} });
          }
        }
      })
    })
    user.user.on('opened', swap => {
      log('swap.opened event received', swap)
      // alert(1);
      activities.forEach(activity => {
        const { fNor, fBase, fIndex, fNext } = getSwapPairId(activity, swap)
        // if(activity.status !== 2 || user.user.id !== swap.secretSeeker.id || activity.orderId !== swap.secretSeeker.orderId) return;
        log('swap.opened event received', swap)
        const network = swap.secretHolder.network['@type'].toLowerCase()
        const credentials = user.user.credentials

        if (fIndex === 0) {
          if (user.user.id === swap.secretSeeker.id) {
            user.user.swapCommit(swap, credentials)
            log('swapCommit by secretSeeker', swap)

            // TODO: right now only checking activity item with the same status
            activitiesStore.dispatch({ type: 'UPDATE_SWAP_STATUS', payload: { secretHash: activity.secretHash, status: fNext } })
            // activitiesStore.dispatch({ type: 'UPDATE_SWAP_STATUS', payload: {
            //   orderId: swap.secretSeeker.orderId,
            //   status: 4} });

            // for ordinals/submarine swaps
            // activitiesStore.dispatch({ type: 'UPDATE_SWAP_STATUS', payload: {
            //   orderId: swap.secretSeeker.orderId,
            //   status: 4,
            //   paymentAddress: swap.secretSeeker.state.shared.swapinfo.descriptor.match(/\(([^)]+)\)/)[1]} });
          }
        }
      })
    })
    user.user.on('holderPaymentPending', swap => {
      activities.forEach(activity => {
        if (activity.status !== 3 || (
          activity.orderId !== swap.secretHolder.orderId &&
          activity.orderId !== swap.secretSeeker.orderId)) return
        log('swap.opened event received', swap)
        if (user.user.id == substrname(swap.secretHolder.id)) {
          activitiesStore.dispatch({
            type: 'UPDATE_SWAP_STATUS',
            payload: {
              orderId: swap.secretHolder.orderId,
              paymentAddress: swap.secretSeeker.state.shared.swapinfo.descriptor.match(/\(([^)]+)\)/)[1]
            }
          })
        } else {
          activitiesStore.dispatch({
            type: 'UPDATE_SWAP_STATUS',
            payload: {
              orderId: swap.secretSeeker.orderId,
              paymentAddress: swap.secretSeeker.state.shared.swapinfo.descriptor.match(/\(([^)]+)\)/)[1]
            }
          })
        }
      })
    })
    user.user.on('holderPaid', swap => {
      activities.forEach(activity => {
        if (activity.status !== 3 || activity.orderId !== swap.secretSeeker.orderId) return

        if (user.user.id == substrname(swap.secretSeeker.id)) {
          const network = swap.secretSeeker.network['@type'].toLowerCase()
          const credentials = user.user.credentials
          user.user.swapCommitV2({
            swap: {
              id: swap.id
            },
            party: {
              id: swap.secretSeeker.id,
              state: {
                secret: activity.secret
              }
            },
            opts: {

            }
          })
          activitiesStore.dispatch({ type: 'UPDATE_SWAP_STATUS', payload: { orderId: swap.secretSeeker.orderId, status: 5 } })
        } else {
          activitiesStore.dispatch({ type: 'UPDATE_SWAP_STATUS', payload: { orderId: swap.secretHolder.orderId, status: 5 } })
        }
      })
    })
    user.user.on('committing', swap => {
      log('swap.commiting event received', swap)
      activities.forEach(activity => {
        const { fNor, fBase, fIndex, fNext } = getSwapPairId(activity, swap)
        // const fNor = (user.user.id === substrname(swap.secretHolder.id) && activity.orderId === swap.secretHolder.orderId);

        if (!fNor) return
        if (fIndex === 0) {
          const network = swap.secretSeeker.network['@type'].toLowerCase()
          const credentials = user.user.credentials
          if (user.user.id === swap.secretHolder.id) {
            user.user.swapCommit(swap, credentials)
            log('swapCommit by secretHolder', swap)
            log('secretHolder credentials', credentials)

            // TODO: right now only checking activity item with the same status
            activitiesStore.dispatch({ type: 'UPDATE_SWAP_STATUS', payload: { secretHash: activity.secretHash, status: fNext } })
            // activitiesStore.dispatch({ type: 'UPDATE_SWAP_STATUS', payload: {orderId: swap.secretHolder.orderId, status: 4} });
          }
        } else {
          if (user.user.id == substrname(swap.secretSeeker.id)) {
            // TODO: right now only checking activity item with the same status
            activitiesStore.dispatch({ type: 'UPDATE_SWAP_STATUS', payload: { secretHash: activity.secretHash, status: fNext } })
            // activitiesStore.dispatch({ type: 'UPDATE_SWAP_STATUS', payload: {orderId: swap.secretSeeker.orderId, status: 5} });
          } else {
            // TODO: right now only checking activity item with the same status
            activitiesStore.dispatch({ type: 'UPDATE_SWAP_STATUS', payload: { secretHash: activity.secretHash, status: fNext } })
            // activitiesStore.dispatch({ type: 'UPDATE_SWAP_STATUS', payload: {orderId: swap.secretHolder.orderId, status: 5} });
          }
        }
      })
    })
    user.user.on('committed', swap => {
      activities.forEach(activity => {
        let ethBal, btcBal

        if (user.user.id == substrname(swap.secretSeeker.id)) {
          // btcBal = node.balance - fromWei(swap.secretHolder.quantity) * curPrices.ETH / curPrices.BTC;
          ethBal = wallet.balance + fromWei(swap.secretHolder.quantity)

          // TODO: right now only checking activity item with the same status
          activitiesStore.dispatch({ type: 'UPDATE_SWAP_STATUS', payload: { secretHash: activity.secretHash, status: 5 } })
          // activitiesStore.dispatch({ type: 'UPDATE_SWAP_STATUS', payload: {orderId: swap.secretSeeker.orderId, status: 5} });
          walletStore.dispatch({ type: 'SET_WALLET_BALANCE', payload: ethBal })
        } else {
          btcBal = node.balance + fromSats(swap.secretSeeker.quantity)
          // ethBal = wallet.balance - fromSats(swap.secretSeeker.quantity) * curPrices.BTC / curPrices.ETH;

          // TODO: right now only checking activity item with the same status
          activitiesStore.dispatch({ type: 'UPDATE_SWAP_STATUS', payload: { secretHash: activity.secretHash, status: 5 } })
          // activitiesStore.dispatch({ type: 'UPDATE_SWAP_STATUS', payload: {orderId: swap.secretHolder.orderId, status: 5} });
          walletStore.dispatch({ type: 'SET_NODE_BALANCE', payload: btcBal })
        }
      })
    })
    return () => {
      user.user.removeAllListeners()
    }
  }, [activities, user])

  const coinTypeChanged = useCallback((isBase, asset) => {
    let another = isBase ? quoteAsset : baseAsset

    if (!ASSET_TYPES[baseAsset].isNFT && !ASSET_TYPES[quoteAsset].isNFT) another = ASSET_TYPES[asset].type === 'BTC' ? 1 : 0
    if (isBase) {
      setBaseAsset(asset)
      setQuoteAsset(another)
      if (!limitOrder) setQuoteQuantity(baseQuantity * curPrices[ASSET_TYPES[asset].type] / curPrices[ASSET_TYPES[another].type])
      if (ASSET_TYPES[asset].isNFT) setBaseQuantity(1)
    } else {
      setQuoteAsset(asset)
      setBaseAsset(another)
      if (!limitOrder) setBaseQuantity(quoteQuantity * curPrices[ASSET_TYPES[asset].type] / curPrices[ASSET_TYPES[another].type])
      if (ASSET_TYPES[asset].isNFT) setQuoteQuantity(1)
    }
  }, [ASSET_TYPES, baseAsset, quoteAsset, curPrices, limitOrder, baseQuantity, quoteQuantity])

  const onInputBaseQuantity = useCallback((e) => {
    if (e.target.value < 0) return
    setBaseQuantity(e.target.value)
    if (!limitOrder) setQuoteQuantity(e.target.value * curPrices[ASSET_TYPES[baseAsset].type] / curPrices[ASSET_TYPES[quoteAsset].type])
  }, [limitOrder, curPrices, ASSET_TYPES, baseAsset, quoteAsset])

  const onInputQuoteQuantity = useCallback((e) => {
    if (e.target.value < 0) return
    setQuoteQuantity(e.target.value)
    if (!limitOrder) setBaseQuantity(e.target.value * curPrices[ASSET_TYPES[quoteAsset].type] / curPrices[ASSET_TYPES[baseAsset].type])
  }, [limitOrder, curPrices, ASSET_TYPES, quoteAsset, baseAsset])

  const onOrderSwap = useCallback(async (order) => {
    const randomValues = crypto.getRandomValues(new Uint8Array(32))
    const secretHex = [...randomValues]
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('')
    const secretHash = await hashSecret(randomValues)

    setSecret(secretHex)
    setOrderSecret(secretHash)

    if (ASSET_TYPES[baseAsset].balance < baseQuantity) {
      notify()
      return
    }

    await thenOrderSwap(order, secretHex, secretHash)
  }, [crypto, ASSET_TYPES, baseAsset, baseQuantity, quoteQuantity, quoteAsset])

  const thenOrderSwap = async (order, secret, secretHash) => {
    const ask = order.side == 'ask'
    const baseA = order.baseAsset ? order.baseAsset : ASSET_TYPES[baseAsset].type
    const quoteA = order.quoteAsset ? order.quoteAsset : ASSET_TYPES[quoteAsset].type
    const baseQty = order.baseQuantity ? order.baseQuantity : baseQuantity
    const quoteQty = order.quoteQuantity ? order.quoteQuantity : quoteQuantity
    const baseNet = order.baseNetwork; const quoteNet = order.quoteNetwork
    const baseO = { asset: baseA, network: baseNet, quantity: baseQty }
    const quoteO = { asset: quoteA, network: quoteNet, quantity: quoteQty }

    const args = ask ? { // if order is an ask, bitcoin as base
      base: baseO,
      quote: quoteO
    } : {
      base: quoteO,
      quote: baseO
    }

    try {
      // setOrderSecret(secretHash);
    } catch (error) { log('error on setOrderSecret(secretHash)', error.message) } finally {
      const bai = ASSET_TYPES.findIndex(asset => asset.type === args.base.asset)
      const qai = ASSET_TYPES.findIndex(asset => asset.type === args.quote.asset)

      const ordinalLocation = !args.ordinalLocation ? args.ordinalLocation : false

      await user.user.submitLimitOrder(
        {
          uid: user.user.id,
          side: order.side,
          hash: secretHash,
          baseAsset: args.base.asset.split('-')[0],
          baseNetwork: args.base.network,
          baseQuantity: (args.base.asset.split('-')[0] === 'BTCORD' || args.quote.asset.split('-')[0] === 'BTCORD') ? 4000 : Math.round(args.base.quantity * ASSET_TYPES[bai].rate),
          baseInfo: ASSET_TYPES[baseAsset].info,
          quoteAsset: args.quote.asset.split('-')[0],
          quoteNetwork: args.quote.network,
          quoteQuantity: Math.round(args.quote.quantity * ASSET_TYPES[qai].rate),
          quoteInfo: ASSET_TYPES[quoteAsset].info
        }
      ).then(data => {
        log('order opened with this response data', data)
        const curDate = new Date()
        const date = {
          year: curDate.getFullYear(),
          month: curDate.getMonth(),
          day: curDate.getDate()
        }

        const baseQ = {
          asset: data.baseAsset,
          network: order.baseNetwork,
          quantity: data.baseQuantity / ASSET_TYPES[bai].rate
        }; const quoteQ = {
          asset: data.quoteAsset,
          network: order.quoteNetwork,
          quantity: data.quoteQuantity / ASSET_TYPES[qai].rate
        }

        /* if(order.side == 'ask') {
        dispatch(setNodeBalance(node.balance - fromSats(data.baseQuantity)));
      } else {
        dispatch(setWalletBalance(wallet.balance - fromWei(data.quoteQuantity)));
      } */
        const args = ask ? { // if order is an ask, bitcoin as base
          base: baseQ,
          quote: quoteQ
        } : {
          base: quoteQ,
          quote: baseQ
        }

        activitiesStore.dispatch({
          type: 'ADD_SWAP_ITEM',
          payload: {
            key: data.id,
            orderId: data.id,
            ts: data.ts,
            uid: data.uid,
            type: data.type,
            side: data.side,
            secret,
            secretHash,
            hash: data.hash,
            baseAsset: args.base.asset.split('-')[0],
            baseQuantity: args.base.quantity,
            baseNetwork: args.base.network,
            baseInfo: ASSET_TYPES[baseAsset].info,
            quoteAsset: args.quote.asset.split('-')[0],
            quoteNetwork: args.quote.network,
            quoteQuantity: args.quote.quantity,
            quoteInfo: ASSET_TYPES[quoteAsset].info,
            ordinalLocation: args.ordinalLocation,
            status: 0,
            createdDate: date
          }
        })

        walletStore.dispatch({ type: 'REMOVE_BALANCE_ON_SWAP_ORDER', payload: { asset: baseAsset, qty: baseQuantity } })
        setBaseQuantity(ASSET_TYPES[baseAsset].isNFT ? 1 : 0)
        setQuoteQuantity(ASSET_TYPES[quoteAsset].isNFT ? 1 : 0)
      })
    }
  }

  const onExchangeCoinType = useCallback(() => {
    const tBase = baseQuantity; const tQuote = quoteQuantity
    const aBase = baseAsset; const aQuote = quoteAsset
    setBaseAsset(aQuote); setQuoteAsset(aBase)
    setBaseQuantity(tQuote); setQuoteQuantity(tBase)
  }, [baseQuantity, quoteQuantity, baseAsset, quoteAsset])

  const mockSwap = useCallback((order) => {
    onOrderSwap(order)
  }, [])

  return (
    <Box className={styles.SwapCreateContainer}>
      <Stack spacing={1}>
        <Grid container height={35}>
          <Grid item xs={4} textAlign='left' style={{ display: 'flex', alignItems: 'flex-start' }}><h3>Swap</h3></Grid>
          <Grid item xs={8} textAlign='right'>
            <IconButton className={classNames({ 'gradient-btn': settingModalOpen })} size='medium' style={{ color: 'grey' }} onClick={handleClickSetting}><SettingsIcon /></IconButton>
            <Popover
              anchorEl={anchorEl}
              open={settingModalOpen}
              onClose={() => { setAnchorEl(null); setSettingModalOpen(false) }}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'left'
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'center'
              }}
            >
              <Grid
                container direction='column'
                style={{ backgroundColor: 'black', width: '100%', height: '100%', padding: '1em' }}
              >
                <Grid item container direction='row' style={{ color: 'white' }} className='flex-middle'>
                  <Grid item xs={10}>Settings</Grid>
                  <Grid item xs={2}><IconButton onClick={handleClickSetting}><CloseIcon style={{ color: 'white' }} /></IconButton></Grid>
                </Grid>
                <FormControlLabel control={<Switch checked={limitOrder} onChange={(e) => setLimitOrder(!limitOrder)} />} label='Limit Order' />
                <FormControlLabel control={<Switch checked={useAdditionalInput} onChange={(e) => { walletStore.dispatch({ type: 'SET_USE_ADDITIONAL_INPUT', payload: !useAdditionalInput }) }} />} label='Use Additional Input' />
                {(useAdditionalInput && ASSET_TYPES[baseAsset].options?.length > 0) && <h4 style={{ color: 'white' }}>{ASSET_TYPES[baseAsset].title}</h4>}
                {
                  useAdditionalInput && ASSET_TYPES[baseAsset].options && ASSET_TYPES[baseAsset].options.map((option, idx) =>
                    <FormControlLabel
                      key={idx}
                      control={
                        <input
                          style={{
                            border: '1px solid grey',
                            borderRadius: '10px',
                            width: '90px',
                            marginLeft: '15px',
                            marginRight: '15px'
                          }}
                          value={option.value}
                          onChange={(e) => walletStore.dispatch({ type: 'SET_ADDITIONAL_INPUT_DATA', payload: { type: baseAsset.type, option_type: option.type, value: e.target.value } })}
                        />
                      }
                      label={option.title}
                      labelPlacement='start'
                    />
                  )
                }
                {(useAdditionalInput && ASSET_TYPES[quoteAsset].options?.length > 0) && <h4 style={{ color: 'white' }}>{ASSET_TYPES[quoteAsset].title}</h4>}
                {useAdditionalInput && ASSET_TYPES[quoteAsset].options && <h4 style={{ color: 'white' }}>{quoteAsset.title}</h4>}
                {
                  useAdditionalInput && ASSET_TYPES[quoteAsset].options && ASSET_TYPES[quoteAsset].options.map((option, idx) =>
                    <FormControlLabel
                      key={idx}
                      control={<input style={{
                        border: '1px solid grey',
                        borderRadius: '10px',
                        width: '90px',
                        marginLeft: '15px',
                        marginRight: '15px'
                      }}
                               />}
                      label={option.title}
                      labelPlacement='start'
                    />
                  )
                }
              </Grid>
            </Popover>
          </Grid>
        </Grid>
        <Grid className={styles.swapExCont}>
          <SwapAmountItem
            assetId={baseAsset}
            unitPrice={curPrices[ASSET_TYPES[baseAsset].type]}
            amount={baseQuantity}
            availQty={ASSET_TYPES[baseAsset].type === 'BTC' ? node.balance : wallet.balance}
            onAmountChange={onInputBaseQuantity}
            onCoinTypeChange={(asset) => { coinTypeChanged(true, asset) }}
            limitOrder={limitOrder}
          />
          <Divider style={{ borderColor: '#202020', marginTop: '0.5em' }} />
          <IconButton className={`${styles.exchange} exchange`} onClick={onExchangeCoinType}><SettingsEthernetIcon /></IconButton>
          <SwapAmountItem
            className='mt-m1 mb-0'
            assetId={quoteAsset}
            unitPrice={curPrices[ASSET_TYPES[quoteAsset].type]}
            amount={quoteQuantity}
            availQty={ASSET_TYPES[baseAsset].type === 'ETH' ? node.balance : wallet.balance}
            onAmountChange={onInputQuoteQuantity}
            onCoinTypeChange={(asset) => { coinTypeChanged(false, asset) }}
            limitOrder={limitOrder}
          />
        </Grid>
        <Grid>
          {(nodeConnected && walletConnected)
            ? ((ASSET_TYPES[baseAsset].isNFT || baseQuantity) && (ASSET_TYPES[quoteAsset].isNFT || quoteQuantity)
                ? <>
                  {(ASSET_TYPES[baseAsset].isNFT == false && ASSET_TYPES[quoteAsset].isNFT == false)
                    ? <p className={styles.prices}>{curPrices.fetching ? 'Loading' : `1 ${ASSET_TYPES[baseAsset].type} = ${Number(curPrices[ASSET_TYPES[baseAsset].type] / curPrices[ASSET_TYPES[quoteAsset].type]).toFixed(6)} ${ASSET_TYPES[quoteAsset].type}`}</p>
                    : <p />}
                  <Button
                    circular='true' secondary='true' className='gradient-btn w-100 h-3' onClick={e => onOrderSwap({
                      side: (
                        (ASSET_TYPES[quoteAsset].type.split('-')[0] !== 'BTCORD' && (ASSET_TYPES[baseAsset].type == 'BTC' || ASSET_TYPES[baseAsset].type.split('-')[0] == 'BTCORD' || ASSET_TYPES[baseAsset].isNFT)) ? 'ask' : 'bid'),
                      baseNetwork: ASSET_TYPES[baseAsset].network,
                      quoteNetwork: ASSET_TYPES[quoteAsset].network,
                      ordinalLocation: (
                        (ASSET_TYPES[baseAsset].isNFT || ASSET_TYPES[quoteAsset].isNFT)
                          ? (ASSET_TYPES[baseAsset].isNFT
                              ? ASSET_TYPES[baseAsset].info.location
                              : ASSET_TYPES[quoteAsset].info.location)
                          : false)
                    })}
                  >Swap
                  </Button>
                  {mock && <DemoSwap mockSwap={mockSwap} />}
                  </>
                : <Button circular='true' secondary='true' className='w-100 h-3 gradient-btn-disabled' disabled>Enter Amounts to Swap</Button>)
            : <Button circular='true' secondary='true' className='w-100 h-3 gradient-btn-disabled' disabled>Connect Wallets to Continue</Button>}
        </Grid>
      </Stack>
    </Box>
  )
}
