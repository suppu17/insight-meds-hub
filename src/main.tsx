import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import { StytchProvider } from '@stytch/react';
import { StytchUIClient } from '@stytch/vanilla-js';
import AppWrapper from "./components/AppWrapper.tsx";
import "./index.css";

const stytchPublicToken = import.meta.env.VITE_STYTCH_PUBLIC_TOKEN;
console.log('Stytch Public Token:', stytchPublicToken ? 'loaded' : 'missing');

if (!stytchPublicToken) {
  throw new Error('VITE_STYTCH_PUBLIC_TOKEN is required');
}

const stytch = new StytchUIClient(stytchPublicToken);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <StytchProvider stytch={stytch}>
      <AppWrapper />
    </StytchProvider>
  </StrictMode>
);
