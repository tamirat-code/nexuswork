import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import AppRouter from "./app/router/index.jsx";
import MarketingLayout from "./components/layouts/MarketingLayout.jsx";
import AppLayout from "./components/layouts/AppLayout.jsx";
import ScrollToTop, { SkipLink } from "./components/common/ScrollToTop.jsx";
import { STANDALONE_PATHS, WORKSPACE_PATHS, WORKSPACE_EXACT_PATHS } from "./config/navigation.js";
import { useAuth } from "./hooks/useAuth.js";
import { installGlobalErrorHandlers } from "./lib/logger.js";
import InitialAppLoader from "./components/loaders/InitialAppLoader.jsx";

const matches = (paths, pathname) =>
  paths.some((p) => pathname === p || pathname.startsWith(`${p}/`));

export default function App() {
  useEffect(() => installGlobalErrorHandlers(), []);
  const { pathname } = useLocation();
  const { token, ready } = useAuth();

  // AuthProvider checks the existing session on every full page load. Keep
  // the route and layout hidden until that check completes so users do not
  // briefly see the wrong public/protected screen during startup.
  if (!ready) return <InitialAppLoader />;

  const standalone = matches(STANDALONE_PATHS, pathname);
  
  const isPublicSiblingOfExactPath = WORKSPACE_EXACT_PATHS.some(
    (p) => pathname !== p && pathname.startsWith(`${p}/`)
  );
  const workspace = !standalone && token && matches(WORKSPACE_PATHS, pathname) && !isPublicSiblingOfExactPath;

  const Layout = standalone ? null : workspace ? AppLayout : MarketingLayout;
  
  const shellKey = standalone ? "standalone" : workspace ? "app" : "marketing";

  return (
    <>
      <ScrollToTop />
      {!standalone && <SkipLink />}
      {Layout ? (
        <div key={shellKey} className="animate-fade-up">
          <Layout>
            <AppRouter />
          </Layout>
        </div>
      ) : (
        <AppRouter />
      )}
    </>
  );
}
