import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  RefreshControl,
  I18nManager,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAssignments, submitAssignment, Assignment } from '../../src/lib/api';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { Spinner } from '../../src/components/ui/Spinner';

const isRTL = I18nManager.isRTL;

const STATUS_LABELS: Record<string, { en: string; ar: string; color: string; bg: string }> = {
  pending: { en: 'Pending', ar: 'معلّق', color: '#d97706', bg: '#fffbeb' },
  submitted: { en: 'Submitted', ar: 'مُسلَّم', color: '#059669', bg: '#ecfdf5' },
  graded: { en: 'Graded', ar: 'مُصحَّح', color: '#2563eb', bg: '#eff6ff' },
  late: { en: 'Late', ar: 'متأخر', color: '#dc2626', bg: '#fef2f2' },
};

const FILTER_TABS = [
  { key: 'all', en: 'All', ar: 'الكل' },
  { key: 'pending', en: 'Pending', ar: 'معلّق' },
  { key: 'submitted', en: 'Submitted', ar: 'مُسلَّم' },
  { key: 'graded', en: 'Graded', ar: 'مُصحَّح' },
];

const t = {
  title: isRTL ? 'الواجبات' : 'Assignments',
  submit: isRTL ? 'تسليم' : 'Submit',
  submitTitle: isRTL ? 'تسليم الواجب' : 'Submit Assignment',
  submitPlaceholder: isRTL ? 'اكتب إجابتك هنا...' : 'Write your answer here...',
  cancel: isRTL ? 'إلغاء' : 'Cancel',
  send: isRTL ? 'إرسال' : 'Send',
  dueOn: isRTL ? 'موعد التسليم:' : 'Due:',
  maxScore: isRTL ? 'الدرجة القصوى:' : 'Max score:',
  score: isRTL ? 'الدرجة:' : 'Score:',
  emptyText: (tab: string) =>
    isRTL ? `لا توجد واجبات في هذه الفئة` : `No ${tab} assignments`,
  submitSuccess: isRTL ? 'تم التسليم بنجاح' : 'Submitted successfully',
  submitError: isRTL ? 'فشل التسليم' : 'Submission failed',
};

export default function AssignmentsScreen() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  const { data: assignments, isLoading, refetch } = useQuery({
    queryKey: ['assignments'],
    queryFn: fetchAssignments,
  });

  const mutation = useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) => submitAssignment(id, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      setModalVisible(false);
      setSubmissionText('');
      Alert.alert('', t.submitSuccess);
    },
    onError: () => {
      Alert.alert('', t.submitError);
    },
  });

  const filtered =
    activeTab === 'all'
      ? (assignments ?? [])
      : (assignments ?? []).filter((a) => a.status === activeTab);

  const openSubmit = (a: Assignment) => {
    setSelectedAssignment(a);
    setSubmissionText('');
    setModalVisible(true);
  };

  const handleSubmit = () => {
    if (!submissionText.trim()) {
      Alert.alert('', isRTL ? 'يرجى كتابة إجابتك' : 'Please write your answer');
      return;
    }
    if (selectedAssignment) {
      mutation.mutate({ id: selectedAssignment.id, text: submissionText });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.pageHeader}>
        <Text style={[styles.pageTitle, isRTL && styles.rtlText]}>{t.title}</Text>
      </View>

      {/* Filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContainer}
      >
        {FILTER_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
          >
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
              {isRTL ? tab.ar : tab.en}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {isLoading ? (
        <Spinner fullScreen />
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#1e3a5f" />
          }
          showsVerticalScrollIndicator={false}
        >
          {filtered.length === 0 ? (
            <Text style={styles.emptyText}>{t.emptyText(activeTab)}</Text>
          ) : (
            filtered.map((a) => {
              const status = STATUS_LABELS[a.status] ?? STATUS_LABELS.pending;
              return (
                <Card key={a.id} style={styles.assignmentCard}>
                  <View style={[styles.cardTop, isRTL && styles.rowReverse]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.assignmentTitle, isRTL && styles.rtlText]}>
                        {a.title}
                      </Text>
                      <Text style={[styles.courseLabel, isRTL && styles.rtlText]}>
                        {a.courseTitle}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                      <Text style={[styles.statusText, { color: status.color }]}>
                        {isRTL ? status.ar : status.en}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.cardMeta, isRTL && styles.rowReverse]}>
                    <Text style={styles.metaItem}>
                      {t.dueOn} {new Date(a.dueDate).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}
                    </Text>
                    <Text style={styles.metaItem}>
                      {a.score != null
                        ? `${t.score} ${a.score}/${a.maxScore}`
                        : `${t.maxScore} ${a.maxScore}`}
                    </Text>
                  </View>

                  {(a.status === 'pending' || a.status === 'late') && (
                    <TouchableOpacity
                      style={styles.submitBtn}
                      onPress={() => openSubmit(a)}
                    >
                      <Text style={styles.submitBtnText}>{t.submit}</Text>
                    </TouchableOpacity>
                  )}
                </Card>
              );
            })
          )}
          <View style={{ height: 24 }} />
        </ScrollView>
      )}

      {/* Submit Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContainer}>
            <Text style={[styles.modalTitle, isRTL && styles.rtlText]}>{t.submitTitle}</Text>
            {selectedAssignment && (
              <Text style={[styles.modalSubtitle, isRTL && styles.rtlText]}>
                {selectedAssignment.title}
              </Text>
            )}
            <TextInput
              style={[styles.textArea, isRTL && styles.rtlInput]}
              value={submissionText}
              onChangeText={setSubmissionText}
              placeholder={t.submitPlaceholder}
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              textAlign={isRTL ? 'right' : 'left'}
            />
            <View style={[styles.modalActions, isRTL && styles.rowReverse]}>
              <Button
                title={t.cancel}
                onPress={() => setModalVisible(false)}
                variant="outline"
                style={{ flex: 1, marginRight: isRTL ? 0 : 8, marginLeft: isRTL ? 8 : 0 }}
              />
              <Button
                title={t.send}
                onPress={handleSubmit}
                loading={mutation.isPending}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f3f4f6' },
  pageHeader: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: '#111827' },
  tabsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
    marginRight: 8,
  },
  tabActive: { backgroundColor: '#1e3a5f' },
  tabLabel: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  tabLabelActive: { color: '#ffffff' },
  listContent: { paddingHorizontal: 16 },
  assignmentCard: { marginBottom: 10 },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  rowReverse: { flexDirection: 'row-reverse' },
  rtlText: { textAlign: 'right' },
  rtlInput: { textAlign: 'right' },
  assignmentTitle: { fontSize: 15, fontWeight: '600', color: '#111827' },
  courseLabel: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginLeft: 8,
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  cardMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 10,
  },
  metaItem: { fontSize: 12, color: '#9ca3af' },
  submitBtn: {
    backgroundColor: '#1e3a5f',
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center',
  },
  submitBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },
  emptyText: { textAlign: 'center', color: '#9ca3af', fontSize: 14, paddingTop: 48 },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 16,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#f9fafb',
    minHeight: 130,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
  },
});
