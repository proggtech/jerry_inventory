import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import 'antd/dist/reset.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { ConfigProvider } from 'antd';

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "iDeviceCare - Modern Inventory Management",
  description: "Manage your inventory with ease",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: '#667eea',
              borderRadius: 8,
            },
          }}
        >
          <AuthProvider>
            {children}
          </AuthProvider>
        </ConfigProvider>
      </body>
    </html>
  );
}
