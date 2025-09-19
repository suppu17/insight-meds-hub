import React from 'react';
import { AuthPage } from './AuthPage';
import { useAuth } from './useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LogOut, User } from 'lucide-react';

/**
 * Example component demonstrating how to use the authentication system
 * This shows the complete flow from login/signup to authenticated state
 */
export function AuthExample() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className=\"min-h-screen flex items-center justify-center\">
        <div className=\"text-center text-white\">
          <div className=\"animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4\"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Show authentication page if not authenticated
  if (!isAuthenticated) {
    return (
      <AuthPage
        initialMode=\"login\"
        onAuthSuccess={() => {
          console.log('Authentication successful!');
          // Handle post-login actions here
          // For example: redirect to dashboard, show welcome message, etc.
        }}
      />
    );
  }

  // Show authenticated user dashboard
  return (
    <div className=\"min-h-screen bg-gradient-to-br from-orange-400 via-red-500 to-pink-500 p-6\">
      <div className=\"max-w-4xl mx-auto\">
        {/* Header */}
        <div className=\"flex items-center justify-between mb-8\">
          <div className=\"flex items-center gap-3\">
            <div className=\"w-10 h-10 bg-white/20 rounded-full flex items-center justify-center\">
              <User className=\"w-5 h-5 text-white\" />
            </div>
            <div>
              <h1 className=\"text-2xl font-bold text-white\">Welcome back!</h1>
              <p className=\"text-white/80\">{user?.email}</p>
            </div>
          </div>

          <Button
            onClick={logout}
            variant=\"outline\"
            className=\"bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-xl shadow-lg\"
          >
            <LogOut className=\"w-4 h-4 mr-2\" />
            Logout
          </Button>
        </div>

        {/* User Info Card */}
        <Card className=\"glass-card p-6 mb-6\">
          <h2 className=\"text-xl font-bold text-white mb-4\">User Profile</h2>
          <div className=\"space-y-3 text-white/90\">
            <div>
              <span className=\"font-medium\">Name:</span> {user?.name || 'Not provided'}
            </div>
            <div>
              <span className=\"font-medium\">Email:</span> {user?.email}
            </div>
            <div>
              <span className=\"font-medium\">User ID:</span> {user?.id}
            </div>
            {user?.createdAt && (
              <div>
                <span className=\"font-medium\">Member since:</span>{' '}
                {new Date(user.createdAt).toLocaleDateString()}
              </div>
            )}
          </div>
        </Card>

        {/* Features Card */}
        <Card className=\"glass-card p-6\">
          <h2 className=\"text-xl font-bold text-white mb-4\">Available Features</h2>
          <div className=\"grid grid-cols-1 md:grid-cols-2 gap-4\">
            <div className=\"p-4 bg-white/5 rounded-lg border border-white/10\">
              <h3 className=\"font-semibold text-white mb-2\">Secure Authentication</h3>
              <p className=\"text-white/80 text-sm\">
                JWT-based authentication with automatic token refresh and secure storage.
              </p>
            </div>
            <div className=\"p-4 bg-white/5 rounded-lg border border-white/10\">
              <h3 className=\"font-semibold text-white mb-2\">Form Validation</h3>
              <p className=\"text-white/80 text-sm\">
                Real-time form validation with password strength indicators and error handling.
              </p>
            </div>
            <div className=\"p-4 bg-white/5 rounded-lg border border-white/10\">
              <h3 className=\"font-semibold text-white mb-2\">Responsive Design</h3>
              <p className=\"text-white/80 text-sm\">
                Mobile-first design that works seamlessly across all device sizes.
              </p>
            </div>
            <div className=\"p-4 bg-white/5 rounded-lg border border-white/10\">
              <h3 className=\"font-semibold text-white mb-2\">Accessibility</h3>
              <p className=\"text-white/80 text-sm\">
                Full keyboard navigation, screen reader support, and ARIA labels.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default AuthExample;