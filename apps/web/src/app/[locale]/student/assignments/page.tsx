'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useLocale } from 'next-intl'
import { Card, CardBody, Badge, Skeleton } from '@/components/ui'
import { ClipboardList, Clock, CheckCircle, AlertCircle, X } from 'lucide-react'

export default function StudentAssignmentsPage() {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted' | 'graded'>('all')
  const [submitModal, setSubmitModal] = useState<any>(null)
  const [submitText, setSubmitText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { data: assignments, isLoading } = useQuery({
    queryKey: ['student-assignments'],
    queryFn: () => api.get('/assignments/my-submissions').then((r) => r.data?.data || []),
  })

  const filtered = (assignments || []).filter((a: any) => {
    if (filter === 'pending') return !a.submission
    if (filter === 'submitted') return a.submission && !a.submission.grade
    if (filter === 'graded') return a.submission?.grade
    return true
  })

  const handleSubmit = async () => {
    if (!submitText.trim() || !submitModal) return
    setSubmitting(true)
    try {
      await api.post(`/assignments/${submitModal.id}/submit`, { textContent: submitText })
      queryClient.invalidateQueries({ queryKey: ['student-assignments'] })
      setSubmitModal(null)
      setSubmitText('')
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error submitting')
    } finally {
      setSubmitting(false)
    }
  }

  const isOverdue = (dueDate: string) => new Date(dueDate) < new Date()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{isRtl ? 'الواجبات' : 'Assignments'}</h1>
        <p className="text-gray-500 text-sm">{isRtl ? 'واجباتك الدراسية المطلوبة' : 'Your course assignments'}</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {(['all', 'pending', 'submitted', 'graded'] as const).map((f) => {
          const labels = {
            all: { en: 'All', ar: 'الكل' },
            pending: { en: 'Pending', ar: 'معلقة' },
            submitted: { en: 'Submitted', ar: 'مُسلَّمة' },
            graded: { en: 'Graded', ar: 'مصحَّحة' },
          }
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {isRtl ? labels[f].ar : labels[f].en}
            </button>
          )
        })}
      </div>

      {/* Assignments List */}
      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardBody>
            <div className="text-center py-16 text-gray-400">
              <ClipboardList size={48} className="mx-auto mb-3 opacity-30" />
              <p>{isRtl ? 'لا توجد واجبات' : 'No assignments'}</p>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((assignment: any) => {
            const hasSubmission = !!assignment.submission
            const isGraded = !!assignment.submission?.grade
            const overdue = assignment.dueDate && isOverdue(assignment.dueDate) && !hasSubmission

            return (
              <Card key={assignment.id} className={overdue ? 'border-red-200 bg-red-50' : ''}>
                <CardBody>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-gray-900 text-sm">
                          {isRtl ? (assignment.titleAr || assignment.title) : assignment.title}
                        </h3>
                        {overdue && (
                          <Badge variant="danger" className="text-xs">
                            <AlertCircle size={10} className="inline mr-1" />
                            {isRtl ? 'متأخر' : 'Overdue'}
                          </Badge>
                        )}
                        {isGraded && (
                          <Badge variant="success" className="text-xs">
                            <CheckCircle size={10} className="inline mr-1" />
                            {isRtl ? 'مصحَّح' : 'Graded'}
                          </Badge>
                        )}
                        {hasSubmission && !isGraded && (
                          <Badge variant="primary" className="text-xs">{isRtl ? 'مُسلَّم' : 'Submitted'}</Badge>
                        )}
                      </div>

                      <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                        {assignment.description || (isRtl ? 'لا يوجد وصف' : 'No description')}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {isRtl ? 'موعد التسليم: ' : 'Due: '}
                          {assignment.dueDate
                            ? new Date(assignment.dueDate).toLocaleDateString(isRtl ? 'ar-SA' : 'en-US')
                            : (isRtl ? 'غير محدد' : 'No deadline')
                          }
                        </span>
                        <span>{assignment.maxScore} {isRtl ? 'نقطة' : 'pts'}</span>
                      </div>

                      {isGraded && (
                        <div className="mt-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                          <p className="text-sm font-semibold text-green-700">
                            {isRtl ? 'الدرجة: ' : 'Grade: '}
                            {assignment.submission.grade.points}/{assignment.submission.grade.maxPoints}
                            {' '}({Math.round(assignment.submission.grade.percentage)}%)
                          </p>
                          {assignment.submission.grade.feedback && (
                            <p className="text-xs text-gray-600 mt-1">{assignment.submission.grade.feedback}</p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex-shrink-0">
                      {!hasSubmission ? (
                        <button
                          onClick={() => setSubmitModal(assignment)}
                          disabled={false}
                          className="bg-primary-900 text-white px-4 py-2 rounded-xl text-xs font-medium hover:bg-primary-800 transition-colors"
                        >
                          {isRtl ? 'تسليم' : 'Submit'}
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">
                          {isRtl ? 'تم التسليم' : 'Submitted'}
                        </span>
                      )}
                    </div>
                  </div>
                </CardBody>
              </Card>
            )
          })}
        </div>
      )}

      {/* Submit Modal */}
      {submitModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">
                {isRtl ? 'تسليم الواجب' : 'Submit Assignment'}
              </h3>
              <button onClick={() => setSubmitModal(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm font-medium text-gray-700">
                {isRtl ? (submitModal.titleAr || submitModal.title) : submitModal.title}
              </p>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {isRtl ? 'إجابتك' : 'Your Answer'}
                </label>
                <textarea
                  rows={6}
                  value={submitText}
                  onChange={(e) => setSubmitText(e.target.value)}
                  placeholder={isRtl ? 'اكتب إجابتك هنا...' : 'Write your answer here...'}
                  dir={isRtl ? 'rtl' : 'ltr'}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary-500 resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setSubmitModal(null)} className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm hover:bg-gray-50">
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!submitText.trim() || submitting}
                  className="flex-1 py-2.5 bg-primary-900 text-white rounded-xl text-sm font-medium hover:bg-primary-800 disabled:opacity-50"
                >
                  {submitting ? (isRtl ? 'جارٍ الإرسال...' : 'Submitting...') : (isRtl ? 'إرسال الواجب' : 'Submit Assignment')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
