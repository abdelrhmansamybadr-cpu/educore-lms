import React, { useState } from 'react';
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
import { fetchChildren, Child } from '../../src/lib/api';
import { useAuthStore } from '../../src/stores/authStore';
import { Card } from '../../src/components/ui/Card';
import { Avatar } from '../../src/components/ui/Avatar';
import { Spinner } from '../../src/components/ui/Spinner';

const isRTL = I18nManager.isRTL;

const t = {
  greeting: (name: string) => (isRTL ? `مرحباً، ${name}` : `Hello, ${name}`),
  subtitle: isRTL ? 'لوحة تحكم ولي الأمر' : 'Parent Dashboard',
  myChildren: isRTL ? 'أبنائي' : 'My Children',
  attendance: isRTL ? 'الحضور' : 'Attendance',
  gpa: isRTL ? 'المعدل' : 'GPA',
  grade: isRTL ? 'الصف' : 'Grade',
  viewDetails: isRTL ? 'عرض التفاصيل' : 'View Details',
  noChildren: isRTL ? 'لا يوجد أبناء مسجّلون' : 'No children registered',
  logout: isRTL ? 'تسجيل الخروج' : 'Logout',
  logoutConfirm: isRTL ? 'هل تريد تسجيل الخروج؟' : 'Are you sure you want to logout?',
  yes: isRTL ? 'نعم' : 'Yes',
  cancel: isRTL ? 'إلغاء' : 'Cancel',
  overview: isRTL ? 'نظرة عامة' : 'Overview',
  totalChildren: isRTL ? 'الأبناء' : 'Children',
  avgAttendance: isRTL ? 'متوسط الحضور' : 'Avg Attendance',
  avgGPA: isRTL ? 'متوسط المعدل' : 'Avg GPA',
};

function getAttendanceColor(rate: number) {
  if (rate >= 85) return '#059669';
  if (rate >= 70) return '#d97706';
  return '#dc2626';
}

function getGPAColor(gpa: number) {
  if (gpa >= 3.5) return '#059669';
  if (gpa >= 2.5) return '#2563eb';
  if (gpa >= 1.5) return '#d97706';
  return '#dc2626';
}

export default function ParentDashboard() {
  const { user, clearAuth } = useAuthStore();
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);

  const { data: children, isLoading, refetch } = useQuery({
    queryKey: ['children'],
    queryFn: fetchChildren,
  });

  const avgAttendance =
    children && children.length > 0
      ? Math.round(children.reduce((a, c) => a + c.attendanceRate, 0) / children.length)
      : 0;

  const avgGPA =
    children && children.length > 0
      ? (children.reduce((a, c) => a + c.gpa, 0) / children.length).toFixed(2)
      : '0.00';

  const handleLogout = () => {
    Alert.alert('', t.logoutConfirm, [
      { text: t.cancel, style: 'cancel' },
      { text: t.yes, style: 'destructive', onPress: clearAuth },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#1e3a5f" />
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

        {/* Overview Stats */}
        <View style={styles.statsRow}>
          <StatCard label={t.totalChildren} value={String(children?.length ?? 0)} style={{ flex: 1, marginRight: 8 }} />
          <StatCard
            label={t.avgAttendance}
            value={`${avgAttendance}%`}
            color={getAttendanceColor(avgAttendance)}
            style={{ flex: 1, marginHorizontal: 4 }}
          />
          <StatCard
            label={t.avgGPA}
            value={avgGPA}
            color={getGPAColor(Number(avgGPA))}
            style={{ flex: 1, marginLeft: 8 }}
          />
        </View>

        {/* Children list */}
        <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>{t.myChildren}</Text>

        {isLoading ? (
          <Spinner />
        ) : !children || children.length === 0 ? (
          <Card>
            <Text style={styles.emptyText}>{t.noChildren}</Text>
          </Card>
        ) : (
          children.map((child) => {
            const isExpanded = selectedChild?.id === child.id;
            const attColor = getAttendanceColor(child.attendanceRate);
            const gpaColor = getGPAColor(child.gpa);

            return (
              <Card key={child.id} style={styles.childCard}>
                {/* Child header */}
                <TouchableOpacity
                  onPress={() => setSelectedChild(isExpanded ? null : child)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.childHeader, isRTL && styles.rowReverse]}>
                    <Avatar name={child.name} uri={child.avatarUrl} size={52} />
                    <View style={{ flex: 1, marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0 }}>
                      <Text style={[styles.childName, isRTL && styles.rtlText]}>{child.name}</Text>
                      <Text style={[styles.childGrade, isRTL && styles.rtlText]}>
                        {t.grade}: {child.grade}
                      </Text>
                    </View>
                    <Text style={styles.expandIcon}>{isExpanded ? '▲' : '▼'}</Text>
                  </View>
                </TouchableOpacity>

                {/* Quick stats row */}
                <View style={[styles.quickStats, isRTL && styles.rowReverse]}>
                  <View style={styles.quickStat}>
                    <Text style={[styles.quickStatValue, { color: attColor }]}>
                      {Math.round(child.attendanceRate)}%
                    </Text>
                    <Text style={styles.quickStatLabel}>{t.attendance}</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.quickStat}>
                    <Text style={[styles.quickStatValue, { color: gpaColor }]}>
                      {child.gpa.toFixed(2)}
                    </Text>
                    <Text style={styles.quickStatLabel}>{t.gpa}</Text>
                  </View>
                </View>

                {/* Progress bars */}
                {isExpanded && (
                  <View style={styles.detailSection}>
                    <View style={{ marginBottom: 12 }}>
                      <View style={[styles.detailRow, isRTL && styles.rowReverse]}>
                        <Text style={[styles.detailLabel, isRTL && styles.rtlText]}>
                          {t.attendance}
                        </Text>
                        <Text style={[styles.detailValue, { color: attColor }]}>
                          {Math.round(child.attendanceRate)}%
                        </Text>
                      </View>
                      <View style={styles.progressBarBg}>
                        <View
                          style={[
                            styles.progressBarFill,
                            {
                              width: `${child.attendanceRate}%` as any,
                              backgroundColor: attColor,
                            },
                          ]}
                        />
                      </View>
                    </View>

                    <View>
                      <View style={[styles.detailRow, isRTL && styles.rowReverse]}>
                        <Text style={[styles.detailLabel, isRTL && styles.rtlText]}>
                          {t.gpa} (/ 4.0)
                        </Text>
                        <Text style={[styles.detailValue, { color: gpaColor }]}>
                          {child.gpa.toFixed(2)}
                        </Text>
                      </View>
                      <View style={styles.progressBarBg}>
                        <View
                          style={[
                            styles.progressBarFill,
                            {
                              width: `${(child.gpa / 4.0) * 100}%` as any,
                              backgroundColor: gpaColor,
                            },
                          ]}
                        />
                      </View>
                    </View>

                    {/* Status summary */}
                    <View style={styles.statusSummary}>
                      <StatusPill
                        color={attColor}
                        label={
                          child.attendanceRate >= 85
                            ? isRTL
                              ? 'حضور ممتاز'
                              : 'Excellent Attendance'
                            : child.attendanceRate >= 70
                            ? isRTL
                              ? 'حضور جيد'
                              : 'Good Attendance'
                            : isRTL
                            ? 'حضور منخفض'
                            : 'Low Attendance'
                        }
                        bg={attColor + '20'}
                      />
                      <StatusPill
                        color={gpaColor}
                        label={
                          child.gpa >= 3.5
                            ? isRTL
                              ? 'أداء أكاديمي ممتاز'
                              : 'Academic Excellence'
                            : child.gpa >= 2.5
                            ? isRTL
                              ? 'أداء جيد'
                              : 'Good Performance'
                            : isRTL
                            ? 'يحتاج دعماً'
                            : 'Needs Support'
                        }
                        bg={gpaColor + '20'}
                      />
                    </View>
                  </View>
                )}
              </Card>
            );
          })
        )}

        {/* Tips */}
        <Card style={styles.tipsCard}>
          <Text style={[styles.tipsTitle, isRTL && styles.rtlText]}>
            {isRTL ? 'نصائح للوالدين' : 'Parent Tips'}
          </Text>
          {[
            isRTL
              ? 'تواصل مع المعلم إذا انخفض معدل الحضور دون 80%'
              : 'Contact the teacher if attendance drops below 80%',
            isRTL
              ? 'راجع الواجبات المتأخرة مع ابنك أسبوعياً'
              : 'Review late assignments with your child weekly',
            isRTL
              ? 'شجّع ابنك على استخدام المساعد الذكي للمراجعة'
              : 'Encourage using the AI Tutor for study sessions',
          ].map((tip, i) => (
            <View key={i} style={[styles.tipRow, isRTL && styles.rowReverse]}>
              <Text style={styles.tipBullet}>•</Text>
              <Text style={[styles.tipText, isRTL && styles.rtlText]}>{tip}</Text>
            </View>
          ))}
        </Card>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  label,
  value,
  color = '#1e3a5f',
  style,
}: {
  label: string;
  value: string;
  color?: string;
  style?: object;
}) {
  return (
    <View style={[statStyles.card, style]}>
      <Text style={[statStyles.value, { color }]}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

function StatusPill({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <View style={[pillStyles.pill, { backgroundColor: bg }]}>
      <Text style={[pillStyles.text, { color }]}>{label}</Text>
    </View>
  );
}

const pillStyles = StyleSheet.create({
  pill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, marginRight: 8, marginBottom: 6 },
  text: { fontSize: 11, fontWeight: '700' },
});

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
  value: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
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
  childCard: { marginBottom: 12 },
  childHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  childName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  childGrade: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  expandIcon: { fontSize: 12, color: '#9ca3af', marginLeft: 4 },
  quickStats: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 12,
    marginBottom: 0,
  },
  quickStat: { flex: 1, alignItems: 'center' },
  quickStatValue: { fontSize: 20, fontWeight: '800' },
  quickStatLabel: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: '#e5e7eb', marginVertical: 4 },
  detailSection: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  detailLabel: { fontSize: 13, color: '#374151', fontWeight: '600' },
  detailValue: { fontSize: 13, fontWeight: '700' },
  progressBarBg: { height: 8, backgroundColor: '#e5e7eb', borderRadius: 4, overflow: 'hidden', marginBottom: 0 },
  progressBarFill: { height: 8, borderRadius: 4 },
  statusSummary: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12 },
  tipsCard: { marginTop: 8 },
  tipsTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 10 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6, gap: 8 },
  tipBullet: { fontSize: 14, color: '#1e3a5f', fontWeight: '700', marginTop: 1 },
  tipText: { flex: 1, fontSize: 13, color: '#374151', lineHeight: 19 },
  emptyText: { textAlign: 'center', color: '#9ca3af', fontSize: 14, paddingVertical: 16 },
});
