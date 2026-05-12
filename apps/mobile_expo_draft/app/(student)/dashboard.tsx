import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  I18nManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import {
  fetchEnrolledCourses,
  fetchAssignments,
  fetchAttendance,
} from '../../src/lib/api';
import { useAuthStore } from '../../src/stores/authStore';
import { Card } from '../../src/components/ui/Card';
import { Avatar } from '../../src/components/ui/Avatar';
import { Spinner } from '../../src/components/ui/Spinner';

const isRTL = I18nManager.isRTL;

const t = {
  greeting: (name: string) => (isRTL ? `مرحباً، ${name}` : `Hello, ${name}`),
  subtitle: isRTL ? 'هذا ما ينتظرك اليوم' : "Here's what's waiting for you today",
  attendance: isRTL ? 'معدل الحضور' : 'Attendance Rate',
  enrolledCourses: isRTL ? 'المقررات المسجّلة' : 'Enrolled Courses',
  pendingAssignments: isRTL ? 'الواجبات المعلّقة' : 'Pending Assignments',
  progress: isRTL ? 'التقدم' : 'Progress',
  dueOn: isRTL ? 'موعد التسليم:' : 'Due:',
  noAssignments: isRTL ? 'لا توجد واجبات معلّقة' : 'No pending assignments',
  noCourses: isRTL ? 'لم تُسجَّل في أي مقرر بعد' : 'No enrolled courses yet',
};

export default function StudentDashboard() {
  const user = useAuthStore((s) => s.user);

  const {
    data: courses,
    isLoading: loadingCourses,
    refetch: refetchCourses,
  } = useQuery({ queryKey: ['enrolledCourses'], queryFn: fetchEnrolledCourses });

  const {
    data: assignments,
    isLoading: loadingAssignments,
    refetch: refetchAssignments,
  } = useQuery({ queryKey: ['assignments'], queryFn: fetchAssignments });

  const {
    data: attendance,
    isLoading: loadingAttendance,
    refetch: refetchAttendance,
  } = useQuery({ queryKey: ['attendance'], queryFn: fetchAttendance });

  const isLoading = loadingCourses || loadingAssignments || loadingAttendance;

  const pendingAssignments =
    assignments?.filter((a) => a.status === 'pending' || a.status === 'late') ?? [];

  const onRefresh = () => {
    refetchCourses();
    refetchAssignments();
    refetchAttendance();
  };

  const attendanceRate = attendance?.rate ?? 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scroll}
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
            <Text style={[styles.headerSubtitle, isRTL && styles.rtlText]}>
              {t.subtitle}
            </Text>
          </View>
          <Avatar name={user?.name} uri={user?.avatarUrl} size={48} />
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <StatCard
            label={t.attendance}
            value={`${Math.round(attendanceRate)}%`}
            accent={attendanceRate >= 80}
            style={{ flex: 1, marginRight: 8 }}
          />
          <StatCard
            label={t.enrolledCourses}
            value={String(courses?.length ?? 0)}
            style={{ flex: 1, marginHorizontal: 4 }}
          />
          <StatCard
            label={t.pendingAssignments}
            value={String(pendingAssignments.length)}
            accent={pendingAssignments.length > 0}
            accentColor="#dc2626"
            style={{ flex: 1, marginLeft: 8 }}
          />
        </View>

        {/* Attendance ring */}
        <Card style={styles.attendanceCard}>
          <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>{t.attendance}</Text>
          <View style={styles.attendanceRow}>
            <View style={styles.progressRing}>
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor:
                      attendanceRate >= 80
                        ? '#059669'
                        : attendanceRate >= 60
                        ? '#d97706'
                        : '#dc2626',
                  },
                ]}
              >
                <Text style={styles.progressText}>{Math.round(attendanceRate)}%</Text>
              </View>
            </View>
            <View style={{ marginLeft: 20 }}>
              {attendance && (
                <>
                  <Text style={styles.attendanceDetail}>
                    {isRTL ? `حاضر: ${attendance.present}` : `Present: ${attendance.present}`}
                  </Text>
                  <Text style={styles.attendanceDetail}>
                    {isRTL ? `غائب: ${attendance.absent}` : `Absent: ${attendance.absent}`}
                  </Text>
                  <Text style={styles.attendanceDetail}>
                    {isRTL ? `الإجمالي: ${attendance.total}` : `Total: ${attendance.total}`}
                  </Text>
                </>
              )}
            </View>
          </View>
        </Card>

        {/* Enrolled Courses */}
        <Text style={[styles.sectionTitle, isRTL && styles.rtlText, { marginTop: 16 }]}>
          {t.enrolledCourses}
        </Text>
        {isLoading ? (
          <Spinner />
        ) : courses && courses.length > 0 ? (
          courses.map((course) => (
            <Card key={course.id} style={styles.courseCard}>
              <View style={[styles.courseHeader, isRTL && styles.rowReverse]}>
                <View
                  style={[
                    styles.courseColorDot,
                    { backgroundColor: course.coverColor || '#1e3a5f' },
                  ]}
                />
                <View style={{ flex: 1, marginLeft: isRTL ? 0 : 10, marginRight: isRTL ? 10 : 0 }}>
                  <Text style={[styles.courseTitle, isRTL && styles.rtlText]}>
                    {course.title}
                  </Text>
                  <Text style={[styles.courseTeacher, isRTL && styles.rtlText]}>
                    {course.teacherName}
                  </Text>
                </View>
                <Text style={styles.progressPct}>{Math.round(course.progress)}%</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.min(100, course.progress)}%` as any,
                      backgroundColor: course.coverColor || '#1e3a5f',
                    },
                  ]}
                />
              </View>
            </Card>
          ))
        ) : (
          <Text style={styles.emptyText}>{t.noCourses}</Text>
        )}

        {/* Pending assignments */}
        <Text style={[styles.sectionTitle, isRTL && styles.rtlText, { marginTop: 16 }]}>
          {t.pendingAssignments}
        </Text>
        {pendingAssignments.length === 0 ? (
          <Card>
            <Text style={[styles.emptyText, { marginVertical: 8 }]}>{t.noAssignments}</Text>
          </Card>
        ) : (
          pendingAssignments.slice(0, 4).map((a) => (
            <Card key={a.id} style={styles.assignmentCard}>
              <View style={[styles.assignmentHeader, isRTL && styles.rowReverse]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.assignmentTitle, isRTL && styles.rtlText]}>
                    {a.title}
                  </Text>
                  <Text style={[styles.assignmentCourse, isRTL && styles.rtlText]}>
                    {a.courseTitle}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: a.status === 'late' ? '#fef2f2' : '#fffbeb' },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: a.status === 'late' ? '#dc2626' : '#d97706' },
                    ]}
                  >
                    {a.status === 'late'
                      ? isRTL
                        ? 'متأخر'
                        : 'Late'
                      : isRTL
                      ? 'معلّق'
                      : 'Pending'}
                  </Text>
                </View>
              </View>
              <Text style={[styles.dueDate, isRTL && styles.rtlText]}>
                {t.dueOn} {new Date(a.dueDate).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}
              </Text>
            </Card>
          ))
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  accent?: boolean;
  accentColor?: string;
  style?: object;
}

function StatCard({ label, value, accent, accentColor = '#059669', style }: StatCardProps) {
  return (
    <View style={[statStyles.card, style]}>
      <Text style={[statStyles.value, accent && { color: accentColor }]}>{value}</Text>
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
  value: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1e3a5f',
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
  },
});

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f3f4f6' },
  scroll: { flex: 1 },
  content: { padding: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  rowReverse: { flexDirection: 'row-reverse' },
  rtlText: { textAlign: 'right' },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  },
  attendanceCard: { marginBottom: 8 },
  attendanceRow: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  progressRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 6,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  progressFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  attendanceDetail: {
    fontSize: 13,
    color: '#374151',
    marginBottom: 4,
  },
  courseCard: { marginBottom: 4 },
  courseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  courseColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  courseTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  courseTeacher: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  progressPct: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e3a5f',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 6,
    borderRadius: 3,
  },
  assignmentCard: { marginBottom: 4 },
  assignmentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  assignmentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  assignmentCourse: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  dueDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  emptyText: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 14,
    paddingVertical: 16,
  },
});
