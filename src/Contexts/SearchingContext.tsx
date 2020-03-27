import React from 'react'

export interface ISearching {
  searching: boolean
  isSearching: (b: boolean) => void
}

const SearchingContext = React.createContext<ISearching>({
  searching: false,
  isSearching: (_: boolean) => {},
})

export default SearchingContext
