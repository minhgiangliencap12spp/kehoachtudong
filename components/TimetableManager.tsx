
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { TimetableEntry, DAYS_OF_WEEK, SchoolTimetableEntry } from '../types';
import { parseTimetableFromImage, parseTimetableFromText, parseTimetableFromPdf } from '../services/geminiService';
import { readExcelToText } from '../services/excelService';
import { 
  Upload, 
  Image as ImageIcon, 
  FileSpreadsheet, 
  Loader2, 
  User, 
  CalendarCheck, 
  Check, 
  Search, 
  Trash2, 
  Filter,
  Grid3X3,
  Save,
  RefreshCw,
  X,
  Printer,
  FileText,
  School,
  Sparkles,
  ArrowRightCircle
} from 'lucide-react';

interface Props {
  onApply: (entries: TimetableEntry[]) => void;
  savedData: TimetableEntry[];
  savedFileName: string;
  onUpdateData: (data: TimetableEntry[]) => void;
  onUpdateFileName: (name: string) => void;
  // Global props
  teacherName: string;
  onUpdateTeacherName: (name: string) => void;
  // School TKB result from the other tab
  schoolTkbData: SchoolTimetableEntry[];
}

const PERIODS_MORNING = [1, 2, 3, 4];
const PERIODS_AFTERNOON = [5, 6, 7];

const TimetableManager: React.FC<Props> = ({ 
  onApply, 
  savedData, 
  savedFileName, 
  onUpdateData, 
  onUpdateFileName,
  teacherName,
  onUpdateTeacherName,
  schoolTkbData
}) => {
  const [teachers, setTeachers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pasteMode, setPasteMode] = useState(false);
  const [showSyncBanner, setShowSyncBanner] = useState(false);
  
  // Auto-show grid if we have a selected teacher and data on load
  const [showGrid, setShowGrid] = useState<boolean>(() => {
    return savedData.length > 0 && !!teacherName;
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Recalculate unique teachers whenever savedData changes and handle auto-selection
  useEffect(() => {
    if (savedData.length > 0) {
      const teacherSet = new Set<string>();
      savedData.forEach(e => {
        if (e.teacherName) teacherSet.add(e.teacherName);
      });
      const teacherList = Array.from(teacherSet).sort();
      setTeachers(teacherList);

      // Smart Selection Logic
      if (teacherList.length > 0) {
        if (teacherName && teacherSet.has(teacherName)) {
          setShowGrid(true);
        }
      }
    } else {
      setTeachers([]);
      setShowGrid(false);
    }
  }, [savedData]); 

  // Detect if school TKB has new data that could be synced
  useEffect(() => {
    if (schoolTkbData && schoolTkbData.length > 0) {
      // If personal TKB is empty OR the source is different, show banner
      if (savedData.length === 0 || savedFileName === "TKB Toàn trường (Đã xếp)") {
        // We only show banner if there's actually a reason to sync
        // Checking if the school data matches current teacher
        const schoolHasTeacher = teacherName ? schoolTkbData.some(item => item.teacherName === teacherName) : true;
        if (schoolHasTeacher) {
          setShowSyncBanner(true);
        }
      }
    } else {
      setShowSyncBanner(false);
    }
  }, [schoolTkbData, savedData.length, teacherName, savedFileName]);

  // Ensure grid visibility syncs with teacher selection
  useEffect(() => {
    if (teacherName && savedData.length > 0) {
      setShowGrid(true);
    }
  }, [teacherName, savedData.length]);

  // Filter data by selected teacher
  const filteredData = useMemo(() => {
    if (!teacherName) return [];
    return savedData.filter(d => 
      (d.teacherName || '').toLowerCase().includes(teacherName.toLowerCase())
    );
  }, [savedData, teacherName]);

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          setIsLoading(true);
          onUpdateFileName("Ảnh chụp màn hình");
          const reader = new FileReader();
          reader.onload = async (event) => {
            const base64 = event.target?.result as string;
            try {
              const entries = await parseTimetableFromImage(base64);
              processParsedData(entries);
            } catch (err) {
              alert("Lỗi phân tích ảnh: " + (err as Error).message);
            } finally {
              setIsLoading(false);
              setPasteMode(false);
            }
          };
          reader.readAsDataURL(blob);
        }
      }
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      onUpdateFileName(file.name);
      setIsLoading(true);
      
      try {
        let entries: TimetableEntry[] = [];
        
        if (file.type === 'application/pdf') {
           const base64 = await fileToBase64(file);
           entries = await parseTimetableFromPdf(base64);
        } else {
           // Assume Excel/CSV
           const textData = await readExcelToText(file);
           entries = await parseTimetableFromText(textData);
        }
        
        processParsedData(entries);
      } catch (err) {
        alert("Lỗi xử lý file: " + (err as Error).message);
      } finally {
        setIsLoading(false);
        // Reset input so same file can be selected again if needed
        e.target.value = '';
      }
    }
  };

  const handleUseSchoolTkb = () => {
    if (!schoolTkbData || schoolTkbData.length === 0) {
      alert("Chưa có kết quả từ TKB Toàn trường. Vui lòng xếp lịch ở tab TKB Toàn trường trước.");
      return;
    }

    // Convert SchoolTimetableEntry[] to TimetableEntry[]
    const entries: TimetableEntry[] = schoolTkbData.map(item => ({
      dayOfWeek: item.day,
      period: item.period,
      subject: item.subject,
      className: item.className,
      teacherName: item.teacherName
    }));

    onUpdateData(entries);
    onUpdateFileName("TKB Toàn trường (Đã xếp)");
    setShowSyncBanner(false);
    alert("Đã đồng bộ dữ liệu từ TKB Toàn trường thành công!");
  };

  const processParsedData = (entries: TimetableEntry[]) => {
    if (entries.length === 0) {
      alert("Không tìm thấy dữ liệu lịch dạy nào.");
      return;
    }
    onUpdateData(entries);
  };

  const handleClear = () => {
    if (confirm("Bạn có chắc chắn muốn xóa dữ liệu TKB hiện tại?")) {
      onUpdateData([]);
      onUpdateFileName('');
      onUpdateTeacherName('');
      setShowGrid(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleReplace = () => {
     fileInputRef.current?.click();
  };

  const handleApply = () => {
    if (filteredData.length === 0) {
      alert("Không có dữ liệu để áp dụng.");
      return;
    }
    const confirmMsg = `Áp dụng lịch dạy của giáo viên "${teacherName}" vào Lịch Báo Giảng tuần hiện tại?`;
      
    if (confirm(confirmMsg)) {
      onApply(filteredData);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Helper to find data for a specific cell
  const getCellData = (day: string, period: number) => {
    return filteredData.find(d => 
      d.period === period && 
      (d.dayOfWeek.toLowerCase() === day.toLowerCase() || d.dayOfWeek.toLowerCase().includes(day.toLowerCase()))
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-violet-100 p-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4 no-print">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-violet-600" />
            <span className="bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
              Quản Lý Thời Khóa Biểu Cá Nhân
            </span>
          </h2>
          <div className="flex items-center gap-1 text-xs text-green-600 mt-1 font-medium">
             <Save className="w-3 h-3"/> Tự động lưu • Lấy TKB từ file hoặc từ TKB trường.
          </div>
        </div>
      </div>

      {/* Dynamic Sync Banner */}
      {showSyncBanner && (
        <div className="mb-4 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl p-4 shadow-lg shadow-indigo-100 flex items-center justify-between text-white animate-in slide-in-from-top-4 duration-500 no-print">
          <div className="flex items-center gap-3">
             <div className="bg-white/20 p-2 rounded-lg">
                <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
             </div>
             <div>
                <p className="font-bold text-sm">Phát hiện dữ liệu TKB mới từ Toàn trường!</p>
                <p className="text-[11px] opacity-80">Hệ thống đã sẵn sàng để đồng bộ lịch dạy vừa xếp xong cho bạn.</p>
             </div>
          </div>
          <button 
            onClick={handleUseSchoolTkb}
            className="flex items-center gap-2 px-4 py-2 bg-white text-indigo-700 rounded-lg text-xs font-black hover:bg-indigo-50 transition-all shadow-md active:scale-95"
          >
            CẬP NHẬT NGAY <ArrowRightCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Control Panel */}
      <div className="bg-violet-50/50 p-4 rounded-xl border border-violet-200 mb-6 no-print">
        <div className="flex flex-wrap items-center gap-4">
          
          {/* Hidden File Input */}
          <input 
             type="file" 
             accept=".xlsx,.xls,.csv,.pdf" 
             className="hidden" 
             ref={fileInputRef}
             onChange={handleFileUpload}
           />

          {/* 1. Upload Section */}
          <div className="flex gap-2 flex-wrap">
            {savedData.length === 0 ? (
              <>
                <div 
                  className="relative overflow-hidden"
                  onPaste={handlePaste} 
                  tabIndex={0}
                >
                   <button 
                     onClick={() => setPasteMode(true)}
                     className="flex items-center gap-2 px-4 py-2 bg-white border border-violet-300 hover:border-violet-500 text-violet-700 rounded-lg font-bold transition-all shadow-sm"
                   >
                     <ImageIcon className="w-4 h-4" />
                     {pasteMode ? "Ctrl+V ngay" : "Dán ảnh"}
                   </button>
                </div>

                 <button 
                   onClick={() => fileInputRef.current?.click()}
                   className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold transition-all shadow-sm"
                 >
                   <Upload className="w-4 h-4" />
                   Tải Excel / PDF
                 </button>

                 {schoolTkbData && schoolTkbData.length > 0 && (
                   <button 
                    onClick={handleUseSchoolTkb}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-all shadow-lg shadow-indigo-100"
                    title="Lấy dữ liệu đã xếp từ tab TKB Toàn trường"
                  >
                    <School className="w-4 h-4" />
                    Lấy từ TKB Trường
                  </button>
                 )}
              </>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-violet-100 shadow-sm">
                  <FileText className="w-5 h-5 text-violet-600" />
                  <span className="text-sm font-medium text-slate-700 truncate max-w-[200px]" title={savedFileName}>
                    {savedFileName || 'Dữ liệu đã nạp'}
                  </span>
                </div>
                
                <button 
                  onClick={handleReplace}
                  className="flex items-center gap-2 px-3 py-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg font-bold transition-colors border border-emerald-200 text-sm"
                  title="Tải file khác để thay thế dữ liệu hiện tại"
                >
                  <RefreshCw className="w-4 h-4" />
                  Thay thế
                </button>

                <button 
                  onClick={handleClear}
                  className="flex items-center gap-2 px-3 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg font-bold transition-colors border border-rose-200 text-sm"
                  title="Xóa toàn bộ dữ liệu TKB"
                >
                  <Trash2 className="w-4 h-4" />
                  Xóa
                </button>
              </div>
            )}
          </div>

          {/* 2. Select Teacher */}
          {savedData.length > 0 && (
             <div className="flex items-center gap-2">
                <div className="relative">
                  <select
                    value={teacherName}
                    onChange={(e) => {
                      onUpdateTeacherName(e.target.value);
                    }}
                    className="pl-9 pr-8 py-2 bg-white border border-violet-300 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none font-bold text-slate-700 shadow-sm min-w-[200px]"
                  >
                    <option value="" disabled>-- Chọn Giáo Viên --</option>
                    {teachers.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-violet-500 pointer-events-none" />
                </div>
             </div>
          )}

          {isLoading && (
            <div className="flex items-center gap-2 text-violet-600 font-bold animate-pulse ml-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Đang xử lý...
            </div>
          )}

          {/* Actions - Only shown when Grid is active */}
          {showGrid && filteredData.length > 0 && (
            <div className="ml-auto flex gap-2">
              <button 
               onClick={handlePrint}
               className="flex items-center gap-2 px-5 py-2 bg-white border border-violet-200 hover:bg-violet-50 text-violet-700 rounded-lg font-bold transition-all shadow-sm"
             >
               <Printer className="w-4 h-4" />
               In TKB
             </button>
             <button 
               onClick={handleApply}
               className="flex items-center gap-2 px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-bold transition-all shadow-lg shadow-violet-200 animate-in fade-in"
               title="Dùng lịch mẫu này để soạn báo giảng tuần"
             >
               <Check className="w-4 h-4" />
               Dùng làm mẫu
             </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto custom-scrollbar border border-violet-100 rounded-lg bg-white relative print:border-none print:overflow-visible">
        {!showGrid ? (
           <div className="h-full flex flex-col items-center justify-center text-slate-400 p-12 text-center bg-violet-50/10">
              {savedData.length > 0 ? (
                <>
                  <Filter className="w-16 h-16 mb-4 opacity-30 text-violet-400"/>
                  <p className="text-lg font-medium text-slate-600">Đã có dữ liệu thời khóa biểu.</p>
                  <p className="text-sm mt-2">Vui lòng chọn tên giáo viên để xem TKB cá nhân.</p>
                </>
              ) : (
                <>
                  <CalendarCheck className="w-16 h-16 mb-4 opacity-30 text-violet-400"/>
                  <p className="text-lg font-medium text-slate-500">Chưa có dữ liệu.</p>
                  <p className="text-sm mt-2">Tải file hoặc nhấn <b>"Lấy từ TKB Trường"</b> nếu đã xếp lịch ở tab bên cạnh.</p>
                </>
              )}
           </div>
        ) : (
          <div className="min-w-[800px] p-4 print:p-0 print:min-w-0">
             <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-violet-800 uppercase print:text-black print:text-xl print:text-center print:w-full">
                  Thời khóa biểu: {teacherName}
                </h3>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded print:hidden">
                  Lịch mẫu (Tổng số tiết: {filteredData.length})
                </span>
             </div>

             <table className="w-full border-collapse text-sm shadow-sm rounded-lg overflow-hidden print:shadow-none print:border print:border-black">
                <thead>
                  <tr className="bg-violet-600 text-white print:bg-white print:text-black">
                    <th className="p-3 border border-violet-500 w-20 text-center print:border print:border-black">Buổi</th>
                    <th className="p-3 border border-violet-500 w-16 text-center print:border print:border-black">Tiết</th>
                    {DAYS_OF_WEEK.map(day => (
                      <th key={day} className="p-3 border border-violet-500 text-center w-32 print:border print:border-black">{day}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white text-slate-800">
                  {/* Morning Session */}
                  {PERIODS_MORNING.map((period, index) => (
                    <tr key={`sang-${period}`} className="hover:bg-violet-50 transition-colors print:hover:bg-white">
                      {index === 0 && (
                        <td rowSpan={PERIODS_MORNING.length} className="p-2 border border-violet-100 text-center font-bold text-orange-600 bg-orange-50 vertical-middle writing-mode-vertical uppercase tracking-widest print:border print:border-black print:text-black print:bg-white">
                          Sáng
                        </td>
                      )}
                      <td className="p-2 border border-violet-100 text-center font-bold text-slate-500 print:border print:border-black print:text-black">{period}</td>
                      {DAYS_OF_WEEK.map(day => {
                        const cellData = getCellData(day, period);
                        return (
                          <td key={`${day}-${period}`} className="p-2 border border-violet-100 text-center h-16 align-middle print:border print:border-black">
                            {cellData ? (
                              <div className="flex flex-col items-center">
                                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded mb-1 border border-emerald-100 print:border-none print:bg-white print:text-black print:text-base">
                                  {cellData.className}
                                </span>
                                <span className="text-xs font-medium text-slate-600 line-clamp-2 print:text-black print:text-sm">
                                  {cellData.subject}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-200 print:hidden">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}

                  {/* Divider */}
                  <tr className="h-2 bg-slate-100 border-t border-b border-slate-200 print:hidden">
                    <td colSpan={2 + DAYS_OF_WEEK.length}></td>
                  </tr>

                  {/* Afternoon Session */}
                  {PERIODS_AFTERNOON.map((period, index) => {
                    const displayPeriod = period - 4; 
                    
                    return (
                      <tr key={`chieu-${period}`} className="hover:bg-blue-50 transition-colors print:hover:bg-white">
                        {index === 0 && (
                          <td rowSpan={PERIODS_AFTERNOON.length} className="p-2 border border-violet-100 text-center font-bold text-blue-600 bg-blue-50 vertical-middle writing-mode-vertical uppercase tracking-widest print:border print:border-black print:text-black print:bg-white">
                            Chiều
                          </td>
                        )}
                        <td className="p-2 border border-violet-100 text-center font-bold text-slate-500 print:border print:border-black print:text-black">{displayPeriod}</td>
                        {DAYS_OF_WEEK.map(day => {
                          const cellData = getCellData(day, period);
                          return (
                            <td key={`${day}-${period}`} className="p-2 border border-violet-100 text-center h-16 align-middle print:border print:border-black">
                              {cellData ? (
                                <div className="flex flex-col items-center">
                                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded mb-1 border border-emerald-100 print:border-none print:bg-white print:text-black print:text-base">
                                    {cellData.className}
                                  </span>
                                  <span className="text-xs font-medium text-slate-600 line-clamp-2 print:text-black print:text-sm">
                                    {cellData.subject}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-200 print:hidden">-</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
             </table>
             <div className="hidden print:block mt-8 text-center italic">
                (Ký tên)
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimetableManager;
