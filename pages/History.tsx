
import React, { useState } from 'react';
import { AttendanceRecord, AttendanceType } from '../types';

interface HistoryProps {
  records: AttendanceRecord[];
}

const History: React.FC<HistoryProps> = ({ records }) => {
  const [filter, setFilter] = useState('ALL');

  const filteredRecords = records.filter(r => {
    if (filter === 'ALL') return true;
    return r.type === filter;
  });

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Lịch sử chấm công</h2>
          <p className="text-slate-500 text-sm">Xem lại toàn bộ hoạt động ra vào của bạn.</p>
        </div>
        
        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          {['ALL', 'CHECK_IN', 'CHECK_OUT'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${
                filter === f ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              {f === 'ALL' ? 'Tất cả' : f === 'CHECK_IN' ? 'Vào ca' : 'Tan làm'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Ngày</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Loại</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Thời gian</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Vị trí</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Ghi chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length > 0 ? filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-slate-700">{formatDate(record.timestamp)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                      record.type === AttendanceType.CHECK_IN 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-rose-100 text-rose-700'
                    }`}>
                      {record.type === AttendanceType.CHECK_IN ? 'Vào ca' : 'Tan làm'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-mono text-slate-600">{formatTime(record.timestamp)}</span>
                  </td>
                  <td className="px-6 py-4">
                    {record.location ? (
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <i className="fas fa-map-marker-alt text-indigo-400"></i>
                        <span>{record.location.latitude.toFixed(3)}, {record.location.longitude.toFixed(3)}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-300 italic">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-slate-500 italic max-w-xs truncate block">
                      {record.note || '—'}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <i className="fas fa-inbox text-4xl mb-2 opacity-20"></i>
                      <p className="font-medium">Chưa có dữ liệu nào phù hợp.</p>
                      <p className="text-xs">Hãy thực hiện chấm công để ghi lại lịch sử của bạn.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default History;
