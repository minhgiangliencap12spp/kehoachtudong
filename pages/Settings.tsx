
import React from 'react';

const Settings: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Cài đặt</h2>
        <p className="text-slate-500 text-sm">Quản lý cấu hình tài khoản và ứng dụng.</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 mb-4">Thông tin cá nhân</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Họ và tên</label>
              <input type="text" defaultValue="Nguyễn Văn A" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email công ty</label>
              <input type="email" defaultValue="a.nguyen@smartcheck.com" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            </div>
          </div>
        </div>

        <div className="p-6 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 mb-4">Cấu hình hệ thống</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                  <i className="fas fa-bell"></i>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Thông báo đẩy</p>
                  <p className="text-xs text-slate-500">Nhận thông báo khi đến giờ check-in/out.</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                  <i className="fas fa-map-marked-alt"></i>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Xác thực vị trí</p>
                  <p className="text-xs text-slate-500">Tự động lấy vị trí khi thực hiện chấm công.</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50/50 flex justify-end gap-3">
          <button className="px-6 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-500 hover:bg-white transition-colors">Hủy</button>
          <button className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">Lưu thay đổi</button>
        </div>
      </div>

      <div className="bg-rose-50 p-6 rounded-3xl border border-rose-100">
        <h3 className="font-bold text-rose-800 mb-1">Vùng nguy hiểm</h3>
        <p className="text-xs text-rose-600 mb-4">Các hành động này không thể hoàn tác. Hãy cẩn trọng.</p>
        <button className="px-6 py-2 border border-rose-200 text-rose-600 rounded-xl text-sm font-bold hover:bg-white transition-colors">Xóa toàn bộ lịch sử</button>
      </div>
    </div>
  );
};

export default Settings;
