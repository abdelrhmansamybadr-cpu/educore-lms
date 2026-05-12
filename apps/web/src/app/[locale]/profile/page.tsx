'use client'

import { useState, useEffect } from 'react'
import { useLocale } from 'next-intl'
import { useAuthStore } from '@/stores/authStore'
import { api } from '@/lib/api'
import { Card, CardHeader, CardBody, Avatar } from '@/components/ui'
import { Save, Camera, User, Lock } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const { user, setUser } = useAuthStore()

  const [profileForm, setProfileForm] = useState({
    firstName: '', lastName: '', firstNameAr: '', lastNameAr: '', phone: '', bio: '',
  })
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile')

  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        firstNameAr: (user as any).firstNameAr || '',
        lastNameAr: (user as any).lastNameAr || '',
        phone: (user as any).phone || '',
        bio: (user as any).bio || '',
      })
    }
  }, [user])

  const saveProfile = async () => {
    setSavingProfile(true)
    try {
      const res = await api.patch('/users/me', profileForm)
      if (res.data?.data) setUser(res.data.data)
      toast.success(isRtl ? 'تم حفظ الملف الشخصي' : 'Profile saved')
    } catch {
      toast.error(isRtl ? 'حدث خطأ' : 'Failed to save')
    } finally {
      setSavingProfile(false)
    }
  }

  const changePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error(isRtl ? 'كلمة المرور غير متطابقة' : 'Passwords do not match')
      return
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error(isRtl ? 'كلمة المرور قصيرة جداً' : 'Password must be at least 8 characters')
      return
    }
    setSavingPassword(true)
    try {
      await api.patch('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      toast.success(isRtl ? 'تم تغيير كلمة المرور' : 'Password changed')
    } catch (err: any) {
      toast.error(err.response?.data?.message || (isRtl ? 'حدث خطأ' : 'Failed to change password'))
    } finally {
      setSavingPassword(false)
    }
  }

  const displayName = isRtl
    ? `${(user as any)?.firstNameAr || user?.firstName || ''} ${(user as any)?.lastNameAr || user?.lastName || ''}`
    : `${user?.firstName || ''} ${user?.lastName || ''}`

  const tabs = [
    { id: 'profile', label: isRtl ? 'المعلومات الشخصية' : 'Personal Info', icon: User },
    { id: 'security', label: isRtl ? 'الأمان' : 'Security', icon: Lock },
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{isRtl ? 'الملف الشخصي' : 'My Profile'}</h1>
        <p className="text-gray-500 text-sm mt-1">{isRtl ? 'إدارة معلوماتك الشخصية وإعدادات الحساب' : 'Manage your personal information and account settings'}</p>
      </div>

      {/* Avatar Section */}
      <Card>
        <CardBody>
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar src={user?.avatar} name={displayName.trim() || 'U'} size="xl" />
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-primary-900 text-white rounded-full flex items-center justify-center hover:bg-primary-800 shadow-md">
                <Camera size={14} />
              </button>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{displayName.trim()}</h2>
              <p className="text-sm text-gray-500">{user?.email}</p>
              <span className="inline-block mt-1 px-2.5 py-0.5 bg-primary-100 text-primary-800 text-xs font-medium rounded-full">
                {user?.role}
              </span>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {tabs.map((tab) => (
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

      {activeTab === 'profile' && (
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-900">{isRtl ? 'المعلومات الشخصية' : 'Personal Information'}</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'الاسم الأول (إنجليزي)' : 'First Name'}</label>
                  <input
                    value={profileForm.firstName}
                    onChange={(e) => setProfileForm((f) => ({ ...f, firstName: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'الاسم الأخير (إنجليزي)' : 'Last Name'}</label>
                  <input
                    value={profileForm.lastName}
                    onChange={(e) => setProfileForm((f) => ({ ...f, lastName: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">الاسم الأول (عربي)</label>
                  <input
                    value={profileForm.firstNameAr}
                    onChange={(e) => setProfileForm((f) => ({ ...f, firstNameAr: e.target.value }))}
                    dir="rtl"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">الاسم الأخير (عربي)</label>
                  <input
                    value={profileForm.lastNameAr}
                    onChange={(e) => setProfileForm((f) => ({ ...f, lastNameAr: e.target.value }))}
                    dir="rtl"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'رقم الهاتف' : 'Phone'}</label>
                <input
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'نبذة عني' : 'Bio'}</label>
                <textarea
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm((f) => ({ ...f, bio: e.target.value }))}
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500 resize-none"
                />
              </div>
              <button
                onClick={saveProfile}
                disabled={savingProfile}
                className="flex items-center gap-2 bg-primary-900 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-800 disabled:opacity-60"
              >
                <Save size={16} />
                {savingProfile ? (isRtl ? 'حفظ...' : 'Saving...') : (isRtl ? 'حفظ التغييرات' : 'Save Changes')}
              </button>
            </div>
          </CardBody>
        </Card>
      )}

      {activeTab === 'security' && (
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-900">{isRtl ? 'تغيير كلمة المرور' : 'Change Password'}</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'كلمة المرور الحالية' : 'Current Password'}</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm((f) => ({ ...f, currentPassword: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'كلمة المرور الجديدة' : 'New Password'}</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm((f) => ({ ...f, newPassword: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'تأكيد كلمة المرور' : 'Confirm New Password'}</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500"
                />
              </div>
              <button
                onClick={changePassword}
                disabled={savingPassword || !passwordForm.currentPassword || !passwordForm.newPassword}
                className="flex items-center gap-2 bg-primary-900 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-800 disabled:opacity-60"
              >
                <Lock size={16} />
                {savingPassword ? (isRtl ? 'تغيير...' : 'Changing...') : (isRtl ? 'تغيير كلمة المرور' : 'Change Password')}
              </button>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  )
}
