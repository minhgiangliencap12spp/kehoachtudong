
import React, { useState, useMemo, useEffect } from 'react';
import { TeacherAssignment, SchoolTimetableEntry, DAYS_OF_WEEK } from '../types';
import { 
  Users, 
  Table as TableIcon, 
  Zap, 
  Plus, 
  Trash2, 
  AlertCircle, 
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Settings,
  X,
  UserPlus,
  BookOpen,
  BarChart3,
  LayoutGrid,
  Sparkles,
  CheckSquare,
  ArrowRightCircle,
  RefreshCw,
  FileText,
  Download
} from 'lucide-react';

interface Props {
  assignments: TeacherAssignment[];
  onUpdateAssignments: (data: TeacherAssignment[]) => void;
  tkbResult: SchoolTimetableEntry[];
  onGenerateTkb: (result: SchoolTimetableEntry[]) => void;
  classes: string[];
  subjects: string[];
  onUpdateClasses: (classes: string[]) => void;
  onUpdateSubjects: (subjects: string[]) => void;
}

const PERIODS_MORNING = [1, 2, 3, 4];
const PERIODS_AFTERNOON = [5, 6, 7];

const SchoolTimetableManager: React.FC<Props> = ({
  assignments,
  onUpdateAssignments,
  tkbResult,
  onGenerateTkb,
  classes,
  subjects,
  onUpdateClasses,
  onUpdateSubjects
}) => {
  const [viewMode, setViewMode] = useState<'assignment' | 'result'>('assignment');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showClassEditor, setShowClassEditor] = useState(false);
  const [showSubjectEditor, setShowSubjectEditor] = useState(false);
  const [newClassInput, setNewClassInput] = useState('');
  const [newSubjectInput, setNewSubjectInput] = useState('');
  
  const [conflictCell, setConflictCell] = useState<{id: string, className: string} | null>(null);

  const teacherStats = useMemo(() => {
    const stats: Record<string, number> = {};
    assignments.forEach(a => {
      if (!a.teacherName) return;
      const totalForRow = a.quotaPerClass * a.assignedClasses.length;
      stats[a.teacherName] = (stats[a.teacherName] || 0) + totalForRow;
    });
    return stats;
  }, [assignments]);

  const handleAddAssignment = (existingTeacherName?: string) => {
    const newEntry: TeacherAssignment = {
      id: crypto.randomUUID(),
      teacherName: existingTeacherName || '',
      subject: subjects[0] || '',
      quotaPerClass: 1,
      assignedClasses: []
    };
    onUpdateAssignments([...assignments, newEntry]);
  };

  const updateAssignment = (id: string, field: keyof TeacherAssignment, value: any) => {
    onUpdateAssignments(assignments.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const toggleClassAssignment = (id: string, className: string) => {
    const currentAssignment = assignments.find(a => a.id === id);
    if (!currentAssignment) return;
    const isAlreadyAssigned = currentAssignment.assignedClasses.includes(className);

    if (!isAlreadyAssigned) {
      const conflict = assignments.find(a => 
        a.id !== id && a.subject === currentAssignment.subject && a.assignedClasses.includes(className)
      );
      if (conflict) {
        setConflictCell({ id, className });
        setTimeout(() => setConflictCell(null), 2000);
        return;
      }
    }

    onUpdateAssignments(assignments.map(a => {
      if (a.id === id) {
        const next = isAlreadyAssigned ? a.assignedClasses.filter(c => c !== className) : [...a.assignedClasses, className];
        return { ...a, assignedClasses: next };
      }
      return a;
    }));
  };

  const toggleAllClasses = (id: string) => {
    const currentAssignment = assignments.find(a => a.id === id);
    if (!currentAssignment) return;
    const isAllSelected = currentAssignment.assignedClasses.length === classes.length;
    onUpdateAssignments(assignments.map(a => {
      if (a.id === id) return { ...a, assignedClasses: isAllSelected ? [] : [...classes] };
      return a;
    }));
  };

  const shuffleArray = <T,>(array: T[]): T[] => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  /**
   * AI TIMETABLE GENERATION LOGIC (V3)
   * Rules: 
   * 1. Fill Mornings first (Mon-Sat, P1-4).
   * 2. No gaps in mornings (must fill 1, then 2, then 3, then 4).
   * 3. Afternoon priority: Mon -> Tue -> Wed (P5-7).
   * 4. No gaps in afternoons (must fill 5, then 6, then 7).
   * 5. No teacher conflicts.
   */
  const generateTkb = () => {
    if (assignments.some(a => !a.teacherName)) {
      alert("Vui lòng nhập đầy đủ tên giáo viên.");
      return;
    }

    setIsGenerating(true);

    // Run in a small timeout to allow UI to show loader
    setTimeout(() => {
      // 1. Flatten assignments into individual "tasks" (each lesson needed)
      const tasks: { teacher: string, subject: string, className: string }[] = [];
      assignments.forEach(a => {
        a.assignedClasses.forEach(cls => {
          for (let i = 0; i < a.quotaPerClass; i++) {
            tasks.push({ teacher: a.teacherName, subject: a.subject, className: cls });
          }
        });
      });

      const morningDays = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
      const afternoonDaysPriority = ['Thứ 2', 'Thứ 3', 'Thứ 4'];

      const MAX_ATTEMPTS = 500;
      let finalResult: SchoolTimetableEntry[] = [];
      let success = false;

      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const currentResult: SchoolTimetableEntry[] = [];
        const teacherBusy: Record<string, boolean> = {}; // teacher_day_period
        const classSlotOccupied: Record<string, string> = {}; // class_day_period
        
        // Track current filled count for each class on each day per block
        const classMorningCount: Record<string, number> = {}; // class_day -> count (0-4)
        const classAfternoonCount: Record<string, number> = {}; // class_day -> count (0-3)

        // Shuffle tasks to provide different combinations each attempt
        // We sort by "difficulty": classes with most tasks first
        const classTotalLoad: Record<string, number> = {};
        tasks.forEach(t => classTotalLoad[t.className] = (classTotalLoad[t.className] || 0) + 1);
        
        const currentTasks = shuffleArray(tasks).sort((a, b) => {
           return classTotalLoad[b.className] - classTotalLoad[a.className];
        });

        let failedPlacement = false;

        for (const task of currentTasks) {
          let placed = false;

          // Attempt 1: Mornings (Priority 1)
          // Try to find a morning day where this task can be appended without teacher conflict
          const shuffledMorningDays = shuffleArray(morningDays);
          for (const day of shuffledMorningDays) {
            const currentCount = classMorningCount[`${task.className}_${day}`] || 0;
            if (currentCount < 4) {
              const nextPeriod = currentCount + 1;
              const tKey = `${task.teacher}_${day}_${nextPeriod}`;
              const cKey = `${task.className}_${day}_${nextPeriod}`;

              if (!teacherBusy[tKey]) {
                // Success: Place in morning
                teacherBusy[tKey] = true;
                classSlotOccupied[cKey] = task.subject;
                classMorningCount[`${task.className}_${day}`] = currentCount + 1;
                currentResult.push({ day, period: nextPeriod, className: task.className, subject: task.subject, teacherName: task.teacher });
                placed = true;
                break;
              }
            }
          }

          // Attempt 2: Afternoons (Priority 2) - Only if not placed in morning
          if (!placed) {
            // We use static priority for afternoon days (Mon > Tue > Wed)
            for (const day of afternoonDaysPriority) {
              const currentCount = classAfternoonCount[`${task.className}_${day}`] || 0;
              if (currentCount < 3) {
                const nextPeriod = currentCount + 5; // 5, 6, 7
                const tKey = `${task.teacher}_${day}_${nextPeriod}`;
                const cKey = `${task.className}_${day}_${nextPeriod}`;

                if (!teacherBusy[tKey]) {
                  teacherBusy[tKey] = true;
                  classSlotOccupied[cKey] = task.subject;
                  classAfternoonCount[`${task.className}_${day}`] = currentCount + 1;
                  currentResult.push({ day, period: nextPeriod, className: task.className, subject: task.subject, teacherName: task.teacher });
                  placed = true;
                  break;
                }
              }
            }
          }

          if (!placed) {
            failedPlacement = true;
            break; 
          }
        }

        if (!failedPlacement && currentResult.length === tasks.length) {
          finalResult = currentResult;
          success = true;
          break;
        }
      }

      setIsGenerating(false);
      if (success) {
        onGenerateTkb(finalResult);
        setViewMode('result');
        alert(`Thành công! Đã dồn hết tiết vào Sáng và các Chiều Thứ 2, 3, 4. Đảm bảo không trống tiết giữa buổi.`);
      } else {
        alert("Không tìm được phương án xếp đủ 100%. Vui lòng giảm số tiết hoặc kiểm tra lại phân công giáo viên.");
      }
    }, 50);
  };

  const handleExportWord = () => {
    if (!tkbResult.length) return;

    const generateTableHtml = (className: string) => {
      const clsTkb = tkbResult.filter(t => t.className === className);
      const getEntry = (day: string, p: number) => clsTkb.find(t => t.day === day && t.period === p);

      let rowsHtml = '';
      
      // Sáng
      PERIODS_MORNING.forEach((p, idx) => {
        rowsHtml += `<tr>`;
        if (idx === 0) rowsHtml += `<td rowspan="4" style="text-align:center; font-weight:bold; background-color: #fffbeb;">Sáng</td>`;
        rowsHtml += `<td style="text-align:center; font-weight: bold; color: #64748b;">${p}</td>`;
        DAYS_OF_WEEK.forEach(day => {
          const e = getEntry(day, p);
          rowsHtml += `<td style="text-align:center; padding: 8px; border: 1px solid #e2e8f0;">${e ? `<b style="color: #1e40af; font-size: 11pt;">${e.subject}</b><br/><small style="color: #f43f5e;">${e.teacherName}</small>` : '-'}</td>`;
        });
        rowsHtml += `</tr>`;
      });

      // Chiều
      PERIODS_AFTERNOON.forEach((p, idx) => {
        rowsHtml += `<tr>`;
        if (idx === 0) rowsHtml += `<td rowspan="3" style="text-align:center; font-weight:bold; background-color: #eff6ff;">Chiều</td>`;
        rowsHtml += `<td style="text-align:center; font-weight: bold; color: #64748b;">${p - 4}</td>`;
        DAYS_OF_WEEK.forEach(day => {
          const e = getEntry(day, p);
          rowsHtml += `<td style="text-align:center; padding: 8px; border: 1px solid #e2e8f0;">${e ? `<b style="color: #c2410c; font-size: 11pt;">${e.subject}</b><br/><small style="color: #f43f5e;">${e.teacherName}</small>` : '-'}</td>`;
        });
        rowsHtml += `</tr>`;
      });

      return `
        <div style="margin-bottom: 50px; page-break-after: always;">
          <h2 style="text-align: center; color: #1e3a8a; text-transform: uppercase;">THỜI KHÓA BIỂU LỚP ${className}</h2>
          <table border="1" style="width: 100%; border-collapse: collapse; font-family: 'Times New Roman'; font-size: 10pt; border: 1px solid #cbd5e1;">
            <thead>
              <tr style="background-color: #f8fafc; color: #334155;">
                <th width="80" style="padding: 10px;">Buổi</th>
                <th width="50" style="padding: 10px;">Tiết</th>
                ${DAYS_OF_WEEK.map(d => `<th width="120" style="padding: 10px;">${d}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      `;
    };

    let fullHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>TKB</title>
      <style>
        body { font-family: 'Times New Roman', serif; }
        table { border-collapse: collapse; }
        td, th { border: 1px solid black; }
      </style>
      </head>
      <body>
    `;

    if (selectedClassFilter === 'all') {
      classes.forEach(c => {
        fullHtml += generateTableHtml(c);
      });
    } else {
      fullHtml += generateTableHtml(selectedClassFilter);
    }

    fullHtml += `</body></html>`;

    const blob = new Blob([fullHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Thoi_Khoa_Bieu_${selectedClassFilter === 'all' ? 'Toan_Truong' : selectedClassFilter}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleAddClass = () => {
    const name = newClassInput.trim().toUpperCase();
    if (name && !classes.includes(name)) {
      onUpdateClasses([...classes, name].sort());
      setNewClassInput('');
    }
  };

  const handleAddSubject = () => {
    const name = newSubjectInput.trim();
    if (name && !subjects.includes(name)) {
      onUpdateSubjects([...subjects, name].sort());
      setNewSubjectInput('');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-green-100 p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6 no-print">
        <div className="flex items-center gap-4">
           <button 
             onClick={() => setViewMode('assignment')}
             className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${viewMode === 'assignment' ? 'bg-green-600 text-white shadow-lg' : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'}`}
           >
             <Users className="w-4 h-4" /> 1. Phân Công
           </button>
           <ArrowRight className="text-orange-400" />
           <button 
             onClick={() => setViewMode('result')}
             disabled={tkbResult.length === 0}
             className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${viewMode === 'result' ? 'bg-orange-500 text-white shadow-lg' : 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 disabled:opacity-50'}`}
           >
             <TableIcon className="w-4 h-4" /> 2. Kết quả TKB
           </button>
        </div>

        <div className="flex gap-2">
          {viewMode === 'result' && (
            <button 
              onClick={handleExportWord}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-bold text-sm shadow-md"
            >
              <FileText className="w-4 h-4" /> Tải Word
            </button>
          )}
          <button 
            onClick={() => setShowSubjectEditor(true)}
            className="flex items-center gap-2 px-4 py-2 bg-pink-50 text-pink-700 rounded-xl hover:bg-pink-100 transition-colors font-bold text-sm border border-pink-200"
          >
            <BookOpen className="w-4 h-4" /> Môn học
          </button>
          <button 
            onClick={() => setShowClassEditor(true)}
            className="flex items-center gap-2 px-4 py-2 bg-pink-50 text-pink-700 rounded-xl hover:bg-pink-100 transition-colors font-bold text-sm border border-pink-200"
          >
            <Settings className="w-4 h-4" /> Lớp học
          </button>
          {viewMode === 'assignment' ? (
            <button 
              onClick={generateTkb}
              disabled={isGenerating || assignments.length === 0}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-green-600 via-orange-500 to-pink-500 text-white rounded-xl font-bold shadow-lg hover:brightness-110 transition-all disabled:opacity-50 active:scale-95"
            >
              {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              Xếp Lịch Toàn Trường
            </button>
          ) : (
            <select 
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="pl-4 pr-8 py-2 bg-white border border-green-200 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-green-400 shadow-sm text-green-700"
            >
              <option value="all">Tất cả các lớp</option>
              {classes.map(c => <option key={c} value={c}>Lớp {c}</option>)}
            </select>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar border border-green-50 rounded-xl bg-green-50/10">
        {viewMode === 'assignment' ? (
          <div className="p-4">
            <div className="mb-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
               {(Object.entries(teacherStats) as [string, number][]).sort((a,b) => b[1] - a[1]).slice(0, 4).map(([name, total]) => (
                  <div key={name} className="bg-white p-3 rounded-xl border border-green-100 shadow-sm flex flex-col items-center group relative overflow-hidden">
                     <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
                     <span className="text-[10px] font-black text-green-600 uppercase truncate w-full text-center">{name}</span>
                     <span className={`text-xl font-black ${total > 20 ? 'text-pink-600' : 'text-orange-500'}`}>{total}</span>
                     <span className="text-[9px] font-bold text-slate-400 uppercase">Tiết/Tuần</span>
                  </div>
               ))}
               <div className="bg-green-600 p-3 rounded-xl shadow-md flex flex-col items-center justify-center text-white cursor-pointer hover:bg-green-700 transition" onClick={() => handleAddAssignment()}>
                  <UserPlus className="w-5 h-5 mb-1" />
                  <span className="text-[9px] font-bold uppercase text-center leading-tight">Thêm GV</span>
               </div>
            </div>

            <div className="overflow-x-auto rounded-xl shadow-sm border border-green-200">
              <table className="w-full bg-white border-collapse">
                <thead className="bg-green-600 text-white text-[10px] uppercase sticky top-0 z-20">
                  <tr>
                    <th className="p-3 text-left w-64 border-r border-green-500/30">Giáo viên</th>
                    <th className="p-3 text-left w-48 border-r border-green-500/30">Môn</th>
                    <th className="p-3 text-center w-20 border-r border-green-500/30">Số tiết</th>
                    <th className="p-3 text-center w-20 border-r border-green-500/30 bg-green-700">All</th>
                    {classes.map(c => (
                      <th key={c} className="p-2 text-center min-w-[60px] border-r border-green-500/30">{c}</th>
                    ))}
                    <th className="p-3 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-green-50 text-sm">
                  {assignments.map(a => {
                    const isAllSelected = a.assignedClasses.length === classes.length && classes.length > 0;
                    return (
                      <tr key={a.id} className="hover:bg-green-50/50 group">
                        <td className="p-2 border-r border-green-50">
                            <input 
                              type="text" 
                              value={a.teacherName}
                              onChange={(e) => updateAssignment(a.id, 'teacherName', e.target.value)}
                              placeholder="Tên GV..."
                              className="w-full p-2 border border-green-100 rounded-lg focus:ring-1 focus:ring-green-400 outline-none font-bold text-green-900"
                            />
                        </td>
                        <td className="p-2 border-r border-green-50">
                           <select 
                             value={a.subject}
                             onChange={(e) => updateAssignment(a.id, 'subject', e.target.value)}
                             className="w-full p-2 border border-green-100 rounded-lg outline-none font-bold bg-white text-green-800"
                           >
                             {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                           </select>
                        </td>
                        <td className="p-2 border-r border-green-50">
                           <input 
                             type="number" min={1} max={10}
                             value={a.quotaPerClass}
                             onChange={(e) => updateAssignment(a.id, 'quotaPerClass', parseInt(e.target.value) || 1)}
                             className="w-full p-2 border border-green-100 rounded-lg text-center font-bold text-orange-600"
                           />
                        </td>
                        <td className="p-2 text-center border-r border-green-50 bg-green-50/30">
                           <button onClick={() => toggleAllClasses(a.id)} className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto transition-all ${isAllSelected ? 'bg-green-600 text-white' : 'bg-white text-green-200 border border-green-100'}`}>
                             <CheckSquare className="w-4 h-4" />
                           </button>
                        </td>
                        {classes.map(c => {
                          const isConflicting = conflictCell?.id === a.id && conflictCell?.className === c;
                          const isAssigned = a.assignedClasses.includes(c);
                          return (
                          <td key={c} className={`p-1 text-center border-r border-green-50 relative`}>
                            <button 
                              onClick={() => toggleClassAssignment(a.id, c)}
                              className={`w-9 h-9 rounded-lg flex items-center justify-center mx-auto transition-all ${isConflicting ? 'bg-pink-500 text-white animate-shake' : isAssigned ? 'bg-green-500 text-white' : 'text-green-100 hover:text-green-400'}`}
                            >
                              {isConflicting ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                            </button>
                          </td>
                        )})}
                        <td className="p-2 text-center">
                           <button onClick={() => onUpdateAssignments(assignments.filter(item => item.id !== a.id))} className="p-2 text-pink-200 hover:text-pink-600 transition-colors">
                             <Trash2 className="w-4 h-4" />
                           </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="p-5 bg-green-50 rounded-2xl border border-green-100 flex items-start gap-4">
                  <div className="bg-white p-3 rounded-xl shadow-sm"><AlertCircle className="w-6 h-6 text-green-600" /></div>
                  <div className="text-xs text-green-900 space-y-2">
                     <p className="font-bold text-sm underline uppercase">Quy tắc Xếp lịch Ưu tiên Sáng (V3)</p>
                     <p>• <span className="text-blue-700 font-bold">Lấp đầy sáng:</span> Ưu tiên xếp tiết vào Sáng Thứ 2-7 trước.</p>
                     <p>• <span className="text-indigo-600 font-bold">Không tiết trống:</span> Tiết sáng phải liên tục (1-2-3-4). Không trống giữa các tiết.</p>
                     <p>• <span className="text-orange-600 font-bold">Ưu tiên chiều:</span> Sau khi hết chỗ sáng, dồn vào chiều Thứ 2 -> 3 -> 4.</p>
                     <p>• <span className="text-pink-600 font-bold">Tiết chiều liên tục:</span> Xếp liên tục 5-6-7, tuyệt đối không trống tiết giữa buổi.</p>
                     <p>• <span className="text-emerald-600 font-bold">Tiết kép:</span> Hệ thống cho phép xếp các tiết liền nhau của cùng một môn học.</p>
                  </div>
               </div>
            </div>
          </div>
        ) : (
          <div className="p-4">
             {selectedClassFilter === 'all' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {classes.map(cls => (
                     <ClassTkbCard key={cls} className={cls} tkb={tkbResult.filter(t => t.className === cls)} />
                   ))}
                </div>
             ) : (
                <div className="bg-white p-6 rounded-2xl border border-green-100 shadow-sm">
                   <h3 className="text-xl font-black text-green-700 flex items-center gap-2 mb-6 underline decoration-orange-400">TKB Lớp {selectedClassFilter}</h3>
                   <ClassTkbTable tkb={tkbResult.filter(t => t.className === selectedClassFilter)} />
                </div>
             )}
          </div>
        )}
      </div>

      {showSubjectEditor && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-green-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-green-100">
              <div className="p-5 bg-gradient-to-r from-green-600 to-teal-600 text-white flex justify-between items-center">
                 <div className="flex items-center gap-2 font-bold"><BookOpen className="w-5 h-5" /> Quản lý Môn</div>
                 <button onClick={() => setShowSubjectEditor(false)} className="p-1 hover:bg-white/20 rounded-lg"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6">
                 <div className="flex gap-2 mb-6">
                    <input type="text" value={newSubjectInput} onChange={(e) => setNewSubjectInput(e.target.value)} placeholder="Tên môn học..." className="flex-1 px-4 py-2.5 border border-green-100 rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-bold" />
                    <button onClick={handleAddSubject} className="px-4 py-2.5 bg-green-600 text-white rounded-xl font-bold">Thêm</button>
                 </div>
                 <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
                    {subjects.map(s => (
                      <div key={s} className="px-4 py-2.5 bg-green-50 border border-green-100 text-green-700 rounded-xl text-sm font-bold flex items-center justify-between hover:bg-white hover:border-orange-400 transition-all">
                        <span>{s}</span>
                        <button onClick={() => onUpdateSubjects(subjects.filter(item => item !== s))} className="text-pink-300 hover:text-pink-600"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      )}

      {showClassEditor && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-green-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-green-100">
              <div className="p-6 bg-gradient-to-r from-pink-500 to-fuchsia-700 text-white flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <LayoutGrid className="w-5 h-5" />
                    <h3 className="font-bold text-lg">Quản lý Lớp học</h3>
                 </div>
                 <button onClick={() => setShowClassEditor(false)} className="p-2 hover:bg-white/10 rounded-xl"><X className="w-6 h-6" /></button>
              </div>
              <div className="p-6 flex flex-col md:flex-row gap-8">
                 <div className="flex-1 space-y-6">
                    <div className="pt-6 flex gap-2">
                       <input type="text" value={newClassInput} onChange={(e) => setNewClassInput(e.target.value.toUpperCase())} placeholder="VD: 6A1..." className="flex-1 px-4 py-3 border border-green-100 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 font-bold" />
                       <button onClick={handleAddClass} className="px-6 py-3 bg-green-600 text-white rounded-2xl font-bold">Thêm</button>
                    </div>
                 </div>
                 <div className="w-full md:w-64 flex flex-col">
                    <div className="text-[10px] font-black text-green-600 uppercase mb-4">Danh sách {classes.length} lớp</div>
                    <div className="flex-1 bg-green-50 rounded-2xl p-4 max-h-[350px] overflow-y-auto custom-scrollbar border border-green-100 space-y-2">
                       {classes.map(c => (
                         <div key={c} className="px-3 py-2 bg-white border border-green-100 text-red-700 rounded-xl text-xs font-bold flex items-center justify-between group hover:border-orange-400">
                           <span>{c}</span>
                           <button onClick={() => onUpdateClasses(classes.filter(item => item !== c))} className="text-pink-200 hover:text-pink-600"><Trash2 className="w-3.5 h-3.5" /></button>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-2px); }
          75% { transform: translateX(2px); }
        }
        .animate-shake { animation: shake 0.2s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

const ClassTkbCard: React.FC<{ className: string, tkb: SchoolTimetableEntry[] }> = ({ className, tkb }) => (
  <div className="bg-white p-5 rounded-2xl border border-green-100 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
     <div className="absolute top-0 right-0 w-16 h-16 bg-orange-50 rounded-bl-full -mr-8 -mt-8 opacity-50"></div>
     <div className="flex justify-between items-center mb-4 pb-2 border-b border-green-50">
        <span className="font-black text-xl text-green-900">Lớp {className}</span>
        <span className="text-[10px] bg-green-50 text-green-600 px-3 py-1 rounded-full font-bold uppercase">{tkb.length} tiết</span>
     </div>
     <div className="space-y-4">
        {DAYS_OF_WEEK.map(day => {
          const dayTkb = tkb.filter(t => t.day === day).sort((a,b) => a.period - b.period);
          if (dayTkb.length === 0) return null;
          return (
            <div key={day} className="bg-green-50/30 p-2 rounded-lg">
               <div className="text-[10px] font-black text-green-500 uppercase mb-2 ml-1">{day}</div>
               <div className="space-y-1">
                 {dayTkb.map(t => (
                   <div key={`${t.day}_${t.period}`} className="flex items-center gap-3 text-xs bg-white p-2 rounded-md border border-green-50 shadow-sm">
                      <span className={`w-6 h-6 rounded flex items-center justify-center font-bold ${t.period > 4 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                        {t.period > 4 ? t.period - 4 : t.period}
                      </span>
                      <div className="flex-1">
                         <div className="font-bold text-green-800 leading-tight">{t.subject}</div>
                         <div className="text-[9px] text-slate-400 font-medium">{t.teacherName}</div>
                      </div>
                   </div>
                 ))}
               </div>
            </div>
          )
        })}
     </div>
  </div>
);

const ClassTkbTable: React.FC<{ tkb: SchoolTimetableEntry[] }> = ({ tkb }) => (
  <div className="overflow-x-auto">
    <table className="w-full border-collapse text-sm shadow-sm rounded-xl overflow-hidden">
      <thead>
        <tr className="bg-green-600 text-white">
          <th className="p-3 border border-green-500 w-24 font-bold">Buổi</th>
          <th className="p-3 border border-green-500 w-16 font-bold">Tiết</th>
          {DAYS_OF_WEEK.map(day => <th key={day} className="p-3 border border-green-500 text-center min-w-[120px] font-black">{day}</th>)}
        </tr>
      </thead>
      <tbody className="bg-white">
        {PERIODS_MORNING.map((p, idx) => (
          <tr key={`morning-${p}`} className="hover:bg-green-50/30">
            {idx === 0 && <td rowSpan={4} className="p-3 border border-green-100 text-center font-black bg-green-50 text-green-600 uppercase vertical-middle text-[10px]">Sáng</td>}
            <td className="p-3 border border-green-100 text-center font-bold text-slate-400">{p}</td>
            {DAYS_OF_WEEK.map(day => {
              const entry = tkb.find(t => t.day === day && t.period === p);
              return (
                <td key={day} className="p-2 border border-green-100 text-center h-20">
                  {entry ? (
                    <div className="animate-in fade-in zoom-in duration-300">
                      <div className="font-bold text-green-700 leading-tight">{entry.subject}</div>
                      <div className="text-[10px] text-pink-400 mt-1 font-medium italic">{entry.teacherName}</div>
                    </div>
                  ) : <span className="text-slate-100">-</span>}
                </td>
              )
            })}
          </tr>
        ))}
        {PERIODS_AFTERNOON.map((p, idx) => (
          <tr key={`afternoon-${p}`} className="hover:bg-orange-50/30">
            {idx === 0 && <td rowSpan={3} className="p-3 border border-green-100 text-center font-black bg-orange-50 text-orange-600 uppercase vertical-middle text-[10px]">Chiều</td>}
            <td className="p-3 border border-green-100 text-center font-bold text-slate-400">{p - 4}</td>
            {DAYS_OF_WEEK.map(day => {
              const entry = tkb.find(t => t.day === day && t.period === p);
              return (
                <td key={day} className="p-2 border border-green-100 text-center h-20">
                  {entry ? (
                    <div className="animate-in fade-in zoom-in duration-300">
                      <div className="font-bold text-orange-700 leading-tight">{entry.subject}</div>
                      <div className="text-[10px] text-pink-400 mt-1 font-medium italic">{entry.teacherName}</div>
                    </div>
                  ) : <span className="text-slate-100">-</span>}
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default SchoolTimetableManager;
