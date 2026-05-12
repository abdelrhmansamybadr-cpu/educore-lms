import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  I18nManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { fetchEnrolledCourses, Course } from '../../src/lib/api';
import { Card } from '../../src/components/ui/Card';
import { Spinner } from '../../src/components/ui/Spinner';

const isRTL = I18nManager.isRTL;

const t = {
  title: isRTL ? 'مقرراتي' : 'My Courses',
  search: isRTL ? 'بحث في المقررات...' : 'Search courses...',
  progress: isRTL ? 'التقدم' : 'Progress',
  teacher: isRTL ? 'المدرس' : 'Teacher',
  noCourses: isRTL ? 'لا توجد مقررات مطابقة' : 'No matching courses',
  errorMsg: isRTL ? 'فشل تحميل المقررات' : 'Failed to load courses',
  retry: isRTL ? 'إعادة المحاولة' : 'Retry',
};

const COVER_COLORS = [
  '#1e3a5f', '#2563eb', '#7c3aed', '#059669', '#dc2626', '#d97706', '#0891b2', '#65a30d',
];

export default function CoursesScreen() {
  const [search, setSearch] = useState('');

  const { data: courses, isLoading, isError, refetch } = useQuery({
    queryKey: ['enrolledCourses'],
    queryFn: fetchEnrolledCourses,
  });

  const filtered = (courses ?? []).filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.teacherName.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.pageHeader}>
        <Text style={[styles.pageTitle, isRTL && styles.rtlText]}>{t.title}</Text>
        <Text style={[styles.pageCount, isRTL && styles.rtlText]}>
          {courses?.length ?? 0} {isRTL ? 'مقرر' : 'courses'}
        </Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.searchInput, isRTL && styles.rtlInput]}
          value={search}
          onChangeText={setSearch}
          placeholder={t.search}
          placeholderTextColor="#9ca3af"
          textAlign={isRTL ? 'right' : 'left'}
        />
      </View>

      {isLoading ? (
        <Spinner fullScreen message={isRTL ? 'جارٍ التحميل...' : 'Loading...'} />
      ) : isError ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t.errorMsg}</Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.retryBtn}>
            <Text style={styles.retryText}>{t.retry}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#1e3a5f" />
          }
          showsVerticalScrollIndicator={false}
        >
          {filtered.length === 0 ? (
            <Text style={styles.emptyText}>{t.noCourses}</Text>
          ) : (
            filtered.map((course, idx) => (
              <CourseCard
                key={course.id}
                course={course}
                fallbackColor={COVER_COLORS[idx % COVER_COLORS.length]}
              />
            ))
          )}
          <View style={{ height: 24 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function CourseCard({ course, fallbackColor }: { course: Course; fallbackColor: string }) {
  const color = course.coverColor || fallbackColor;
  const progress = Math.min(100, Math.max(0, course.progress));

  return (
    <Card style={styles.courseCard}>
      {/* Banner */}
      <View style={[styles.banner, { backgroundColor: color }]}>
        <Text style={styles.bannerTitle} numberOfLines={2}>
          {course.title}
        </Text>
      </View>

      {/* Body */}
      <View style={styles.cardBody}>
        <View style={[styles.metaRow, isRTL && styles.rowReverse]}>
          <Text style={[styles.metaLabel, isRTL && styles.rtlText]}>{t.teacher}:</Text>
          <Text style={[styles.metaValue, isRTL && styles.rtlText]}> {course.teacherName}</Text>
        </View>

        {course.description ? (
          <Text style={[styles.description, isRTL && styles.rtlText]} numberOfLines={2}>
            {course.description}
          </Text>
        ) : null}

        {/* Progress */}
        <View style={[styles.progressRow, isRTL && styles.rowReverse]}>
          <Text style={[styles.progressLabel, isRTL && styles.rtlText]}>{t.progress}</Text>
          <Text style={[styles.progressPct, { color }]}>{Math.round(progress)}%</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View
            style={[styles.progressBarFill, { width: `${progress}%` as any, backgroundColor: color }]}
          />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f3f4f6' },
  pageHeader: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: '#111827' },
  pageCount: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  searchContainer: { paddingHorizontal: 16, paddingVertical: 10 },
  searchInput: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  rtlInput: { textAlign: 'right' },
  rtlText: { textAlign: 'right' },
  rowReverse: { flexDirection: 'row-reverse' },
  listContent: { paddingHorizontal: 16 },
  courseCard: { padding: 0, overflow: 'hidden', marginBottom: 12 },
  banner: {
    paddingHorizontal: 16,
    paddingVertical: 22,
    minHeight: 80,
    justifyContent: 'flex-end',
  },
  bannerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
  },
  cardBody: { padding: 14 },
  metaRow: { flexDirection: 'row', marginBottom: 6 },
  metaLabel: { fontSize: 13, color: '#6b7280' },
  metaValue: { fontSize: 13, fontWeight: '600', color: '#374151' },
  description: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 10,
    lineHeight: 19,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabel: { fontSize: 12, color: '#6b7280' },
  progressPct: { fontSize: 13, fontWeight: '700' },
  progressBarBg: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: { height: 6, borderRadius: 3 },
  emptyText: { textAlign: 'center', color: '#9ca3af', fontSize: 14, paddingTop: 48 },
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { fontSize: 15, color: '#dc2626', marginBottom: 16 },
  retryBtn: {
    backgroundColor: '#1e3a5f',
    paddingHorizontal: 24,
    paddingVertical: 11,
    borderRadius: 10,
  },
  retryText: { color: '#ffffff', fontWeight: '600' },
});
