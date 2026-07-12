import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { getDashboardPath, getIsLoggedIn, getUserRole, type UserRole } from '../utils/auth';

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const isLoggedIn = getIsLoggedIn();
  const userRole = getUserRole();

  if (!isLoggedIn || !userRole) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(userRole)) {
    return <Navigate to={getDashboardPath(userRole)} replace />;
  }

  return (
    <div className="flex min-h-screen bg-base">
      <Sidebar />
      <main className="flex-1 lg:ml-0">
        <Outlet />
      </main>
    </div>
  );
};

export default ProtectedRoute;
