import React from 'react';
import Navbar from './Navbar';
import Footer from '../sections/Footer'; // We will create this later

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="bg-black min-h-screen text-gray-300">
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
};

export default Layout;
