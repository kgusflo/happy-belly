import "./globals.css";
import DesktopLayout from './components/DesktopLayout';
import BottomNav from './components/BottomNav';

export const metadata = {
  title: "Happy Belly",
  description: "Family meal planning made easy",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, fontFamily: 'Montserrat, sans-serif' }}>

        {/* Single render of page content — DesktopLayout handles responsive margins */}
        <DesktopLayout>
          {children}
        </DesktopLayout>

        {/* Mobile bottom nav — hidden on desktop via .mobile-layout CSS class */}
        <div className="mobile-layout">
          <BottomNav />
        </div>

        {/* TEMP TEST — delete after confirming updates work */}
        <div style={{ position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)', background: 'red', color: 'white', padding: '4px 12px', zIndex: 9999, fontSize: '12px', fontWeight: 'bold' }}>
          ✅ UPDATED
        </div>

      </body>
    </html>
  );
}
