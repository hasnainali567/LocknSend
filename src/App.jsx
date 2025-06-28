import { useState } from 'react'
import { BrowserRouter  } from 'react-router-dom'
import './App.css'
import AppRouter from './config/Router.jsx'

function App() {

  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  )
}

export default App
