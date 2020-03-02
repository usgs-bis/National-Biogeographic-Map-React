import './AlertBox.scss'
import React, {FunctionComponent, useState, useEffect} from 'react'
import {Alert} from 'react-bootstrap'
import AppConfig from '../config'

const AlertBox: FunctionComponent = () => {
  const [apiCheck, setApiCheck] = useState<null|string>(null)

  useEffect(() => {
    console.log('api check effect')
    const apiUrl = AppConfig.REACT_APP_BIS_API + '/api'
    fetch(apiUrl)
      .then((res) => {
        if (!res.ok) {
          setApiCheck(`Api '${apiUrl}' is unreachable, this will greatly degrade the performance of this site!`)
        } else {
          setApiCheck(null)
        }
      })
      .catch((err) => {
        setApiCheck(err)
      })
  }, [])

  const apiBox = () => {
    if (apiCheck) {
      return (
        <Alert bsStyle="danger" className="app-alert">{apiCheck}</Alert>
      )
    }
  }

  return (
    <>
      {apiBox()}
    </>
  )
}

export default AlertBox
