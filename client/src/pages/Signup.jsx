import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import API from '../api/axios'
import { Building2 } from 'lucide-react'

export default function Signup() {
  const [form, setForm]     = useState({ name: '', email: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim())  return toast.error('Name is required')
    if (!form.email.trim()) return toast.error('Email is required')
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters')
    if (form.password !== form.confirm) return toast.error('Passwords do not match')

    setLoading(true)
    try {
      const { data } = await API.post('/auth/register', {
        name:     form.name,
        email:    form.email,
        password: form.password,
        role:     'resident'
      })
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      toast.success('Account created successfully!')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-600 rounded-2xl mb-4">
            <Building2 size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">HostelPro</h1>
          <p className="text-sm text-gray-500 mt-1">Create your resident account</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
              <input type="text" required value={form.name}
                onChange={e => setForm(f => ({...f, name: e.target.value}))}
                placeholder="Rajesh Kumar"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm
                           focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
              <input type="email" required value={form.email}
                onChange={e => setForm(f => ({...f, email: e.target.value}))}
                placeholder="rajesh@email.com"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm
                           focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input type="password" required value={form.password}
                onChange={e => setForm(f => ({...f, password: e.target.value}))}
                placeholder="Min 6 characters"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm
                           focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
              <input type="password" required value={form.confirm}
                onChange={e => setForm(f => ({...f, confirm: e.target.value}))}
                placeholder="Re-enter password"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm
                           focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"/>
            </div>

            <div className="bg-blue-50 rounded-lg px-3 py-2 text-xs text-blue-700">
              New accounts are created as <strong>Resident</strong> role. Contact admin to be assigned a room.
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700
                         disabled:bg-emerald-400 text-white text-sm font-medium
                         rounded-lg transition focus:outline-none focus:ring-2
                         focus:ring-emerald-500 focus:ring-offset-2">
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-emerald-600 hover:text-emerald-700 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}