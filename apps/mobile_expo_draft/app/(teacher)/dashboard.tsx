import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  I18nManager,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { fetchTeacherCourses, fetchTeacherAssignments } from '../../src/lib/api';
import { useAuthStore } from '../../src/stores/authStore';
import { Card } from '../../src/components/ui/Card';
import { Avatar } from '../../src/components/ui/Avatar';
import { Spinner } from '../../src/components/ui/Spinner';

const isRTL = I18nManager.isRTL;

const t = {
  greeting: (name: string) => (isRTL ? `مرحباً أستاذ ${name}` : `Welcome, ${name}`),
  subtitle: isRTL ? 'لوحة تحكم المعلم' : 'Teacher Dashboard',
  myCourses: isRTL ? 'مقرراتي' : 'My Courses',
  recentAssignments: isRTL ? 'الواجبات الأخيرة' : 'Recent Assignments',
  students: isRTL ? 'طالب' : 'Students',
  progress: isRTL ? 'التقدم' : 'Progress',
  status: isRTL ? 'الحالة' : 'Status',
  logout: isRTL ? 'تسجيل الخروج' : 'Logout',
  logoutConfirm: isRTL ? 'هل تريد تسجيل الخروج؟' : 'Are you sure you want to logout?',
  yes: isRTL ? 'نعم' : 'Yes',
  cancel: isRTL ? 'إلغاء' : 'Cancel',
  totalCourses: isRTL ? 'المقررات' : 'Courses',
  totalAssignments: isRTL ? 'الواجبات' : 'Assignments',
  pendingGrading: isRTL ? 'بانتظار التصحيح' : 'To Grade',
};

export default function TeacherDashboard() {
  const { user, clearAuth } = useAuthStore();

  const {
    data: courses,
    isLoading: loadingCourses,
    refetch: refetchCourses,
  } = useQuery({ queryKey: ['teacherCourses'], queryFn: fetchTeacherCourses });

  const {
    data: assignments,
    isLoading: loadingAssignments,
    refetch: refetchAssignments,
  } = useQuery({ queryKey: ['teacherAssignments'], queryFn: fetchTeacherAssignments });

  const isLoading = loadingCourses || loadingAssignments;

  const pendingGrading = (assignments ?? []).filter((a) => a.status === 'submitted').length;

  const onRefresh = () => {
    refetchCourses();
    refetchAssignments();
  };

  const handleLogout = () => {
    Alert.alert('', t.logoutConfirm, [
      { text: t.cancel, style: 'cancel' },
      { text: t.yes, style: 'destructive', onPress: clearAuth },
    ]);
  };

  const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: isRTL ? 'معلّق' : 'Pending', color: '#d97706', bg: '#fffbeb' },
    submitted: { label: isRTL ? 'مُسلَّم' : 'Submitted', color: '#2563eb', bg: '#eff6ff' },
    graded: { label: isRTL ? 'مُصحَّح' : 'Graded', color: '#059669', bg: '#ecfdf5' },
    late: { label: isRTL ? 'متأخر' : 'Late', color: '#dc2626', bg: '#fef2f2' },
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor="#1e3a5f" />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, isRTL && styles.rowReverse]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.greeting, isRTL && styles.rtlText]}>
              {t.greeting(user?.name ?? '')}
            </Text>
            <Text style={[styles.headerSub, isRTL && styles.rtlText]}>{t.subtitle}</Text>
          </View>
          <View style={{ alignItems: 'center', gap: 6 }}>
            <Avatar name={user?.name} uri={user?.avatarUrl} size={48} />
            <TouchableOpacity onPress={handleLogout}>
              <Text style={styles.logoutText}>{t.logout}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard label={t.totalCourses} value={String(courses?.length ?? 0)} style={{ flex: 1, marginRight: 8 }} />
          <StatCard label={t.totalAssignments} value={String(assignments?.length ?? 0)} style={{ flex: 1, marginHorizontal: 4 }} />
          <StatCard
            label={t.pendingGrading}
            value={String(pendingGrading)}
            accent={pendingGrading > 0}
            style={{ flex: 1, marginLeft: 8 }}
          />
        </View>

        {/* My Courses */}
        <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>{t.myCourses}</Text>
        {isLoading ? (
          <Spinner />
        ) : (courses ?? []).length === 0 ? (
          <Card>
            <Text style={styles.emptyText}>
              {isRTL ? 'لا توجد مقررات مُسنَدة إليك' : 'No courses assigned yet'}
            </Text>
          </Card>
        ) : (
          (courses ?? []).map((c) => (
            <Card key={c.id} style={styles.courseCard}>
              <View style={[styles.courseRow, isRTL && styles.rowReverse]}>
                <View
                  style={[styles.colorBadge, { backgroundColor: c.coverColor || '#1e3a5f' }]}
                />
                <View style={{ flex: 1, marginLeft: isRTL ? 0 : 10, marginRight: isRTL ? 10 : 0 }}>
                  <Text style={[styles.courseTitle, isRTL && styles.rtlText]}>{c.title}</Text>
                  <Text style={[styles.courseDesc, isRTL && styles.rtlText]} numberOfLines={1}>
                    {c.description}
                  </Text>
                </View>
                <Text style={[styles.progressPct, { color: c.coverColor || '#1e3a5f' }]}>
                  {Math.round(c.progress)}%
                </Text>
              </View>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.min(100, c.progress)}%` as any,
                      backgroundColor: c.coverColor || '#1e3a5f',
                    },
                  ]}
                />
              </View>
            </Card>
          ))
        )}

        {/* Recent Assignments */}
        <Text style={[styles.sectionTitle, isRTL && styles.rtlText, { marginTop: 16 }]}>
          {t.recentAssignments}
        </Text>
        {(assignments ?? []).slice(0, 6).map((a) => {
          const s = STATUS_MAP[a.status] ?? STATUS_MAP.pending;
          return (
            <Card key={a.id} style={styles.assignmentCard}>
              <View style={[styles.assignmentRow, isRTL && styles.rowReverse]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.assignmentTitle, isRTL && styles.rtlText]}>{a.title}</Text>
                  <Text style={[styles.assignmentCourse, isRTL && styles.rtlText]}>
                    {a.courseTitle}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
                  <Text style={[styles.statusText, { color: s.color }]}>{s.label}</Text>
                </View>
              </View>
              <Text style={[styles.dueDate, isRTL && styles.rtlText]}>
                {isRTL ? 'الموعد: ' : 'Due: '}
                {new Date(a.dueDate).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}
              </Text>
            </Card>
          );
        })}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ label, value, accent = false, style }: { label: string; value: string; accent?: boolean; style?: object }) {
  return (
    <View style={[statStyles.card, style]}>
      <Text style={[statStyles.value, accent && statStyles.accentValue]}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  value: { fontSize: 22, fontWeight: '800', color: '#1e3a5f', marginBottom: 4 },
  accentValue: { color: '#2563eb' },
  label: { fontSize: 11, color: '#6b7280', textAlign: 'center' },
});

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f3f4f6' },
  content: { padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  rowReverse: { flexDirection: 'row-reverse' },
  rtlText: { textAlign: 'right' },
  greeting: { fontSize: 22, fontWeight: '700', color: '#111827' },
  headerSub: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  logoutText: { fontSize: 12, color: '#dc2626', fontWeight: '600' },
  statsRow: { flexDirection: isRTL ? 'row-reverse' : 'row', marginBottom: 20 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 10 },
  courseCard: { marginBottom: 8 },
  courseRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  colorBadge: { width: 12, height: 12, borderRadius: 6 },
  courseTitle: { fontSize: 14, fontWeight: '600', color: '#111827' },
  courseDesc: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  progressPct: { fontSize: 13, fontWeight: '700' },
  progressBarBg: { height: 6, backgroundColor: '#e5e7eb', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: 6, borderRadius: 3 },
  assignmentCard: { marginBottom: 6 },
  assignmentRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 },
  assignmentTitle: { fontSize: 14, fontWeight: '600', color: '#111827' },
  assignmentCourse: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginLeft: 8 },
  statusText: { fontSize: 11, fontWeight: '700' },
  dueDate: { fontSize: 12, color: '#9ca3af' },
  emptyText: { textAlign: 'center', color: '#9ca3af', fontSize: 14, paddingVertical: 16 },
});
