import { useLocation } from "react-router-dom";
import AppRouter from "./app/router/index.jsx";
import MarketingLayout from "./components/layouts/MarketingLayout.jsx";
import AppLayout from "./components/layouts/AppLayout.jsx";
import ScrollToTop, { SkipLink } from "./components/common/ScrollToTop.jsx";
import { STANDALONE_PATHS, WORKSPACE_PATHS } from "./config/navigation.js";
import { useAuth } from "./hooks/useAuth.js";

const matches = (paths, pathname) =>
  paths.some((p) => pathname === p || pathname.startsWith(`${p}/`));

export default function App() {
  const { pathname } = useLocation();
  const { token } = useAuth();

  const standalone = matches(STANDALONE_PATHS, pathname);
  const workspace = !standalone && token && matches(WORKSPACE_PATHS, pathname);

  const Layout = standalone ? null : workspace ? AppLayout : MarketingLayout;

  return (
    <>
      <ScrollToTop />
      {!standalone && <SkipLink />}
      {Layout ? (
        <Layout>
          <AppRouter />
        </Layout>
      ) : (
        <AppRouter />
      )}
    </>
  );
}
