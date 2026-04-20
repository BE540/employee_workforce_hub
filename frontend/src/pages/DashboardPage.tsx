import { useEffect, useState } from 'react'
import api from '../services/api'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface DashboardData {
  headcount: number
  avg_utilization: number
  pending_transfers: number
  bench_count: number
  teams: { name: string; avg_util: number; member_count: number }[]
  critical_skills_concentration: { skill: string; holder_count: number }[]
}

interface Project {
  id: number
  name: string
  description: string
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    // Load user's accessible projects
    api.get('/projects')
      .then(r => {
        setProjects(r.data.data)
        // Auto-select first project if available
        if (r.data.data.length > 0 && !selectedProject) {
          setSelectedProject(r.data.data[0].id)
        }
      })
      .catch(() => setError('Failed to load projects'))
  }, [])

  useEffect(() => {
    if (selectedProject) {
      setLoading(true)
      api.get(`/analytics/dashboard?project_id=${selectedProject}`)
        .then(r => setData(r.data.data))
        .catch(() => setError('Failed to load dashboard'))
        .finally(() => setLoading(false))
    }
  }, [selectedProject])

  if (loading) return (
    <div className="p-8 flex items-center justify-center h-full">
      <div className="text-gray-400 text-sm">Loading dashboard...</div>
    </div>
  )
  if (error) return <div className="p-8 text-red-600 text-sm">{error}</div>
  if (!data) return null

  const kpis = [
    { label: 'Total Employees', value: data.headcount.toLocaleString(), sub: 'In selected project', color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Avg Utilization', value: `${data.avg_utilization}%`, sub: 'Across project teams', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Pending Transfers', value: data.pending_transfers, sub: 'In selected project', color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'On Bench', value: data.bench_count, sub: 'Available < 50% util', color: 'text-red-600', bg: 'bg-red-50' },
  ]

  return (
    <div className="relative p-6 max-w-7xl mx-auto">
      <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-red-500/15 blur-3xl" />
      <div className="pointer-events-none absolute left-0 bottom-0 h-56 w-56 rounded-full bg-slate-900/15 blur-3xl" />

      <div className="mb-6 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-red-600 via-rose-500 to-fuchsia-500 p-6 shadow-xl shadow-red-500/10 text-white">
        <div className="max-w-xl">
          <p className="text-xs uppercase tracking-[0.3em] text-rose-100/80">Toyota Workforce Intelligence</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">Executive Dashboard</h1>
          <p className="mt-2 text-sm text-white/80 leading-6">A beautiful workforce command center with team health, utilization trends, and skill concentration alerts.</p>
        </div>
      </div>

      {/* Project Selector */}
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-slate-700">Select Project:</label>
          <select
            value={selectedProject || ''}
            onChange={(e) => setSelectedProject(Number(e.target.value))}
            className="px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {kpis.map(k => (
          <div key={k.label} className="rounded-2xl border border-white/10 bg-white/90 p-5 shadow-xl shadow-slate-900/10 transition hover:-translate-y-0.5">
            <div className={`inline-flex items-center justify-center rounded-xl ${k.bg} p-2.5 shadow-sm mb-3`}>
              <div className={`w-2.5 h-2.5 rounded-full ${k.color.replace('text-', 'bg-')}`} />
            </div>
            <p className={`text-2xl font-bold ${k.color} tracking-tight`}>{k.value}</p>
            <p className="text-sm font-semibold text-slate-700 mt-1">{k.label}</p>
            <p className="text-xs text-slate-400 mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Team Utilization Chart */}
        <div className="rounded-2xl border border-white/10 bg-white/95 p-5 shadow-xl shadow-slate-900/10">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Team Utilization</h2>
              <p className="text-xs text-slate-500">Live utilization by team, colored by load.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">Current</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.teams} margin={{ left: -20 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Bar dataKey="avg_util" radius={[8, 8, 0, 0]}>
                {data.teams.map((t) => (
                  <Cell
                    key={t.name}
                    fill={t.avg_util >= 90 ? '#dc2626' : t.avg_util >= 75 ? '#f59e0b' : '#10b981'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-3 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Healthy</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-400" /> High</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-500" /> Overloaded</span>
          </div>
        </div>

        {/* Critical Skill Concentration */}
        <div className="rounded-2xl border border-white/10 bg-white/95 p-5 shadow-xl shadow-slate-900/10">
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-slate-900">Critical Skills Concentration</h2>
            <p className="text-xs text-slate-500">Skills held by 2 or fewer people — risk areas to act on.</p>
          </div>
          <div className="space-y-3">
            {data.critical_skills_concentration.length === 0 ? (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-3 text-sm text-emerald-700">No critical concentration detected yet — good balance.</div>
            ) : data.critical_skills_concentration.map(s => (
              <div key={s.skill} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">{s.skill}</span>
                  <span className={`text-xs font-semibold ${s.holder_count === 1 ? 'text-red-600' : 'text-amber-600'}`}>
                    {s.holder_count} {s.holder_count === 1 ? 'person' : 'people'}
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-red-500 via-rose-500 to-pink-500"
                    style={{ width: `${Math.min(100, (s.holder_count / 5) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          {data.critical_skills_concentration.length > 0 && (
            <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-3 py-3 text-sm text-red-700">
              ⚠ Consider cross-training or hiring to reduce knowledge concentration risk.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
