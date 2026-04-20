import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { motion } from 'framer-motion'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [hoveredAccount, setHoveredAccount] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch {
      setError('Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: 'easeOut' },
    },
  }

  const floatingVariants = {
    animate: {
      y: [0, -12, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  }

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  }

  const demoAccountVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: (i: number) => ({
      opacity: 1,
      scale: 1,
      transition: {
        delay: 0.3 + i * 0.05,
        duration: 0.3,
      },
    }),
    hover: {
      y: -4,
      scale: 1.06,
      transition: { duration: 0.2 },
    },
  }

  const orbs = [
    { size: 320, top: 10, right: -50, duration: 4, color: 'from-red-600/10 to-transparent' },
    { size: 280, top: 100, right: 0, duration: 5, color: 'from-rose-500/10 to-transparent' },
    { size: 400, bottom: -100, left: -50, duration: 6, color: 'from-blue-500/5 to-transparent' },
  ]

  const carBackgroundVariants = {
    animate: {
      scale: [1, 1.05, 1],
      y: [0, -10, 0],
    },
  }

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-6 flex items-center justify-center" style={{ background: '#0f172a' }}>
      {/* BACKGROUND LAYER - Photorealistic Toyota Car - FAR LEFT */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1559056169-641407002675?w=1600&q=80&auto=format&fit=crop")',
          backgroundSize: 'cover',
          backgroundPosition: 'left center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
          opacity: 1,
          zIndex: 0,
          filter: 'brightness(1) contrast(1.1) saturate(1)',
        }}
      />

      {/* OVERLAY 1 - Smooth Fade from Left Car to Dark Right */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(to right, transparent 0%, transparent 30%, rgba(15,23,42,0.3) 50%, rgba(15,23,42,0.7) 80%, rgba(15,23,42,0.95) 100%)',
          zIndex: 1,
        }}
      />

      {/* OVERLAY 2 - Subtle Lighting */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(30,41,59,0.15) 0%, rgba(15,23,42,0.05) 50%, rgba(0,0,0,0.2) 100%)',
          zIndex: 2,
        }}
      />

      {/* 3D Animated Background Orbs */}
      {orbs.map((orb, idx) => (
        <motion.div
          key={idx}
          className={`pointer-events-none fixed rounded-full blur-3xl bg-gradient-to-br ${orb.color}`}
          style={{
            width: orb.size,
            height: orb.size,
            top: orb.top !== false ? `${orb.top}%` : 'auto',
            right: orb.right !== false ? `${orb.right}%` : 'auto',
            bottom: orb.bottom !== false ? `${orb.bottom}px` : 'auto',
            left: orb.left !== false ? `${orb.left}%` : 'auto',
            zIndex: 1,
          }}
          animate={{
            y: [0, 15, -10, 0],
            x: [0, 10, -8, 0],
          }}
          transition={{
            duration: orb.duration,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      <motion.div
        className="mx-auto w-full max-w-md relative z-20"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header with subtle animation */}
        <motion.div
          className="mb-8 text-center relative z-10"
          variants={itemVariants}
        >
          <motion.div
            className="inline-flex items-center gap-3 mb-3"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <motion.div
              className="w-12 h-12 rounded-3xl bg-gradient-to-br from-red-600 to-rose-500 shadow-xl shadow-red-500/40 flex items-center justify-center"
              variants={floatingVariants}
              animate="animate"
            >
              <span className="text-white font-bold text-lg">W</span>
            </motion.div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent">
                WorkspaceHub
              </h1>
              <p className="text-sm text-slate-400">Toyota Platform</p>
            </div>
          </motion.div>
        </motion.div>

        {/* Main Form Card with smooth effects */}
        <motion.div
          className="relative z-10 overflow-hidden rounded-[2rem] border border-white/10 bg-white/95 shadow-2xl shadow-slate-950/50 px-6 py-6 backdrop-blur-xl"
          variants={cardVariants}
          whileHover={{
            boxShadow: '0 20px 60px -15px rgba(220, 38, 38, 0.3)',
          }}
        >
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-red-500 via-rose-500 to-fuchsia-500 opacity-20" />
          <div className="relative space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Input with animation */}
              <motion.div variants={itemVariants}>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">Email</label>
                <motion.input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@toyota.poc"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-200 focus:scale-105"
                  whileFocus={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                />
              </motion.div>

              {/* Password Input with animation */}
              <motion.div variants={itemVariants}>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">Password</label>
                <motion.input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-200 focus:scale-105"
                  whileFocus={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                />
              </motion.div>

              {/* Error Message with animation */}
              {error && (
                <motion.div
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 font-medium"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  {error}
                </motion.div>
              )}

              {/* Sign In Button with smooth hover */}
              <motion.button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-red-600 to-pink-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-red-500/40 transition hover:shadow-red-500/60 disabled:cursor-not-allowed disabled:opacity-60 relative overflow-hidden group"
                whileHover={!loading ? { scale: 1.03 } : {}}
                whileTap={!loading ? { scale: 0.97 } : {}}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '100%' }}
                  transition={{ duration: 0.3 }}
                />
                <span className="relative">
                  {loading ? (
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      style={{ display: 'inline-block' }}
                    >
                      ⏳
                    </motion.span>
                  ) : (
                    'Sign in'
                  )}
                </span>
              </motion.button>
            </form>

            {/* Demo Accounts Section */}
            <motion.div
              className="pt-3 border-t border-slate-200/60"
              variants={itemVariants}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 mb-3">Demo Accounts</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { role: 'VP', email: 'vp@toyota.poc', color: 'from-purple-500 to-indigo-500' },
                  { role: 'Director', email: 'director@toyota.poc', color: 'from-blue-500 to-cyan-500' },
                  { role: 'Manager', email: 'manager1@toyota.poc', color: 'from-emerald-500 to-teal-500' },
                ].map((acc, idx) => (
                  <motion.button
                    key={acc.email}
                    onClick={() => { setEmail(acc.email); setPassword('Test@1234') }}
                    className="relative rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-center text-xs text-slate-700 shadow-sm transition hover:shadow-md"
                    custom={idx}
                    variants={demoAccountVariants}
                    onMouseEnter={() => setHoveredAccount(acc.email)}
                    onMouseLeave={() => setHoveredAccount(null)}
                    whileHover={{ y: -4, scale: 1.06 }}
                  >
                    {/* Smooth background effect */}
                    <motion.div
                      className="absolute inset-0 rounded-lg bg-gradient-to-br from-slate-200 to-slate-100 -z-10"
                      initial={{ opacity: 0 }}
                      animate={hoveredAccount === acc.email ? { opacity: 1 } : { opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    />
                    <div className={`font-semibold text-[10px] uppercase text-white mb-1 px-1.5 py-1 rounded-full bg-gradient-to-r ${acc.color} text-center shadow-lg`}>
                      {acc.role}
                    </div>
                    <div className="text-[10px] font-medium text-slate-600 truncate">{acc.email}</div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
