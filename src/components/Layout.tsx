import { Outlet, NavLink } from "react-router-dom";
import { Layout01Icon, ShoppingCart01Icon, Wrench01Icon, BarChartIcon, Notification01Icon, AiSearch02Icon, Logout01Icon, Settings01Icon, HelpCircleIcon, Moon02Icon } from "@hugeicons/core-free-icons";
import { HugeIcon } from "./HugeIcon";
import { cn } from "../lib/utils";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const { user, logout } = useAuth();

  const MAIN_MENU = [
    ...(user?.role === 'admin' ? [{ label: "Dashboard", path: "/", icon: Layout01Icon }] : []),
    { label: "Sales", path: "/sales", icon: ShoppingCart01Icon },
    { label: "Repairs", path: "/repairs", icon: Wrench01Icon },
  ];

  const TOOLS = [
    ...(user?.role === 'admin' ? [{ label: "Reports", path: "/reports", icon: BarChartIcon }] : []),
  ];

  const OTHERS = [
    ...(user?.role === 'admin' ? [{ label: "Settings", path: "/settings", icon: Settings01Icon }] : []),
    { label: "Help Center", path: "/help", icon: HelpCircleIcon },
  ];

  return (
    <div className="flex bg-[#F5F7FA] min-h-screen text-[#1A1A1A] font-sans">
      {/* Sidebar */}
      <aside className="w-[260px] bg-white border-r border-[#E5E5E5] flex flex-col">
        <div className="h-20 flex px-6 items-center border-b border-[#E5E5E5] gap-3">
          <div className="w-8 h-8 bg-[#F6A723] rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-white rounded-sm"></div>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[#1A1A1A]">RepairTech</h1>
        </div>
        
        <nav className="flex-1 overflow-y-auto px-4 py-8 space-y-8">
          {/* Main Menu */}
          <div>
            <p className="text-[11px] font-semibold text-[#A1A1AA] uppercase tracking-wider mb-3 px-4">Main Menu</p>
            <div className="space-y-1">
              {MAIN_MENU.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-4 py-3 rounded-2xl text-[14px] font-medium transition-all duration-200",
                      isActive
                        ? "bg-[#FFF9EA] text-[#D97706] shadow-sm ring-1 ring-[#FDE6B0]"
                        : "text-[#71717A] hover:bg-[#F5F7FA] hover:text-[#1A1A1A]"
                    )
                  }
                >
                  <HugeIcon icon={item.icon} className="w-[18px] h-[18px]" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>

          {/* Tools */}
          {TOOLS.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-[#A1A1AA] uppercase tracking-wider mb-3 px-4">Tools</p>
              <div className="space-y-1">
                {TOOLS.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 px-4 py-3 rounded-2xl text-[14px] font-medium transition-all duration-200",
                        isActive
                          ? "bg-[#FFF9EA] text-[#D97706] shadow-sm ring-1 ring-[#FDE6B0]"
                          : "text-[#71717A] hover:bg-[#F5F7FA] hover:text-[#1A1A1A]"
                      )
                    }
                  >
                    <HugeIcon icon={item.icon} className="w-[18px] h-[18px]" />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          )}

          {/* Others */}
          <div>
            <p className="text-[11px] font-semibold text-[#A1A1AA] uppercase tracking-wider mb-3 px-4">Others</p>
            <div className="space-y-1">
              {OTHERS.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-4 py-3 rounded-2xl text-[14px] font-medium transition-all duration-200",
                      isActive
                        ? "bg-[#FFF9EA] text-[#D97706] shadow-sm ring-1 ring-[#FDE6B0]"
                        : "text-[#71717A] hover:bg-[#F5F7FA] hover:text-[#1A1A1A]"
                    )
                  }
                >
                  <HugeIcon icon={item.icon} className="w-[18px] h-[18px]" />
                  {item.label}
                </NavLink>
              ))}
              
              {/* Dark Mode toggle - just visual for now */}
              <div className="flex items-center justify-between px-4 py-3 rounded-2xl text-[14px] font-medium text-[#71717A] cursor-pointer hover:bg-[#F5F7FA] hover:text-[#1A1A1A] transition-all duration-200">
                <div className="flex items-center gap-3">
                  <HugeIcon icon={Moon02Icon} className="w-[18px] h-[18px]" />
                  Dark Mode
                </div>
                <div className="w-8 h-4 bg-[#E5E5E5] rounded-full flex items-center p-0.5">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </nav>
        
        <div className="p-6 border-t border-[#E5E5E5]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#E5E5E5] flex items-center justify-center text-xs font-bold text-[#1A1A1A]">
                {user?.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <div className="text-[14px] font-semibold text-[#1A1A1A] leading-tight">{user?.name}</div>
                <div className="text-[12px] text-[#71717A] capitalize mt-0.5">{user?.role} {user?.role === 'admin' ? 'Manager' : 'Staff'}</div>
              </div>
            </div>
            <button 
              onClick={logout}
              className="p-2 text-[#71717A] hover:text-[#EF4444] hover:bg-[#FEF2F2] rounded-xl transition-all duration-200"
              title="Log out"
            >
              <HugeIcon icon={Logout01Icon} className="w-[18px] h-[18px]" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#F5F7FA]">
        {/* Header Bar */}
        <header className="h-20 bg-white border-b border-[#E5E5E5] flex items-center justify-between px-8 flex-shrink-0">
          {/* Header left - Page Context could go here or search */}
          <div className="flex items-center gap-2 bg-[#F5F5F5] px-4 py-2 rounded-lg w-[300px]">
            <HugeIcon icon={AiSearch02Icon} className="w-4 h-4 text-[#71717A]" />
            <input 
              type="text" 
              placeholder="Search repairs, customers, invoices..." 
              className="bg-transparent border-none outline-none text-sm font-medium text-[#1A1A1A] w-full placeholder:text-[#A1A1AA]"
            />
          </div>

          {/* Header right - Notifications and Profile */}
          <div className="flex items-center gap-6">
            <button className="text-[#71717A] hover:text-[#1A1A1A] transition-colors relative">
              <HugeIcon icon={Notification01Icon} className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-[#F97D7D] rounded-full"></span>
            </button>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto px-8 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
