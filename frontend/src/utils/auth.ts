export type UserRole = 'admin' | 'supervisor' | 'production_manager' | 'plant_head';

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  supervisor: 'Supervisor',
  production_manager: 'Production Manager',
  plant_head: 'Plant Head',
};

export function login(role: UserRole, displayName?: string) {
  localStorage.setItem('user_role', role);
  localStorage.setItem('display_name', displayName ?? ROLE_LABELS[role]);
  localStorage.setItem('is_logged_in', 'true');
}

export function logout() {
  localStorage.removeItem('user_role');
  localStorage.removeItem('display_name');
  localStorage.removeItem('is_logged_in');
}

export function getIsLoggedIn(): boolean {
  return localStorage.getItem('is_logged_in') === 'true';
}

export function getUserRole(): UserRole | null {
  const role = localStorage.getItem('user_role');
  return role === 'admin' || role === 'supervisor' || role === 'production_manager' || role === 'plant_head'
    ? role
    : null;
}

export function getUserDisplayName(): string {
  return localStorage.getItem('display_name') ?? 'Operator';
}

export function getDashboardPath(role: UserRole | null): string {
  switch (role) {
    case 'admin':
    case 'plant_head':
      return '/admin';
    case 'supervisor':
    case 'production_manager':
      return '/supervisor';
    default:
      return '/login';
  }
}

export function getRoleLabel(role: UserRole | null): string {
  if (!role) return 'Guest';
  return ROLE_LABELS[role];
}
