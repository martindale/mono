import { useState } from 'react'
import {
  Route,
  BrowserRouter as Router,
  Routes
} from 'react-router-dom'
import './App.css'
import { Swap } from './components/Swap'
import { SwapActivity } from './components/SwapActivity/SwapActivity'
import { SwapHome } from './components/SwapHome'
import { AppContext } from '../context'

function App () {
  const [context, setContext] = useState({})

  return (
    <AppContext.Provider value={{ context, setContext }}>
      <Router>
        <Routes>
          <Route path='' element={<SwapHome />} />
          <Route path='' element={<Swap />}>
            <Route path='/history' element={<SwapActivity />} />
          </Route>
        </Routes>
      </Router>
    </AppContext.Provider>
  )
}

export default App
