import { useState, useRef, ChangeEvent } from "react";
import { Navigate } from "react-router-dom";
import { 
  User, 
  Lock, 
  Users, 
  Bell, 
  CreditCard, 
  Database, 
  AlertTriangle,
  Pencil,
  ImagePlus,
  Save,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Loader2
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useConfig } from "../context/ConfigContext";
import { cn } from "../lib/utils";
import UserManagement from "../components/UserManagement";

export default function Settings() {
  const { user, updateUser } = useAuth();
  const { config, updateConfig, resetToDefault } = useConfig();
  const [activeTab, setActiveTab] = useState("users");
  
  if (user?.permissions?.Settings !== 'Full') {
    return <Navigate to="/" replace />;
  }

  // State for form edits
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{type: 'success' | 'error', message: string} | null>(null);

  // Local state for forms to avoid instant updates to context
  const [brandingForm, setBrandingForm] = useState(config);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const loginBgInputRef = useRef<HTMLInputElement>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveBranding = async () => {
    setIsSaving(true);
    try {
      await updateConfig(brandingForm);
      showToast('success', 'Branding updated successfully');
    } catch (error) {
      showToast('error', 'Failed to update branding');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>, field: 'sidebarLogoUrl' | 'loginImageUrl') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit for base64 in Firestore
        showToast('error', 'File too large. Max size 1MB for direct upload.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setBrandingForm(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const TABS = [
    ...(user?.role === 'Admin' ? [{ id: "users", label: "User Management" }] : []),
    ...(user?.role === 'Admin' ? [{ id: "branding", label: "App Branding" }] : []),
  ];

  return (
    <div className="max-w-7xl mx-auto w-full relative pb-[40px]">
      {/* Toast Notification */}
      {toast && (
        <div className={cn(
          "fixed top-8 right-8 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-xl border animate-in slide-in-from-right-10 fade-in duration-300",
          toast.type === 'success' ? "bg-white border-green-100 text-green-700" : "bg-white border-red-100 text-red-700"
        )}>
          {toast.type === 'success' ? <CheckCircle2 size={20} className="text-green-500" /> : <XCircle size={20} className="text-red-500" />}
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Horizontal Tabs */}
      <div className="mb-8 w-full flex flex-col sm:flex-row justify-between sm:items-center gap-4 sm:gap-0">
        <div className="flex bg-gray-100 p-1 rounded-xl w-full sm:w-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-6 py-2.5 text-sm font-semibold transition-all rounded-lg flex-1 sm:flex-none",
                activeTab === tab.id
                  ? "bg-white text-[#1A1A1A] shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button 
          onClick={() => handleSaveBranding()}
          disabled={isSaving || activeTab !== 'branding'}
          className={cn("bg-[#0561FC] hover:shadow-[0_0_15px_rgba(5,97,252,0.5)] text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm w-full sm:w-auto", (isSaving || activeTab !== 'branding') ? "opacity-50 cursor-not-allowed hover:shadow-none" : "")}
        >
          {isSaving && <Loader2 size={16} className="animate-spin" />}
          Save Changes
        </button>
      </div>

      <div className="flex-1 overflow-y-auto w-full max-w-4xl">
        {activeTab === "branding" && user?.role === 'Admin' && (
          <div className="space-y-12 pl-4">
            <div>
              <div className="mb-8">
                <h2 className="text-lg font-medium text-gray-900 mb-1">App Information</h2>
                <p className="text-gray-500 text-[14px]">Manage your app information here.</p>
              </div>

              <div className="space-y-8 max-w-2xl">
                <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] items-start gap-4">
                  <div className="text-sm font-medium text-gray-900 pt-2">
                    Company Logo
                    <span className="block text-gray-500 text-xs font-normal mt-0.5">Beside company name</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-4 mb-2">
                        {brandingForm.sidebarLogoUrl ? (
                          <img src={brandingForm.sidebarLogoUrl} alt="Logo" className="w-[60px] h-[60px] rounded-lg object-cover bg-gray-100 border border-gray-200" />
                        ) : (
                          <div className="w-[60px] h-[60px] rounded-lg bg-gray-200 border border-gray-200"></div>
                        )}
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        className="hidden" 
                        accept="image/*"
                        onChange={(e) => {
                          handleFileUpload(e, 'sidebarLogoUrl');
                        }}
                      />
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-md hover:bg-gray-50 bg-white shadow-sm text-gray-700"
                      >
                        Upload logo
                      </button>
                      <button 
                        onClick={() => {
                          setBrandingForm({...brandingForm, sidebarLogoUrl: ''});
                        }}
                        className="px-4 py-2 text-sm font-medium bg-red-50 text-red-600 rounded-md hover:bg-red-100"
                      >
                        Delete
                      </button>
                    </div>
                    <span className="text-[12px] text-gray-500">Jpeg, PNG or JPG. 1mb max</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] items-start gap-4">
                  <div className="text-sm font-medium text-gray-900 pt-2">
                    Login Image
                    <span className="block text-gray-500 text-xs font-normal mt-0.5">Choose an image for the login page</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-4 mb-2">
                        {brandingForm.loginImageUrl ? (
                          <img src={brandingForm.loginImageUrl} alt="Login Image" className="w-[60px] h-[60px] rounded-full object-cover bg-gray-100" />
                        ) : (
                          <div className="w-[60px] h-[60px] rounded-full bg-gray-200"></div>
                        )}
                      <input 
                        type="file" 
                        ref={loginBgInputRef}
                        className="hidden" 
                        accept="image/*"
                        onChange={(e) => {
                          handleFileUpload(e, 'loginImageUrl');
                        }}
                      />
                      <button 
                        onClick={() => loginBgInputRef.current?.click()}
                        className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-md hover:bg-gray-50 bg-white shadow-sm text-gray-700"
                      >
                        Upload new image
                      </button>
                      <button 
                        onClick={() => {
                          setBrandingForm({...brandingForm, loginImageUrl: ''});
                        }}
                        className="px-4 py-2 text-sm font-medium bg-red-50 text-red-600 rounded-md hover:bg-red-100"
                      >
                        Delete
                      </button>
                    </div>
                    <span className="text-[12px] text-gray-500">Jpeg, PNG or JPG. 1mb max</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] items-center gap-4">
                  <label className="text-sm font-medium text-gray-900">Company Name</label>
                  <input 
                    type="text" 
                    value={brandingForm.sidebarName || ''} 
                    onChange={(e) => setBrandingForm({...brandingForm, sidebarName: e.target.value})}
                    placeholder="Deroyal Tech"
                    className="w-full md:w-[300px] bg-white text-gray-900 px-3 py-2 rounded-md border border-gray-200 text-sm focus:outline-none focus:border-[#0561FC] focus:ring-1 focus:ring-[#0561FC]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "users" && user?.role === 'Admin' && (
          <div className="pl-4">
            <UserManagement />
          </div>
        )}

        {/* Placeholder for other tabs */}
        {!["branding", "users"].includes(activeTab) && (
          <div className="flex flex-col items-center justify-center p-12 text-center h-64">
            <h2 className="text-lg font-bold text-gray-900">Section: {TABS.find(t => t.id === activeTab)?.label}</h2>
            <p className="text-sm text-gray-500 mt-2">This section is currently under development.</p>
          </div>
        )}
      </div>
    </div>
  );
}
