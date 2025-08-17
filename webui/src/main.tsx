import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import PrimitivePage from './pages/PrimitivePage.tsx'
import { UserProvider } from './store/user.tsx'
import HomePage from './pages/HomePage/HomePage.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UserProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />}>
            <Route index element={<HomePage />} />
            <Route path=":type/:key" element={<PrimitivePage />} />
            <Route path="prompts/:key" element={<PrimitivePage />} />
            <Route path="resources/:key" element={<PrimitivePage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </UserProvider>
  </StrictMode>,
)
