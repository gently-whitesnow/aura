import { Outlet } from 'react-router-dom'

function App() {
  return (
    <div className="min-h-screen bg-base-200">
      <main className="container mx-auto p-4">
        <Outlet />
      </main>
    </div>
  )
}

export default App
