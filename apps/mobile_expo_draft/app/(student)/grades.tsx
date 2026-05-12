import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  I18nManager,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { fetchGrades, Grade } from '../../src/lib/api';
import { Card } from '../../src/components/ui/Card';
import { Spinner } from '../../src/components/ui/Spinner';

const isRTL = I18nManager.isRTL;

const t = {
  title: isRTL ? 'درجاتي' : 'My Grades',
  gpa: isRTL ? 'المعدل التراكمي' : 'GPA',
  average: isRTL ? 'المتوسط' : 'Average',
  total: isRTL ? 'المجموع' : 'Total',
  course: isRTL ? 'المقرر' : 'Course',
  assignment: isRTL ? 'الواجب' : 'Assignment',
  score: isRTL ? 'الدرجة' : 'Score',
  date: isRTL ? 'التاريخ' : 'Date',
  feedback: isRTL ? 'التغذية الراجعة' : 'Feedback',
  noGrades: isRTL ? 'لا توجد درجات بعد' : 'No grades yet',
  excellent: isRTL ? 'ممتاز' : 'Excellent',
  good: isRTL ? 'جيد' : 'Good',
  average2: isRTL ? 'مقبول' : 'Average',
  poor: isRTL ? 'ضعيف' : 'Poor',
};

function getGradeLetter(pct: number): string {
  if (pct >= 90) return 'A';
  if (pct >= 80) return 'B';
  if (pct >= 70) return 'C';
  if (pct >= 60) return 'D';
  return 'F';
}

function getGradeColor(pct: number): string {
  if (pct >= 80) return '#059669';
  if (pct >= 70) return '#2563eb';
  if (pct >= 60) return '#d97706';
  return '#dc2626';
}

function computeAverage(grades: Grade[]): number {
  if (!grades.length) return 0;
  const sum = grades.reduce((acc, g) => acc + (g.score / g.maxScore) * 100, 0);
  return sum / grades.length;
}

export default function GradesScreen() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: grades, isLoading, refetch } = useQuery({
    queryKey: ['grades'],
    queryFn: fetchGrades,
  });

  const avg = computeAverage(grades ?? []);
  const gradeLetter = getGradeLetter(avg);
  const gradeColor = getGradeColor(avg);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
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
        <Text style={[styles.pageTitle, isRTL && styles.rtlText]}>{t.title}</Text>

        {/* Summary card */}
        <Card style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            {/* GPA circle */}
            <View style={styles.gpaCircle}>
              <Text style={[styles.gpaLetter, { color: gradeColor }]}>{gradeLetter}</Text>
              <Text style={styles.gpaPct}>{Math.round(avg)}%</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 20 }}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>{t.total}:</Text>
                <Text style={styles.summaryValue}>{grades?.length ?? 0}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>{t.average}:</Text>
                <Text style={[styles.summaryValue, { color: gradeColor }]}>
                  {Math.round(avg)}%
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>{t.gpa}:</Text>
                <Text style={[styles.summaryValue, { color: gradeColor }]}>
                  {(avg / 25).toFixed(2)}
                </Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Grade distribution */}
        {grades && grades.length > 0 && (
          <Card style={{ marginBottom: 8 }}>
            <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>
              {isRTL ? 'توزيع الدرجات' : 'Grade Distribution'}
            </Text>
            {[
              { range: 'A (90–100)', pct: grades.filter((g) => (g.score / g.maxScore) * 100 >= 90).length },
              { range: 'B (80–89)', pct: grades.filter((g) => { const p = (g.score / g.maxScore) * 100; return p >= 80 && p < 90; }).length },
              { range: 'C (70–79)', pct: grades.filter((g) => { const p = (g.score / g.maxScore) * 100; return p >= 70 && p < 80; }).length },
              { range: 'D (60–69)', pct: grades.filter((g) => { const p = (g.score / g.maxScore) * 100; return p >= 60 && p < 70; }).length },
              { range: 'F (<60)', pct: grades.filter((g) => (g.score / g.maxScore) * 100 < 60).length },
            ].map((row) => {
              const barPct = grades.length ? (row.pct / grades.length) * 100 : 0;
              return (
                <View key={row.range} style={styles.distRow}>
                  <Text style={styles.distLabel}>{row.range}</Text>
                  <View style={styles.distBarBg}>
                    <View style={[styles.distBarFill, { width: `${barPct}%` as any }]} />
                  </View>
                  <Text style={styles.distCount}>{row.pct}</Text>
                </View>
              );
            })}
          </Card>
        )}

        {/* Individual grades */}
        <Text style={[styles.sectionTitle, isRTL && styles.rtlText, { marginTop: 8 }]}>
          {isRTL ? 'تفاصيل الدرجات' : 'Grade Details'}
        </Text>

        {isLoading ? (
          <Spinner />
        ) : !grades || grades.length === 0 ? (
          <Text style={styles.emptyText}>{t.noGrades}</Text>
        ) : (
          grades.map((g) => {
            const pct = Math.round((g.score / g.maxScore) * 100);
            const color = getGradeColor(pct);
            const letter = getGradeLetter(pct);
            const expanded = expandedId === g.id;

            return (
              <TouchableOpacity key={g.id} onPress={() => toggleExpand(g.id)} activeOpacity={0.8}>
                <Card style={styles.gradeCard}>
                  <View style={[styles.gradeTop, isRTL && styles.rowReverse]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.assignmentName, isRTL && styles.rtlText]}>
                        {g.assignmentTitle}
                      </Text>
                      <Text style={[styles.courseName, isRTL && styles.rtlText]}>
                        {g.courseTitle}
                      </Text>
                    </View>
                    <View style={[styles.gradeCircle, { borderColor: color }]}>
                      <Text style={[styles.gradeLetter, { color }]}>{letter}</Text>
                    </View>
                  </View>

                  <View style={[styles.scoreRow, isRTL && styles.rowReverse]}>
                    <Text style={styles.scoreText}>
                      {g.score} / {g.maxScore} ({pct}%)
                    </Text>
                    <Text style={styles.dateText}>
                      {new Date(g.gradedAt).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}
                    </Text>
                  </View>

                  <View style={styles.gradePbar}>
                    <View style={[styles.gradePbarFill, { width: `${pct}%` as any, backgroundColor: color }]} />
                  </View>

                  {expanded && g.feedback ? (
                    <View style={styles.feedbackBox}>
                      <Text style={[styles.feedbackLabel, isRTL && styles.rtlText]}>
                        {t.feedback}:
                      </Text>
                      <Text style={[styles.feedbackText, isRTL && styles.rtlText]}>
                        {g.feedback}
                      </Text>
                    </View>
                  ) : null}
                </Card>
              </TouchableOpacity>
            );
          })
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f3f4f6' },
  content: { padding: 16 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 14 },
  rtlText: { textAlign: 'right' },
  rowReverse: { flexDirection: 'row-reverse' },
  summaryCard: { marginBottom: 12 },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  gpaCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gpaLetter: { fontSize: 28, fontWeight: '800' },
  gpaPct: { fontSize: 12, color: '#6b7280', fontWeight: '600' },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  summaryLabel: { fontSize: 13, color: '#6b7280' },
  summaryValue: { fontSize: 15, fontWeight: '700', color: '#111827' },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 10 },
  distRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  distLabel: { width: 80, fontSize: 12, color: '#374151' },
  distBarBg: { flex: 1, height: 8, backgroundColor: '#e5e7eb', borderRadius: 4, overflow: 'hidden' },
  distBarFill: { height: 8, backgroundColor: '#1e3a5f', borderRadius: 4 },
  distCount: { width: 24, fontSize: 12, color: '#6b7280', textAlign: 'right' },
  gradeCard: { marginBottom: 8 },
  gradeTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  assignmentName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  courseName: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  gradeCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  gradeLetter: { fontSize: 16, fontWeight: '800' },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  scoreText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  dateText: { fontSize: 12, color: '#9ca3af' },
  gradePbar: { height: 5, backgroundColor: '#e5e7eb', borderRadius: 3, overflow: 'hidden' },
  gradePbarFill: { height: 5, borderRadius: 3 },
  feedbackBox: {
    marginTop: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 10,
  },
  feedbackLabel: { fontSize: 12, fontWeight: '700', color: '#374151', marginBottom: 4 },
  feedbackText: { fontSize: 13, color: '#4b5563', lineHeight: 19 },
  emptyText: { textAlign: 'center', color: '#9ca3af', fontSize: 14, paddingTop: 48 },
});
