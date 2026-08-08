import { useLocation } from "react-router-dom";
import Navbar from "./components/common/Navbar.jsx";
import Footer from "./components/common/Footer.jsx";
import AppRouter from "./app/router/index.jsx";

const STANDALONE_LAYOUT_PATHS = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email"];

export default function App() {
  const location = useLocation();
  const standalone = STANDALONE_LAYOUT_PATHS.some((p) => location.pathname.startsWith(p));

  if (standalone) {
    return <AppRouter />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <Navbar />
      <main className="flex-1">
        <AppRouter />
      </main>
      <Footer />
    </div>
  );
}