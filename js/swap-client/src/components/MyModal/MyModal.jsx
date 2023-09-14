import { Box, Modal } from '@mui/material'
import React from 'react'

export const MyModal = ({ classme, children, open }) => {
  return (
    <Modal
      open={open}
      onClose={() => {}}
      aria-labelledby='parent-modal-title'
      aria-describedby='parent-modal-description'
      sx={{ width: 'fit-content', display: 'flex', margin: 'auto' }}
    >
      <Box className={`${classme} modal-container`}>
        {children}
      </Box>
    </Modal>
  )
}
