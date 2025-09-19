// Authentication module exports
// This file provides clean imports for all authentication components and utilities

// Main components
export { LoginForm } from './LoginForm';
export { SignupForm } from './SignupForm';
export { AuthPage } from './AuthPage';
export { AuthExample } from './AuthExample';

// Hooks and services
export { useAuth } from './useAuth';
export { authService } from './AuthService';

// Types
export type {
  User,
  AuthResponse,
  LoginData,
  SignupData,
  ValidationErrors,
  AuthState
} from './AuthTypes';

// Usage Examples:

/**
 * Basic usage with AuthPage component:
 *
 * import { AuthPage } from '@/components/auth';
 *
 * function App() {
 *   return (
 *     <AuthPage
 *       initialMode="login"
 *       onAuthSuccess={() => console.log('Logged in!')}
 *     />
 *   );
 * }
 */

/**
 * Using individual components:
 *
 * import { LoginForm, SignupForm } from '@/components/auth';
 *
 * function CustomAuthFlow() {
 *   const [mode, setMode] = useState('login');
 *
 *   return mode === 'login' ? (
 *     <LoginForm onSwitchToSignup={() => setMode('signup')} />
 *   ) : (
 *     <SignupForm onSwitchToLogin={() => setMode('login')} />
 *   );
 * }
 */

/**
 * Using the auth hook:
 *
 * import { useAuth } from '@/components/auth';
 *
 * function UserProfile() {
 *   const { user, isAuthenticated, logout } = useAuth();
 *
 *   if (!isAuthenticated) return <div>Please log in</div>;
 *
 *   return (
 *     <div>
 *       <h1>Welcome, {user?.name}</h1>
 *       <button onClick={logout}>Logout</button>
 *     </div>
 *   );
 * }
 */

/**
 * Using the auth service directly:
 *
 * import { authService } from '@/components/auth';
 *
 * async function handleLogin(email: string, password: string) {
 *   const result = await authService.login({ email, password });
 *   if (result.success) {
 *     console.log('Logged in successfully');
 *   } else {
 *     console.error('Login failed:', result.message);
 *   }
 * }
 */