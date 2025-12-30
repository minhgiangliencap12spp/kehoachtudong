import * as XLSX from 'xlsx';
import { PPCTEntry, ScheduleRow, EquipmentRow, EquipmentConfigEntry, DAYS_OF_WEEK } from '../types';

export const importPPCTFromExcel = (file: File, subjectName: string): Promise<PPCTEntry[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
        const result: PPCTEntry[] = [];
        
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (row.length >= 2) {
             let num = row[0];
             let name = row[1];
             if (row.length > 2 && (String(row[1]).match(/^\d+$/) || !isNaN(Number(row[1])))) {
                num = row[1];
                name = row[2];
             }
             if (num && name) {
               result.push({
                 lessonNumber: String(num).trim(),
                 lessonName: String(name).trim(),
                 subject: subjectName
               });
             }
          }
        }
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};

export const importEquipmentConfigFromExcel = (file: File, subjectName: string): Promise<EquipmentConfigEntry[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
        const entryMap = new Map<string, EquipmentConfigEntry>();
        
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (row.length >= 2) {
             let num = row[0];
             let eqName = row[1];
             let qty = row[2];
             if (row.length >= 3 && typeof row[1] === 'string' && row[1].length > 5 && isNaN(Number(row[1]))) {
                 if (row[2]) {
                   eqName = row[2];
                   qty = row[3];
                 } else continue;
             }
             if (num && eqName) {
               const lessonKey = String(num).trim();
               const cleanName = String(eqName).trim();
               const cleanQty = qty ? String(qty).trim() : '1';
               if (entryMap.has(lessonKey)) {
                 const existing = entryMap.get(lessonKey)!;
                 if (!existing.equipmentName.includes(cleanName)) {
                   existing.equipmentName = `${existing.equipmentName}, ${cleanName}`;
                 }
               } else {
                 entryMap.set(lessonKey, {
                   lessonNumber: lessonKey,
                   equipmentName: cleanName,
                   quantity: cleanQty,
                   subject: subjectName
                 });
               }
             }
          }
        }
        resolve(Array.from(entryMap.values()));
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};

export const readExcelToText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const csv = XLSX.utils.sheet_to_csv(sheet);
        resolve(csv);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};

const formatDayNumber = (dayName: string) => {
  if (dayName.toLowerCase().includes('chủ nhật')) return 'CN';
  const match = dayName.match(/\d+/);
  return match ? match[0] : dayName;
};

const calculateDate = (startDateStr: string, dayOffset: number): string => {
  try {
    const parts = startDateStr.split('/');
    if (parts.length !== 3) return "";
    const [d, m, y] = parts.map(Number);
    const date = new Date(Date.UTC(y, m - 1, d)); 
    date.setUTCDate(date.getUTCDate() + dayOffset);
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
  } catch (e) {
    return "";
  }
};

const getPeriodLabel = (p: number) => {
  if (p <= 4) return p.toString();
  return (p - 4).toString();
};

const generateBaseHTML = (
  weekNumber: number,
  startDateStr: string,
  endDateStr: string,
  title: string,
  headers: string[],
  rowsGenerator: (dayName: string, dateStr: string, dayNum: string) => string,
  customFooter?: string
) => {
  return `
  <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <style>
      /* Page setup: A4 Landscape, Margins: T2, B2, R2, L3 cm */
      @page {
        size: A4 landscape;
        margin: 2cm 2cm 2cm 3cm;
        mso-page-orientation: landscape;
      }
      body { font-family: 'Times New Roman', serif; font-size: 11.5pt; color: #000; }
      
      /* Main Table Frame - Standard borders (0.5pt) */
      table.main-table { 
        border-collapse: collapse; 
        width: 100%; 
        margin-bottom: 20px; 
        table-layout: fixed; 
        border: 0.5pt solid #000; 
      }
      
      td, th { border: 0.5pt solid #000; vertical-align: middle; text-align: center; font-size: 11pt; word-wrap: break-word; }
      
      /* Header Styling */
      .header-title { font-size: 16pt; font-weight: bold; border: none; padding: 10px; text-transform: uppercase; text-align: center; color: #b91c1c; }
      .header-sub { font-size: 12.5pt; font-style: italic; border: none; padding-bottom: 20px; text-align: center; font-weight: bold; color: #475569; }
      
      /* Table Headers */
      .thead-cell { 
        background-color: #fce7f3; 
        font-weight: bold; 
        font-size: 11pt; 
        height: 42px; 
        text-align: center; 
        color: #831843; 
        border: 0.5pt solid #000; 
      }
      
      /* Day & Date Style */
      .day-cell { 
        width: 6.5%; 
        font-size: 11pt; 
        font-weight: bold; 
        background-color: #ffffff; 
      }
      .day-num { font-size: 14pt; color: #4338ca; }
      .day-date { font-size: 10pt; font-style: italic; color: #64748b; font-weight: normal; }
      
      /* Session Indicator Styles - Bold, Italic, Normal Case */
      .session-cell { 
        font-weight: bold; 
        font-style: italic; 
        width: 4%; 
        writing-mode: vertical-rl; 
        transform: rotate(180deg); 
        text-transform: none; 
        font-size: 11pt; 
      }
      /* Specific session background colors for visibility */
      .session-sang { background-color: #fff9db !important; color: #856404; }
      .session-chieu { background-color: #e7f3ff !important; color: #004085; }
      
      /* Column Data Styles */
      .col-period { width: 3.5%; font-weight: bold; }
      .col-subject { width: 13%; text-align: left; padding-left: 6px; font-weight: bold; color: #0f172a; }
      .col-class { width: 6%; font-weight: bold; color: #047857; }
      .col-ppct { width: 6%; font-weight: bold; color: #6d28d9; }
      .col-main { width: 44%; text-align: left; padding-left: 6px; }
      .col-note { width: 17%; text-align: left; padding-left: 6px; font-style: italic; color: #475569; }
      
      /* Background colors for Morning and Afternoon rows to distinguish them easily */
      .row-data { height: 35px; }
      .row-morning td { background-color: #fffef0; } /* Light yellow tint for morning */
      .row-afternoon td { background-color: #f5faff; font-style: italic; } /* Light blue tint for afternoon */
      
      .text-bold { font-weight: bold; }

      .row-empty { height: 20px; background-color: #fafafa; }
      .row-empty td { border: 0.5pt solid #000; }
      .row-empty .col-period { color: #cbd5e1; font-weight: normal; font-size: 9pt; }

      /* Footer Layout */
      .footer-table td { border: none; padding: 25px 15px; vertical-align: top; font-size: 12pt; }
      .sign-title { font-weight: bold; text-transform: uppercase; font-size: 11.5pt; margin-bottom: 8px; }
      .sign-space { height: 90px; }
      .sign-name { font-weight: bold; font-size: 12pt; text-decoration: underline; }
    </style>
  </head>
  <body>
    <table class="main-table">
      <colgroup>
        <col style="width: 6.5%;">
        <col style="width: 4%;">
        <col style="width: 3.5%;">
        <col style="width: 13%;">
        <col style="width: 6%;">
        <col style="width: 6%;">
        <col style="width: 44%;">
        <col style="width: 17%;">
      </colgroup>
      <tr>
        <td colspan="8" class="header-title">${title} TUẦN ${weekNumber}</td>
      </tr>
      <tr>
        <td colspan="8" class="header-sub">(Từ ngày ${startDateStr} đến ngày ${endDateStr})</td>
      </tr>
      <tr>
        ${headers.map(h => `<th class="thead-cell">${h}</th>`).join('')}
      </tr>
      ${DAYS_OF_WEEK.map((dayName, index) => {
        const dateStr = calculateDate(startDateStr, index);
        const dayNum = formatDayNumber(dayName);
        return rowsGenerator(dayName, dateStr, dayNum);
      }).join('')}
    </table>
    ${customFooter}
  </body>
  </html>
  `;
}

const generateScheduleHTML = (
  schedule: ScheduleRow[], 
  weekNumber: number, 
  startDateStr: string, 
  endDateStr: string,
  isWord: boolean = false,
  teacherName?: string
) => {
  const defaultFooter = `
    <table class="footer-table" style="margin-top: 20px; border: none; width: 100%;">
      <tr>
        <td style="width: 50%; text-align: center;">
          <div class="sign-title">NGƯỜI LẬP BIỂU</div>
          <div style="font-style: italic; font-size: 11pt;">(Ký và ghi rõ họ tên)</div>
          <div class="sign-space"></div>
          <div class="sign-name">${teacherName || '................................................'}</div>
        </td>
        <td style="width: 50%; text-align: center;">
          <div class="sign-title">DUYỆT CỦA BAN GIÁM HIỆU</div>
          <div style="font-style: italic; font-size: 11pt;">(Ký và đóng dấu)</div>
          <div class="sign-space"></div>
          <div class="sign-name">................................................</div>
        </td>
      </tr>
    </table>
  `;

  return generateBaseHTML(
    weekNumber, startDateStr, endDateStr,
    "LỊCH BÁO GIẢNG",
    ["Thứ/Ngày", "Buổi", "Tiết", "Môn", "Lớp", "PPCT", "Tên Bài Dạy", "Ghi Chú"],
    (dayName, dateStr, dayNum) => {
      let rowsHtml = '';
      for (let period = 1; period <= 7; period++) {
        const rowData = schedule.find(
          s => s.week === weekNumber && s.dayOfWeek === dayName && s.period === period
        );
        const periodLabel = getPeriodLabel(period);
        const isAfternoon = period > 4;
        const rowDataClass = isAfternoon ? 'row-afternoon' : 'row-morning';
        const hasContent = rowData && (rowData.subject || rowData.className || rowData.lessonName || rowData.notes);
        const rowClass = hasContent ? `row-data ${rowDataClass}` : 'row-empty';

        rowsHtml += `<tr class="${rowClass}">`;
        if (period === 1) {
          rowsHtml += `<td rowspan="7" class="day-cell"><span class="day-num">${dayNum}</span><br/><span class="day-date">${dateStr}</span></td>`;
          rowsHtml += `<td rowspan="4" class="session-cell session-sang">Sáng</td>`;
        }
        if (period === 5) {
          rowsHtml += `<td rowspan="3" class="session-cell session-chieu">Chiều</td>`;
        }

        rowsHtml += `
          <td class="col-period">${periodLabel}</td>
          <td class="col-subject">${rowData?.subject || ''}</td>
          <td class="col-class">${rowData?.className || ''}</td>
          <td class="col-ppct">${rowData?.ppctNumber || ''}</td>
          <td class="col-main ${hasContent ? 'text-bold' : ''}">${rowData?.lessonName || ''}</td>
          <td class="col-note">${rowData?.notes || ''}</td>
        </tr>`;
      }
      return rowsHtml;
    },
    defaultFooter
  );
};

const generateEquipmentHTML = (
  equipment: EquipmentRow[], 
  weekNumber: number, 
  startDateStr: string, 
  endDateStr: string,
  isWord: boolean = false,
  teacherName?: string
) => {
  const equipmentFooter = `
    <table class="footer-table" style="margin-top: 20px; border: none; width: 100%;">
      <tr>
        <td style="width: 33%; text-align: center;">
          <div class="sign-title">NGƯỜI LẬP BIỂU</div>
          <div style="font-style: italic; font-size: 11pt;">(Ký và ghi rõ họ tên)</div>
          <div class="sign-space"></div>
          <div class="sign-name">${teacherName || '................................................'}</div>
        </td>
        <td style="width: 33%; text-align: center;">
          <div class="sign-title">CÁN BỘ TV - TB</div>
          <div style="font-style: italic; font-size: 11pt;">(Ký và ghi rõ họ tên)</div>
          <div class="sign-space"></div>
          <div class="sign-name">................................................</div>
        </td>
        <td style="width: 34%; text-align: center;">
          <div class="sign-title">DUYỆT CỦA BAN GIÁM HIỆU</div>
          <div style="font-style: italic; font-size: 11pt;">(Ký và đóng dấu)</div>
          <div class="sign-space"></div>
          <div class="sign-name">................................................</div>
        </td>
      </tr>
    </table>
  `;

  return generateBaseHTML(
    weekNumber, startDateStr, endDateStr,
    "PHIẾU ĐĂNG KÝ THIẾT BỊ",
    ["Thứ/Ngày", "Buổi", "Tiết", "Môn", "Lớp", "PPCT", "Tên Thiết Bị", "SL"],
    (dayName, dateStr, dayNum) => {
      let rowsHtml = '';
      for (let period = 1; period <= 7; period++) {
        const rowData = equipment.find(
          s => s.week === weekNumber && s.dayOfWeek === dayName && s.period === period
        );
        const periodLabel = getPeriodLabel(period);
        const isAfternoon = period > 4;
        const rowDataClass = isAfternoon ? 'row-afternoon' : 'row-morning';
        const eqName = rowData?.equipmentName || '';
        const qty = rowData?.quantity || (eqName ? '1' : '');
        const hasContent = rowData && (rowData.subject || rowData.className || eqName);
        const rowClass = hasContent ? `row-data ${rowDataClass}` : 'row-empty';

        rowsHtml += `<tr class="${rowClass}">`;
        if (period === 1) {
          rowsHtml += `<td rowspan="7" class="day-cell"><span class="day-num">${dayNum}</span><br/><span class="day-date">${dateStr}</span></td>`;
          rowsHtml += `<td rowspan="4" class="session-cell session-sang">Sáng</td>`;
        }
        if (period === 5) {
          rowsHtml += `<td rowspan="3" class="session-cell session-chieu">Chiều</td>`;
        }

        rowsHtml += `
          <td class="col-period">${periodLabel}</td>
          <td class="col-subject">${rowData?.subject || ''}</td>
          <td class="col-class">${rowData?.className || ''}</td>
          <td class="col-ppct">${rowData?.ppctNumber || ''}</td>
          <td class="col-main ${hasContent ? 'text-bold' : ''}">${eqName}</td>
          <td class="col-note" style="text-align: center; font-weight: bold;">${qty}</td>
        </tr>`;
      }
      return rowsHtml;
    },
    equipmentFooter
  );
};

const downloadFile = (content: string, fileName: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const exportScheduleToExcel = (schedule: ScheduleRow[], week: number, start: string, end: string, teacherName?: string) => {
  const html = generateScheduleHTML(schedule, week, start, end, false, teacherName);
  downloadFile(html, `Lich_Bao_Giang_Tuan_${week}.xls`, 'application/vnd.ms-excel');
};

export const exportScheduleToWord = (schedule: ScheduleRow[], week: number, start: string, end: string, teacherName?: string) => {
  const html = generateScheduleHTML(schedule, week, start, end, true, teacherName);
  downloadFile(html, `Lich_Bao_Giang_Tuan_${week}.doc`, 'application/msword');
};

export const exportEquipmentToExcel = (equipment: EquipmentRow[], week: number, start: string, end: string, teacherName?: string) => {
  const html = generateEquipmentHTML(equipment, week, start, end, false, teacherName);
  downloadFile(html, `Phieu_Thiet_Bi_Tuan_${week}.xls`, 'application/vnd.ms-excel');
};

export const exportEquipmentToWord = (equipment: EquipmentRow[], week: number, start: string, end: string, teacherName?: string) => {
  const html = generateEquipmentHTML(equipment, week, start, end, true, teacherName);
  downloadFile(html, `Phieu_Thiet_Bi_Tuan_${week}.doc`, 'application/msword');
};