import { Outlet, NavLink } from "react-router-dom";
import { LayoutDashboard, ShoppingCart, Wrench, Bell, Search, LogOut, Settings, HelpCircle } from "lucide-react";
import { cn } from "../lib/utils";
import { useAuth } from "../context/AuthContext";
import { useConfig } from "../context/ConfigContext";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

export default function Layout() {
  const { user, logout } = useAuth();
  const { config } = useConfig();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Close sidebar when window is resized to larger breakpoint
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const MAIN_MENU = [
    ...(user?.permissions?.Dashboard !== 'None' ? [{ label: "Dashboard", path: "/", icon: LayoutDashboard }] : []),
    ...(user?.permissions?.Sales !== 'None' ? [{ label: "Sales", path: "/sales", icon: ShoppingCart }] : []),
    ...(user?.permissions?.Repair !== 'None' ? [{ label: "Repairs", path: "/repairs", icon: Wrench }] : []),
  ];

  const OTHERS = [
    ...(user?.permissions?.Settings === 'Full' ? [{ label: "Settings", path: "/settings", icon: Settings }] : []),
  ];

  const getFormattedName = () => {
    if (!user) return '';
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName.charAt(0)}.`;
    }
    if (user.name) {
      const parts = (user.name || '').trim().split(' ');
      if (parts.length > 1) {
        return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
      }
      return user.name;
    }
    return '';
  };

  return (
    <div className="fixed inset-0 flex bg-[#F9FAFB] w-full overflow-hidden text-gray-900 font-sans">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-[260px] bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-20 flex px-6 items-center border-b border-gray-200 gap-3 justify-between">
          <div className="flex flex-row items-center gap-3">
            {config.sidebarLogoUrl ? (
              <img src={config.sidebarLogoUrl} alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
            ) : (
              <div className="w-8 h-8 bg-[#F6A723] rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white rounded-sm"></div>
              </div>
            )}
            <h1 className="text-xl font-display font-bold tracking-tight text-gray-900">{config.sidebarName}</h1>
          </div>
          <button 
            className="lg:hidden p-2 -mr-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>
        
        <nav className="flex-1 overflow-y-auto px-4 py-8 space-y-8">
          {/* Main Menu */}
          <div>
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-3 px-4">Main Menu</p>
            <div className="space-y-1">
              {MAIN_MENU.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-4 py-3 rounded-2xl text-[14px] font-medium transition-all duration-200",
                      isActive
                        ? "bg-[#0561FC] text-white shadow-sm ring-1 ring-[#0561FC] shadow-[0_0_15px_rgba(5,97,252,0.3)]"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )
                  }
                >
                  <item.icon className="w-[18px] h-[18px]" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>

          {/* Others */}
          <div>
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-3 px-4">Others</p>
            <div className="space-y-1">
              {OTHERS.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-4 py-3 rounded-2xl text-[14px] font-medium transition-all duration-200",
                      isActive
                        ? "bg-[#0561FC] text-white shadow-sm ring-1 ring-[#0561FC] shadow-[0_0_15px_rgba(5,97,252,0.3)]"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )
                  }
                >
                  <item.icon className="w-[18px] h-[18px]" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        </nav>
        
        <div className="p-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                  {user?.name?.split(' ').map(n => n[0]).join('') || '?'}
                </div>
              )}
              <div>
                <div className="text-[14px] font-semibold text-gray-900 leading-tight">{getFormattedName()}</div>
                <div className="text-[12px] text-gray-500 capitalize mt-0.5">{user?.role} {user?.role === 'Admin' ? 'Manager' : 'Staff'}</div>
              </div>
            </div>
            <button 
              onClick={logout}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200"
              title="Log out"
            >
              <LogOut className="w-[18px] h-[18px]" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#F9FAFB]">
        {/* Header Bar */}
        <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-8 flex-shrink-0">
          {/* Header left */}
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 rounded-lg text-white bg-[#0561FC]"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <div className="hidden sm:flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg w-[200px] md:w-[300px] border border-gray-200">
              <Search className="w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search repairs..." 
                className="bg-transparent border-none outline-none text-sm font-medium text-gray-900 w-full placeholder:text-gray-500"
              />
            </div>
          </div>

          {/* Header right - Notifications and Profile */}
          <div className="flex items-center gap-4 sm:gap-6">
            <button className="sm:hidden text-gray-500 hover:text-gray-900 transition-colors relative">
               <Search className="w-5 h-5" />
            </button>
            <button className="text-gray-500 hover:text-gray-900 transition-colors relative bg-gray-50 p-2 rounded-full border border-gray-200">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8 w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
