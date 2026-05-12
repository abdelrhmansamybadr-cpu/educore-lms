'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useLocale } from 'next-intl'
import { Card, CardBody, CardHeader, Skeleton } from '@/components/ui'
import { Plus, Search, BookOpen, Users, RotateCcw, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminLibraryPage() {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'books' | 'loans'>('books')
  const [showAddBook, setShowAddBook] = useState(false)
  const [bookForm, setBookForm] = useState({ title: '', author: '', isbn: '', category: '', totalCopies: '1', description: '' })
  const [loanForm, setLoanForm] = useState<{ bookId: string; userId: string } | null>(null)

  const { data: books, isLoading: booksLoading } = useQuery({
    queryKey: ['library-books', search],
    queryFn: () => api.get('/library/books', { params: { search } }).then((r) => r.data?.data || []),
  })

  const { data: loans, isLoading: loansLoading } = useQuery({
    queryKey: ['library-loans'],
    queryFn: () => api.get('/library/loans').then((r) => r.data?.data || []),
    enabled: activeTab === 'loans',
  })

  const createBook = useMutation({
    mutationFn: (data: any) => api.post('/library/books', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['library-books'] })
      setShowAddBook(false)
      setBookForm({ title: '', author: '', isbn: '', category: '', totalCopies: '1', description: '' })
      toast.success(isRtl ? 'تم إضافة الكتاب' : 'Book added')
    },
    onError: () => toast.error(isRtl ? 'حدث خطأ' : 'Failed to add book'),
  })

  const deleteBook = useMutation({
    mutationFn: (id: string) => api.delete(`/library/books/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['library-books'] })
      toast.success(isRtl ? 'تم الحذف' : 'Deleted')
    },
  })

  const returnBook = useMutation({
    mutationFn: (id: string) => api.patch(`/library/loans/${id}/return`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['library-loans'] })
      toast.success(isRtl ? 'تم الاسترجاع' : 'Returned')
    },
  })

  const loanBook = useMutation({
    mutationFn: ({ bookId, userId }: { bookId: string; userId: string }) =>
      api.post(`/library/books/${bookId}/loan`, { userId, dueDays: 14 }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['library-books'] })
      qc.invalidateQueries({ queryKey: ['library-loans'] })
      setLoanForm(null)
      toast.success(isRtl ? 'تم الإعارة' : 'Book loaned')
    },
    onError: () => toast.error(isRtl ? 'لا توجد نسخ متاحة' : 'No copies available'),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isRtl ? 'المكتبة' : 'Library'}</h1>
          <p className="text-gray-500 text-sm mt-1">{isRtl ? 'إدارة الكتب والإعارات' : 'Manage books and loans'}</p>
        </div>
        <button
          onClick={() => setShowAddBook(true)}
          className="flex items-center gap-2 bg-primary-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-800"
        >
          <Plus size={16} />
          {isRtl ? 'إضافة كتاب' : 'Add Book'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {[
          { id: 'books', label: isRtl ? 'الكتب' : 'Books', icon: BookOpen },
          { id: 'loans', label: isRtl ? 'الإعارات' : 'Loans', icon: Users },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Add Book Modal */}
      {showAddBook && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <h3 className="font-semibold">{isRtl ? 'إضافة كتاب جديد' : 'Add New Book'}</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                <input placeholder={isRtl ? 'عنوان الكتاب *' : 'Book Title *'} value={bookForm.title}
                  onChange={(e) => setBookForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500" />
                <input placeholder={isRtl ? 'المؤلف' : 'Author'} value={bookForm.author}
                  onChange={(e) => setBookForm((f) => ({ ...f, author: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500" />
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="ISBN" value={bookForm.isbn}
                    onChange={(e) => setBookForm((f) => ({ ...f, isbn: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500" />
                  <input placeholder={isRtl ? 'الفئة' : 'Category'} value={bookForm.category}
                    onChange={(e) => setBookForm((f) => ({ ...f, category: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500" />
                </div>
                <input type="number" min="1" placeholder={isRtl ? 'عدد النسخ' : 'Total Copies'} value={bookForm.totalCopies}
                  onChange={(e) => setBookForm((f) => ({ ...f, totalCopies: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500" />
                <textarea placeholder={isRtl ? 'الوصف' : 'Description'} value={bookForm.description} rows={2}
                  onChange={(e) => setBookForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500 resize-none" />
                <div className="flex gap-2 pt-1">
                  <button onClick={() => setShowAddBook(false)} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50">
                    {isRtl ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    onClick={() => createBook.mutate({ ...bookForm, totalCopies: Number(bookForm.totalCopies) })}
                    disabled={!bookForm.title || createBook.isPending}
                    className="flex-1 bg-primary-900 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-primary-800 disabled:opacity-60"
                  >
                    {isRtl ? 'إضافة' : 'Add'}
                  </button>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {activeTab === 'books' && (
        <>
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 max-w-sm">
            <Search size={16} className="text-gray-400" />
            <input
              placeholder={isRtl ? 'بحث...' : 'Search books...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 text-sm outline-none bg-transparent"
            />
          </div>

          {booksLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(books || []).map((book: any) => {
                const borrowed = book._count?.loans || 0
                const available = book.totalCopies - borrowed
                return (
                  <Card key={book.id}>
                    <CardBody>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <BookOpen size={18} className="text-primary-700" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-sm truncate">{book.title}</h3>
                          <p className="text-xs text-gray-500">{book.author || (isRtl ? 'غير معروف' : 'Unknown author')}</p>
                          {book.category && <span className="inline-block mt-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">{book.category}</span>}
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className={`text-xs font-medium ${available > 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {available}/{book.totalCopies} {isRtl ? 'متاح' : 'available'}
                        </span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => setLoanForm({ bookId: book.id, userId: '' })}
                            disabled={available === 0}
                            className="px-2.5 py-1 text-xs bg-primary-100 text-primary-800 rounded-lg hover:bg-primary-200 disabled:opacity-40"
                          >
                            {isRtl ? 'إعارة' : 'Loan'}
                          </button>
                          <button onClick={() => deleteBook.mutate(book.id)} className="p-1 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                )
              })}
            </div>
          )}
        </>
      )}

      {activeTab === 'loans' && (
        <Card>
          <CardBody>
            {loansLoading ? (
              <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
            ) : (loans || []).length === 0 ? (
              <p className="text-center text-gray-400 py-8">{isRtl ? 'لا توجد إعارات' : 'No loans'}</p>
            ) : (
              <div className="space-y-2">
                {(loans || []).map((loan: any) => (
                  <div key={loan.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-gray-200">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{loan.book?.title}</p>
                      <p className="text-xs text-gray-500">
                        {loan.user?.profile?.firstName} {loan.user?.profile?.lastName} · {isRtl ? 'مستحق' : 'Due'}: {new Date(loan.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        loan.status === 'RETURNED' ? 'bg-green-50 text-green-700' :
                        new Date(loan.dueDate) < new Date() ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
                      }`}>
                        {loan.status === 'RETURNED' ? (isRtl ? 'مُرتجع' : 'Returned') :
                         new Date(loan.dueDate) < new Date() ? (isRtl ? 'متأخر' : 'Overdue') : (isRtl ? 'مُعار' : 'Borrowed')}
                      </span>
                      {loan.status !== 'RETURNED' && (
                        <button onClick={() => returnBook.mutate(loan.id)} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg">
                          <RotateCcw size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Loan Book Modal */}
      {loanForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-sm">
            <CardHeader><h3 className="font-semibold">{isRtl ? 'إعارة كتاب' : 'Loan Book'}</h3></CardHeader>
            <CardBody>
              <div className="space-y-3">
                <input placeholder={isRtl ? 'معرّف الطالب (User ID)' : 'Student User ID'} value={loanForm.userId}
                  onChange={(e) => setLoanForm((f) => f ? { ...f, userId: e.target.value } : f)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500" />
                <div className="flex gap-2">
                  <button onClick={() => setLoanForm(null)} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50">
                    {isRtl ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    onClick={() => loanBook.mutate(loanForm)}
                    disabled={!loanForm.userId || loanBook.isPending}
                    className="flex-1 bg-primary-900 text-white rounded-xl py-2.5 text-sm font-medium disabled:opacity-60"
                  >
                    {isRtl ? 'إعارة' : 'Loan'}
                  </button>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  )
}
