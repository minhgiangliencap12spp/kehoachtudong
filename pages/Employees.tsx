
import React from 'react';

const MOCK_EMPLOYEES = [
  { id: 'EMP001', name: 'Nguyễn Văn A', role: 'Senior Developer', department: 'Product', status: 'In Office', avatar: 'https://picsum.photos/seed/a/100' },
  { id: 'EMP002', name: 'Trần Thị B', role: 'UI/UX Designer', department: 'Product', status: 'On Leave', avatar: 'https://picsum.photos/seed/b/100' },
  { id: 'EMP003', name: 'Lê Văn C', role: 'Product Manager', department: 'Growth', status: 'Remote', avatar: 'https://picsum.photos/seed/c/100' },
  { id: 'EMP004', name: 'Phạm Minh D', role: 'HR Specialist', department: 'Admin', status: 'In Office', avatar: 'https://picsum.photos/seed/d/100' },
  { id: 'EMP005', name: 'Hoàng Anh E', role: 'QA Engineer', department: 'Quality', status: 'In Office', avatar: 'https://picsum.photos/seed/e/100' },
];

const Employees: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Danh sách nhân sự</h2>
          <p className="text-slate-500 text-sm">Xem trạng thái làm việc của đồng nghiệp.</p>
        </div>
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700">
          + Thêm mới
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_EMPLOYEES.map((emp) => (
          <div key={emp.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex items-start justify-between mb-4">
              <div className="relative">
                <img src={emp.avatar} alt={emp.name} className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-sm" />
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                  emp.status === 'In Office' ? 'bg-green-500' : emp.status === 'Remote' ? 'bg-blue-500' : 'bg-amber-500'
                }`}></div>
              </div>
              <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                emp.status === 'In Office' ? 'bg-green-50 text-green-600' : emp.status === 'Remote' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
              }`}>
                {emp.status}
              </span>
            </div>
            
            <h4 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{emp.name}</h4>
            <p className="text-xs text-slate-500 mb-4">{emp.role} • {emp.department}</p>
            
            <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
              <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-6 h-6 rounded-full bg-slate-100 border border-white flex items-center justify-center text-[10px] text-slate-400">
                    <i className="fas fa-user"></i>
                  </div>
                ))}
              </div>
              <button className="text-xs font-bold text-indigo-600 hover:underline">Xem chi tiết</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Employees;
