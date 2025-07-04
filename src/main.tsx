import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App'
import Signin from './pages/SignIn'
import Signup from './pages/Signup'
import Home from './pages/Home'
import Friends from './pages/Friends'
// import Profile from './pages/Profile'
// import Dashboard from './pages/Dashboard'
// import Groups from './pages/Groups'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/signin" element={<Signin />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/home" element={<Home />} />
        <Route path="/friends" element={<Friends />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
