
import React from 'react';
import { NavLink } from 'react-router-dom';

interface SidebarProps {
  status: 'ON' | 'OFF';
}

const Sidebar: React.FC<SidebarProps> = ({ status }) => {
  const links = [
    { to: '/', icon: 'fa-chart-line', label: 'Bảng điều khiển' },
    { to: '/checkin', icon: 'fa-clock', label: 'Chấm công' },
    { to: '/history', icon: 'fa-list', label: 'Lịch sử' },
    { to: '/employees', icon: 'fa-users', label: 'Nhân viên' },
    { to: '/settings', icon: 'fa-cog', label: 'Cài đặt' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
            <i className="fas fa-fingerprint text-white text-xl"></i>
          </div>
          <span className="font-bold text-xl text-slate-800 tracking-tight">SmartCheck</span>
        </div>

        <nav className="space-y-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-600 font-semibold'
                    : 'text-slate-500 hover:bg-slate-50'
                }`
              }
            >
              <i className={`fas ${link.icon} w-5`}></i>
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-6">
        <div className={`p-4 rounded-xl border ${status === 'ON' ? 'border-green-100 bg-green-50' : 'border-slate-100 bg-slate-50'}`}>
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-2 h-2 rounded-full ${status === 'ON' ? 'bg-green-500' : 'bg-slate-400'}`}></div>
            <span className={`text-xs font-bold uppercase ${status === 'ON' ? 'text-green-700' : 'text-slate-500'}`}>
              {status === 'ON' ? 'Đang làm việc' : 'Đã tan làm'}
            </span>
          </div>
          <p className="text-[10px] text-slate-400">Tự động kết thúc lúc 18:00</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
