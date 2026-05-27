export type AttendanceStatus =
  | "present"
  | "on leave"
  | "late"
  | "half day"
  | "checked out"
  | "absent";

export type MonthlyStatus = "on track" | "warning" | "critical";

export interface DailyRecord {
  id: string;
  employeeId: string;
  name: string;
  role: string;
  avatarUrl?: string | null;
  status: AttendanceStatus;
  location?: string;
  loginTime?: string;
  logoutTime?: string;
  totalHours?: string;
}

export interface MonthlyRecord {
  id: string;
  employeeId: string;
  name: string;
  role: string;
  avatarUrl?: string | null;
  attendanceRate: number;
  totalPresent: number;
  totalLate: number;
  totalLeaves: number;
  monthlyStatus: MonthlyStatus;
}