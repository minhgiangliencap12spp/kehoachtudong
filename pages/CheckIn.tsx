
import React, { useState, useEffect } from 'react';
import { AttendanceType, Location } from '../types';

interface CheckInProps {
  onAction: (type: AttendanceType, location?: Location, note?: string) => void;
  currentStatus: 'ON' | 'OFF';
}

const CheckIn: React.FC<CheckInProps> = ({ onAction, currentStatus }) => {
  const [time, setTime] = useState(new Date());
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAction = () => {
    setLoading(true);
    setError(null);

    const type = currentStatus === 'OFF' ? AttendanceType.CHECK_IN : AttendanceType.CHECK_OUT;

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };
          setLocation(loc);
          onAction(type, loc, note);
          setLoading(false);
          setNote('');
          alert(`${type === AttendanceType.CHECK_IN ? 'Vào ca' : 'Tan làm'} thành công!`);
        },
        (err) => {
          console.error(err);
          setError('Không thể lấy vị trí. Vui lòng cho phép quyền truy cập GPS.');
          onAction(type, undefined, note); // Still allow check-in but without location
          setLoading(false);
          setNote('');
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      onAction(type, undefined, note);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          {currentStatus === 'OFF' ? 'Bắt đầu làm việc' : 'Kết thúc làm việc'}
        </h2>
        <p className="text-slate-500">Hôm nay: {time.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl text-center space-y-6">
        <div className="space-y-1">
          <p className="text-6xl font-bold text-indigo-600 tracking-tighter">
            {time.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
          </p>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">Giờ hệ thống hiện tại</p>
        </div>

        <div className="relative group">
          <button
            onClick={handleAction}
            disabled={loading}
            className={`w-40 h-40 rounded-full border-8 transition-all flex flex-col items-center justify-center gap-2 ${
              loading 
                ? 'bg-slate-100 border-slate-200 cursor-not-allowed' 
                : currentStatus === 'OFF'
                ? 'bg-indigo-600 border-indigo-100 text-white hover:scale-105 active:scale-95 shadow-lg shadow-indigo-200'
                : 'bg-rose-500 border-rose-100 text-white hover:scale-105 active:scale-95 shadow-lg shadow-rose-200'
            } mx-auto`}
          >
            {loading ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400"></div>
            ) : (
              <>
                <i className={`fas ${currentStatus === 'OFF' ? 'fa-sign-in-alt' : 'fa-sign-out-alt'} text-3xl`}></i>
                <span className="font-bold text-lg uppercase tracking-wider">{currentStatus === 'OFF' ? 'Vào ca' : 'Tan làm'}</span>
              </>
            )}
          </button>
        </div>

        <div className="space-y-4">
          <textarea
            placeholder="Thêm ghi chú (không bắt buộc)..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none transition-all"
            rows={2}
          ></textarea>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs flex items-center gap-2">
              <i className="fas fa-exclamation-circle"></i>
              {error}
            </div>
          )}

          <div className="flex items-center justify-center gap-2 text-slate-400">
            <i className="fas fa-map-marker-alt text-xs"></i>
            <span className="text-xs">
              {location ? `Vị trí: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : 'Đang lấy tọa độ GPS...'}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
        <div className="flex gap-4">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-indigo-600 shrink-0">
            <i className="fas fa-info-circle"></i>
          </div>
          <div>
            <h4 className="text-sm font-bold text-indigo-800 mb-1">Quy định chấm công</h4>
            <p className="text-xs text-indigo-600/80 leading-relaxed">
              Vui lòng thực hiện chấm công đúng giờ quy định (8:00 - 17:30). Hệ thống sẽ tự động ghi nhận vị trí để xác thực văn phòng.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckIn;
