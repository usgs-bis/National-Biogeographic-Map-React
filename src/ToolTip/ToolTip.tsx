import './ToolTip.css'
import React, {FunctionComponent, useState} from 'react'
import {Tooltip, TooltipProps} from 'reactstrap'

// @Matt TODO: #current this doesn't appear to be working, maybe another ticket
const CustomToolTip: FunctionComponent<TooltipProps> = ({ text, target, placement, children }) => {
  const [open, setOpen] = useState(false)

  if (text) {
    return (

      <Tooltip
        style={{fontSize: '14px'}} isOpen={open}
        target={target}
        toggle={() => setOpen(!open)}
        delay={0}
        placement={placement || 'auto'}
      >
        {children}
      </Tooltip>
    )
  }

  return null
}
