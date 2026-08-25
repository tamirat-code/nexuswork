import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App.jsx";
import { AuthProvider } from "./app/providers/AuthProvider.jsx";
import { QueryProvider } from "./app/providers/QueryProvider.jsx";
import { SocketProvider } from "./app/providers/SocketProvider.jsx";
import { ThemeProvider } from "./app/providers/ThemeProvider.jsx";
import { ToastProvider } from "./components/notifications/ToastProvider.jsx";
import { Toaster } from "./components/ui/shadcn/sonner.jsx";
import "./styles/tailwind.css";
import "./styles/globals.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <ThemeProvider>
          <QueryProvider>
            <ToastProvider>
              <AuthProvider>
                <SocketProvider>
                  <App />
                  <Toaster position="bottom-right" richColors />
                </SocketProvider>
              </AuthProvider>
            </ToastProvider>
          </QueryProvider>
        </ThemeProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
