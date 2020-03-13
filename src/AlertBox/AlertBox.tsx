import './AlertBox.scss'
import React, {FunctionComponent, useState, useEffect} from 'react'
import {Alert} from 'reactstrap'
import AppConfig from '../config'

const AlertBox: FunctionComponent = () => {
  const [apiCheck, setApiCheck] = useState<null|string>('This is a test')

  useEffect(() => {
    console.log('api check effect')
    const apiUrl = AppConfig.REACT_APP_BIS_API + '/api'
    const apiDownMessage = `Api '${apiUrl}' is unreachable, this will greatly degrade the performance of this site!`
    fetch(apiUrl)
      .then((res) => {
        if (!res.ok) {
          setApiCheck(apiDownMessage)
        } else {
          setApiCheck(null)
        }
      })
      .catch(() => {
        setApiCheck(apiDownMessage)
      })
  }, [])

  const apiBox = () => {
    if (apiCheck) {
      return (
        <Alert color="danger" className="app-alert">{apiCheck}</Alert>
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
