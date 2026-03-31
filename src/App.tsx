import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminDashboard } from './routes/AdminDashboard'
import { AdminLogin } from './routes/AdminLogin'
import { PublicMenu } from './routes/PublicMenu'

function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicMenu />} />
      <Route path="/admin" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
