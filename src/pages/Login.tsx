import { useAuth } from '../context/AuthContext';
import { useConfig } from '../context/ConfigContext';
import { Navigate } from 'react-router-dom';
import { useState, FormEvent } from 'react';
import { getFirstAllowedRoute } from '../components/ProtectedRoute';

export default function Login() {
  const { user, login, loading } = useAuth();
  const { config } = useConfig();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-12 h-12 border-4 border-[#3B82F6]/20 border-t-[#3B82F6] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to={getFirstAllowedRoute(user)} replace />;
  }

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      await login(username, password);
    } catch (err: any) {
      setError(err.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex font-sans text-[#1A1A1A] bg-white overflow-hidden relative">
      {/* Background decoration elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-pink-200/30 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#E5F3FF] blur-[100px] pointer-events-none" />

      <div className="w-full h-screen flex overflow-hidden relative z-10">
        
        {/* Left Side: Login Form */}
        <div className="w-full lg:w-1/2 px-4 py-[88px] sm:px-6 sm:py-[104px] lg:px-[128px] flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-8 justify-center lg:justify-start">
            {config.sidebarLogoUrl ? (
              <img src={config.sidebarLogoUrl} alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#3B82F6"/>
                <path d="M2 17L12 22L22 17" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="#EC4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
            <span className="text-xl font-extrabold tracking-tight text-[#1A1A1A]">{config.sidebarName}</span>
          </div>

          <h1 className="text-[28px] sm:text-[32px] font-bold tracking-tight text-[#1A1A1A] mb-8 text-center lg:text-left">
            Welcome to {config.sidebarName}
          </h1>

          <form onSubmit={handleLogin} className="flex flex-col gap-6 w-full max-w-[400px] mx-auto lg:mx-0">
            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-4">
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-2 bg-[#1C2331] text-white rounded-xl text-[15px] font-bold hover:bg-[#111827] transition-colors shadow-md disabled:opacity-50"
            >
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>
        </div>

        {/* Right Side: Image */}
        <div className="hidden lg:flex lg:w-1/2 h-full">
          <div className="w-full h-full relative overflow-hidden flex flex-col justify-center items-center">
            {/* Background Image */}
            <div 
              className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 hover:scale-105"
              style={{ backgroundImage: `url(${config.loginImageUrl})` }}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
