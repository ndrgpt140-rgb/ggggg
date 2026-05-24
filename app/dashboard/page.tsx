// صفحة لوحة تحكم HR الرئيسية

import React from 'react'
import JobsManagement from '@/components/dashboard/JobsManagement'

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* رأس الصفحة */}
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-800">لوحة تحكم الموارد البشرية</h1>
          <p className="text-gray-600">نظام المقابلات الذكي التفاعلي</p>
        </div>
      </header>

      {/* المحتوى الرئيسي */}
      <main className="container mx-auto p-4">
        <JobsManagement />
      </main>
    </div>
  )
}
