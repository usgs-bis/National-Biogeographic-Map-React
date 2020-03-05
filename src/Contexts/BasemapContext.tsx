import React from 'react'

export interface IBasemapContext {
  serviceUrl: string
  type: string
  attribution: any
  leafletProperties: any
}

const BasemapContext = React.createContext<[IBasemapContext|null, Function]>([null, () => {}])

export default BasemapContext
