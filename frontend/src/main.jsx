import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { NotificationProvider } from "./context/NotificationContext";

import App from "./App";
import { ThemeProvider } from "./context/ThemeContext";
import { LanguageProvider } from "./context/LanguageContext";
import { AuthProvider } from "./context/AuthContext"; // <-- Make sure this is here
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider> {/* <-- And wrapping the App */}
              <NotificationProvider>
    <App />
  </NotificationProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);