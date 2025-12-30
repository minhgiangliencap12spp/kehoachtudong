
import React, { useState, useMemo } from 'react';
import { ScheduleRow, PPCTEntry, DAYS_OF_WEEK, TimetableEntry } from '../types';
import { exportScheduleToExcel, exportScheduleToWord } from '../services/excelService';
import { Calendar, Download, Trash2, Settings, X, Plus, FileText, CheckCircle2, User, Grid3X3, RefreshCw, CalendarDays, Calendar as CalendarIcon } from 'lucide-react';

interface Props {
  schedule: ScheduleRow[];
  ppct: PPCTEntry[];
  onUpdateSchedule: (newSchedule: ScheduleRow[]) => void;
  availableSubjects: string[];
  onUpdateSubjects: (subjects: string[]) => void;
  availableClasses: string[];
  onUpdateClasses: (classes: string[]) => void;
  // Synchronized props
  currentWeek: number;
  onWeekChange: (week: number) => void;
  weekStartDate: string;
  onDateChange: (date: string) => void;
  // Teacher Name
  teacherName: string;
  onTeacherNameChange: (name: string) => void;
  // Reference
  referenceTimetable?: TimetableEntry[];
  onApplyReference?: (entries: TimetableEntry[]) => void;
}

const PERIODS = [1, 2, 3, 4, 5, 6, 7];

const ScheduleEditor: React.FC<Props> = ({ 
  schedule, 
  ppct, 
  onUpdateSchedule,
  availableSubjects,
  onUpdateSubjects,
  availableClasses,
  onUpdateClasses,
  currentWeek,
  onWeekChange,
  weekStartDate,
  onDateChange,
  teacherName,
  onTeacherNameChange,
  referenceTimetable = [],
  onApplyReference
}) => {
  const [showConfig, setShowConfig] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newClass, setNewClass] = useState('');

  const normalizeStr = (s: string) => (s || '').toLowerCase().trim();

  const getLessonNameFromPPCT = (subject: string, number: string): string | undefined => {
    if (!subject || !number) return undefined;
    const rowSub = normalizeStr(subject);
    const found = ppct.find(p => {
      const pSub = normalizeStr(p.subject || '');
      return (pSub === rowSub || rowSub.startsWith(pSub)) && String(p.lessonNumber).trim() === String(number).trim();
    });
    return found?.lessonName;
  }

  const handleSyncLessons = () => {
    const newSchedule = schedule.map(row => {
      if (row.week === currentWeek && row.subject && row.ppctNumber) {
        const foundName = getLessonNameFromPPCT(row.subject, row.ppctNumber);
        if (foundName) {
          return { ...row, lessonName: foundName };
        }
      }
      return row;
    });
    onUpdateSchedule(newSchedule);
    alert("Đã cập nhật tên bài dạy từ danh sách PPCT.");
  };

  const formatDateVN = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  const getDayDate = (baseDate: string, daysToAdd: number): string => {
    if (!baseDate) return '';
    try {
      const parts = baseDate.split('-');
      const d = new Date(Date.UTC(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)));
      d.setUTCDate(d.getUTCDate() + daysToAdd);
      return d.toISOString().split('T')[0];
    } catch (e) { return ''; }
  };

  const getPeriodLabel = (p: number) => {
    if (p <= 4) return p.toString();
    return (p - 4).toString();
  };

  const handleCellChange = (
    dayIndex: number, 
    period: number,   
    field: keyof ScheduleRow,
    value: any
  ) => {
    const dayOfWeek = DAYS_OF_WEEK[dayIndex];
    const currentDate = getDayDate(weekStartDate, dayIndex);
    const existingRowIndex = schedule.findIndex(
      r => r.week === currentWeek && r.dayOfWeek === dayOfWeek && r.period === period
    );

    let newSchedule = [...schedule];
    if (existingRowIndex >= 0) {
      const currentRow = newSchedule[existingRowIndex];
      const updatedRow = { ...currentRow, [field]: value, date: currentDate, teacherName: teacherName };
      if (field === 'ppctNumber' || field === 'subject') {
        const foundName = getLessonNameFromPPCT(updatedRow.subject, updatedRow.ppctNumber);
        if (foundName) updatedRow.lessonName = foundName;
      }
      newSchedule[existingRowIndex] = updatedRow;
    } else {
      const newRow: ScheduleRow = {
        id: crypto.randomUUID(),
        week: currentWeek,
        dayOfWeek,
        date: currentDate,
        period,
        subject: '',
        className: '',
        ppctNumber: '',
        lessonName: '',
        notes: '',
        teacherName: teacherName,
        [field]: value,
      };
      if (field === 'ppctNumber' || field === 'subject') {
         const foundName = getLessonNameFromPPCT(newRow.subject, newRow.ppctNumber);
         if (foundName) newRow.lessonName = foundName;
      }
      newSchedule.push(newRow);
    }
    onUpdateSchedule(newSchedule);
  };

  const getValue = (dayIndex: number, period: number, field: keyof ScheduleRow) => {
    const dayOfWeek = DAYS_OF_WEEK[dayIndex];
    const row = schedule.find(
      r => r.week === currentWeek && r.dayOfWeek === dayOfWeek && r.period === period
    );
    return row ? row[field] : '';
  };

  const getEndDate = () => {
     const end = getDayDate(weekStartDate, 5); 
     return formatDateVN(end);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-pink-100 p-6 h-full flex flex-col relative">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-pink-600" />
            <span className="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">Lịch Báo Giảng</span>
          </h2>
          <div className="flex items-center gap-1 text-xs text-green-600 mt-1 font-medium">
             <CheckCircle2 className="w-3 h-3"/> Dữ liệu tự động lưu
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 bg-orange-50/80 p-3 rounded-xl border border-orange-100">
           <div className="flex items-center gap-2">
            <label className="text-sm font-bold text-orange-700 whitespace-nowrap">Giáo viên:</label>
            <div className="relative">
              <input 
                type="text" 
                value={teacherName}
                onChange={(e) => onTeacherNameChange(e.target.value)}
                placeholder="Nhập tên..."
                className="w-32 md:w-40 p-1.5 pl-7 text-sm font-bold text-slate-700 border border-orange-300 rounded focus:ring-2 focus:ring-purple-500 outline-none"
              />
              <User className="absolute left-2 top-2 w-3.5 h-3.5 text-orange-400 pointer-events-none" />
            </div>
           </div>

           <div className="h-6 w-px bg-orange-200 hidden sm:block"></div>

           <div className="flex items-center gap-2">
            <label className="text-sm font-bold text-orange-700 whitespace-nowrap">Tuần:</label>
            <input 
              type="number" min={1} max={52} 
              value={currentWeek}
              onChange={(e) => onWeekChange(parseInt(e.target.value) || 1)}
              className="w-14 p-1.5 text-center text-sm font-bold text-purple-700 border border-orange-300 rounded focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-orange-200 shadow-sm min-w-[200px] justify-center">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Thời gian:</span>
            <span className="text-sm font-bold text-indigo-600">
              {formatDateVN(weekStartDate)} → {getEndDate()}
            </span>
          </div>

           <div className="flex gap-2">
             <button 
                onClick={handleSyncLessons}
                className="flex items-center gap-1 px-3 py-1.5 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-lg text-sm font-bold transition-colors border border-indigo-200"
                title="Cập nhật tên bài từ PPCT"
              >
                <RefreshCw className="w-4 h-4" /> Cập nhật bài
              </button>

            <button onClick={() => setShowConfig(true)} className="flex items-center gap-1 px-3 py-1.5 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-lg text-sm font-bold transition-colors border border-purple-200">
              <Settings className="w-4 h-4" />
            </button>
            <button onClick={() => exportScheduleToWord(schedule, currentWeek, formatDateVN(weekStartDate), getEndDate(), teacherName)} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-colors shadow-sm">
              <FileText className="w-4 h-4" /> Word
            </button>
            <button onClick={() => exportScheduleToExcel(schedule, currentWeek, formatDateVN(weekStartDate), getEndDate(), teacherName)} className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-bold transition-colors shadow-sm">
              <Download className="w-4 h-4" /> Excel
            </button>
           </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar border border-purple-100 rounded-lg bg-white shadow-inner">
        <datalist id="list-subjects">
          {availableSubjects.map(s => <option key={s} value={s} />)}
        </datalist>
        <datalist id="list-classes">
          {availableClasses.map(c => <option key={c} value={c} />)}
        </datalist>

        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead className="text-sm sticky top-0 z-10">
            <tr className="bg-gradient-to-r from-orange-100 via-pink-100 to-purple-100 text-slate-800">
              <th className="border border-purple-200 px-2 py-3 text-center w-32 font-bold text-purple-900">Ngày thứ</th>
              <th className="border border-purple-200 px-2 py-3 text-center w-16 font-bold text-blue-900">Buổi</th>
              <th className="border border-purple-200 px-2 py-3 text-center w-16 font-bold text-pink-900">Tiết</th>
              <th className="border border-purple-200 px-2 py-3 text-center w-24 font-bold text-orange-900">Môn</th>
              <th className="border border-purple-200 px-2 py-3 text-center w-20 font-bold text-emerald-900">Lớp</th>
              <th className="border border-purple-200 px-2 py-3 text-center w-20 font-bold text-indigo-900">PPCT</th>
              <th className="border border-purple-200 px-4 py-3 text-center font-bold text-slate-800">Tên Bài Dạy</th>
              <th className="border border-purple-200 px-2 py-3 text-center w-48 font-bold text-slate-600">Ghi chú</th>
            </tr>
          </thead>
          <tbody className="text-sm text-slate-700">
            {DAYS_OF_WEEK.map((dayName, dayIndex) => {
              const formattedDate = formatDateVN(getDayDate(weekStartDate, dayIndex));
              const rowBg = dayIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50/30';

              return (
                <React.Fragment key={dayName}>
                  {PERIODS.map((period) => {
                    const isAfternoon = period > 4;
                    const periodLabel = getPeriodLabel(period);
                    return (
                    <tr key={`${dayName}-${period}`} className={`${rowBg} ${isAfternoon ? 'bg-blue-50/50' : ''} hover:bg-orange-50 transition-colors group`}>
                      {period === 1 && (
                        <td rowSpan={PERIODS.length} className="border border-purple-200 px-2 py-2 text-center align-middle font-medium bg-white/50 backdrop-blur-sm">
                          <div className="flex flex-col gap-2 items-center">
                            <span className="text-xl font-black bg-gradient-to-br from-pink-500 to-purple-600 bg-clip-text text-transparent">{dayName.replace('Thứ ', '')}</span>
                            
                            {dayIndex === 0 ? (
                              <div className="relative group/date-picker">
                                <input 
                                  type="date" 
                                  value={weekStartDate}
                                  onChange={(e) => onDateChange(e.target.value)}
                                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                  title="Chọn ngày bắt đầu tuần (Thứ 2)"
                                />
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-indigo-600 text-white shadow-md hover:bg-indigo-700 transition-all scale-90 group-hover/date-picker:scale-100 border border-indigo-400">
                                  <CalendarIcon className="w-3 h-3" />
                                  <span className="text-[11px] font-black">{formattedDate}</span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs font-semibold text-slate-400 italic">{formattedDate}</span>
                            )}
                          </div>
                        </td>
                      )}
                      {period === 1 && <td rowSpan={4} className="border border-purple-200 px-1 py-1 text-center font-bold text-orange-600 bg-orange-50/50 vertical-middle">Sáng</td>}
                      {period === 5 && <td rowSpan={3} className="border border-purple-200 px-1 py-1 text-center font-bold text-blue-600 bg-blue-50/50 vertical-middle">Chiều</td>}
                      <td className="border border-purple-200 px-2 py-1 text-center font-bold text-slate-500">{periodLabel}</td>
                      <td className="border border-purple-200 px-1 py-1">
                        <input type="text" list="list-subjects" value={getValue(dayIndex, period, 'subject') as string} onChange={(e) => handleCellChange(dayIndex, period, 'subject', e.target.value)} className="w-full h-full p-1.5 outline-none bg-transparent text-center focus:bg-orange-100/50 focus:text-orange-900 font-medium rounded" placeholder="..." />
                      </td>
                      <td className="border border-purple-200 px-1 py-1">
                        <input type="text" list="list-classes" value={getValue(dayIndex, period, 'className') as string} onChange={(e) => handleCellChange(dayIndex, period, 'className', e.target.value)} className="w-full h-full p-1.5 outline-none bg-transparent text-center uppercase focus:bg-emerald-100/50 focus:text-emerald-900 font-bold rounded" placeholder="..." />
                      </td>
                      <td className="border border-purple-200 px-1 py-1">
                        <input type="text" value={getValue(dayIndex, period, 'ppctNumber') as string} onChange={(e) => handleCellChange(dayIndex, period, 'ppctNumber', e.target.value)} className="w-full h-full p-1.5 outline-none bg-transparent text-center font-bold text-purple-600 focus:bg-purple-100/50 rounded" placeholder="#" />
                      </td>
                      <td className="border border-purple-200 px-2 py-1 align-middle">
                        <div className="min-h-[24px] flex items-center font-medium text-slate-700">{getValue(dayIndex, period, 'lessonName') as string}</div>
                      </td>
                      <td className="border border-purple-200 px-1 py-1">
                         <input type="text" value={getValue(dayIndex, period, 'notes') as string} onChange={(e) => handleCellChange(dayIndex, period, 'notes', e.target.value)} className="w-full h-full p-1.5 outline-none bg-transparent focus:bg-slate-100 rounded text-slate-500 italic" />
                      </td>
                    </tr>
                  )})}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      {showConfig && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm rounded-lg">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl border border-purple-100 flex flex-col max-h-full">
            <div className="p-4 border-b border-purple-100 bg-purple-50 rounded-t-xl flex justify-between items-center">
              <h3 className="font-bold text-lg text-purple-900 flex items-center gap-2"><Settings className="w-5 h-5 text-purple-600"/> Cấu hình</h3>
              <button onClick={() => setShowConfig(false)} className="text-purple-400 hover:text-purple-700 p-1 hover:bg-purple-200 rounded"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 overflow-y-auto">
              <div>
                <h4 className="font-bold text-orange-700 border-b border-orange-200 pb-2 mb-4">Danh sách Môn dạy</h4>
                <div className="flex gap-2 mb-4">
                   <input value={newSubject} onChange={(e) => setNewSubject(e.target.value)} className="flex-1 border border-orange-200 rounded-lg px-3 py-2 text-sm outline-none" placeholder="Thêm môn..." onKeyDown={(e) => e.key === 'Enter' && (onUpdateSubjects([...availableSubjects, newSubject.trim()]), setNewSubject(''))} />
                   <button onClick={() => (onUpdateSubjects([...availableSubjects, newSubject.trim()]), setNewSubject(''))} className="bg-orange-500 text-white p-2 rounded-lg"><Plus className="w-4 h-4" /></button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableSubjects.map(sub => (
                    <span key={sub} className="inline-flex items-center gap-1 pl-3 pr-1 py-1 bg-orange-50 text-orange-700 rounded-full text-sm border border-orange-200">{sub}<button onClick={() => onUpdateSubjects(availableSubjects.filter(s => s !== sub))} className="p-1 hover:bg-orange-200 rounded-full"><X className="w-3 h-3"/></button></span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-bold text-emerald-700 border-b border-emerald-200 pb-2 mb-4">Danh sách Lớp dạy</h4>
                <div className="flex gap-2 mb-4">
                   <input value={newClass} onChange={(e) => setNewClass(e.target.value.toUpperCase())} className="flex-1 border border-emerald-200 rounded-lg px-3 py-2 text-sm outline-none" placeholder="Thêm lớp..." onKeyDown={(e) => e.key === 'Enter' && (onUpdateClasses([...availableClasses, newClass.trim()]), setNewClass(''))} />
                   <button onClick={() => (onUpdateClasses([...availableClasses, newClass.trim()]), setNewClass(''))} className="bg-emerald-500 text-white p-2 rounded-lg"><Plus className="w-4 h-4" /></button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableClasses.map(cls => (
                    <span key={cls} className="inline-flex items-center gap-1 pl-3 pr-1 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm border border-emerald-200">{cls}<button onClick={() => onUpdateClasses(availableClasses.filter(c => c !== cls))} className="p-1 hover:bg-emerald-200 rounded-full"><X className="w-3 h-3"/></button></span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleEditor;
