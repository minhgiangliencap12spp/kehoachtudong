
import React, { useState } from 'react';
import { School, Lock, User, LogIn, AlertCircle, Sparkles } from 'lucide-react';

interface LoginPageProps {
  onLogin: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Mock auth logic as requested
    setTimeout(() => {
      if (username === 'minhgiangdinh' && password === '13579') {
        onLogin();
      } else {
        setError('Tên đăng nhập hoặc mật khẩu không chính xác.');
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-indigo-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl border border-indigo-100 overflow-hidden relative">
          {/* Top Decorative bar */}
          <div className="h-2 bg-gradient-to-r from-orange-500 via-pink-500 to-indigo-600"></div>
          
          <div className="p-8 md:p-10">
            <div className="flex flex-col items-center mb-8">
              <div className="bg-indigo-600 p-4 rounded-2xl shadow-xl shadow-indigo-200 mb-4 animate-bounce-slow">
                <School className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-black text-indigo-900 tracking-tight text-center">
                TeacherScheduler <span className="text-indigo-500">AI</span>
              </h1>
              <p className="text-slate-500 text-sm mt-2 font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" /> Trợ lý số cho giáo viên hiện đại
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                  Tên đăng nhập
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-medium text-slate-700"
                    placeholder="Nhập tài khoản..."
                    required
                  />
                  <User className="absolute left-4 top-3.5 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                  Mật khẩu
                </label>
                <div className="relative group">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-medium text-slate-700"
                    placeholder="Nhập mật khẩu..."
                    required
                  />
                  <Lock className="absolute left-4 top-3.5 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold animate-in fade-in slide-in-from-top-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2 group active:scale-[0.98] disabled:opacity-70"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    ĐĂNG NHẬP NGAY
                    <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                TeacherScheduler AI &copy; 2025
              </p>
            </div>
          </div>
        </div>
        
        {/* Helper Hint - Remove in production if needed */}
        <div className="mt-6 p-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/50 text-center">
            <p className="text-xs text-indigo-400 font-medium">Tài khoản mẫu: <span className="font-black text-indigo-600">minhgiangdinh</span> / MK: <span className="font-black text-indigo-600">13579</span></p>
        </div>
      </div>

      <style>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
