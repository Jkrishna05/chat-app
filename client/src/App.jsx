import React from 'react'
import Homepage from './pages/Homepage'
import { Navigate, Route, Routes } from 'react-router-dom'
import Profilepage from './pages/Profilepage'
import Loginpage from './pages/Loginpage'
import  { Toaster } from 'react-hot-toast'
import { ChatContext } from './context/Context'
import { useContext } from 'react'
import assets from './assets/chat-app-assets/chat-app-assets/assets'

const App = () => {
  let value=useContext(ChatContext);
  let {authUser}=value;

  return (
    <div className='bg-[url("/bgImage.svg")] bg-no-repeat bg-cover min-h-screen '>

      <Toaster />
      <Routes>
        <Route path='/' element={authUser?<Homepage />:<Navigate to='/login'/>} />
        <Route path='/profile' element={authUser?<Profilepage />:<Navigate to='/login'/>} />
        <Route path='/login' element={!authUser?<Loginpage />:<Navigate to='/'/>} />
      </Routes>

    </div>
  )
}

export default App
