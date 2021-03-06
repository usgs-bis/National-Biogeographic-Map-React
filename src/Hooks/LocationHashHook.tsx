import {useState} from 'react'

const useLocationHash = () => {
  const [state] = useState(() => {
    let hash = window.location.hash.substr(1)
    if (hash.length > 0) {
      return JSON.parse(atob(hash))
    }

    return null
  })

  const setHash = (model: any) => {
    window.location.hash = Buffer.from(JSON.stringify(model)).toString('base64')
  }

  return [state, setHash]
}

export default useLocationHash
