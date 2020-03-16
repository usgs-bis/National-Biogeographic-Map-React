import React, {FunctionComponent, useState, useEffect} from 'react'
import {Alert, UncontrolledAlert} from 'reactstrap'
import AppConfig from '../config'

export interface IAlertBox {
  errorMsg?: string
}

const AlertBox: FunctionComponent<IAlertBox> = ({ errorMsg }) => {
  const [apiCheck, setApiCheck] = useState<null|string>(null)

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

    if (errorMsg) {
      return (
        <UncontrolledAlert color="danger" className="app-alert">
          <b>Sorry, there was an error!</b>
          <div>{errorMsg}</div>
        </UncontrolledAlert>
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
