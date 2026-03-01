import "./globals.css";
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import GroceryPanel from './components/GroceryPanel';

export const metadata = {
  title: "Happy Belly",
  description: "Family meal planning made easy",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, backgroundColor: '#F9D7B5', fontFamily: 'Montserrat, sans-serif' }}>

        {/* Desktop Layout */}
        <div className="desktop-layout">
          <Sidebar />
          <div style={{ marginLeft: '60px', marginRight: '300px', minHeight: '100vh', padding: '24px' }}>
            {children}
          </div>
          <GroceryPanel />
        </div>

        {/* Mobile Layout */}
        <div className="mobile-layout">
          {children}
          <BottomNav />
        </div>

      </body>
    </html>
  );
}
