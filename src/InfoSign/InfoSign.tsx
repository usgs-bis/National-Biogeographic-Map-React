import './InfoSign.scss'
import React, {FunctionComponent, useState} from 'react'
import {FaInfoCircle} from 'react-icons/fa'
import {UncontrolledTooltip} from 'reactstrap'

export interface IInfoSignProps {
  onClick?: any
}

const InfoSign: FunctionComponent<IInfoSignProps> = ({ onClick }) => {
  const [id] = useState(() => {
    var text = ''
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
    for (var i = 0; i < 15; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length))
    return text
  })

  return (
    <React.Fragment>
      <span id={id} onClick={onClick} className="main-title-info">
        <FaInfoCircle />
      </span>
      <UncontrolledTooltip
        target={id}
        delay={0}
      >Information</UncontrolledTooltip>
    </React.Fragment>
  )
}
export default InfoSign

