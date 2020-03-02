// @Matt TODO: unify how we are using bootstrap, right now we use 3.x and 4.x,
// we should stick to one, as well as one react library for it
import 'bootstrap/dist/css/bootstrap.min.css'

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

