import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Sales from "./pages/Sales";
import Repairs from "./pages/Repairs";
import Login from "./pages/Login";
import Settings from "./pages/Settings";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { ConfigProvider } from "./context/ConfigContext";
import { ToastProvider } from "./context/ToastContext";
import { SearchProvider } from "./context/SearchContext";

export default function App() {
  return (
    <ConfigProvider>
      <AuthProvider>
        <ToastProvider>
          <SearchProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<Login />} />
                
                <Route element={<ProtectedRoute />}>
                  <Route path="/" element={<Layout />}>
                    <Route element={<ProtectedRoute requiredPermission={{ module: 'Dashboard' }} />}>
                      <Route index element={<Dashboard />} />
                    </Route>
                    <Route element={<ProtectedRoute requiredPermission={{ module: 'Sales' }} />}>
                      <Route path="sales" element={<Sales />} />
                    </Route>
                    <Route element={<ProtectedRoute requiredPermission={{ module: 'Repair' }} />}>
                      <Route path="repairs" element={<Repairs />} />
                    </Route>
                    
                    {/* Admin only routes */}
                    <Route element={<ProtectedRoute allowedRoles={['Admin']} requiredPermission={{ module: 'Settings', minLevel: 'Full' }} />}>
                      <Route path="settings" element={<Settings />} />
                    </Route>
                  </Route>
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </SearchProvider>
        </ToastProvider>
      </AuthProvider>
    </ConfigProvider>
  );
}
