import { useState, useRef, ChangeEvent } from "react";
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

export default function Settings() {
  const { user, updateUser } = useAuth();
  const { config, updateConfig, resetToDefault } = useConfig();
  const [activeTab, setActiveTab] = useState("profile");
  
  // State for form edits
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [isEditingBranding, setIsEditingBranding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{type: 'success' | 'error', message: string} | null>(null);

  // Local state for forms to avoid instant updates to context
  const [profileForm, setProfileForm] = useState(user || {});
  const [brandingForm, setBrandingForm] = useState(config);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const loginBgInputRef = useRef<HTMLInputElement>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await updateUser(profileForm);
      setIsEditingProfile(false);
      setIsEditingInfo(false);
      showToast('success', 'Profile updated successfully');
    } catch (error) {
      showToast('error', 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveBranding = async () => {
    setIsSaving(true);
    try {
      await updateConfig(brandingForm);
      setIsEditingBranding(false);
      showToast('success', 'Branding updated successfully');
    } catch (error) {
      showToast('error', 'Failed to update branding');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetBranding = async () => {
    if (confirm("Are you sure you want to reset branding to defaults?")) {
      setIsSaving(true);
      try {
        await resetToDefault();
        setBrandingForm(config); // Update local form too
        showToast('success', 'Branding reset to default');
      } catch (error) {
        showToast('error', 'Failed to reset branding');
      } finally {
        setIsSaving(false);
      }
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
    { id: "profile", label: "My Profile", icon: User },
    ...(user?.role === 'admin' ? [{ id: "branding", label: "App Branding", icon: ImagePlus }] : []),
    { id: "security", label: "Password & Security", icon: Lock },
    { id: "teams", label: "Teams", icon: Users },
    { id: "team-member", label: "Team Member", icon: Users },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "billing", label: "Billing", icon: CreditCard },
    { id: "data-export", label: "Data Export", icon: Database },
    { id: "delete", label: "Delete Account", icon: AlertTriangle, className: "text-[#EF4444]" },
  ];

  return (
    <div className="max-w-7xl mx-auto w-full relative">
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

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Account Settings</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 bg-white rounded-[24px] border border-[#E5E5E5] shadow-sm overflow-hidden p-6 lg:p-8">
        {/* Left Sidebar */}
        <div className="w-full lg:w-64 flex-shrink-0 lg:border-r border-[#E5E5E5] lg:pr-8">
          <nav className="flex flex-col space-y-1 text-left">
            {TABS.map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-medium transition-all duration-200",
                    activeTab === tab.id
                      ? "bg-[#EAF2FF] text-[#1A1A1A] shadow-sm"
                      : cn("text-[#71717A] hover:bg-gray-50", tab.className)
                  )}
                >
                  <TabIcon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Content */}
        <div className="flex-1 lg:pl-8 overflow-y-auto max-h-[80vh]">
          {activeTab === "profile" && (
            <div className="space-y-8">
              <h2 className="text-xl font-bold text-[#1A1A1A] mb-6">My Profile</h2>
              
              {/* Profile Card */}
              <div className="p-6 rounded-[24px] border border-[#E5E5E5] bg-white relative group hover:border-gray-300 transition-all">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <img 
                      src={profileForm.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=256&auto=format&fit=crop'} 
                      alt="Avatar" 
                      className="w-20 h-20 rounded-full object-cover border-2 border-white shadow-sm" 
                    />
                    {isEditingProfile && (
                       <label className="absolute bottom-0 right-0 p-1.5 bg-[#1A1A1A] text-white rounded-full shadow-lg cursor-pointer hover:bg-black transition-colors">
                          <ImagePlus size={14} />
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  const img = new Image();
                                  img.onload = () => {
                                    const canvas = document.createElement('canvas');
                                    const MAX_WIDTH = 400;
                                    const MAX_HEIGHT = 400;
                                    let width = img.width;
                                    let height = img.height;

                                    if (width > height) {
                                      if (width > MAX_WIDTH) {
                                        height *= MAX_WIDTH / width;
                                        width = MAX_WIDTH;
                                      }
                                    } else {
                                      if (height > MAX_HEIGHT) {
                                        width *= MAX_HEIGHT / height;
                                        height = MAX_HEIGHT;
                                      }
                                    }
                                    canvas.width = width;
                                    canvas.height = height;
                                    const ctx = canvas.getContext('2d');
                                    ctx?.drawImage(img, 0, 0, width, height);
                                    const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
                                    setProfileForm({ ...profileForm, avatarUrl: compressedDataUrl });
                                  };
                                  img.src = reader.result as string;
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                       </label>
                    )}
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-bold text-[#1A1A1A]">{user?.name}</h3>
                    <p className="text-[#71717A] text-sm">{user?.bio || 'No bio added'}</p>
                  </div>
                  <button 
                    disabled={isSaving}
                    onClick={() => isEditingProfile ? handleSaveProfile() : setIsEditingProfile(true)}
                    className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[#EAF2FF] text-[#1A1A1A] hover:bg-[#D9E6FF] transition-all disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : (isEditingProfile ? <Save size={16} /> : <Pencil size={16} />)}
                    {isEditingProfile ? "Save" : "Edit"}
                  </button>
                </div>
              </div>

              {/* Personal Information */}
              <div className="p-6 rounded-[24px] border border-[#E5E5E5] bg-white relative group hover:border-gray-300 transition-all text-left">
                <h3 className="text-lg font-bold text-[#1A1A1A] mb-8">Personal Information</h3>
                <button 
                   disabled={isSaving}
                  onClick={() => isEditingInfo ? handleSaveProfile() : setIsEditingInfo(true)}
                  className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[#EAF2FF] text-[#1A1A1A] hover:bg-[#D9E6FF] transition-all disabled:opacity-50"
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : (isEditingInfo ? <Save size={16} /> : <Pencil size={16} />)}
                  {isEditingInfo ? "Save" : "Edit"}
                </button>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-[#A1A1AA] uppercase tracking-wider">First Name</label>
                    {isEditingInfo ? (
                      <input 
                        type="text" 
                        value={profileForm.firstName || ''} 
                        onChange={(e) => setProfileForm({...profileForm, firstName: e.target.value})}
                        className="px-4 py-2 rounded-xl border border-[#E5E5E5] text-sm focus:outline-none focus:ring-2 focus:ring-[#EAF2FF]"
                      />
                    ) : (
                      <p className="text-[14px] font-semibold text-[#1A1A1A]">{user?.firstName || '—'}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-[#A1A1AA] uppercase tracking-wider">Last Name</label>
                   {isEditingInfo ? (
                      <input 
                        type="text" 
                        value={profileForm.lastName || ''} 
                        onChange={(e) => setProfileForm({...profileForm, lastName: e.target.value})}
                        className="px-4 py-2 rounded-xl border border-[#E5E5E5] text-sm focus:outline-none focus:ring-2 focus:ring-[#EAF2FF]"
                      />
                    ) : (
                      <p className="text-[14px] font-semibold text-[#1A1A1A]">{user?.lastName || '—'}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-[#A1A1AA] uppercase tracking-wider">Email Address</label>
                   {isEditingInfo ? (
                      <input 
                        type="email" 
                        value={profileForm.email || ''} 
                        onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                        className="px-4 py-2 rounded-xl border border-[#E5E5E5] text-sm focus:outline-none focus:ring-2 focus:ring-[#EAF2FF]"
                      />
                    ) : (
                      <p className="text-[14px] font-semibold text-[#1A1A1A]">{user?.email}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-[#A1A1AA] uppercase tracking-wider">Phone</label>
                   {isEditingInfo ? (
                      <input 
                        type="text" 
                        value={profileForm.phone || ''} 
                        onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                        className="px-4 py-2 rounded-xl border border-[#E5E5E5] text-sm focus:outline-none focus:ring-2 focus:ring-[#EAF2FF]"
                      />
                    ) : (
                      <p className="text-[14px] font-semibold text-[#1A1A1A]">{user?.phone || '—'}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="text-xs font-medium text-[#A1A1AA] uppercase tracking-wider">Bio</label>
                   {isEditingInfo ? (
                      <textarea 
                        value={profileForm.bio || ''} 
                        onChange={(e) => setProfileForm({...profileForm, bio: e.target.value})}
                        className="px-4 py-2 rounded-xl border border-[#E5E5E5] text-sm focus:outline-none focus:ring-2 focus:ring-[#EAF2FF] min-h-[80px]"
                      />
                    ) : (
                      <p className="text-[14px] font-semibold text-[#1A1A1A]">{user?.bio || '—'}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Removed Address Section */}
            </div>
          )}

          {activeTab === "branding" && user?.role === 'admin' && (
            <div className="space-y-8 text-left">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-[#1A1A1A]">App Branding</h2>
                <button 
                  onClick={handleResetBranding}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-[#71717A] hover:bg-gray-100 transition-all border border-[#E5E5E5]"
                >
                  <RotateCcw size={14} />
                  Reset to Default
                </button>
              </div>
              
              <div className="p-6 rounded-[24px] border border-[#E5E5E5] bg-white relative group hover:border-gray-300 transition-all">
                <h3 className="text-lg font-bold text-[#1A1A1A] mb-8">Sidebar & Identity</h3>
                <button 
                  disabled={isSaving}
                  onClick={() => isEditingBranding ? handleSaveBranding() : setIsEditingBranding(true)}
                  className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[#EAF2FF] text-[#1A1A1A] hover:bg-[#D9E6FF] transition-all disabled:opacity-50"
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : (isEditingBranding ? <Save size={16} /> : <Pencil size={16} />)}
                  {isEditingBranding ? "Save" : "Edit"}
                </button>
                
                <div className="grid grid-cols-1 gap-8">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-[#71717A] uppercase tracking-wider">Company Name</label>
                    {isEditingBranding ? (
                      <input 
                        type="text" 
                        value={brandingForm.sidebarName} 
                        onChange={(e) => setBrandingForm({...brandingForm, sidebarName: e.target.value})}
                        className="px-4 py-3 rounded-xl border border-[#E5E5E5] text-sm focus:outline-none focus:ring-2 focus:ring-[#EAF2FF] w-full max-w-md"
                      />
                    ) : (
                      <p className="text-[16px] font-bold text-[#1A1A1A]">{config.sidebarName}</p>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-[#71717A] uppercase tracking-wider">Logo Image</label>
                    {isEditingBranding ? (
                      <div className="flex flex-col gap-4">
                        <input 
                          type="text" 
                          value={brandingForm.sidebarLogoUrl} 
                          onChange={(e) => setBrandingForm({...brandingForm, sidebarLogoUrl: e.target.value})}
                          className="px-4 py-3 rounded-xl border border-[#E5E5E5] text-sm focus:outline-none focus:ring-2 focus:ring-[#EAF2FF] w-full"
                          placeholder="Paste image URL here"
                        />
                        <div className="flex items-center gap-4">
                          <input 
                            type="file" 
                            ref={fileInputRef}
                            className="hidden" 
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, 'sidebarLogoUrl')}
                          />
                          <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-50 border border-[#E5E5E5] text-sm font-semibold hover:bg-gray-100 transition-all"
                          >
                            <ImagePlus size={18} />
                            Upload Logo
                          </button>
                          <span className="text-xs text-[#A1A1AA]">Supports JPG, PNG, SVG (Max 1MB)</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4">
                        {config.sidebarLogoUrl ? (
                          <img src={config.sidebarLogoUrl} alt="Logo" className="w-12 h-12 rounded-xl object-cover border border-gray-100" />
                        ) : (
                          <div className="w-12 h-12 bg-[#F6A723] rounded-xl flex items-center justify-center">
                            <div className="w-6 h-6 border-2 border-white rounded-sm"></div>
                          </div>
                        )}
                        <span className="text-sm text-[#71717A] italic">Current Active Logo</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-[24px] border border-[#E5E5E5] bg-white relative group hover:border-gray-300 transition-all">
                <h3 className="text-lg font-bold text-[#1A1A1A] mb-8">Login Screen</h3>
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-[#71717A] uppercase tracking-wider">Main Hero Background</label>
                    {isEditingBranding ? (
                      <div className="flex flex-col gap-4">
                        <input 
                          type="text" 
                          value={brandingForm.loginImageUrl} 
                          onChange={(e) => setBrandingForm({...brandingForm, loginImageUrl: e.target.value})}
                          className="px-4 py-3 rounded-xl border border-[#E5E5E5] text-sm focus:outline-none focus:ring-2 focus:ring-[#EAF2FF] w-full"
                          placeholder="Paste background URL here"
                        />
                        <div className="flex items-center gap-4">
                          <input 
                            type="file" 
                            ref={loginBgInputRef}
                            className="hidden" 
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, 'loginImageUrl')}
                          />
                          <button 
                            onClick={() => loginBgInputRef.current?.click()}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-50 border border-[#E5E5E5] text-sm font-semibold hover:bg-gray-100 transition-all"
                          >
                            <ImagePlus size={18} />
                            Upload Hero Image
                          </button>
                           <span className="text-xs text-[#A1A1AA]">Supports JPG, PNG, WEBP (Max 1MB)</span>
                        </div>
                      </div>
                    ) : (
                      <div className="relative w-full h-48 rounded-2xl overflow-hidden border border-gray-100 group-hover:shadow-md transition-all">
                        <img 
                          src={config.loginImageUrl} 
                          alt="Login Background" 
                          className="w-full h-full object-cover" 
                        />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                           <span className="text-white text-xs font-bold uppercase tracking-widest bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm">Preview</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Placeholder for other tabs */}
          {!["profile", "branding"].includes(activeTab) && (
            <div className="flex flex-col items-center justify-center p-12 text-center h-full">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300 border border-gray-100 shadow-inner">
                 {(() => {
                   const TabIcon = TABS.find(t => t.id === activeTab)?.icon || AlertTriangle;
                   return <TabIcon size={32} />;
                 })()}
              </div>
              <h2 className="text-lg font-bold text-[#1A1A1A]">Section: {TABS.find(t => t.id === activeTab)?.label}</h2>
              <p className="text-sm text-[#71717A] mt-2">This section is currently under development.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
