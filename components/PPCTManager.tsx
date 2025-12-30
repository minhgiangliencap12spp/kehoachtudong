
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { PPCTEntry } from '../types';
import { importPPCTFromExcel } from '../services/excelService';
import { parsePPCTFromText } from '../services/geminiService';
import { SAMPLE_PPCT } from '../data/sampleData';
import { FileSpreadsheet, Upload, Bot, Loader2, Trash2, Filter, AlertCircle, Save, Database } from 'lucide-react';

interface Props {
  data: PPCTEntry[];
  onUpdate: (data: PPCTEntry[]) => void;
  availableSubjects: string[];
}

const PPCTManager: React.FC<Props> = ({ data, onUpdate, availableSubjects }) => {
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showAiInput, setShowAiInput] = useState(false);
  const [aiText, setAiText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-select first subject when the filtered list changes
  useEffect(() => {
    if (availableSubjects.length > 0) {
      if (!selectedSubject || !availableSubjects.includes(selectedSubject)) {
        setSelectedSubject(availableSubjects[0]);
      }
    } else {
      setSelectedSubject('');
    }
  }, [availableSubjects, selectedSubject]);

  const filteredData = useMemo(() => {
    return data.filter(entry => entry.subject === selectedSubject);
  }, [data, selectedSubject]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedSubject) {
      alert("Vui lòng chọn môn học trước khi nhập.");
      return;
    }
    
    if (e.target.files && e.target.files[0]) {
      try {
        const newEntries = await importPPCTFromExcel(e.target.files[0], selectedSubject);
        const otherData = data.filter(d => d.subject !== selectedSubject);
        onUpdate([...otherData, ...newEntries]);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (err) {
        alert("Lỗi khi đọc file Excel.");
      }
    }
  };

  const handleAiParse = async () => {
    if (!aiText.trim()) return;
    if (!selectedSubject) {
      alert("Vui lòng chọn môn học trước khi nhập.");
      return;
    }

    setIsAiLoading(true);
    try {
      const parsedData = await parsePPCTFromText(aiText);
      const taggedData = parsedData.map(d => ({ ...d, subject: selectedSubject }));
      const otherData = data.filter(d => d.subject !== selectedSubject);
      onUpdate([...otherData, ...taggedData]);
      setShowAiInput(false);
      setAiText('');
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleLoadSample = () => {
    if (!selectedSubject) return;
    const samples = SAMPLE_PPCT.filter(s => s.subject === selectedSubject);
    if (samples.length === 0) {
      alert(`Chưa có mẫu cho môn "${selectedSubject}".`);
      return;
    }
    if (confirm(`Nạp bài mẫu cho môn ${selectedSubject}?`)) {
       const otherData = data.filter(d => d.subject !== selectedSubject);
       onUpdate([...otherData, ...samples]);
    }
  };

  const clearSubjectData = () => {
    if (confirm(`Xóa PPCT của môn ${selectedSubject}?`)) {
      onUpdate(data.filter(d => d.subject !== selectedSubject));
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-orange-100 p-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-orange-500" />
            <span className="bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
              Danh sách Bài dạy (PPCT)
            </span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Hiển thị các môn bạn đang giảng dạy theo Thời khóa biểu cá nhân.
          </p>
        </div>
      </div>

      <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-200 mb-6 flex flex-wrap gap-4 items-end">
        <div className="flex flex-col gap-1 w-full md:w-auto min-w-[200px]">
           <label className="text-xs font-bold text-orange-700 uppercase tracking-wide">Môn học đang chọn</label>
           <div className="relative">
             <select
               value={selectedSubject}
               onChange={(e) => setSelectedSubject(e.target.value)}
               className="w-full p-2.5 pl-3 pr-10 bg-white border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none appearance-none font-bold text-slate-700 shadow-sm"
             >
                {availableSubjects.length === 0 && <option value="">(Không có môn nào)</option>}
                {availableSubjects.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
             </select>
             <Filter className="absolute right-3 top-3 w-4 h-4 text-orange-400 pointer-events-none" />
           </div>
        </div>

        {selectedSubject && (
          <div className="flex gap-2 flex-wrap">
             <input type="file" accept=".xlsx,.xls" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
             <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-bold shadow-md shadow-emerald-200"><Upload className="w-4 h-4" /> Excel</button>
             <button onClick={() => setShowAiInput(!showAiInput)} className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-bold shadow-md shadow-purple-200"><Bot className="w-4 h-4" /> AI</button>
             <button onClick={handleLoadSample} className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-bold shadow-md shadow-blue-200"><Database className="w-4 h-4" /> Mẫu</button>
             {filteredData.length > 0 && (
               <button onClick={clearSubjectData} className="px-4 py-2.5 bg-white text-rose-500 border border-rose-200 hover:bg-rose-50 rounded-lg text-sm font-bold"><Trash2 className="w-4 h-4" /></button>
             )}
          </div>
        )}
      </div>

      {showAiInput && (
        <div className="mb-6 p-4 bg-purple-50 rounded-xl border border-purple-200 shadow-inner animate-in fade-in">
          <textarea
            value={aiText}
            onChange={(e) => setAiText(e.target.value)}
            className="w-full h-32 p-3 text-sm border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
            placeholder={`Dán nội dung PPCT cho môn: ${selectedSubject}...`}
          />
          <div className="flex justify-end mt-2">
             <button onClick={handleAiParse} disabled={isAiLoading || !aiText.trim()} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium">
               {isAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />} Phân tích
             </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto border border-orange-200 rounded-lg bg-white">
        {!selectedSubject ? (
             <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-orange-50/20">
               <AlertCircle className="w-10 h-10 mb-2 opacity-40 text-orange-400"/>
               <p className="font-bold">Chưa có môn dạy.</p>
               <p className="text-sm">Vui lòng chọn giáo viên và nạp TKB Cá nhân trước.</p>
             </div>
        ) : filteredData.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
            <FileSpreadsheet className="w-12 h-12 mb-3 opacity-50 text-orange-400" />
            <p>Môn <span className="font-bold text-orange-600">{selectedSubject}</span> chưa có danh sách bài.</p>
            <p className="text-sm mt-1">Hãy tải Excel hoặc dùng AI để nạp bài dạy.</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-orange-100/80 sticky top-0 z-10 shadow-sm backdrop-blur-sm">
              <tr>
                <th className="px-4 py-3 font-bold text-orange-800 w-24">Tiết</th>
                <th className="px-4 py-3 font-bold text-orange-800">Tên Bài Học</th>
                <th className="px-4 py-3 font-bold text-orange-800 w-32 text-right">Lưu trữ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-100">
              {filteredData.map((entry, idx) => (
                <tr key={idx} className="hover:bg-orange-50 transition-colors">
                  <td className="px-4 py-2 font-bold text-orange-600">{entry.lessonNumber}</td>
                  <td className="px-4 py-2 text-slate-800 font-medium">{entry.lessonName}</td>
                  <td className="px-4 py-2 text-right"><span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-100">Cloud Sync</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default PPCTManager;
