
export interface PPCTEntry {
  lessonNumber: number | string;
  lessonName: string;
  subject?: string;
  grade?: string;
}

export interface EquipmentConfigEntry {
  lessonNumber: number | string;
  equipmentName: string;
  quantity?: string;
  subject?: string;
  grade?: string;
}

export interface TimetableEntry {
  dayOfWeek: string;
  period: number;
  subject: string;
  className: string;
  teacherName?: string;
}

export interface ScheduleRow {
  id: string;
  week: number;
  dayOfWeek: string; 
  date: string; 
  period: number; 
  subject: string; 
  className: string;
  ppctNumber: string; 
  lessonName: string; 
  notes: string;
  teacherName?: string;
}

export interface EquipmentRow {
  id: string;
  week: number;
  dayOfWeek: string;
  date: string;
  period: number;
  subject: string;
  className: string;
  ppctNumber: string;
  equipmentName: string; 
  quantity: string;      
  teacherName?: string; 
}

export interface TeacherAssignment {
  id: string;
  teacherName: string;
  subject: string;
  quotaPerClass: number;
  assignedClasses: string[];
}

export interface SchoolTimetableEntry {
  day: string;
  period: number;
  className: string;
  subject: string;
  teacherName: string;
}

export enum AppTab {
  TIMETABLE = 'TIMETABLE',
  PPCT = 'PPCT',
  DEVICE_LIST = 'DEVICE_LIST',
  SCHEDULE = 'SCHEDULE',
  EQUIPMENT = 'EQUIPMENT',
  SCHOOL_TIMETABLE = 'SCHOOL_TIMETABLE',
  SETTINGS = 'SETTINGS'
}

export const DAYS_OF_WEEK = [
  'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'
];

export interface ProcessingState {
  status: 'idle' | 'uploading' | 'analyzing' | 'generating' | 'complete' | 'error';
  message?: string;
}

export enum ElementType {
  HEADING_1 = 'HEADING_1',
  HEADING_2 = 'HEADING_2',
  PARAGRAPH = 'PARAGRAPH',
  BULLET_LIST = 'BULLET_LIST',
}

export interface ExtractedElement {
  type: ElementType;
  content?: string;
  items?: string[];
}

export interface ExtractedDocument {
  title: string;
  elements: ExtractedElement[];
}

export interface MathReviewTopic {
  id: string;
  grade: number;
  chapter: string;
  lessonName: string;
  theory: string;
  exercises: string;
  lastUpdated: string;
}

export interface ExamConfiguration {
  subject: string;
  grade: string;
  topic: string;
  duration: number;
  description: string;
  ratios: {
    nb: number;
    th: number;
    vd: number;
    vdc: number;
  };
  questionCount: number;
}

export interface GeneratedExamData {
  matrix: string;
  specification: string;
  examPaper: string;
  answerKey: string;
}

export enum AttendanceType {
  CHECK_IN = 'CHECK_IN',
  CHECK_OUT = 'CHECK_OUT'
}

export interface Location {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface AttendanceRecord {
  id: string;
  timestamp: number;
  type: AttendanceType;
  location?: Location;
  note?: string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  status: string;
  avatar: string;
}
