// layouts/MainLayout.jsx
// The storefront shell: intro overlay (once), announcement bar, sticky navbar,
// routed page content, then the footer.
import { Outlet } from 'react-router-dom';
import AnnouncementBar from '../components/layout/AnnouncementBar.jsx';
import Navbar from '../components/layout/Navbar.jsx';
import Footer from '../components/layout/Footer.jsx';
import IntroOverlay from '../components/layout/IntroOverlay.jsx';

export default function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <IntroOverlay />
      <AnnouncementBar />
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
