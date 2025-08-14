import { Link, Outlet, useLocation } from 'react-router-dom'
import Topbar from './components/Topbar'

function App() {
  const { pathname } = useLocation()
  return (
    <div className="min-h-screen bg-base-200">
      <header className="navbar bg-base-100 shadow-sm sticky top-0 z-10">
        <div className="flex-1 px-2">
          <Link to="/" className="btn btn-ghost text-xl">Aura</Link>
        </div>
        <nav className="flex gap-1 px-2" aria-label="Навигация">
          <Link className={`btn btn-sm btn-ghost ${pathname === '/' ? 'btn-active' : ''}`} to="/">Главная</Link>
          <Link className={`btn btn-sm btn-ghost ${pathname.startsWith('/prompts') ? 'btn-active' : ''}`} to="/prompts">Промпты</Link>
          <Link className={`btn btn-sm btn-ghost ${pathname.startsWith('/resources') ? 'btn-active' : ''}`} to="/resources">Ресурсы</Link>
        </nav>
        <div className="flex-none px-2">
          <Topbar />
        </div>
      </header>
      <main className="container mx-auto p-4">
        <Outlet />
      </main>
    </div>
  )
}

export default App
