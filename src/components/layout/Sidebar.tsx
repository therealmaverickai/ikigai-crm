type Page = 'dashboard' | 'companies' | 'contacts' | 'deals' | 'projects' | 'time-tracking' | 'invoices' | 'settings';

interface SidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  currentPage: Page;
  onPageChange: (page: Page) => void;
}

const Sidebar = ({ isCollapsed = false, onToggleCollapse, currentPage, onPageChange }: SidebarProps) => {
  const navigationItems = [
    { icon: '📊', label: 'Dashboard', page: 'dashboard' as Page },
    { icon: '🏢', label: 'Companies', page: 'companies' as Page },
    { icon: '👥', label: 'Contacts', page: 'contacts' as Page },
    { icon: '💼', label: 'Deals', page: 'deals' as Page },
    { icon: '📋', label: 'Projects', page: 'projects' as Page },
    { icon: '⏱️', label: 'Time Tracking', page: 'time-tracking' as Page },
    { icon: '🧾', label: 'Invoices', page: 'invoices' as Page },
    { icon: '⚙️', label: 'Settings', page: 'settings' as Page },
  ];

  return (
    <aside 
      className={`
        fixed left-0 top-0 h-full bg-white border-r border-gray-200 transition-all duration-300 z-40
        ${isCollapsed ? 'w-18' : 'w-64'}
      `}
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-600 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-sm">I</span>
            </div>
            <span className="font-semibold text-gray-800 text-lg">Ikigai</span>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-md hover:bg-gray-100 transition-colors"
        >
          <span className="text-gray-500">
            {isCollapsed ? '→' : '←'}
          </span>
        </button>
      </div>

      {/* Navigation */}
      <nav className="mt-6">
        <ul className="space-y-1 px-4">
          {navigationItems.map((item) => (
            <li key={item.page}>
              <button
                onClick={() => onPageChange(item.page)}
                className={`
                  w-full flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium transition-colors
                  ${currentPage === item.page
                    ? 'bg-primary-600 text-white' 
                    : 'text-gray-600 hover:bg-primary-50 hover:text-primary-600'
                  }
                  ${isCollapsed ? 'justify-center' : ''}
                `}
              >
                <span className="text-lg">{item.icon}</span>
                {!isCollapsed && <span>{item.label}</span>}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Profile */}
      {!isCollapsed && (
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
              <span className="text-white font-medium">JD</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">
                John Doe
              </p>
              <p className="text-xs text-gray-500 truncate">
                john@company.com
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;