'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useLocale } from 'next-intl'
import { Card, CardBody, Badge, Skeleton } from '@/components/ui'
import { Brain, Clock, CheckCircle, Play, AlertTriangle } from 'lucide-react'

export default function StudentQuizzesPage() {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const queryClient = useQueryClient()
  const [activeQuiz, setActiveQuiz] = useState<any>(null)
  const [attempt, setAttempt] = useState<any>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const { data: courses } = useQuery({
    queryKey: ['my-courses'],
    queryFn: () => api.get('/courses/my-courses').then(r => r.data?.data || []),
  })

  const [selectedCourse, setSelectedCourse] = useState('')

  const { data: quizzes, isLoading } = useQuery({
    queryKey: ['student-quizzes', selectedCourse],
    queryFn: () => api.get(`/quizzes/course/${selectedCourse}`).then(r => r.data?.data || []),
    enabled: !!selectedCourse,
  })

  // attemptData = { attempt: {...}, quiz: { questions: [...] } }
  const [attemptData, setAttemptData] = useState<any>(null)

  const submitQuiz = useCallback(async (currentAnswers?: Record<string, string>, currentAttempt?: any) => {
    const a = currentAttempt || attempt
    if (!a?.id) return
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    setSubmitting(true)
    try {
      const ans = Object.entries(currentAnswers || answers).map(([questionId, answer]) => ({ questionId, answer }))
      const res = await api.post(`/quizzes/attempts/${a.id}/submit`, { answers: ans })
      setResult(res.data?.data)
      setAttemptData(null)
      setAttempt(null)
      setTimeLeft(null)
      queryClient.invalidateQueries({ queryKey: ['student-quizzes'] })
    } catch {
      alert(isRtl ? 'حدث خطأ' : 'Error submitting quiz')
    } finally {
      setSubmitting(false)
    }
  }, [attempt, answers, isRtl, queryClient])

  const startQuiz = useMutation({
    mutationFn: (quizId: string) => api.post(`/quizzes/${quizId}/start`),
    onSuccess: (res) => {
      const data = res.data?.data
      setAttemptData(data)
      setAttempt(data?.attempt)
      setAnswers({})
      setResult(null)
      // Start timer
      if (timerRef.current) clearInterval(timerRef.current)
      const minutes = data?.quiz?.timeLimitMinutes
      if (minutes && minutes > 0) {
        setTimeLeft(minutes * 60)
      }
    },
  })

  // Countdown timer
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timerRef.current!)
          timerRef.current = null
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [timeLeft === null || timeLeft === 0 ? timeLeft : 'running'])

  // Auto-submit when timer hits 0
  useEffect(() => {
    if (timeLeft === 0 && attempt?.id) {
      submitQuiz(answers, attempt)
    }
  }, [timeLeft])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{isRtl ? 'الاختبارات' : 'Quizzes'}</h1>
        <p className="text-gray-500 text-sm">{isRtl ? 'اختباراتك الدراسية' : 'Your course quizzes'}</p>
      </div>

      {/* Quiz Taking Modal */}
      {activeQuiz && attempt && attemptData && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="font-bold text-gray-900">{isRtl ? (activeQuiz.titleAr || activeQuiz.title) : activeQuiz.title}</h3>
              {timeLeft !== null ? (
                <div className={`flex items-center gap-2 text-sm font-mono font-bold px-3 py-1.5 rounded-xl ${timeLeft <= 60 ? 'text-red-600 bg-red-50 animate-pulse' : 'text-primary-700 bg-primary-50'}`}>
                  {timeLeft <= 60 ? <AlertTriangle size={14} /> : <Clock size={14} />}
                  {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock size={14} />
                  {attemptData.quiz?.timeLimitMinutes || activeQuiz.timeLimitMinutes} {isRtl ? 'دقيقة' : 'min'}
                </div>
              )}
            </div>
            <div className="p-6 space-y-6">
              {(attemptData.quiz?.questions || []).map((q: any, idx: number) => (
                <div key={q.id} className="space-y-3">
                  <p className="font-medium text-gray-900 text-sm">{idx + 1}. {q.text}</p>
                  <div className="space-y-2">
                    {q.options?.map((opt: any) => (
                      <label key={opt.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${answers[q.id] === opt.text ? 'border-primary-400 bg-primary-50' : 'border-gray-100 hover:bg-gray-50'}`}>
                        <input type="radio" name={q.id} value={opt.text} checked={answers[q.id] === opt.text} onChange={() => setAnswers(a => ({ ...a, [q.id]: opt.text }))} className="flex-shrink-0" />
                        <span className="text-sm text-gray-700">{opt.text}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button onClick={() => { if (timerRef.current) clearInterval(timerRef.current); setActiveQuiz(null); setAttempt(null); setAttemptData(null); setTimeLeft(null) }} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700">{isRtl ? 'إلغاء' : 'Cancel'}</button>
                <button
                  onClick={() => submitQuiz()}
                  disabled={submitting || Object.keys(answers).length === 0}
                  className="flex-1 py-2.5 bg-primary-900 text-white rounded-xl text-sm font-medium disabled:opacity-50"
                >
                  {submitting ? '...' : (isRtl ? 'إرسال الاختبار' : 'Submit Quiz')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Result Modal */}
      {result && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-8 text-center">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${result.isPassed ? 'bg-green-100' : 'bg-red-100'}`}>
              <CheckCircle size={40} className={result.isPassed ? 'text-green-500' : 'text-red-400'} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{Math.round(result.score || 0)}%</h3>
            <p className="text-gray-500 mb-2">{result.earnedPoints}/{result.totalPoints} {isRtl ? 'نقطة' : 'points'}</p>
            <Badge variant={result.isPassed ? 'success' : 'danger'} className="mb-6">
              {result.isPassed ? (isRtl ? 'ناجح ✓' : 'Passed ✓') : (isRtl ? 'راسب ✗' : 'Failed ✗')}
            </Badge>
            <button onClick={() => { setResult(null); setActiveQuiz(null) }} className="w-full py-2.5 bg-primary-900 text-white rounded-xl text-sm font-medium hover:bg-primary-800">
              {isRtl ? 'العودة' : 'Done'}
            </button>
          </div>
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

      {!selectedCourse ? (
        <Card><CardBody><div className="text-center py-16 text-gray-400"><Brain size={48} className="mx-auto mb-3 opacity-30" /><p>{isRtl ? 'اختر مقررًا لعرض الاختبارات' : 'Select a course to view quizzes'}</p></div></CardBody></Card>
      ) : isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40" />)}</div>
      ) : quizzes?.length === 0 ? (
        <Card><CardBody><div className="text-center py-16 text-gray-400"><Brain size={48} className="mx-auto mb-3 opacity-30" /><p>{isRtl ? 'لا توجد اختبارات' : 'No quizzes available'}</p></div></CardBody></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {quizzes?.map((quiz: any) => (
            <Card key={quiz.id} className="hover:shadow-md transition-shadow">
              <CardBody>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="font-semibold text-gray-900">{isRtl ? (quiz.titleAr || quiz.title) : quiz.title}</h3>
                  <Badge variant={quiz.myAttempts?.length > 0 ? 'success' : 'default'} className="text-xs flex-shrink-0">
                    {quiz.myAttempts?.length > 0 ? (isRtl ? 'مكتمل' : 'Done') : (isRtl ? 'لم يُحل' : 'Pending')}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                  <span className="flex items-center gap-1"><Clock size={11} />{quiz.timeLimit} {isRtl ? 'دقيقة' : 'min'}</span>
                  <span>{quiz._count?.questions || 0} {isRtl ? 'سؤال' : 'questions'}</span>
                  <span>{isRtl ? 'النجاح: ' : 'Pass: '}{quiz.passingScore}%</span>
                </div>
                {quiz.myAttempts?.length > 0 ? (
                  <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-center">
                    <p className="text-sm font-semibold text-green-700">{Math.round(quiz.myAttempts[0]?.percentage || 0)}%</p>
                    <p className="text-xs text-gray-500">{isRtl ? 'درجتك' : 'Your score'}</p>
                  </div>
                ) : (
                  <button
                    onClick={() => { setActiveQuiz(quiz); startQuiz.mutate(quiz.id) }}
                    disabled={startQuiz.isPending}
                    className="w-full py-2.5 bg-primary-900 text-white rounded-xl text-sm font-medium hover:bg-primary-800 flex items-center justify-center gap-2"
                  >
                    <Play size={14} />{isRtl ? 'ابدأ الاختبار' : 'Start Quiz'}
                  </button>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
