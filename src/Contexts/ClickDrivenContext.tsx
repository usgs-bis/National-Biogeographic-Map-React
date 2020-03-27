import React from 'react'

export interface IClickDriven {
  clickDriven: boolean
  isClickDriven: (b: boolean) => void
}

const ClickDrivenContext = React.createContext<IClickDriven>({
  clickDriven: false,
  isClickDriven: (_: boolean) => {},
})

export default ClickDrivenContext
