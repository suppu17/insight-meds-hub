# Enhanced React Authentication Components

A comprehensive, production-ready authentication system built with React, TypeScript, and Tailwind CSS. This system provides secure login and signup functionality with modern UX patterns and robust error handling.

## 🚀 Features

- **🔐 Secure Authentication**: JWT-based authentication with automatic token refresh
- **🎨 Modern UI**: Beautiful, responsive design with glassmorphism effects
- **✅ Form Validation**: Real-time validation with visual feedback
- **💪 Password Strength**: Dynamic password strength indicator
- **📱 Responsive Design**: Mobile-first approach that works on all devices
- **♿ Accessibility**: Full keyboard navigation and screen reader support
- **🔄 State Management**: Custom React hooks for authentication state
- **⚡ TypeScript**: Full type safety throughout the codebase
- **🎭 Smooth Animations**: Elegant transitions and loading states

## 📁 File Structure

```
src/components/auth/
├── AuthTypes.ts          # TypeScript interfaces and types
├── AuthService.ts        # API service class for Stitch integration
├── useAuth.ts           # Custom hook for authentication state
├── LoginForm.tsx        # Login form component
├── SignupForm.tsx       # Signup form component
├── AuthPage.tsx         # Combined auth page with form switching
├── AuthExample.tsx      # Example usage component
├── index.ts             # Clean exports for easy imports
└── README.md            # This documentation
```

## 🛠 Installation & Setup

### 1. Copy the authentication files to your project:

```bash
# Copy all files from the auth folder to your project
cp -r src/components/auth/* /your-project/src/components/auth/
```

### 2. Configure Stitch API endpoints:

Update the `STITCH_CONFIG` in `AuthService.ts`:

```typescript
const STITCH_CONFIG = {
  baseUrl: 'https://your-stitch-api-url.com', // Replace with your Stitch API URL
  endpoints: {
    signup: '/auth/signup',
    login: '/auth/login',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    profile: '/auth/profile'
  }
};
```

### 3. Install required dependencies (if not already installed):

```bash
npm install lucide-react @radix-ui/react-*
```

## 📚 Usage Examples

### Basic Usage with AuthPage

The simplest way to add authentication to your app:

```tsx
import React from 'react';
import { AuthPage, useAuth } from '@/components/auth';

function App() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return (
      <AuthPage
        initialMode="login"
        onAuthSuccess={() => {
          console.log('User authenticated successfully!');
          // Handle post-authentication logic
        }}
      />
    );
  }

  return <Dashboard />; // Your main app content
}
```

### Individual Form Components

For more control over the authentication flow:

```tsx
import React, { useState } from 'react';
import { LoginForm, SignupForm } from '@/components/auth';

function CustomAuthFlow() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  return (
    <div className="min-h-screen flex items-center justify-center">
      {mode === 'login' ? (
        <LoginForm
          onSuccess={() => console.log('Login successful')}
          onSwitchToSignup={() => setMode('signup')}
        />
      ) : (
        <SignupForm
          onSuccess={() => console.log('Signup successful')}
          onSwitchToLogin={() => setMode('login')}
        />
      )}
    </div>
  );
}
```

### Using the Authentication Hook

Access authentication state and methods throughout your app:

```tsx
import React from 'react';
import { useAuth } from '@/components/auth';

function UserProfile() {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    logout,
    clearError
  } = useAuth();

  if (isLoading) return <div>Loading...</div>;

  if (!isAuthenticated) {
    return <div>Please log in to access this page</div>;
  }

  return (
    <div>
      <h1>Welcome, {user?.name || user?.email}</h1>
      <p>User ID: {user?.id}</p>

      {error && (
        <div className="error">
          {error}
          <button onClick={clearError}>Dismiss</button>
        </div>
      )}

      <button onClick={logout}>
        Sign Out
      </button>
    </div>
  );
}
```

### Direct API Usage

Use the authentication service directly for custom implementations:

```tsx
import { authService, LoginData, SignupData } from '@/components/auth';

// Login example
async function handleLogin(email: string, password: string) {
  const loginData: LoginData = {
    email,
    password,
    rememberMe: true
  };

  const result = await authService.login(loginData);

  if (result.success) {
    console.log('Login successful:', result.user);
  } else {
    console.error('Login failed:', result.message);
  }
}

// Signup example
async function handleSignup(email: string, password: string, name: string) {
  const signupData: SignupData = {
    email,
    password,
    confirmPassword: password,
    name
  };

  const result = await authService.signup(signupData);

  if (result.success) {
    console.log('Signup successful:', result.user);
  } else {
    console.error('Signup failed:', result.message);
  }
}

// Check authentication status
if (authService.isAuthenticated()) {
  console.log('User is authenticated');
} else {
  console.log('User needs to log in');
}
```

## 🔧 API Integration

### Expected Stitch API Response Format

Your Stitch API should return responses in this format:

```typescript
// Successful response
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}

// Error response
{
  "success": false,
  "message": "Invalid credentials",
  "errors": {
    "email": "Email is required",
    "password": "Password must be at least 8 characters"
  }
}
```

### Required Endpoints

Ensure your Stitch API provides these endpoints:

- `POST /auth/signup` - User registration
- `POST /auth/login` - User authentication
- `POST /auth/logout` - User logout (optional)
- `POST /auth/refresh` - Token refresh (optional)
- `GET /auth/profile` - Get user profile (optional)

## 🎨 Customization

### Styling

The components use Tailwind CSS classes and can be customized by:

1. **Theme Colors**: Update the color classes in the components
2. **Glassmorphism**: Modify the `glass-card` classes
3. **Animations**: Adjust transition and animation classes

### Form Fields

Add additional fields to the signup form:

```tsx
// In SignupForm.tsx, add to the SignupData interface in AuthTypes.ts
interface SignupData {
  email: string;
  password: string;
  confirmPassword: string;
  name?: string;
  phoneNumber?: string; // Add new fields
  dateOfBirth?: string;
}
```

### Validation Rules

Customize validation in `AuthService.ts`:

```typescript
private validateSignupData(data: SignupData): string | null {
  // Add custom validation rules
  if (data.password && data.password.length < 12) {
    return 'Password must be at least 12 characters';
  }
  // ... other rules
}
```

## 🔒 Security Features

- **JWT Token Management**: Secure storage in localStorage/sessionStorage
- **Automatic Token Refresh**: Prevents session expiration
- **Request Timeouts**: 10-second timeout for all API requests
- **Input Validation**: Client-side validation before API calls
- **CSRF Protection**: Ready for CSRF token implementation
- **Password Strength**: Real-time password strength validation

## 📱 Responsive Design

The components are fully responsive and include:

- Mobile-first design approach
- Touch-friendly button sizes
- Adaptive layouts for different screen sizes
- Optimized for both desktop and mobile usage

## ♿ Accessibility Features

- **Keyboard Navigation**: Full keyboard support
- **Screen Reader Support**: Proper ARIA labels and descriptions
- **Focus Management**: Visible focus indicators
- **Color Contrast**: Meets WCAG guidelines
- **Error Announcements**: Screen reader accessible error messages

## 🧪 Testing

Example test cases you should implement:

```typescript
// Jest/Testing Library examples
describe('LoginForm', () => {
  test('validates email format', async () => {
    // Test email validation
  });

  test('shows error for invalid credentials', async () => {
    // Test error handling
  });

  test('calls onSuccess when login succeeds', async () => {
    // Test success callback
  });
});
```

## 🤝 Contributing

1. Follow the existing code style and patterns
2. Add TypeScript types for all new features
3. Include proper error handling
4. Test on both desktop and mobile devices
5. Ensure accessibility compliance

## 📄 License

This code is provided as-is for use in your React projects. Feel free to modify and adapt it to your needs.

---

## 🚀 Quick Start Checklist

- [ ] Copy all auth files to your project
- [ ] Update Stitch API configuration in `AuthService.ts`
- [ ] Install required dependencies
- [ ] Import and use `AuthPage` in your app
- [ ] Test login and signup flows
- [ ] Customize styling to match your brand
- [ ] Add any additional form fields needed
- [ ] Implement proper error handling
- [ ] Test on mobile devices
- [ ] Verify accessibility compliance

Need help? Check the example components or create an issue in your project repository.