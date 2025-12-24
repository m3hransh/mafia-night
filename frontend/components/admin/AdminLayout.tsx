'use client';

import { useState } from 'react';
import { AdminProtectedRoute } from '@/components/AdminProtectedRoute';
import { AdminSidebar } from './AdminSidebar';
import { adminLogout } from '@/lib/adminAuth';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  actions?: React.ReactNode;
}

export function AdminLayout({ children, title, actions }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      adminLogout();
    }
  };

  return (
    <AdminProtectedRoute>
      <div className="flex h-screen overflow-hidden relative">
        {/* Sidebar */}
        <AdminSidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
          onLogout={handleLogout}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 relative z-10">
          {/* Mobile Header */}
          <div className="md:hidden p-4 flex items-center gap-3 border-b border-purple-500/20 bg-black/20 backdrop-blur-sm">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="text-purple-300 hover:text-white p-2 -ml-2"
              aria-label="Open menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 12h15" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-white">{title}</h1>
          </div>

          {/* Desktop Header & Content */}
          <main className="flex-1 p-4 md:p-8 overflow-y-auto">
            <div className="max-w-6xl mx-auto">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <h1 className="hidden md:block text-3xl md:text-5xl font-bold text-white drop-shadow-2xl">
                  {title}
                </h1>
                {actions && (
                  <div className="w-full md:w-auto">
                    {actions}
                  </div>
                )}
              </div>
              
              {children}
            </div>
          </main>
        </div>
      </div>
    </AdminProtectedRoute>
  );
}
