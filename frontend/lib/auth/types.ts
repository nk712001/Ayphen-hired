export interface User {
  id: string;
  email: string;
  role: 'admin' | 'proctor' | 'student';
  fullName: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string, role: User['role']) => Promise<void>;
  logout: () => Promise<void>;
}
