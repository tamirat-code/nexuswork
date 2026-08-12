import Navbar from "../common/Navbar.jsx";
import Footer from "../common/Footer.jsx";

/** Public marketing / marketplace shell: site header, content, full footer. */
export default function MarketingLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-ink">
      <Navbar />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
