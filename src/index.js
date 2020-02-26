import App from './App'
import React from 'react'
import ReactDOM from 'react-dom'

//let bioscapeName = "biogeography";
let bioscapeName = 'terrestrial-ecosystems-2011'

let name = window.location.pathname
let chunks = name.split('/')
let path = chunks[chunks.length - 2]

for (let i = chunks.length - 1; i > -1; i--) {
  if (chunks[i]) {
    path = chunks[i]
    i = -1
  }
}

if (path.length > 1) {
  bioscapeName = path.replace(/\//g, '')
}

ReactDOM.render(<App bioscape={bioscapeName} />, document.getElementById('root'))

