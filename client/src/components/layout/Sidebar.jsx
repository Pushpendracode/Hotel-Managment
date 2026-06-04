import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Bell } from 'lucide-react' // already imported? if not add it
import {
  LayoutDashboard, DoorOpen, Users, Wrench,
  Receipt, BarChart2, ShieldCheck, LogOut, Building2
} from 'lucide-react'

const navItems = [
  { to: '/',            icon: LayoutDashboard, label: 'Dashboard',    roles: ['admin','staff','resident'] },
  { to: '/rooms',       icon: DoorOpen,        label: 'Rooms',        roles: ['admin','staff'] },
  { to: '/residents',   icon: Users,           label: 'Residents',    roles: ['admin','staff'] },
  { to: '/maintenance', icon: Wrench,          label: 'Maintenance',  roles: ['admin','staff','resident'] },
  { to: '/billing',     icon: Receipt,         label: 'Billing',      roles: ['admin','staff','resident'] },
  { to: '/reports',     icon: BarChart2,       label: 'Reports',      roles: ['admin'] },
  { to: '/users',       icon: ShieldCheck,     label: 'User Roles',   roles: ['admin'] },
  { to: '/notifications', icon: Bell, label: 'Notifications', roles: ['admin','staff','resident'] },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const filtered = navItems.filter(item => item.roles.includes(user?.role))

  return (
    <div className="w-52 bg-white border-r border-gray-100 flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
            <Building2 size={16} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900">HostelPro</div>
            <div className="text-xs text-gray-400">Management</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {filtered.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all
               ${isActive
                 ? 'bg-emerald-50 text-emerald-700 font-medium'
                 : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
               }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User info + logout */}
      <div className="px-3 py-3 border-t border-gray-100">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center
                          text-xs font-semibold text-emerald-700 flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <div className="text-xs font-medium text-gray-800 truncate">{user?.name}</div>
            <div className="text-xs text-gray-400 capitalize">{user?.role}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-gray-500
                     hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
        >
          <LogOut size={13} />
          Sign out
        </button>
      </div>
    </div>
  )
}