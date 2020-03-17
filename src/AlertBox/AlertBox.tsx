import AppConfig from '../config'
import React, {FunctionComponent, useState, useEffect} from 'react'
import {Alert} from 'reactstrap'

export interface IAlertBox {
  error?: Error
}

const AlertBox: FunctionComponent<IAlertBox> = ({ error }) => {
  const [apiCheck, setApiCheck] = useState<null|string>(null)

  const [showError, setShowError] = useState(false)

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

  useEffect(() => {
    if (error?.message) {
      setShowError(true)
    }
  }, [error])

  const onDismissError = () => setShowError(false)

  const apiBox = () => {

    if (apiCheck) {
      return (
        <Alert color="danger" className="app-alert">{apiCheck}</Alert>
      )
    }

    if (error?.message) {
      return (
        <Alert color="danger" className="app-alert" toggle={onDismissError} isOpen={showError}>
          <b>Sorry, there was an error!</b>
          <div>{error.message}</div>
        </Alert>
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
