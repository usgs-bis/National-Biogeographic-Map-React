import React from 'react'

export interface IComposeContexts {
  contexts: [React.Context<any>, any][],
  children: React.ReactNode,
}

/**
 * Used to combine multiple contexts, pass an array of [Context, value]
 */
const ComposeContexts = (props: IComposeContexts) => {
  const {contexts = [], children} = props

  return (
    <>
      {contexts.reduceRight((acc, [c, val]) => (<c.Provider value={val}>{acc}</c.Provider>), children)}
    </>
  )
}

export default ComposeContexts
