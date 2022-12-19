import { useState } from 'react'
import 'semantic-ui-css/semantic.min.css';
import { Header, Image } from 'semantic-ui-react'
import './App.css'
import SwapDemo from './components/SwapDemo'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="App">
      <div>
        <Image
          centered
          circular
          size='large'
          src='https://pbs.twimg.com/profile_banners/1082726135941586949/1650477093/1500x500'
        />
        <Header as='h2' icon textAlign='center'>
          <Header.Content>Portal Lightning Swap Demo</Header.Content>
        </Header>
        <br />
      </div>
      <SwapDemo />
    </div>
  )
}

export default App
