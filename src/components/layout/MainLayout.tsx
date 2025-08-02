import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

type Page = 'dashboard' | 'companies' | 'contacts' | 'deals' | 'projects' | 'time-tracking' | 'invoices' | 'settings';

interface MainLayoutProps {
  children: React.ReactNode;
  currentPage: Page;
  onPageChange: (page: Page) => void;
  onAddCompany?: () => void;
  onExportData?: () => void;
}

const MainLayout = ({ children, currentPage, onPageChange, onAddCompany, onExportData }: MainLayoutProps) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar 
        isCollapsed={sidebarCollapsed} 
        onToggleCollapse={toggleSidebar}
        currentPage={currentPage}
        onPageChange={onPageChange}
      />

      {/* Header */}
      <Header sidebarCollapsed={sidebarCollapsed} onAddCompany={onAddCompany} onExportData={onExportData} />

      {/* Main Content */}
      <main 
        className={`
          pt-16 transition-all duration-300
          ${sidebarCollapsed ? 'ml-18' : 'ml-64'}
        `}
      >
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default MainLayout;