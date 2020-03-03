import React from 'react'

const BasemapContext = React.createContext<[any, Function]>([{}, () => {}])

export default BasemapContext
