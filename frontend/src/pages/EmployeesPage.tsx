import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

interface Employee {
  id: number; employee_code: string; name: string; email: string
  designation: string; team_name: string; utilization_pct: number
  availability: string; skills: string[]; project_name: string
}

interface Project {
  id: number; name: string; description: string
}

interface ProjectRequirement {
  id: number; name: string; required_skills: string[]; priority: 'high' | 'medium' | 'low'
  skill_gaps: string[]; team_name: string
}

const availabilityStyle: Record<string, string> = {
  immediate: 'bg-green-100 text-green-700',
  '2w_wait': 'bg-amber-100 text-amber-700',
  assigned: 'bg-red-100 text-red-700',
}
const availabilityLabel: Record<string, string> = {
  immediate: 'Available Now',
  '2w_wait': '2-Week Wait',
  assigned: 'Assigned',
}

const priorityColors = {
  high: 'bg-red-100 text-red-800 border-red-200',
  medium: 'bg-amber-100 text-amber-800 border-amber-200',
  low: 'bg-green-100 text-green-800 border-green-200'
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<number | null>(null)
  const [projectRequirements, setProjectRequirements] = useState<ProjectRequirement[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'list' | 'matrix'>('list')
  const [search, setSearch] = useState('')
  const [skillFilter, setSkillFilter] = useState('')
  const [availFilter, setAvailFilter] = useState('')
  const [teamFilter, setTeamFilter] = useState('')
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const navigate = useNavigate()

  const fetchData = useCallback(() => {
    if (!selectedProject) return

    setLoading(true)
    const params: Record<string, string> = {}
    if (search) params.search = search
    if (skillFilter) params.skill = skillFilter
    if (availFilter) params.availability = availFilter
    if (teamFilter) params.team = teamFilter
    params.project_id = selectedProject.toString()

    // Mock project requirements data
    const mockProjectRequirements: ProjectRequirement[] = [
      {
        id: 1,
        name: 'Toyota Connected Platform v2.0',
        required_skills: ['React', 'TypeScript', 'Node.js', 'AWS'],
        priority: 'high',
        skill_gaps: ['Kubernetes', 'Docker'],
        team_name: 'Frontend Team'
      },
      {
        id: 2,
        name: 'AI-Powered Analytics Dashboard',
        required_skills: ['Python', 'Machine Learning', 'Data Science'],
        priority: 'medium',
        skill_gaps: ['TensorFlow', 'PyTorch'],
        team_name: 'Data Science Team'
      },
      {
        id: 3,
        name: 'Mobile App Redesign',
        required_skills: ['React Native', 'iOS', 'Android'],
        priority: 'low',
        skill_gaps: ['Flutter', 'Swift'],
        team_name: 'Mobile Team'
      }
    ]

    Promise.all([
      api.get('/employees', { params })
    ])
      .then(([empRes]) => {
        setEmployees(empRes.data.data)
        setProjectRequirements(mockProjectRequirements)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [search, skillFilter, availFilter, teamFilter, selectedProject])

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
      .catch(console.error)
  }, [])

  useEffect(() => {
    fetchData()
  }, [selectedProject, search, skillFilter, availFilter, teamFilter, fetchData])

  const allSkills = Array.from(new Set(employees.flatMap(emp => emp.skills || [])))
  const allTeams = Array.from(new Set(employees.map(emp => emp.team_name).filter(Boolean)))

  const toggleSkillSelection = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    )
  }

  const getSkillMatchScore = (employeeSkills: string[], requiredSkills: string[]) => {
    if (!requiredSkills.length) return 0
    const matches = requiredSkills.filter(skill => employeeSkills.includes(skill))
    return Math.round((matches.length / requiredSkills.length) * 100)
  }

  const filteredEmployees = employees.filter(emp => {
    if (selectedSkills.length === 0) return true
    return selectedSkills.some(skill => emp.skills?.includes(skill))
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Employee Finder & Skill Matrix</h1>
          <p className="text-gray-600">Discover talent and match skills to project requirements</p>
        </div>

        {/* Project Requirements Cards */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Project Requirements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projectRequirements.slice(0, 6).map(req => (
              <div key={req.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-gray-900 text-sm">{req.name}</h3>
                    <p className="text-xs text-gray-500">{req.team_name}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full border font-medium ${priorityColors[req.priority]}`}>
                    {req.priority}
                  </span>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-1">Required Skills:</p>
                    <div className="flex flex-wrap gap-1">
                      {req.required_skills.map(skill => (
                        <span key={skill} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  {req.skill_gaps.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-red-700 mb-1">Skill Gaps:</p>
                      <div className="flex flex-wrap gap-1">
                        {req.skill_gaps.map(skill => (
                          <span key={skill} className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded-full">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* View Toggle & Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700">View:</span>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  List View
                </button>
                <button
                  onClick={() => setViewMode('matrix')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    viewMode === 'matrix' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Skill Matrix
                </button>
              </div>
            </div>
            <button
              onClick={() => navigate('/transfers/new')}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              + Initiate Transfer
            </button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Project</label>
              <select
                value={selectedProject || ''}
                onChange={(e) => setSelectedProject(Number(e.target.value))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
              >
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                placeholder="Name or role..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Team</label>
              <select
                value={teamFilter}
                onChange={e => setTeamFilter(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
              >
                <option value="">All Teams</option>
                {allTeams.map(team => (
                  <option key={team} value={team}>{team}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Availability</label>
              <select
                value={availFilter}
                onChange={e => setAvailFilter(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
              >
                <option value="">All Availability</option>
                <option value="immediate">Available Now</option>
                <option value="2w_wait">2-Week Wait</option>
                <option value="assigned">Assigned</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => { setSearch(''); setSkillFilter(''); setAvailFilter(''); setTeamFilter(''); setSelectedSkills([]) }}
                className="px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Skill Selection */}
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Filter by Skills:</p>
            <div className="flex flex-wrap gap-2">
              {allSkills.map(skill => (
                <button
                  key={skill}
                  onClick={() => toggleSkillSelection(skill)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    selectedSkills.includes(skill)
                      ? 'bg-red-100 text-red-800 border-red-300'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content based on view mode */}
        {viewMode === 'list' ? (
          /* List View */
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-700">
                {loading ? 'Loading...' : `${filteredEmployees.length} employees found`}
              </span>
            </div>
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left">
                  {['Employee', 'Role & Team', 'Skills', 'Utilization', 'Availability', 'Actions'].map(h => (
                    <th key={h} className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-6 py-4">
                          <div className="h-3 bg-gray-100 rounded animate-pulse w-24" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filteredEmployees.map(emp => (
                  <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center text-sm font-semibold text-white">
                          {emp.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{emp.name}</p>
                          <p className="text-xs text-gray-400">{emp.employee_code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-700">{emp.designation}</p>
                      <p className="text-xs text-gray-400">{emp.team_name || '—'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(emp.skills || []).slice(0, 3).map(s => (
                          <span key={s} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{s}</span>
                        ))}
                        {emp.skills?.length > 3 && (
                          <span className="text-xs text-gray-400">+{emp.skills.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-100 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${emp.utilization_pct >= 90 ? 'bg-red-500' : emp.utilization_pct >= 75 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                            style={{ width: `${emp.utilization_pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600">{emp.utilization_pct}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${availabilityStyle[emp.availability] || 'bg-gray-100 text-gray-600'}`}>
                        {availabilityLabel[emp.availability] || emp.availability}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => navigate(`/transfers/new?employee_id=${emp.id}`)}
                        className="text-xs font-medium text-red-600 hover:text-red-700 border border-red-200 hover:border-red-400 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Transfer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && filteredEmployees.length === 0 && (
              <div className="px-6 py-12 text-center text-sm text-gray-400">
                No employees match your filters.
              </div>
            )}
          </div>
        ) : (
          /* Skill Matrix View */
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-700">
                Skill Matrix - {filteredEmployees.length} employees
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-max">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider sticky left-0 bg-gray-50">
                      Employee
                    </th>
                    {allSkills.map(skill => (
                      <th key={skill} className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider min-w-20">
                        {skill}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredEmployees.map(emp => (
                    <tr key={emp.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 sticky left-0 bg-white">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center text-xs font-semibold text-white">
                            {emp.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{emp.name}</p>
                            <p className="text-xs text-gray-400">{emp.designation}</p>
                          </div>
                        </div>
                      </td>
                      {allSkills.map(skill => {
                        const hasSkill = emp.skills?.includes(skill)
                        return (
                          <td key={skill} className="px-4 py-4 text-center">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center mx-auto ${
                              hasSkill ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                            }`}>
                              {hasSkill ? '✓' : '○'}
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
