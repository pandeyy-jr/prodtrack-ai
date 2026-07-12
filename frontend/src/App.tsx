
import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';

const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Supervisor = lazy(() => import('./pages/Supervisor'));
const Admin = lazy(() => import('./pages/Admin'));

const LoadingScreen = () => (
  <div className="flex min-h-screen items-center justify-center bg-base text-text-secondary">
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-6 py-4 text-sm">
      Loading workspace...
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute allowedRoles={["supervisor", "production_manager"]} />}>
            <Route path="/supervisor" element={<Supervisor />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["admin", "plant_head"]} />}>
            <Route path="/admin" element={<Admin />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
