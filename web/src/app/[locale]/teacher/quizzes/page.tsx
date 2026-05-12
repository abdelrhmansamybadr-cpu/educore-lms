'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useLocale } from 'next-intl'
import { Card, CardHeader, CardBody, Badge, Skeleton } from '@/components/ui'
import { Brain, Plus, Trash2, Eye, EyeOff, X, Sparkles, Loader2 } from 'lucide-react'

export default function TeacherQuizzesPage() {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const queryClient = useQueryClient()
  const [selectedCourse, setSelectedCourse] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [activeQuiz, setActiveQuiz] = useState<any>(null)
  const [form, setForm] = useState({ title: '', titleAr: '', description: '', timeLimit: '30', passingScore: '60' })
  const [questionForm, setQuestionForm] = useState({ text: '', type: 'MULTIPLE_CHOICE', points: '1', options: ['', '', '', ''], correctAnswer: '0' })
  const [showAiGenerator, setShowAiGenerator] = useState(false)
  const [aiForm, setAiForm] = useState({ topic: '', subject: '', gradeLevel: '', questionCount: '5', difficulty: 'MEDIUM' })
  const [aiGenerating, setAiGenerating] = useState(false)

  const { data: courses } = useQuery({
    queryKey: ['teacher-courses'],
    queryFn: () => api.get('/courses?limit=100').then(r => r.data?.data || []),
  })

  const { data: quizzes, isLoading } = useQuery({
    queryKey: ['teacher-quizzes', selectedCourse],
    queryFn: () => api.get(`/quizzes/course/${selectedCourse}`).then(r => r.data?.data || []),
    enabled: !!selectedCourse,
  })

  const { data: quizDetail } = useQuery({
    queryKey: ['quiz-detail', activeQuiz?.id],
    queryFn: () => api.get(`/quizzes/${activeQuiz.id}/teacher-view`).then(r => r.data?.data),
    enabled: !!activeQuiz?.id,
  })

  const createQuiz = useMutation({
    mutationFn: (data: any) => api.post('/quizzes', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['teacher-quizzes'] }); setShowCreate(false) },
  })

  const togglePublish = useMutation({
    mutationFn: (id: string) => api.patch(`/quizzes/${id}/publish`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teacher-quizzes'] }),
  })

  const deleteQuiz = useMutation({
    mutationFn: (id: string) => api.delete(`/quizzes/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teacher-quizzes'] }),
  })

  const addQuestion = useMutation({
    mutationFn: ({ quizId, data }: any) => api.post(`/quizzes/${quizId}/questions`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['quiz-detail'] }); setQuestionForm({ text: '', type: 'MULTIPLE_CHOICE', points: '1', options: ['', '', '', ''], correctAnswer: '0' }) },
  })

  const generateAiQuestions = async () => {
    if (!activeQuiz?.id || !aiForm.topic || !aiForm.subject) return
    setAiGenerating(true)
    try {
      const res = await api.post('/ai/quiz-generator', {
        ...aiForm,
        questionCount: Number(aiForm.questionCount),
        language: locale === 'ar' ? 'ar' : 'en',
      })
      const questions: any[] = res.data?.data || []
      // Add all generated questions to the quiz
      for (const q of questions) {
        if (!q.text || !q.options) continue
        await api.post(`/quizzes/${activeQuiz.id}/questions`, {
          text: q.text,
          type: 'MULTIPLE_CHOICE',
          points: q.points || 1,
          correctAnswer: q.options?.find((o: any) => o.isCorrect)?.text || q.correctAnswer,
          options: q.options?.map((o: any) => ({ text: o.text, isCorrect: o.isCorrect || false })),
        })
      }
      queryClient.invalidateQueries({ queryKey: ['quiz-detail'] })
      setShowAiGenerator(false)
    } catch {
      alert(isRtl ? 'فشل توليد الأسئلة' : 'Failed to generate questions')
    } finally {
      setAiGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isRtl ? 'الاختبارات' : 'Quizzes'}</h1>
          <p className="text-gray-500 text-sm">{isRtl ? 'إنشاء وإدارة الاختبارات' : 'Create and manage quizzes'}</p>
        </div>
        {selectedCourse && (
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-primary-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-800">
            <Plus size={16} />{isRtl ? 'اختبار جديد' : 'New Quiz'}
          </button>
        )}
      </div>

      {/* Course Selector */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'المقرر' : 'Course'}</label>
        <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500 min-w-64">
          <option value="">{isRtl ? '-- اختر المقرر --' : '-- Select Course --'}</option>
          {courses?.map((c: any) => <option key={c.id} value={c.id}>{isRtl ? (c.titleAr || c.title) : c.title}</option>)}
        </select>
      </div>

      {/* Create Quiz Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">{isRtl ? 'إنشاء اختبار' : 'Create Quiz'}</h3>
              <button onClick={() => setShowCreate(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder={isRtl ? 'عنوان الاختبار (إنجليزي)' : 'Quiz title (English)'} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary-500" />
              <input value={form.titleAr} onChange={e => setForm(f => ({ ...f, titleAr: e.target.value }))} placeholder="عنوان الاختبار (عربي)" dir="rtl" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary-500" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'المدة (دقيقة)' : 'Time Limit (min)'}</label>
                  <input type="number" value={form.timeLimit} onChange={e => setForm(f => ({ ...f, timeLimit: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'درجة النجاح (%)' : 'Passing Score (%)'}</label>
                  <input type="number" value={form.passingScore} onChange={e => setForm(f => ({ ...f, passingScore: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary-500" />
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm">{isRtl ? 'إلغاء' : 'Cancel'}</button>
                <button
                  onClick={() => createQuiz.mutate({ title: form.title, titleAr: form.titleAr, courseId: selectedCourse, timeLimitMinutes: Number(form.timeLimit), passingScore: Number(form.passingScore) })}
                  disabled={!form.title || createQuiz.isPending}
                  className="flex-1 py-2.5 bg-primary-900 text-white rounded-xl text-sm font-medium disabled:opacity-50"
                >
                  {createQuiz.isPending ? '...' : (isRtl ? 'إنشاء' : 'Create')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Quiz List */}
        <div className="lg:col-span-1 space-y-3">
          {!selectedCourse ? (
            <Card><CardBody><div className="text-center py-12 text-gray-400"><Brain size={40} className="mx-auto mb-2 opacity-30" /><p className="text-sm">{isRtl ? 'اختر مقررًا أولًا' : 'Select a course first'}</p></div></CardBody></Card>
          ) : isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)
          ) : quizzes?.length === 0 ? (
            <Card><CardBody><div className="text-center py-12 text-gray-400"><Brain size={40} className="mx-auto mb-2 opacity-30" /><p className="text-sm">{isRtl ? 'لا توجد اختبارات' : 'No quizzes yet'}</p></div></CardBody></Card>
          ) : quizzes?.map((quiz: any) => (
            <button key={quiz.id} onClick={() => setActiveQuiz(quiz)} className={`w-full text-start p-4 rounded-2xl border transition-all ${activeQuiz?.id === quiz.id ? 'border-primary-300 bg-primary-50' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-sm text-gray-900">{isRtl ? (quiz.titleAr || quiz.title) : quiz.title}</p>
                <Badge variant={quiz.isPublished ? 'success' : 'default'} className="text-xs flex-shrink-0">{quiz.isPublished ? (isRtl ? 'منشور' : 'Live') : (isRtl ? 'مسودة' : 'Draft')}</Badge>
              </div>
              <p className="text-xs text-gray-400 mt-1">{quiz._count?.questions || 0} {isRtl ? 'سؤال' : 'questions'} · {quiz.timeLimit} {isRtl ? 'دقيقة' : 'min'}</p>
            </button>
          ))}
        </div>

        {/* Quiz Detail */}
        <div className="lg:col-span-2">
          {activeQuiz ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">{isRtl ? (activeQuiz.titleAr || activeQuiz.title) : activeQuiz.title}</h3>
                  <div className="flex gap-2">
                    <button onClick={() => setShowAiGenerator(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-purple-200 text-purple-700 hover:bg-purple-50">
                      <Sparkles size={12} />{isRtl ? 'توليد AI' : 'AI Generate'}
                    </button>
                    <button onClick={() => togglePublish.mutate(activeQuiz.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border ${activeQuiz.isPublished ? 'border-gray-200 text-gray-600 hover:bg-gray-50' : 'border-green-200 text-green-700 hover:bg-green-50'}`}>
                      {activeQuiz.isPublished ? <><EyeOff size={12} />{isRtl ? 'إلغاء النشر' : 'Unpublish'}</> : <><Eye size={12} />{isRtl ? 'نشر' : 'Publish'}</>}
                    </button>
                    <button onClick={() => { if (confirm(isRtl ? 'حذف الاختبار؟' : 'Delete quiz?')) deleteQuiz.mutate(activeQuiz.id) }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-xl"><Trash2 size={14} /></button>
                  </div>
                </div>
              </CardHeader>
              <CardBody>
                {/* Add Question Form */}
                <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3">
                  <h4 className="text-sm font-semibold text-gray-700">{isRtl ? 'إضافة سؤال' : 'Add Question'}</h4>
                  <textarea value={questionForm.text} onChange={e => setQuestionForm(f => ({ ...f, text: e.target.value }))} placeholder={isRtl ? 'نص السؤال...' : 'Question text...'} rows={2} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary-500 resize-none bg-white" />
                  {questionForm.options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input type="radio" name="correct" checked={questionForm.correctAnswer === String(i)} onChange={() => setQuestionForm(f => ({ ...f, correctAnswer: String(i) }))} className="flex-shrink-0" />
                      <input value={opt} onChange={e => { const opts = [...questionForm.options]; opts[i] = e.target.value; setQuestionForm(f => ({ ...f, options: opts })) }} placeholder={`${isRtl ? 'خيار' : 'Option'} ${i + 1}`} className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary-500 bg-white" />
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const correctIdx = Number(questionForm.correctAnswer)
                      const filteredOptions = questionForm.options.filter(Boolean)
                      addQuestion.mutate({ quizId: activeQuiz.id, data: { text: questionForm.text, type: 'MULTIPLE_CHOICE', points: Number(questionForm.points), correctAnswer: filteredOptions[correctIdx] || filteredOptions[0], options: filteredOptions.map((text, i) => ({ text, isCorrect: i === correctIdx })) } })
                    }}
                    disabled={!questionForm.text || addQuestion.isPending}
                    className="w-full py-2 bg-primary-900 text-white rounded-xl text-sm font-medium hover:bg-primary-800 disabled:opacity-50"
                  >
                    {addQuestion.isPending ? '...' : (isRtl ? 'إضافة السؤال' : 'Add Question')}
                  </button>
                </div>

                {/* Questions List */}
                <div className="space-y-2">
                  {quizDetail?.questions?.map((q: any, idx: number) => (
                    <div key={q.id} className="p-3 border border-gray-100 rounded-xl">
                      <p className="text-sm font-medium text-gray-900">{idx + 1}. {q.text}</p>
                      <div className="mt-2 space-y-1">
                        {q.options?.map((opt: any) => (
                          <div key={opt.id} className={`text-xs px-3 py-1.5 rounded-lg ${opt.isCorrect ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-500'}`}>
                            {opt.isCorrect ? '✓ ' : '○ '}{opt.text}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          ) : (
            <div className="flex items-center justify-center h-64 bg-white rounded-2xl border border-gray-100 text-gray-400">
              <div className="text-center"><Brain size={40} className="mx-auto mb-2 opacity-20" /><p>{isRtl ? 'اختر اختبارًا لعرضه' : 'Select a quiz to view'}</p></div>
            </div>
          )}
        </div>
      </div>

      {/* AI Question Generator Modal */}
      {showAiGenerator && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-purple-600" />
                <h3 className="font-bold text-gray-900">{isRtl ? 'توليد أسئلة بالذكاء الاصطناعي' : 'AI Question Generator'}</h3>
              </div>
              <button onClick={() => setShowAiGenerator(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'الموضوع *' : 'Topic *'}</label>
                <input value={aiForm.topic} onChange={e => setAiForm(f => ({ ...f, topic: e.target.value }))} placeholder={isRtl ? 'مثال: المعادلات التربيعية' : 'e.g. Quadratic equations'} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'المادة *' : 'Subject *'}</label>
                <input value={aiForm.subject} onChange={e => setAiForm(f => ({ ...f, subject: e.target.value }))} placeholder={isRtl ? 'مثال: الرياضيات' : 'e.g. Mathematics'} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'عدد الأسئلة' : 'Questions'}</label>
                  <input type="number" min="1" max="20" value={aiForm.questionCount} onChange={e => setAiForm(f => ({ ...f, questionCount: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'الصعوبة' : 'Difficulty'}</label>
                  <select value={aiForm.difficulty} onChange={e => setAiForm(f => ({ ...f, difficulty: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary-500">
                    <option value="EASY">{isRtl ? 'سهل' : 'Easy'}</option>
                    <option value="MEDIUM">{isRtl ? 'متوسط' : 'Medium'}</option>
                    <option value="HARD">{isRtl ? 'صعب' : 'Hard'}</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowAiGenerator(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700">{isRtl ? 'إلغاء' : 'Cancel'}</button>
                <button
                  onClick={generateAiQuestions}
                  disabled={!aiForm.topic || !aiForm.subject || aiGenerating}
                  className="flex-1 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {aiGenerating ? <><Loader2 size={14} className="animate-spin" />{isRtl ? 'جارٍ التوليد...' : 'Generating...'}</> : <><Sparkles size={14} />{isRtl ? 'توليد الأسئلة' : 'Generate Questions'}</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
