import "./globals.css";
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';

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
          <div style={{
            position: 'fixed',
            right: 0,
            top: 0,
            bottom: 0,
            width: '300px',
            backgroundColor: '#5AA0B4',
            borderLeft: '1px solid #88B0B4',
            padding: '24px 16px',
            overflowY: 'auto',
          }}>
            <p style={{ fontSize: '16px', fontWeight: '500', color: 'white', marginBottom: '16px' }}>🛒 Grocery List</p>
          </div>
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
