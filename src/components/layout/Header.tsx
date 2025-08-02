interface HeaderProps {
  sidebarCollapsed?: boolean;
  onAddCompany?: () => void;
  onExportData?: () => void;
}

const Header = ({ sidebarCollapsed = false, onAddCompany, onExportData }: HeaderProps) => {
  return (
    <header 
      className={`
        fixed top-0 right-0 h-16 bg-white border-b border-gray-200 z-30 transition-all duration-300
        ${sidebarCollapsed ? 'left-18' : 'left-64'}
      `}
    >
      <div className="h-full flex items-center justify-between px-6">
        {/* Search */}
        <div className="flex-1 max-w-lg">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400">🔍</span>
            </div>
            <input
              type="text"
              placeholder="Search your Ikigai CRM..."
              className="
                block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-md
                leading-5 bg-gray-50 placeholder-gray-400 text-gray-900
                focus:outline-none focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20
                transition-colors
              "
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-4">
          {/* Export Data */}
          <button 
            onClick={onExportData}
            className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Export Data Backup"
          >
            <span className="text-xl">📁</span>
          </button>

          {/* Notifications */}
          <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <span className="text-xl">🔔</span>
            <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500"></span>
          </button>

          {/* Quick Actions */}
          <div className="flex space-x-2">
            <button 
              onClick={onAddCompany}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 transition-colors"
            >
              + Company
            </button>
            <button className="px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-md hover:bg-primary-100 transition-colors">
              + Contact
            </button>
            <button className="px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-md hover:bg-primary-100 transition-colors">
              + Deal
            </button>
          </div>

          {/* Profile Dropdown */}
          <div className="relative">
            <button className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-50 transition-colors">
              <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">JD</span>
              </div>
              <span className="text-gray-400">▼</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;