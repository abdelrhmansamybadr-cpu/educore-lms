'use client'

import { useState } from 'react'
import { Card, CardHeader, CardBody, Button, Badge } from '@/components/ui'
import { Shield, Globe, Bell, Database, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

const VERSION = '1.0.0'

export default function SuperAdminSettingsPage() {
  const [maintenance, setMaintenance] = useState(false)
  const [maintenanceMsg, setMaintenanceMsg] = useState('System under scheduled maintenance. We\'ll be back shortly.')

  const handleSaveMaintenance = () => {
    // In production: API call to toggle maintenance mode
    toast.success(maintenance ? 'Maintenance mode enabled' : 'Maintenance mode disabled')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Platform Settings</h1>
        <p className="text-sm text-neutral-500 mt-1">Global configuration for the EduCore platform</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Platform Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe size={18} className="text-primary-600" />
              <h3 className="font-semibold">Platform Information</h3>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-700">
                <span className="text-sm text-neutral-600 dark:text-neutral-400">Version</span>
                <Badge variant="primary">v{VERSION}</Badge>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-700">
                <span className="text-sm text-neutral-600 dark:text-neutral-400">Environment</span>
                <Badge variant="success">Production</Badge>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-700">
                <span className="text-sm text-neutral-600 dark:text-neutral-400">Database</span>
                <Badge variant="success">PostgreSQL 16</Badge>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-700">
                <span className="text-sm text-neutral-600 dark:text-neutral-400">Cache</span>
                <Badge variant="success">Redis 7</Badge>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-neutral-600 dark:text-neutral-400">Storage</span>
                <Badge variant="accent">AWS S3</Badge>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* System Health */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database size={18} className="text-primary-600" />
              <h3 className="font-semibold">System Health</h3>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {[
                { name: 'API Server', status: 'operational', latency: '23ms' },
                { name: 'Database', status: 'operational', latency: '5ms' },
                { name: 'Redis Cache', status: 'operational', latency: '1ms' },
                { name: 'File Storage', status: 'operational', latency: '80ms' },
                { name: 'Email Service', status: 'operational', latency: '120ms' },
              ].map((svc) => (
                <div key={svc.name} className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-700 last:border-0">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-success-500" />
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{svc.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-neutral-400">{svc.latency}</span>
                    <Badge variant="success">Operational</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Maintenance Mode */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-warning-500" />
              <h3 className="font-semibold">Maintenance Mode</h3>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Enable Maintenance Mode</p>
                  <p className="text-xs text-neutral-500 mt-0.5">Prevents all users from accessing the platform</p>
                </div>
                <button
                  onClick={() => setMaintenance(!maintenance)}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none ${maintenance ? 'bg-warning-500' : 'bg-neutral-300 dark:bg-neutral-600'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${maintenance ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">Maintenance Message</label>
                <textarea
                  rows={3}
                  value={maintenanceMsg}
                  onChange={(e) => setMaintenanceMsg(e.target.value)}
                  className="w-full border border-neutral-200 dark:border-neutral-600 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500 dark:bg-neutral-700 dark:text-neutral-100 resize-none"
                />
              </div>
              <Button
                variant={maintenance ? 'primary' : 'outline'}
               
                onClick={handleSaveMaintenance}
                className="w-full"
              >
                {maintenance ? 'Enable Maintenance Mode' : 'Save Message'}
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield size={18} className="text-primary-600" />
              <h3 className="font-semibold">Security</h3>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              {[
                { label: 'Force 2FA for Admins', desc: 'Require two-factor authentication for all school admins', enabled: true },
                { label: 'Session Timeout', desc: 'Automatically log out inactive users after 30 minutes', enabled: true },
                { label: 'IP Allowlist', desc: 'Restrict super admin access to specific IP addresses', enabled: false },
                { label: 'Audit Logging', desc: 'Log all sensitive actions across the platform', enabled: true },
              ].map((setting) => (
                <div key={setting.label} className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{setting.label}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">{setting.desc}</p>
                  </div>
                  <Badge variant={setting.enabled ? 'success' : 'default'}>
                    {setting.enabled ? 'On' : 'Off'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Notification Settings */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell size={18} className="text-primary-600" />
              <h3 className="font-semibold">Platform Notifications</h3>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: 'New School Registration', enabled: true },
                { label: 'Subscription Expiry (7 days)', enabled: true },
                { label: 'Subscription Expiry (1 day)', enabled: true },
                { label: 'Payment Received', enabled: true },
                { label: 'System Errors (Critical)', enabled: true },
                { label: 'Storage Threshold (90%)', enabled: true },
              ].map((n) => (
                <div key={n.label} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-700/50 rounded-xl">
                  <span className="text-sm text-neutral-700 dark:text-neutral-300">{n.label}</span>
                  <Badge variant={n.enabled ? 'success' : 'default'}>{n.enabled ? 'On' : 'Off'}</Badge>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
