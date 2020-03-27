import React, { Dispatch, SetStateAction } from 'react'

export interface IResultsContext {
  setResults: Dispatch<SetStateAction<never[]>>
  results: any[]
}

const ResultsContext = React.createContext<IResultsContext>({
  results: [],
  setResults: () => {},
})

export default ResultsContext
