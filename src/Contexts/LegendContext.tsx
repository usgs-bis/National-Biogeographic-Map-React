import React from 'react'

export interface ILegendContext {
  hasLegend: boolean
  setHasLegend: Function
  toggleLegend: Function
  setToggleLegend: Function
}

const LegendContext = React.createContext<ILegendContext>({
  hasLegend: false,
  setHasLegend: (_hasLegend: boolean) => {},
  toggleLegend: () => {},
  setToggleLegend: (_toggle: Function) => {},
})

export default LegendContext
