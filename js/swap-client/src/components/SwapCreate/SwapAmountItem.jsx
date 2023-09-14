import React, { useState, useEffect, useSyncExternalStore, useCallback } from 'react'
import styles from '../../styles/SwapCreate.module.css'
import { Grid, Select, MenuItem, Button, IconButton, Divider, Stack } from '@mui/material'
import { MyModal } from '../MyModal/MyModal'
import { Close } from '@mui/icons-material'
import KeyboardBackspaceIcon from '@mui/icons-material/KeyboardBackspace'
import { AssetItem } from '../common/AssetItem'
import { CollectiblesModal } from '../Collectibles/CollectiblesModal'
import { getMinimizedAssets } from '../../selector'
import { walletStore } from '../../syncstore/walletstore'

export const SwapAmountItem = ({ assetId, amount, className, onAmountChange, unitPrice, onCoinTypeChange, availQty, limitOrder = true }) => {
  const globalWallet = useSyncExternalStore(walletStore.subscribe, () => walletStore.currentState)
  const assetTypes = getMinimizedAssets(globalWallet)
  const asset = globalWallet.assets[assetId]
  const [assetStep, setAssetStep] = useState(0)
  const onClickAsset = useCallback((asset) => {
    if (asset.isNFT === false) {
      onCoinTypeChange(globalWallet.assets.findIndex(ast => ast.title === asset.title))
      setAssetStep(0)
    } else {
      setAssetStep(2)
    }
  }, [globalWallet])

  const onKeyDown = useCallback((e) => {
    if (e.keyCode === 109) {
      e.preventDefault()
    }
  }, [])

  const handleItemClick = useCallback((asset) => {
    onCoinTypeChange(globalWallet.assets.findIndex(ast => ast.title === asset.title))
    setAssetStep(0)
  }, [globalWallet])

  return (
    <>
      <Grid container direction='row' className={className}>
        {!asset.isNFT
          ? <Grid item xs={7} container direction='column' textAlign='left'>
            <input
              className={`${styles['qty-input']} qty-input`}
              placeholder={availQty}
              type='number'
              value={(amount === 0) ? '' : amount}
              onChange={onAmountChange}
              onKeyDown={onKeyDown}
            />
            {unitPrice * amount > 0 ? <span className={styles.prices}>${unitPrice * amount}</span> : ''}
            </Grid>
          : <Grid item xs={7} container direction='row' textAlign='left'>
            <img className={styles['nft-asset-image']} src={asset.img_url} />
            <Stack direction='column' spacing={1}>
              <span>{asset.detail}</span>
              <span>{asset.info.inscription.slice(0, 3)}...{asset.info.inscription.slice(-3)}</span>
            </Stack>
            </Grid>}
        <Grid item xs={5} textAlign='right'>
          <Button className={`${styles['coin-select']} coin-select`} onClick={() => setAssetStep(1)}><img src={asset.img_url} />{asset.type.split('-')[0]}</Button>
        </Grid>
      </Grid>
      <MyModal open={assetStep === 1}>
        <Grid container direction='column' spacing={1}>
          <Grid item container direction='row' width={350}>
            <Grid item xs={1}><IconButton onClick={() => setAssetStep(0)}><KeyboardBackspaceIcon /></IconButton></Grid>
            <Grid item xs={10} className='flex-center flex-middle'><h3>Select Asset</h3></Grid>
            <Grid item xs={1} textAlign='right'><IconButton onClick={() => setAssetStep(0)}><Close /></IconButton></Grid>
          </Grid>
          {
          assetTypes.map((asset, idx) => <span key={idx}><AssetItem asset={asset} handleClick={onClickAsset} /><Divider style={{ borderColor: '#3A3A3A', margin: '0.3em' }} /></span>)
        }
        </Grid>
      </MyModal>
      <CollectiblesModal open={assetStep === 2} handleItemClick={handleItemClick} handleClose={() => setAssetStep(0)} />
    </>
  )
}
