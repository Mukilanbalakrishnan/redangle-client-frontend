import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import Login from './pages/Login'
import SetPassword from './pages/SetPassword'
import ProtectedRoute from './components/ProtectedRoute'

import ClientLayout from './pages/client/ClientLayout'
import ClientDashboard from './pages/client/pages/Dashboard'
import Tracker from './pages/client/pages/Tracker'
import Events from './pages/client/pages/Events'
import Delivery from './pages/client/pages/Delivery'
import EventDetails from './pages/client/pages/EventDetails'
import Quotation from './pages/client/pages/Quotation'
import Invoice from './pages/client/pages/Invoice'
import ClientNotifications from './pages/client/pages/Notifications'
import RaiseComplaint from './pages/client/pages/RaiseComplaint'
import Works from './pages/client/pages/Works'
import SaveTheDate from './pages/client/pages/preproduction/SaveTheDate'
import SaveTheVideo from './pages/client/pages/preproduction/SaveTheVideo'
import Retouch from './pages/client/pages/preproduction/Retouch'

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/set-password" element={<SetPassword />} />
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* --- Client Portal Routes --- */}
        <Route element={<ProtectedRoute allowedRoles={['client']} />}>
          <Route path="/client" element={<ClientLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<ClientDashboard />} />
            <Route path="works" element={<Works />} />
            <Route path="tracker" element={<Tracker />} />
            <Route path="quotation" element={<Quotation />} />
            <Route path="invoice" element={<Invoice />} />
            <Route path="event/:id" element={<EventDetails />} />
            <Route path="preproduction/save-the-date" element={<SaveTheDate />} />
            <Route path="preproduction/save-the-video" element={<SaveTheVideo />} />
            <Route path="preproduction/retouch" element={<Retouch />} />
            <Route path="events" element={<Events />} />
            <Route path="delivery" element={<Delivery />} />
            <Route path="raise-complaint" element={<RaiseComplaint />} />
            <Route path="notifications" element={<ClientNotifications />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
