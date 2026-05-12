'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useLocale } from 'next-intl'
import { Card, CardHeader, CardBody, Badge, Skeleton } from '@/components/ui'
import { ClipboardList, Plus, CheckCircle, Clock, X, Sparkles, Loader2 } from 'lucide-react'

export default function TeacherAssignmentsPage() {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const queryClient = useQueryClient()
  const [selectedCourse, setSelectedCourse] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [gradingModal, setGradingModal] = useState<any>(null)
  const [gradeForm, setGradeForm] = useState({ points: '', feedback: '' })
  const [form, setForm] = useState({ title: '', titleAr: '', instructions: '', dueDate: '', maxPoints: '100' })
  const [aiFeedbackLoading, setAiFeedbackLoading] = useState(false)

  const { data: courses } = useQuery({
    queryKey: ['teacher-courses'],
    queryFn: () => api.get('/courses?limit=100').then(r => r.data?.data || []),
  })

  const { data: assignments, isLoading } = useQuery({
    queryKey: ['teacher-assignments', selectedCourse],
    queryFn: () => api.get(`/assignments/course/${selectedCourse}`).then(r => r.data?.data || []),
    enabled: !!selectedCourse,
  })

  const { data: pending } = useQuery({
    queryKey: ['pending-grading'],
    queryFn: () => api.get('/assignments/pending-grading').then(r => r.data?.data || []),
  })

  const createAssignment = useMutation({
    mutationFn: (data: any) => api.post('/assignments', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['teacher-assignments'] }); setShowCreate(false) },
  })

  const gradeSubmission = useMutation({
    mutationFn: ({ id, points, feedback }: any) =>
      api.patch(`/assignments/submissions/${id}/grade`, { score: Number(points), feedback }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['pending-grading'] }); setGradingModal(null) },
  })

  const getAiFeedback = async () => {
    if (!gradingModal?.textContent && !gradingModal?.content) return
    setAiFeedbackLoading(true)
    try {
      const res = await api.post('/ai/grade-submission', {
        assignmentTitle: gradingModal.assignment?.title || 'Assignment',
        submissionText: gradingModal.textContent || gradingModal.content || '',
        maxPoints: gradingModal.assignment?.maxPoints || 100,
        language: locale === 'ar' ? 'ar' : 'en',
      })
      const result = res.data?.data
      if (result?.feedback) setGradeForm(f => ({ ...f, feedback: result.feedback }))
      if (result?.suggestedScore) setGradeForm(f => ({ ...f, points: String(Math.min(result.suggestedScore, gradingModal.assignment?.maxPoints || 100)) }))
    } catch {
      // silently ignore
    } finally {
      setAiFeedbackLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isRtl ? 'الواجبات' : 'Assignments'}</h1>
          <p className="text-gray-500 text-sm">{isRtl ? 'إدارة الواجبات وتصحيحها' : 'Manage and grade assignments'}</p>
        </div>
        {selectedCourse && (
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-primary-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-800">
            <Plus size={16} />{isRtl ? 'واجب جديد' : 'New Assignment'}
          </button>
        )}
      </div>

      {/* Pending grading alert */}
      {pending && pending.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-center gap-3">
          <Clock size={20} className="text-yellow-600 flex-shrink-0" />
          <p className="text-sm text-yellow-800">
            <span className="font-semibold">{pending.length}</span> {isRtl ? 'تسليم بانتظار التصحيح' : 'submissions awaiting grading'}
          </p>
        </div>
      )}

      {/* Course Selector */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'المقرر' : 'Course'}</label>
        <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500 min-w-64">
          <option value="">{isRtl ? '-- اختر المقرر --' : '-- Select Course --'}</option>
          {courses?.map((c: any) => <option key={c.id} value={c.id}>{isRtl ? (c.titleAr || c.title) : c.title}</option>)}
        </select>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">{isRtl ? 'إنشاء واجب' : 'Create Assignment'}</h3>
              <button onClick={() => setShowCreate(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder={isRtl ? 'عنوان الواجب (إنجليزي)' : 'Title (English)'} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary-500" />
              <input value={form.titleAr} onChange={e => setForm(f => ({ ...f, titleAr: e.target.value }))} placeholder="العنوان (عربي)" dir="rtl" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary-500" />
              <textarea value={form.instructions} onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))} placeholder={isRtl ? 'تعليمات الواجب' : 'Instructions'} rows={3} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary-500 resize-none" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'موعد التسليم' : 'Due Date'}</label>
                  <input type="datetime-local" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'الدرجة القصوى' : 'Max Points'}</label>
                  <input type="number" value={form.maxPoints} onChange={e => setForm(f => ({ ...f, maxPoints: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary-500" />
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50">{isRtl ? 'إلغاء' : 'Cancel'}</button>
                <button
                  onClick={() => createAssignment.mutate({ title: form.title, titleAr: form.titleAr, instructions: form.instructions || form.title, courseId: selectedCourse, dueDate: form.dueDate || new Date(Date.now() + 7 * 86400000).toISOString(), maxPoints: Number(form.maxPoints) })}
                  disabled={!form.title || createAssignment.isPending}
                  className="flex-1 py-2.5 bg-primary-900 text-white rounded-xl text-sm font-medium disabled:opacity-50"
                >
                  {createAssignment.isPending ? '...' : (isRtl ? 'إنشاء' : 'Create')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grade Modal */}
      {gradingModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">{isRtl ? 'تصحيح الواجب' : 'Grade Submission'}</h3>
              <button onClick={() => setGradingModal(null)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-xl p-3 max-h-32 overflow-y-auto">
                <p className="text-xs text-gray-500 mb-1">{isRtl ? 'إجابة الطالب' : 'Student Answer'}</p>
                <p className="text-sm text-gray-700">{gradingModal.textContent || gradingModal.content || '—'}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'الدرجة' : 'Points'} / {gradingModal.assignment?.maxPoints}</label>
                <input type="number" value={gradeForm.points} onChange={e => setGradeForm(f => ({ ...f, points: e.target.value }))} min={0} max={gradingModal.assignment?.maxPoints} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary-500" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-gray-700">{isRtl ? 'ملاحظات' : 'Feedback'}</label>
                  <button onClick={getAiFeedback} disabled={aiFeedbackLoading} className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 disabled:opacity-50">
                    {aiFeedbackLoading ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                    {isRtl ? 'اقتراح AI' : 'AI Suggest'}
                  </button>
                </div>
                <textarea value={gradeForm.feedback} onChange={e => setGradeForm(f => ({ ...f, feedback: e.target.value }))} rows={3} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary-500 resize-none" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setGradingModal(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm">{isRtl ? 'إلغاء' : 'Cancel'}</button>
                <button
                  onClick={() => gradeSubmission.mutate({ id: gradingModal.id, points: gradeForm.points, feedback: gradeForm.feedback })}
                  disabled={!gradeForm.points || gradeSubmission.isPending}
                  className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium disabled:opacity-50"
                >
                  {gradeSubmission.isPending ? '...' : (isRtl ? 'حفظ الدرجة' : 'Save Grade')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pending grading list */}
      {pending && pending.length > 0 && (
        <Card>
          <CardHeader><h3 className="font-semibold text-gray-900">{isRtl ? 'بانتظار التصحيح' : 'Pending Grading'}</h3></CardHeader>
          <CardBody>
            <div className="space-y-2">
              {pending.map((sub: any) => (
                <div key={sub.id} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-100 rounded-xl">
                  <div>
                    <p className="font-medium text-sm text-gray-900">{sub.assignment?.title}</p>
                    <p className="text-xs text-gray-500">{sub.student?.profile?.firstName} {sub.student?.profile?.lastName}</p>
                  </div>
                  <button onClick={() => { setGradingModal(sub); setGradeForm({ points: '', feedback: '' }) }} className="flex items-center gap-1.5 bg-primary-900 text-white px-3 py-1.5 rounded-xl text-xs font-medium hover:bg-primary-800">
                    <CheckCircle size={12} />{isRtl ? 'تصحيح' : 'Grade'}
                  </button>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Assignments list */}
      {selectedCourse && (
        isLoading ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
        ) : assignments?.length === 0 ? (
          <Card><CardBody><div className="text-center py-12 text-gray-400"><ClipboardList size={40} className="mx-auto mb-2 opacity-30" /><p>{isRtl ? 'لا توجد واجبات' : 'No assignments for this course'}</p></div></CardBody></Card>
        ) : (
          <div className="space-y-3">
            {assignments?.map((a: any) => (
              <Card key={a.id}>
                <CardBody>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{isRtl ? (a.titleAr || a.title) : a.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">{a.description}</p>
                      <div className="flex gap-3 mt-2 text-xs text-gray-400">
                        <span>{isRtl ? 'الدرجة: ' : 'Max: '}{a.maxScore} {isRtl ? 'نقطة' : 'pts'}</span>
                        {a.dueDate && <span>{isRtl ? 'الموعد: ' : 'Due: '}{new Date(a.dueDate).toLocaleDateString(isRtl ? 'ar-SA' : 'en-US')}</span>}
                        <span>{a._count?.submissions || 0} {isRtl ? 'تسليم' : 'submissions'}</span>
                      </div>
                    </div>
                    <Badge variant={a.isPublished ? 'success' : 'default'} className="text-xs flex-shrink-0">
                      {a.isPublished ? (isRtl ? 'منشور' : 'Published') : (isRtl ? 'مسودة' : 'Draft')}
                    </Badge>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )
      )}
    </div>
  )
}
