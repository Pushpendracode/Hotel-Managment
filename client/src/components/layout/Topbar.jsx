import { useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Bell } from 'lucide-react'

const titles = {
  '/':            'Dashboard',
  '/rooms':       'Room Allocation',
  '/residents':   'Residents',
  '/maintenance': 'Maintenance',
  '/billing':     'Billing & Payments',
  '/reports':     'Financial Reports',
  '/users':       'User Roles',
}

export default function Topbar() {
  const { pathname } = useLocation()
  const { user } = useAuth()

  return (
    <div className="h-14 bg-white border-b border-gray-100 flex items-center
                    justify-between px-6 flex-shrink-0">
      <h1 className="text-sm font-semibold text-gray-900">
        {titles[pathname] || 'HostelPro'}
      </h1>
      <div className="flex items-center gap-3">
        <button className="relative p-2 text-gray-400 hover:text-gray-600
                           hover:bg-gray-50 rounded-lg transition">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5
                           bg-red-500 rounded-full"></span>
        </button>
        <div className="text-xs text-gray-500">
          Welcome, <span className="font-medium text-gray-800">{user?.name}</span>
        </div>
      </div>
    </div>
  )
}