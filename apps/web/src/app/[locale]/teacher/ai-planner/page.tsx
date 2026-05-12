'use client'

import { useState } from 'react'
import { api } from '@/lib/api'
import { useLocale } from 'next-intl'
import { Card, CardHeader, CardBody } from '@/components/ui'
import { Sparkles, Loader2, Copy, CheckCheck } from 'lucide-react'
import toast from 'react-hot-toast'

export default function TeacherAiPlannerPage() {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const [form, setForm] = useState({ subject: '', topic: '', gradeLevel: '', duration: '45', objectives: '' })
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const generate = async () => {
    if (!form.subject || !form.topic) return
    setLoading(true)
    setResult(null)
    try {
      const res = await api.post('/ai/lesson-plan', {
        subject: form.subject,
        topic: form.topic,
        gradeLevel: form.gradeLevel || 'General',
        duration: Number(form.duration),
        learningObjectives: form.objectives ? form.objectives.split('\n').filter(Boolean) : undefined,
        language: locale === 'ar' ? 'ar' : 'en',
      })
      setResult(res.data?.data)
    } catch {
      toast.error(isRtl ? 'حدث خطأ في توليد الخطة' : 'Failed to generate lesson plan')
    } finally {
      setLoading(false)
    }
  }

  const copy = () => {
    const text = result?.plan || result?.content || JSON.stringify(result, null, 2)
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{isRtl ? 'مخطط الدروس بالذكاء الاصطناعي' : 'AI Lesson Planner'}</h1>
        <p className="text-gray-500 text-sm">{isRtl ? 'أنشئ خطط دراسية احترافية بثوانٍ' : 'Generate professional lesson plans in seconds'}</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-primary-700" />
              <h3 className="font-semibold text-gray-900">{isRtl ? 'بيانات الدرس' : 'Lesson Details'}</h3>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'المادة الدراسية *' : 'Subject *'}</label>
                <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder={isRtl ? 'مثال: الرياضيات' : 'e.g. Mathematics'} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'موضوع الدرس *' : 'Topic *'}</label>
                <input value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))} placeholder={isRtl ? 'مثال: المعادلات التربيعية' : 'e.g. Quadratic Equations'} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'المرحلة الدراسية' : 'Grade Level'}</label>
                  <input value={form.gradeLevel} onChange={e => setForm(f => ({ ...f, gradeLevel: e.target.value }))} placeholder={isRtl ? 'مثال: الصف العاشر' : 'e.g. Grade 10'} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'المدة (دقيقة)' : 'Duration (min)'}</label>
                  <input type="number" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'الأهداف التعليمية' : 'Learning Objectives'}</label>
                <textarea value={form.objectives} onChange={e => setForm(f => ({ ...f, objectives: e.target.value }))} placeholder={isRtl ? 'اكتب الأهداف المطلوبة...' : 'Enter desired learning objectives...'} rows={3} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500 resize-none" />
              </div>
              <button
                onClick={generate}
                disabled={!form.subject || !form.topic || loading}
                className="w-full py-3 bg-primary-900 text-white rounded-xl text-sm font-medium hover:bg-primary-800 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <><Loader2 size={16} className="animate-spin" />{isRtl ? 'جارٍ التوليد...' : 'Generating...'}</> : <><Sparkles size={16} />{isRtl ? 'توليد خطة الدرس' : 'Generate Lesson Plan'}</>}
              </button>
            </div>
          </CardBody>
        </Card>

        {/* Result */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">{isRtl ? 'خطة الدرس' : 'Generated Plan'}</h3>
              {result && (
                <button onClick={copy} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg">
                  {copied ? <><CheckCheck size={12} className="text-green-500" />{isRtl ? 'تم النسخ' : 'Copied'}</> : <><Copy size={12} />{isRtl ? 'نسخ' : 'Copy'}</>}
                </button>
              )}
            </div>
          </CardHeader>
          <CardBody>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4 text-gray-400">
                <Loader2 size={40} className="animate-spin text-primary-500" />
                <p className="text-sm">{isRtl ? 'يعمل الذكاء الاصطناعي على إنشاء خطتك...' : 'AI is crafting your lesson plan...'}</p>
              </div>
            ) : result ? (
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 rounded-xl p-4 overflow-auto max-h-[480px]">
                  {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400 text-center">
                <Sparkles size={40} className="mb-3 opacity-20" />
                <p className="text-sm">{isRtl ? 'أدخل بيانات الدرس واضغط توليد' : 'Fill in lesson details and click Generate'}</p>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
