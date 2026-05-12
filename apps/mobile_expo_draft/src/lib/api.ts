import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://localhost:4000/api';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor — attach Bearer token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const raw = await AsyncStorage.getItem('auth-storage');
      if (raw) {
        const parsed = JSON.parse(raw);
        const token: string | undefined = parsed?.state?.token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch {
      // token unavailable — continue unauthenticated
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

// Response interceptor — surface errors uniformly
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

// ─── Typed API helpers ────────────────────────────────────────────────────────

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: 'student' | 'teacher' | 'parent' | 'admin';
    avatarUrl?: string;
  };
}

export interface Course {
  id: string;
  title: string;
  description: string;
  teacherName: string;
  coverColor: string;
  progress: number;
}

export interface Assignment {
  id: string;
  title: string;
  courseTitle: string;
  dueDate: string;
  status: 'pending' | 'submitted' | 'graded' | 'late';
  maxScore: number;
  score?: number;
}

export interface Grade {
  id: string;
  courseTitle: string;
  assignmentTitle: string;
  score: number;
  maxScore: number;
  gradedAt: string;
  feedback?: string;
}

export interface AiMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AttendanceSummary {
  rate: number;
  present: number;
  absent: number;
  total: number;
}

// Auth
export const login = (payload: LoginPayload) =>
  apiClient.post<AuthResponse>('/auth/login', payload).then((r) => r.data);

// Student
export const fetchEnrolledCourses = () =>
  apiClient.get<Course[]>('/student/courses').then((r) => r.data);

export const fetchAssignments = () =>
  apiClient.get<Assignment[]>('/student/assignments').then((r) => r.data);

export const submitAssignment = (id: string, text: string) =>
  apiClient.post(`/student/assignments/${id}/submit`, { text }).then((r) => r.data);

export const fetchGrades = () =>
  apiClient.get<Grade[]>('/student/grades').then((r) => r.data);

export const fetchAttendance = () =>
  apiClient.get<AttendanceSummary>('/student/attendance').then((r) => r.data);

export const sendAiMessage = (messages: AiMessage[]) =>
  apiClient.post<{ reply: string }>('/ai/chat', { messages }).then((r) => r.data);

// Teacher
export const fetchTeacherCourses = () =>
  apiClient.get<Course[]>('/teacher/courses').then((r) => r.data);

export const fetchTeacherAssignments = () =>
  apiClient.get<Assignment[]>('/teacher/assignments').then((r) => r.data);

// Parent
export interface Child {
  id: string;
  name: string;
  grade: string;
  avatarUrl?: string;
  attendanceRate: number;
  gpa: number;
}

export const fetchChildren = () =>
  apiClient.get<Child[]>('/parent/children').then((r) => r.data);
