import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { useState } from 'react';

export default function Login() {
  const { user, login } = useAuth();
  const [role, setRole] = useState<'admin' | 'sales'>('admin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  if (user) {
    return <Navigate to={user.role === 'admin' ? '/' : '/sales'} replace />;
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login(role);
  };

  return (
    <div className="min-h-screen flex font-sans text-[#1A1A1A] bg-white overflow-hidden relative">
      {/* Background decoration elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-pink-200/30 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#E5F3FF] blur-[100px] pointer-events-none" />

      <div className="w-full h-screen flex overflow-hidden relative z-10">
        
        {/* Left Side: Login Form */}
        <div className="w-full lg:w-1/2 pr-[96px] pl-[96px] py-[88px] sm:pr-[128px] sm:pl-[128px] sm:py-[104px] flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-8 justify-center lg:justify-start">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#3B82F6"/>
              <path d="M2 17L12 22L22 17" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="#EC4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-xl font-extrabold tracking-tight">DeRoyal<span className="text-pink-500">Tech</span></span>
          </div>

          <h1 className="text-[28px] sm:text-[32px] font-bold tracking-tight text-[#1A1A1A] mb-8 text-center lg:text-left">
            Welcome to DeRoyalTech
          </h1>

          <form onSubmit={handleLogin} className="flex flex-col gap-6 w-full max-w-[400px] mx-auto lg:mx-0">
            {/* Segmented Control */}
            <div className="flex rounded-xl p-1 bg-[#F4F4F5] border border-[#E5E5E5]/50">
              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`flex-1 py-2.5 text-[14px] font-semibold rounded-lg transition-all ${
                  role === 'admin' 
                    ? 'bg-white text-[#1A1A1A] shadow-sm' 
                    : 'text-[#A1A1AA] hover:text-[#71717A]'
                }`}
              >
                Owner
              </button>
              <button
                type="button"
                onClick={() => setRole('sales')}
                className={`flex-1 py-2.5 text-[14px] font-semibold rounded-lg transition-all ${
                  role === 'sales' 
                    ? 'bg-white text-[#1A1A1A] shadow-sm' 
                    : 'text-[#A1A1AA] hover:text-[#71717A]'
                }`}
              >
                Sales Staff
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {/* Username Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-[#71717A]">Username</label>
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl border border-[#E5E5E5] text-[15px] focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-colors placeholder:text-[#D4D4D8]"
                  required
                />
              </div>

              {/* Password Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-[#71717A]">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-4 pr-12 py-3.5 rounded-xl border border-[#E5E5E5] text-[15px] focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-colors placeholder:text-[#D4D4D8]"
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A1A1AA] hover:text-[#71717A] p-1"
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="flex justify-end mt-[-8px]">
              <a href="#" className="text-[13px] font-semibold text-[#8B5CF6] hover:text-[#7C3AED]">
                Forgot your password?
              </a>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              className="w-full py-3.5 mt-2 bg-[#1C2331] text-white rounded-xl text-[15px] font-bold hover:bg-[#111827] transition-colors shadow-md"
            >
              Log in
            </button>
          </form>
        </div>

        {/* Right Side: Galaxy Image & Promo */}
        <div className="hidden lg:flex lg:w-1/2 h-full">
          <div className="w-full h-full relative overflow-hidden flex flex-col justify-start items-center text-center">
            {/* Galaxy Background */}
            <div 
              className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 hover:scale-105"
              style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2464&auto=format&fit=crop)' }}
            />
            {/* Overlay Gradient for readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#1C2331]/30 via-transparent to-[#1C2331]/90 z-0 pointer-events-none" />

            <div className="relative z-10 px-12 pt-16 mt-4 mix-blend-plus-lighter">
              <h2 className="text-[32px] font-bold text-white mb-4 drop-shadow-md">Smarter Workflow Starts Here</h2>
              <p className="text-white/90 leading-relaxed text-[15px] max-w-sm mx-auto drop-shadow-md pb-8">
                Monitor team performance, manage operations processes, and keep teams aligned with a centralized dashboard.
              </p>
              
              <div className="mt-8 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white shadow-xl text-[14px] font-medium">
                <span className="text-yellow-200">✨</span> Support Teams with Better Insights <span className="text-yellow-200">✨</span>
              </div>
            </div>
            
          </div>
        </div>

      </div>
    </div>
  );
}
