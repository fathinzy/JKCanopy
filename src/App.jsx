import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './system/auth/AuthContext.jsx'
import ProtectedRoute from './system/auth/ProtectedRoute.jsx'
import Website from './pages/Website.jsx'
import Login from './system/pages/Login.jsx'
import SystemLayout from './system/SystemLayout.jsx'
import Dashboard from './system/pages/Dashboard.jsx'
import Items from './system/pages/Items.jsx'
import BookingForm from './system/pages/BookingForm.jsx'
import BookingList from './system/pages/BookingList.jsx'
import Workers from './system/pages/Workers.jsx'
import Quotations from './system/pages/Quotations.jsx'
import Payments from './system/pages/Payments.jsx'
import CalendarPage from './system/pages/CalendarPage.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public marketing website */}
          <Route path="/" element={<Website />} />

          {/* Auth */}
          <Route path="/system/login" element={<Login />} />

          {/* Protected management system */}
          <Route
            path="/system"
            element={
              <ProtectedRoute>
                <SystemLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="items" element={<Items />} />
            <Route path="bookings" element={<BookingList />} />
            <Route path="bookings/new" element={<BookingForm />} />
            <Route path="quotations" element={<Quotations />} />
            <Route path="workers" element={<Workers />} />
            <Route path="payments" element={<Payments />} />
            <Route path="calendar" element={<CalendarPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
