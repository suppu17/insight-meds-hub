import React, { useEffect, useState } from 'react';
import { useStytchUser, useStytch, useStytchSession } from '@stytch/react';

const AuthDebug = () => {
  const { user, isInitialized } = useStytchUser();
  const { session } = useStytchSession();
  const stytch = useStytch();
  const [cookies, setCookies] = useState<string>('');

  useEffect(() => {
    // Check for Stytch cookies
    const checkCookies = () => {
      const allCookies = document.cookie;
      const stytchCookies = allCookies.split(';').filter(cookie => 
        cookie.trim().includes('stytch')
      );
      setCookies(stytchCookies.join('; '));
    };

    checkCookies();
    const interval = setInterval(checkCookies, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed top-4 right-4 bg-black/90 text-white p-4 rounded-lg text-xs z-50 max-w-xs">
      <h3 className="font-bold mb-2">Auth Debug</h3>
      <div>Initialized: {isInitialized ? '✅' : '❌'}</div>
      <div>User: {user ? '✅ ' + user.user_id?.slice(0, 8) + '...' : '❌'}</div>
      <div>Session: {session ? '✅ ' + session.session_id?.slice(0, 8) + '...' : '❌'}</div>
      <div>Stytch: {stytch ? '✅' : '❌'}</div>
      
      {user && (
        <div className="mt-2 border-t border-gray-600 pt-2">
          <div>Email: {user.emails?.[0]?.email}</div>
          <div>Status: {user.status}</div>
        </div>
      )}
      
      {session && (
        <div className="mt-2 border-t border-gray-600 pt-2">
          <div>Session Started: {new Date(session.started_at).toLocaleTimeString()}</div>
          <div>Expires: {new Date(session.expires_at).toLocaleTimeString()}</div>
        </div>
      )}
      
      <div className="mt-2 border-t border-gray-600 pt-2">
        <div className="text-xs">Cookies:</div>
        <div className="text-xs text-gray-300 break-all">
          {cookies || 'No Stytch cookies found'}
        </div>
      </div>
    </div>
  );
};

export default AuthDebug;
