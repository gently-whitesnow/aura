import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

import PromptsPage from './pages/PromptsPage.tsx'
import ResourcesPage from './pages/ResourcesPage.tsx'
import ArtifactDetailsPage from './pages/ArtifactDetailsPage.tsx'
import { UserProvider } from './store/user.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UserProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />}>
            <Route index element={<Navigate to="/prompts" replace />} />
            <Route path="prompts" element={<PromptsPage />} />
            <Route path="resources" element={<ResourcesPage />} />
            <Route path=":type/:key" element={<ArtifactDetailsPage />} />
            <Route path="prompts/:key" element={<ArtifactDetailsPage />} />
            <Route path="resources/:key" element={<ArtifactDetailsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </UserProvider>
  </StrictMode>,
)
