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

        {/* Desktop Layout — sidebar always visible; grocery panel only on Meals screen */}
        <DesktopLayout>{children}</DesktopLayout>

        {/* Mobile Layout */}
        <div className="mobile-layout">
          {children}
          <BottomNav />
        </div>

      </body>
    </html>
  );
}
