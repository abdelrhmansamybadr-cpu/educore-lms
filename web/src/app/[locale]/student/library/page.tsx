'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useLocale } from 'next-intl'
import { Card, CardBody, CardHeader, Skeleton } from '@/components/ui'
import { BookOpen, Search, Clock } from 'lucide-react'

export default function StudentLibraryPage() {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'browse' | 'myloans'>('browse')

  const { data: books, isLoading } = useQuery({
    queryKey: ['library-books-student', search],
    queryFn: () => api.get('/library/books', { params: { search } }).then((r) => r.data?.data || []),
    enabled: tab === 'browse',
  })

  const { data: myLoans, isLoading: loansLoading } = useQuery({
    queryKey: ['my-loans'],
    queryFn: () => api.get('/library/my-loans').then((r) => r.data?.data || []),
    enabled: tab === 'myloans',
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{isRtl ? 'المكتبة' : 'Library'}</h1>
        <p className="text-gray-500 text-sm mt-1">{isRtl ? 'تصفح الكتب وتاريخ إعاراتك' : 'Browse books and your loan history'}</p>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {[
          { id: 'browse', label: isRtl ? 'تصفح الكتب' : 'Browse Books' },
          { id: 'myloans', label: isRtl ? 'إعاراتي' : 'My Loans' },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'browse' && (
        <>
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 max-w-sm">
            <Search size={16} className="text-gray-400" />
            <input placeholder={isRtl ? 'بحث...' : 'Search books...'} value={search} onChange={(e) => setSearch(e.target.value)}
              className="flex-1 text-sm outline-none bg-transparent" />
          </div>
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-36" />)}</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {(books || []).map((book: any) => {
                const borrowed = book._count?.loans || 0
                const available = book.totalCopies - borrowed
                return (
                  <Card key={book.id}>
                    <CardBody>
                      <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center mb-2">
                        <BookOpen size={18} className="text-primary-700" />
                      </div>
                      <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">{book.title}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{book.author}</p>
                      {book.category && <span className="inline-block mt-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">{book.category}</span>}
                      <p className={`text-xs mt-2 font-medium ${available > 0 ? 'text-green-600' : 'text-red-400'}`}>
                        {available > 0 ? `${available} ${isRtl ? 'نسخة متاحة' : 'available'}` : (isRtl ? 'غير متاح' : 'Not available')}
                      </p>
                    </CardBody>
                  </Card>
                )
              })}
            </div>
          )}
        </>
      )}

      {tab === 'myloans' && (
        <Card>
          <CardHeader><h3 className="font-semibold text-gray-900">{isRtl ? 'كتبي المُعارة' : 'My Borrowed Books'}</h3></CardHeader>
          <CardBody>
            {loansLoading ? (
              <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
            ) : (myLoans || []).length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <BookOpen size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">{isRtl ? 'لا توجد إعارات حالية' : 'No current loans'}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {(myLoans || []).map((loan: any) => {
                  const overdue = loan.status !== 'RETURNED' && new Date(loan.dueDate) < new Date()
                  return (
                    <div key={loan.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{loan.book?.title}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Clock size={11} className="text-gray-400" />
                          <p className="text-xs text-gray-500">{isRtl ? 'مستحق: ' : 'Due: '}{new Date(loan.dueDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        loan.status === 'RETURNED' ? 'bg-green-50 text-green-700' :
                        overdue ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
                      }`}>
                        {loan.status === 'RETURNED' ? (isRtl ? 'مُرتجع' : 'Returned') :
                         overdue ? (isRtl ? 'متأخر' : 'Overdue') : (isRtl ? 'نشط' : 'Active')}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  )
}
