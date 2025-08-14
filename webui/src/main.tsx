import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import DetailsPage from './pages/DetailsPage.tsx'
import { UserProvider } from './store/user.tsx'
import HomePage from './pages/HomePage.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UserProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />}>
            <Route index element={<HomePage />} />
            <Route path=":type/:key" element={<DetailsPage />} />
            <Route path="prompts/:key" element={<DetailsPage />} />
            <Route path="resources/:key" element={<DetailsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </UserProvider>
  </StrictMode>,
)
