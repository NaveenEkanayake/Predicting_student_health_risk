import { AuthProvider } from '../contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import '../styles/globals.css';

export const metadata = {
  title: 'HealthPredict — Student Wellness Dashboard',
  description: 'Monitor and predict student health conditions using AI & ML',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 antialiased">
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                borderRadius: '12px',
                background: '#1e293b',
                color: '#f1f5f9',
                fontSize: '14px',
              },
              success: { iconTheme: { primary: '#22c55e', secondary: '#f0fdf4' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#fef2f2' } },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
