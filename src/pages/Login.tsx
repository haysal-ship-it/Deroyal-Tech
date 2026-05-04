import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

export default function Login() {
  const { user, login } = useAuth();

  if (user) {
    return <Navigate to={user.role === 'admin' ? '/' : '/sales'} replace />;
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-4 font-sans text-[#1A1A1A]">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-[#E5E5E5] w-full max-w-sm flex flex-col gap-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-12 h-12 bg-[#1A1A1A] rounded-xl flex items-center justify-center shadow-sm">
            <div className="w-6 h-6 border-2 border-white rounded-sm"></div>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#1A1A1A]">FixFlow Pro</h1>
            <p className="text-[#71717A] text-sm mt-1">Please select your role to continue</p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => login('admin')}
            className="w-full py-2.5 bg-[#1A1A1A] text-white rounded-lg text-sm font-medium hover:bg-black transition-colors"
          >
            Login as Admin (Owner)
          </button>
          <button
            onClick={() => login('sales')}
            className="w-full py-2.5 bg-white border border-[#E5E5E5] text-[#1A1A1A] rounded-lg text-sm font-medium hover:bg-[#FAFAFA] transition-colors"
          >
            Login as Sales Staff
          </button>
        </div>
      </div>
    </div>
  );
}
