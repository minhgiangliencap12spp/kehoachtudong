
import React, { useState, useEffect } from 'react';
import { analyzeAttendance } from '../services/geminiService';
import { AttendanceRecord } from '../types';

interface AIInsightsProps {
  records: AttendanceRecord[];
  onClose: () => void;
}

const AIInsights: React.FC<AIInsightsProps> = ({ records, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [insight, setInsight] = useState('');

  useEffect(() => {
    const fetchInsight = async () => {
      if (records.length === 0) {
        setInsight("Chưa có đủ dữ liệu để phân tích. Hãy chấm công thường xuyên hơn nhé! 🚀");
        setLoading(false);
        return;
      }
      const result = await analyzeAttendance(records);
      setInsight(result);
      setLoading(false);
    };
    fetchInsight();
  }, [records]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 bg-indigo-600 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <i className="fas fa-brain"></i>
            </div>
            <div>
              <h3 className="font-bold text-lg">SmartCheck AI Insights</h3>
              <p className="text-indigo-100 text-xs">Phân tích chuyên sâu dựa trên thói quen của bạn</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="p-8 overflow-y-auto bg-slate-50 flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <i className="fas fa-sparkles text-indigo-400 animate-pulse"></i>
                </div>
              </div>
              <p className="text-slate-500 font-medium animate-pulse">Đang quét dữ liệu & tạo phân tích...</p>
            </div>
          ) : (
            <div className="prose prose-slate max-w-none prose-sm sm:prose-base text-slate-700 leading-relaxed whitespace-pre-wrap">
              {insight}
            </div>
          )}
        </div>

        <div className="p-6 bg-white border-t border-slate-100 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            Đã hiểu, cảm ơn!
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIInsights;
