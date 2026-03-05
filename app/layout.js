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

      </body>
    </html>
  );
}
