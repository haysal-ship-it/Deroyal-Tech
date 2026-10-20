import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, ShoppingCart, Wrench, Bell, Search, LogOut, Settings, X, Menu, CheckCircle2, ChevronRight, ArrowLeft } from "lucide-react";
import { cn } from "../lib/utils";
import { useAuth } from "../context/AuthContext";
import { useConfig } from "../context/ConfigContext";
import { useSearch } from "../context/SearchContext";
import { useState, useEffect, useRef } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import ChangePasswordModal from "./ChangePasswordModal";

export default function Layout() {
  const { user, logout } = useAuth();
  const { config } = useConfig();
  const { searchQuery, setSearchQuery, clearSearch } = useSearch();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [uncollectedRepairs, setUncollectedRepairs] = useState<any[]>([]);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Clear search on route change
  useEffect(() => {
    clearSearch();
    setIsNotificationsOpen(false);
    setIsMobileSearchOpen(false);
  }, [location.pathname]);

  // Close sidebar on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close notifications on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch real notifications: repairs Completed but not Collected
  useEffect(() => {
    if (!user || user.permissions?.Repair === 'None') return;
    try {
      const q = query(collection(db, "repairs"), where("status", "==", "Completed"));
      const unsub = onSnapshot(q, (snap) => {
        setUncollectedRepairs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }, (err) => {
        if (err.code !== 'permission-denied') {
          console.error("Notifications listener error:", err);
        }
      });
      return unsub;
    } catch (e) {
      console.error(e);
    }
  }, [user]);

  const MAIN_MENU = [
    ...(user?.permissions?.Dashboard !== 'None' ? [{ label: "Dashboard", path: "/", icon: LayoutDashboard }] : []),
    ...(user?.permissions?.Sales !== 'None' ? [{ label: "Sales", path: "/sales", icon: ShoppingCart }] : []),
    ...(user?.permissions?.Repair !== 'None' ? [{ label: "Repairs", path: "/repairs", icon: Wrench }] : []),
  ];

  const OTHERS = [
    ...(user?.role === 'Admin' && user?.permissions?.Settings === 'Full' ? [{ label: "Settings", path: "/settings", icon: Settings }] : []),
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

  const isRepairsPage = location.pathname === "/repairs";
  const isSalesPage = location.pathname === "/sales";
  const showSearch = isRepairsPage || isSalesPage;
  const searchPlaceholder = isRepairsPage ? "Search repairs..." : "Search invoices...";

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
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3 px-4">Main Menu</p>
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
          {OTHERS.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3 px-4">Others</p>
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
          )}
        </nav>
        
        <div className="p-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                  {user?.name?.split(' ').map((n: string) => n[0]).join('') || '?'}
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
          {/* If mobile search is open, show full-width search bar */}
          {isMobileSearchOpen && showSearch ? (
            <div className="flex items-center gap-2 w-full animate-in fade-in duration-200">
              <button 
                type="button"
                onClick={() => { setIsMobileSearchOpen(false); clearSearch(); }}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors shrink-0"
                aria-label="Close search"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="flex-1 flex items-center gap-2 bg-gray-50 px-3.5 py-2 rounded-xl border border-gray-200 focus-within:border-[#0561FC] focus-within:bg-white transition-all">
                <Search className="w-4 h-4 text-gray-500 shrink-0" />
                <input 
                  type="text" 
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchPlaceholder} 
                  className="bg-transparent border-none outline-none text-sm font-medium text-gray-900 w-full placeholder:text-gray-500 min-h-[28px]"
                />
                {searchQuery && (
                  <button 
                    type="button"
                    onClick={clearSearch} 
                    className="min-w-[36px] min-h-[36px] flex items-center justify-center text-gray-500 hover:text-gray-700"
                    aria-label="Clear search input"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Header left */}
              <div className="flex items-center gap-3 sm:gap-4">
                <button 
                  className="lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-white bg-[#0561FC] shadow-sm hover:bg-blue-700 active:scale-95 transition-all"
                  onClick={() => setIsSidebarOpen(true)}
                  aria-label="Open sidebar menu"
                >
                  <Menu size={20} />
                </button>

                {showSearch ? (
                  <div className="hidden sm:flex items-center gap-2 bg-gray-50 px-4 py-2.5 rounded-xl w-[260px] md:w-[320px] border border-gray-200 focus-within:border-[#0561FC] focus-within:bg-white transition-all">
                    <Search className="w-4 h-4 text-gray-500 shrink-0" />
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={searchPlaceholder} 
                      className="bg-transparent border-none outline-none text-sm font-medium text-gray-900 w-full placeholder:text-gray-500"
                    />
                    {searchQuery && (
                      <button 
                        type="button"
                        onClick={clearSearch} 
                        className="p-1 text-gray-400 hover:text-gray-600 rounded-md"
                        aria-label="Clear search"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="hidden sm:block text-sm font-semibold text-gray-700">
                    DeRoyal Tech POS & Repair System
                  </div>
                )}
                
                {/* On mobile when search is available, show title */}
                <div className="sm:hidden font-bold text-gray-900 text-sm truncate max-w-[150px]">
                  {config.sidebarName || 'DeRoyal Tech'}
                </div>
              </div>

              {/* Header right - Notifications, Mobile Search Trigger, and Profile */}
              <div className="flex items-center gap-2 sm:gap-4 relative" ref={notifRef}>
                {/* Mobile search trigger */}
                {showSearch && (
                  <button
                    type="button"
                    onClick={() => setIsMobileSearchOpen(true)}
                    className="sm:hidden min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-700 hover:text-gray-900 hover:bg-gray-100 bg-gray-50 rounded-xl border border-gray-200 transition-colors"
                    aria-label="Open search bar"
                    title="Search"
                  >
                    <Search className="w-5 h-5" />
                  </button>
                )}

                <button 
                  type="button"
                  onClick={() => setIsNotificationsOpen(prev => !prev)}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors relative bg-gray-50 rounded-xl border border-gray-200"
                  title="Notifications"
                  aria-label="View notifications"
                >
                  <Bell className="w-5 h-5" />
                  {uncollectedRepairs.length > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-4 h-4 px-1 bg-red-600 text-white text-xs font-bold rounded-full border-2 border-white">
                      {uncollectedRepairs.length}
                    </span>
                  )}
                </button>

            {/* Notification Dropdown Panel */}
            {isNotificationsOpen && (
              <div className="absolute right-0 top-12 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-200 py-3 z-50 animate-in fade-in zoom-in-95">
                <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                      {uncollectedRepairs.length} Ready for pickup
                    </span>
                  </div>
                  <button onClick={() => setIsNotificationsOpen(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
                  {uncollectedRepairs.length === 0 ? (
                    <div className="p-6 text-center text-sm text-gray-500">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                      All completed repair jobs have been collected!
                    </div>
                  ) : (
                    uncollectedRepairs.map((job) => (
                      <div 
                        key={job.id} 
                        onClick={() => {
                          setIsNotificationsOpen(false);
                          navigate("/repairs");
                        }}
                        className="p-3 hover:bg-gray-50 transition-colors cursor-pointer flex items-start gap-3"
                      >
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0 mt-0.5">
                          <Wrench className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-900">
                            {job.id} - Ready for Collection
                          </p>
                          <p className="text-xs text-gray-600 truncate">
                            {job.device} for {job.customer} ({job.phone})
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">Status: Completed</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 shrink-0 self-center" />
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
            </>
          )}
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto px-4 pt-6 pb-16 sm:px-8 sm:pt-8 w-full">
          <Outlet />
        </main>
      </div>

      {/* Forced Password Change Modal */}
      <ChangePasswordModal />
    </div>
  );
}
