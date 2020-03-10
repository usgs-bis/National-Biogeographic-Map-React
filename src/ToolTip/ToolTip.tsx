import './ToolTip.css'
import React, {FunctionComponent, useState} from 'react'
import {Tooltip, TooltipProps} from 'reactstrap'

export interface ICustomTooltip extends TooltipProps {
  text: string
  target: string
}

// @Matt TODO: #current this doesn't appear to be working, maybe another ticket
const CustomToolTip: FunctionComponent<ICustomTooltip> = ({ text, target, placement }) => {
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
        {text}
      </Tooltip>
    )
  }

  return null
}

export default CustomToolTip
