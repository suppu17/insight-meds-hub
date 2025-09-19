import React from 'react';
import { useStytchUser } from '@stytch/react';
import App from '../App';

const AppWrapper = () => {
  const { isInitialized } = useStytchUser();

  // Show loading while Stytch initializes
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Initializing authentication...</p>
        </div>
      </div>
    );
  }

  return <App />;
};

export default AppWrapper;
