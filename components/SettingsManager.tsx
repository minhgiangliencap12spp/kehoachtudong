
import React, { useState } from 'react';
import { BookOpen, LayoutGrid, Plus, Trash2, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
  subjects: string[];
  onUpdateSubjects: (subjects: string[]) => void;
  classes: string[];
  onUpdateClasses: (classes: string[]) => void;
}

const GRADE_CONFIG = [
  { grade: '6', prefix: 'A', color: 'bg-blue-500' },
  { grade: '7', prefix: 'B', color: 'bg-emerald-500' },
  { grade: '8', prefix: 'C', color: 'bg-orange-500' },
  { grade: '9', prefix: 'D', color: 'bg-rose-500' },
];

const SettingsManager: React.FC<Props> = ({ subjects, onUpdateSubjects, classes, onUpdateClasses }) => {
  const [newSubject, setNewSubject] = useState('');
  const [newClass, setNewClass] = useState('');

  const handleAddSubject = () => {
    const trimmed = newSubject.trim();
    if (trimmed && !subjects.includes(trimmed)) {
      onUpdateSubjects([...subjects, trimmed].sort());
      setNewSubject('');
    }
  };

  const handleRemoveSubject = (sub: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa môn "${sub}"?`)) {
      onUpdateSubjects(subjects.filter(s => s !== sub));
    }
  };

  const handleAddClass = () => {
    const trimmed = newClass.trim().toUpperCase();
    if (trimmed && !classes.includes(trimmed)) {
      onUpdateClasses([...classes, trimmed].sort());
      setNewClass('');
    }
  };

  const handleRemoveClass = (cls: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa lớp "${cls}"?`)) {
      onUpdateClasses(classes.filter(c => c !== cls));
    }
  };

  const quickCreateClasses = (grade: string, prefix: string) => {
    const count = prompt(`Bạn muốn tạo bao nhiêu lớp cho Khối ${grade} (Ký hiệu ${prefix})?`, "5");
    if (!count) return;
    const num = parseInt(count);
    if (isNaN(num)) return;

    const newOnes: string[] = [];
    for (let i = 1; i <= num; i++) {
      const name = `${grade}${prefix}${i}`;
      if (!classes.includes(name)) newOnes.push(name);
    }
    if (newOnes.length > 0) {
      onUpdateClasses([...classes, ...newOnes].sort());
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Quản lý Môn học */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              Danh mục Môn học
            </h3>
            <p className="text-xs text-slate-500 mt-1">Thêm hoặc xóa các môn học trong hệ thống.</p>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="flex gap-2">
              <input 
                type="text" 
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSubject()}
                placeholder="Nhập tên môn học mới..."
                className="flex-1 px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium transition-all"
              />
              <button 
                onClick={handleAddSubject}
                className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-100"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-xl border border-slate-100 max-h-[400px] overflow-y-auto custom-scrollbar">
              {subjects.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">Chưa có môn học nào.</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {subjects.map(sub => (
                    <div key={sub} className="flex items-center justify-between p-3 px-4 group hover:bg-white transition-colors">
                      <span className="text-sm font-semibold text-slate-700">{sub}</span>
                      <button 
                        onClick={() => handleRemoveSubject(sub)}
                        className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              <CheckCircle2 className="w-3 h-3 text-green-500" />
              Tổng cộng {subjects.length} môn học
            </div>
          </div>
        </div>

        {/* Quản lý Lớp học */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-emerald-600" />
              Danh mục Lớp học
            </h3>
            <p className="text-xs text-slate-500 mt-1">Quản lý danh sách các lớp học của nhà trường.</p>
          </div>

          <div className="p-6 space-y-6">
            {/* Tạo nhanh */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-amber-500" /> Công cụ tạo nhanh theo khối
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {GRADE_CONFIG.map(rule => (
                  <button 
                    key={rule.grade} 
                    onClick={() => quickCreateClasses(rule.grade, rule.prefix)}
                    className={`p-2.5 ${rule.color} text-white rounded-xl text-xs font-bold shadow-sm hover:scale-105 transition-transform`}
                  >
                    Khối {rule.grade} ({rule.prefix})
                  </button>
                ))}
              </div>
            </div>

            <div className="h-px bg-slate-100"></div>

            <div className="space-y-4">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newClass}
                  onChange={(e) => setNewClass(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddClass()}
                  placeholder="Thêm lớp lẻ (VD: 6A1)..."
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold transition-all"
                />
                <button 
                  onClick={handleAddClass}
                  className="p-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition shadow-lg shadow-emerald-100"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-slate-50 rounded-xl border border-slate-100 max-h-[300px] overflow-y-auto custom-scrollbar">
                {classes.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-sm">Chưa có lớp học nào.</div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-slate-100">
                    {classes.map(cls => (
                      <div key={cls} className="flex items-center justify-between p-3 px-4 bg-white group hover:bg-emerald-50 transition-colors">
                        <span className="text-sm font-black text-slate-700">{cls}</span>
                        <button 
                          onClick={() => handleRemoveClass(cls)}
                          className="p-1.5 text-slate-200 hover:text-rose-500 hover:bg-white rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <CheckCircle2 className="w-3 h-3 text-green-500" />
                Tổng cộng {classes.length} lớp học
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-4">
        <div className="p-2 bg-white rounded-xl"><AlertCircle className="w-5 h-5 text-amber-500" /></div>
        <div className="text-xs text-amber-800 space-y-1">
          <p className="font-bold text-sm">Lưu ý quan trọng</p>
          <p>• Việc xóa môn học hoặc lớp học có thể ảnh hưởng đến các dữ liệu báo giảng đã lập trước đó.</p>
          <p>• Hệ thống sẽ tự động đồng bộ danh mục này cho tất cả các tab chức năng (Báo giảng, TKB Trường, Thiết bị...).</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsManager;
