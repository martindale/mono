import { Grid, IconButton, Stack } from '@mui/material'
import React from 'react'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'

export const AssetItem = ({ asset, handleClick }) => {
  return (
    <Grid item container direction='row' onClick={e => handleClick(asset)} style={{ cursor: 'pointer' }} className='asset-item'>
      <Grid item xs={1.5}><img width='32px' src={asset.img_url} /></Grid>
      <Grid item xs={5} container direction='column' textAlign='left'>
        <span><h4>{asset.title}</h4></span>
        {asset.type && <span><h5 style={{ fontSize: '0.8em', color: 'grey' }}>{asset.type}</h5></span>}
      </Grid>
      <Grid item xs={5.5} textAlign='right' alignItems='center'>
        {asset.amount}<span style={{ color: 'grey', fontSize: '0.7em' }}>{asset.type && asset.type.toUpperCase()}</span><NavigateNextIcon />
      </Grid>
    </Grid>
  )
}
