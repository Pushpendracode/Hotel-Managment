import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'


export default function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const { login } = useAuth()
  const navigate  = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await login(email, password)
      toast.success(`Welcome back, ${user.name}!`)
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-600 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2M5 21H3
                   m4-10h2m4 0h2M7 7h2m4 0h2" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">HostelPro</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@hostelpro.com"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300
                           text-sm text-gray-900 placeholder-gray-400
                           focus:outline-none focus:ring-2 focus:ring-emerald-500
                           focus:border-transparent transition"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <a href="#" className="text-xs text-emerald-600 hover:text-emerald-700">
                  Forgot password?
                </a>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300
                           text-sm text-gray-900 placeholder-gray-400
                           focus:outline-none focus:ring-2 focus:ring-emerald-500
                           focus:border-transparent transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700
                         disabled:bg-emerald-400 text-white text-sm font-medium
                         rounded-lg transition focus:outline-none focus:ring-2
                         focus:ring-emerald-500 focus:ring-offset-2"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>

          </form>

          {/* Test credentials hint */}
          <div className="mt-6 p-3.5 bg-gray-50 rounded-lg border border-gray-100">
            <p className="text-xs font-medium text-gray-500 mb-2">Test credentials</p>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-600">
                <span>Admin</span>
                <span className="font-mono">admin@hostelpro.com / admin123</span>
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>Staff</span>
                <span className="font-mono">staff@hostelpro.com / staff123</span>
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>Resident</span>
                <span className="font-mono">resident@hostelpro.com / res123</span>
              </div>
            </div>
          </div>
        </div>
<p className="text-center text-sm text-gray-500 mt-4">
  Don't have an account?{' '}
  <Link to="/signup" className="text-emerald-600 hover:text-emerald-700 font-medium">
    Sign up
  </Link>
</p>
        <p className="text-center text-xs text-gray-400 mt-6">
          HostelPro Management System © 2026
        </p>
      </div>
    </div>
  )
}