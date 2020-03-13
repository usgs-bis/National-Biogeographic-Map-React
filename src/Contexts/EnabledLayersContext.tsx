import React from 'react'

export interface IEnabledLayersContext {
  enabledLayers: any[]
  setEnabledLayers: Function
}

const EnabledLayersContext = React.createContext<IEnabledLayersContext>({
  enabledLayers: [],
  setEnabledLayers: () => {}
})

export default EnabledLayersContext
