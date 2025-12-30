
import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { AttendanceRecord, Employee, AttendanceType } from '../types';
import AIInsights from '../components/AIInsights';

interface DashboardProps {
  records: AttendanceRecord[];
  user: Employee;
}

const Dashboard: React.FC<DashboardProps> = ({ records, user }) => {
  const [showAI, setShowAI] = useState(false);

  const stats = useMemo(() => {
    const today = new Date().setHours(0,0,0,0);
    const todayRecords = records.filter(r => new Date(r.timestamp).setHours(0,0,0,0) === today);
    
    // Group by day for the chart
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    const chartData = last7Days.map(dateStr => {
      const dayRecords = records.filter(r => new Date(r.timestamp).toISOString().split('T')[0] === dateStr);
      const checkIn = dayRecords.find(r => r.type === AttendanceType.CHECK_IN);
      const checkOut = dayRecords.find(r => r.type === AttendanceType.CHECK_OUT);
      
      let hours = 0;
      if (checkIn && checkOut) {
        hours = (checkOut.timestamp - checkIn.timestamp) / (1000 * 60 * 60);
      } else if (checkIn) {
        // If still on, calculate up to now or 8 hours max for demo
        hours = Math.min(8, (Date.now() - checkIn.timestamp) / (1000 * 60 * 60));
      }

      return {
        date: new Date(dateStr).toLocaleDateString('vi-VN', { weekday: 'short' }),
        hours: parseFloat(hours.toFixed(1))
      };
    });

    return {
      todayPresent: todayRecords.length > 0 ? 1 : 0,
      weeklyHours: chartData.reduce((acc, cur) => acc + cur.hours, 0).toFixed(1),
      avgCheckIn: "08:15", // Mock
      chartData
    };
  }, [records]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Hôm nay" value={stats.todayPresent ? 'Đã điểm danh' : 'Chưa điểm danh'} icon="fa-calendar-check" color="bg-blue-500" />
        <StatCard title="Tổng giờ tuần này" value={`${stats.weeklyHours}h`} icon="fa-clock" color="bg-indigo-500" />
        <StatCard title="Giờ check-in TB" value={stats.avgCheckIn} icon="fa-sign-in-alt" color="bg-emerald-500" />
        <StatCard title="Nghỉ phép còn lại" value="12 ngày" icon="fa-umbrella-beach" color="bg-amber-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800">Hiệu suất làm việc (Giờ/Ngày)</h3>
            <select className="text-xs border-slate-200 rounded-lg bg-slate-50 text-slate-600 p-1">
              <option>7 ngày qua</option>
              <option>30 ngày qua</option>
            </select>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.chartData}>
                <defs>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ stroke: '#6366f1', strokeWidth: 2 }}
                />
                <Area type="monotone" dataKey="hours" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorHours)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800 text-sm">Phân tích AI</h3>
            <button 
              onClick={() => setShowAI(true)}
              className="px-3 py-1 bg-indigo-600 text-white text-xs rounded-full hover:bg-indigo-700 transition-colors flex items-center gap-1"
            >
              <i className="fas fa-magic"></i> Chạy phân tích
            </button>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-xs text-slate-500 mb-1">Dự đoán hôm nay</p>
              <p className="text-sm font-semibold text-slate-800">Bạn thường tan làm lúc 18:15. Hãy chuẩn bị hoàn thành công việc trước thời gian này.</p>
            </div>
            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
              <p className="text-xs text-indigo-500 mb-1">Mẹo năng suất</p>
              <p className="text-sm font-semibold text-indigo-800">Check-in sớm giúp bạn có thêm 20 phút tập trung cao độ vào buổi sáng.</p>
            </div>
          </div>
        </div>
      </div>

      {showAI && <AIInsights records={records} onClose={() => setShowAI(false)} />}
    </div>
  );
};

const StatCard = ({ title, value, icon, color }: any) => (
  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-3">
      <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center text-white`}>
        <i className={`fas ${icon}`}></i>
      </div>
      <span className="text-[10px] text-green-500 font-bold bg-green-50 px-2 py-0.5 rounded-full">+12%</span>
    </div>
    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{title}</p>
    <p className="text-xl font-bold text-slate-800">{value}</p>
  </div>
);

export default Dashboard;
