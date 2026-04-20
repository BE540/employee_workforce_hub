import { useEffect, useState } from 'react'
import api from '../services/api'

interface Project {
  id: number
  name: string
  description: string
  status: string
  start_date: string
  end_date: string
  team_count: number
  employee_count: number
  avg_utilization: number
  bench_count: number
  statusColor: string
  allocation_status: string
}

interface Team {
  id: number
  name: string
  project_id: number
  project_name: string
  member_count: number
  avg_utilization: number
  availability_pct: number
}

interface Employee {
  id: number
  employee_code: string
  name: string
  designation: string
  utilization_pct: number
  availability: string
  team_name: string
  project_name: string
  skills: string
}

interface ResourcePlannerData {
  projects: Project[]
  teams: Team[]
  employees: Employee[]
  summary: {
    total_projects: number
    total_teams: number
    total_employees: number
    avg_utilization: number
    bench_resources: number
  }
}

export default function ResourcePlannerPage() {
  const [data, setData] = useState<ResourcePlannerData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedProject, setSelectedProject] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<'projects' | 'teams' | 'resources'>('projects')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchResourceData()
  }, [])

  const fetchResourceData = async () => {
    try {
      setLoading(true)
      const response = await api.get('/analytics/resource-planner')
      console.log('Resource planner API response:', response.data)
      setData(response.data.data)
      if (response.data.data.projects.length > 0 && !selectedProject) {
        setSelectedProject(response.data.data.projects[0].id)
      }
    } catch (err: any) {
      console.error('Resource planner API error:', err)
      setError(err.response?.data?.error || 'Failed to load resource planning data')
    } finally {
      setLoading(false)
    }
  }

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 90) return 'bg-red-500'
    if (utilization >= 75) return 'bg-amber-500'
    return 'bg-green-500'
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      healthy: { color: 'bg-green-100 text-green-700', label: 'Healthy' },
      overload: { color: 'bg-amber-100 text-amber-700', label: 'Overload Warning' },
      understaffed: { color: 'bg-red-100 text-red-700', label: 'Understaffed' }
    }
    return statusMap[status as keyof typeof statusMap] || statusMap.healthy
  }

  const filteredProjects = data?.projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  const filteredTeams = data?.teams.filter(team =>
    selectedProject ? team.project_id === selectedProject : true
  ).filter(team =>
    team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.project_name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  const filteredEmployees = data?.employees.filter(employee =>
    selectedProject ? employee.project_name === data.projects.find(p => p.id === selectedProject)?.name : true
  ).filter(employee =>
    employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.skills?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  if (loading) return (
    <div className="p-8 flex items-center justify-center h-full">
      <div className="text-gray-400 text-sm">Loading resource planning data...</div>
    </div>
  )

  if (error) return (
    <div className="p-8 text-red-600 text-sm">{error}</div>
  )

  if (!data) return null

  return (
    <div className="relative p-6 max-w-7xl mx-auto">
      <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-blue-500/15 blur-3xl" />
      <div className="pointer-events-none absolute left-0 bottom-0 h-56 w-56 rounded-full bg-slate-900/15 blur-3xl" />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Resource Planner Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Real-time workforce allocation and project capacity management</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Projects</p>
              <p className="text-2xl font-bold text-gray-900">{data.summary.total_projects}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 text-lg">📊</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Teams</p>
              <p className="text-2xl font-bold text-gray-900">{data.summary.total_teams}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600 text-lg">👥</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Employees</p>
              <p className="text-2xl font-bold text-gray-900">{data.summary.total_employees}</p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-purple-600 text-lg">👤</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Avg Utilization</p>
              <p className="text-2xl font-bold text-gray-900">{data.summary.avg_utilization}%</p>
            </div>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getUtilizationColor(data.summary.avg_utilization)}`}>
              <span className="text-white text-lg">📈</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Bench Resources</p>
              <p className="text-2xl font-bold text-gray-900">{data.summary.bench_resources}</p>
            </div>
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-orange-600 text-lg">🪑</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search projects, teams, or resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
          />
        </div>

        <div className="flex gap-2">
          {[
            { key: 'projects', label: 'Projects', icon: '📊' },
            { key: 'teams', label: 'Teams', icon: '👥' },
            { key: 'resources', label: 'Resources', icon: '👤' }
          ].map((mode) => (
            <button
              key={mode.key}
              onClick={() => setViewMode(mode.key as any)}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold capitalize transition ${
                viewMode === mode.key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {mode.icon} {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Project Selector (for Teams and Resources views) */}
      {(viewMode === 'teams' || viewMode === 'resources') && (
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-slate-700">Filter by Project:</label>
            <select
              value={selectedProject || ''}
              onChange={(e) => setSelectedProject(Number(e.target.value))}
              className="px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Projects</option>
              {data.projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Content based on view mode */}
      {viewMode === 'projects' && (
        <div className="grid gap-4">
          {filteredProjects.map((project) => {
            const statusInfo = getStatusBadge(project.allocation_status)
            return (
              <div key={project.id} className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{project.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{project.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>📅 {new Date(project.start_date).toLocaleDateString()} - {new Date(project.end_date).toLocaleDateString()}</span>
                      <span>👥 {project.team_count} teams</span>
                      <span>👤 {project.employee_count} employees</span>
                    </div>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Utilization</span>
                      <span className="text-sm font-bold text-gray-900">{project.avg_utilization}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getUtilizationColor(project.avg_utilization)}`}
                        style={{ width: `${Math.min(project.avg_utilization, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Team Capacity</span>
                      <span className="text-sm font-bold text-gray-900">{project.team_count}</span>
                    </div>
                    <div className="text-xs text-gray-600">
                      {project.employee_count} total members
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Bench Resources</span>
                      <span className="text-sm font-bold text-gray-900">{project.bench_count}</span>
                    </div>
                    <div className="text-xs text-gray-600">
                      Available for allocation
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {viewMode === 'teams' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTeams.map((team) => (
            <div key={team.id} className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{team.name}</h3>
                  <p className="text-sm text-gray-600">{team.project_name}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">{team.member_count}</div>
                  <div className="text-xs text-gray-500">members</div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Utilization</span>
                    <span className="font-medium">{team.avg_utilization}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getUtilizationColor(team.avg_utilization)}`}
                      style={{ width: `${Math.min(team.avg_utilization, 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Availability</span>
                    <span className="font-medium">{team.availability_pct}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-blue-500"
                      style={{ width: `${team.availability_pct}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewMode === 'resources' && (
        <div className="space-y-6">
          {/* Resource Utilization Heatmap */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Resource Utilization Heatmap</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {filteredEmployees.slice(0, 24).map((employee) => (
                <div key={employee.id} className="text-center">
                  <div
                    className={`h-16 rounded-lg flex items-center justify-center text-white text-xs font-semibold mb-2 ${getUtilizationColor(employee.utilization_pct)}`}
                  >
                    {employee.utilization_pct}%
                  </div>
                  <div className="text-xs">
                    <div className="font-medium text-gray-900 truncate">{employee.name}</div>
                    <div className="text-gray-500 truncate">{employee.team_name}</div>
                    <div className={`inline-block px-2 py-1 rounded-full text-xs mt-1 ${
                      employee.availability === 'immediate' ? 'bg-green-100 text-green-700' :
                      employee.availability === '2w_wait' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {employee.availability === 'immediate' ? 'Available' :
                       employee.availability === '2w_wait' ? '2W Wait' : 'Assigned'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resource Details Table */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Resource Details</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilization</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Availability</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Skills</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredEmployees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                          <div className="text-sm text-gray-500">{employee.employee_code}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.designation}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.team_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-2 ${getUtilizationColor(employee.utilization_pct)}`} />
                          <span className="text-sm font-medium">{employee.utilization_pct}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          employee.availability === 'immediate' ? 'bg-green-100 text-green-800' :
                          employee.availability === '2w_wait' ? 'bg-amber-100 text-amber-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {employee.availability === 'immediate' ? 'Available Now' :
                           employee.availability === '2w_wait' ? '2 Week Wait' : 'Fully Assigned'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="flex flex-wrap gap-1">
                          {employee.skills?.split(', ').slice(0, 3).map((skill, index) => (
                            <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                              {skill}
                            </span>
                          ))}
                          {employee.skills?.split(', ').length > 3 && (
                            <span className="text-xs text-gray-500">+{employee.skills.split(', ').length - 3} more</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {filteredProjects.length === 0 && viewMode === 'projects' && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
          <p className="text-gray-500">Try adjusting your search criteria</p>
        </div>
      )}

      {filteredTeams.length === 0 && viewMode === 'teams' && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">👥</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No teams found</h3>
          <p className="text-gray-500">Try adjusting your search or project filter</p>
        </div>
      )}

      {filteredEmployees.length === 0 && viewMode === 'resources' && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">👤</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No resources found</h3>
          <p className="text-gray-500">Try adjusting your search or project filter</p>
        </div>
      )}
    </div>
  )
}