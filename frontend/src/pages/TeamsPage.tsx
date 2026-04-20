import { useEffect, useState } from 'react'
import api from '../services/api'

interface Team {
  id: number; name: string; description: string
  project_name: string; manager_name: string
  member_count: number; avg_utilization: number
}
interface Member {
  id: number; name: string; designation: string
  utilization_pct: number; availability: string; skills: string
}
interface Coverage {
  skill: string; category: string
  required_count: number; actual_count: number
  max_level: string; status: 'covered' | 'gap' | 'critical_gap'
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [coverage, setCoverage] = useState<Coverage[]>([])
  const [loadingTeams, setLoadingTeams] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)

  useEffect(() => {
    api.get('/teams').then(r => setTeams(r.data.data)).finally(() => setLoadingTeams(false))
  }, [])

  const selectTeam = async (team: Team) => {
    setSelectedTeam(team)
    setLoadingDetail(true)
    try {
      const [mRes, cRes] = await Promise.all([
        api.get(`/teams/${team.id}/members`),
        api.get(`/teams/${team.id}/skill-coverage`),
      ])
      setMembers(mRes.data.data)
      setCoverage(cRes.data.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingDetail(false)
    }
  }

  const statusStyle: Record<string, string> = {
    covered: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    gap: 'bg-amber-50 text-amber-700 border-amber-100',
    critical_gap: 'bg-red-50 text-red-700 border-red-100',
  }
  const statusLabel: Record<string, string> = {
    covered: '✓ Covered',
    gap: '⚠ Gap',
    critical_gap: '✕ Critical Gap',
  }

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Teams & Skill Coverage</h1>
        <p className="text-sm text-gray-500 mt-1">Click a team to see members and skill matrix</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Team List */}
        <div className="col-span-1 space-y-3">
          {loadingTeams ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
                <div className="h-4 bg-gray-100 rounded w-32 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-20" />
              </div>
            ))
          ) : teams.map(team => (
            <button
              key={team.id}
              onClick={() => selectTeam(team)}
              className={`w-full text-left bg-white rounded-xl border p-4 transition-all ${
                selectedTeam?.id === team.id
                  ? 'border-red-400 shadow-sm bg-red-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <p className="text-sm font-semibold text-gray-900">{team.name}</p>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  team.avg_utilization >= 90 ? 'bg-red-100 text-red-700'
                  : team.avg_utilization >= 75 ? 'bg-amber-100 text-amber-700'
                  : 'bg-emerald-100 text-emerald-700'
                }`}>{team.avg_utilization}%</span>
              </div>
              <p className="text-xs text-gray-400">{team.member_count} members · {team.manager_name || 'No manager'}</p>
            </button>
          ))}
        </div>

        {/* Team Detail */}
        <div className="col-span-2">
          {!selectedTeam ? (
            <div className="bg-white rounded-xl border border-gray-200 h-64 flex items-center justify-center">
              <p className="text-sm text-gray-400">← Select a team to view details</p>
            </div>
          ) : loadingDetail ? (
            <div className="bg-white rounded-xl border border-gray-200 h-64 flex items-center justify-center">
              <p className="text-sm text-gray-400">Loading...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Members */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100">
                  <h2 className="text-sm font-semibold text-gray-900">Team Members ({members.length})</h2>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase">Name</th>
                      <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase">Skills</th>
                      <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase">Util.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {members.map(m => (
                      <tr key={m.id} className="hover:bg-gray-50">
                        <td className="px-5 py-3">
                          <p className="text-sm font-medium text-gray-900">{m.name}</p>
                          <p className="text-xs text-gray-400">{m.designation}</p>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex flex-wrap gap-1">
                            {(m.skills || '').split(', ').filter(Boolean).slice(0, 3).map(s => (
                              <span key={s} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{s}</span>
                            ))}
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-12 bg-gray-100 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full ${m.utilization_pct >= 90 ? 'bg-red-500' : m.utilization_pct >= 75 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                                style={{ width: `${m.utilization_pct}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-600">{m.utilization_pct}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Skill Coverage */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100">
                  <h2 className="text-sm font-semibold text-gray-900">Skill Coverage Matrix</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Required vs actual skill coverage</p>
                </div>
                <div className="p-5 space-y-3">
                  {coverage.length === 0 ? (
                    <p className="text-sm text-gray-400">No required skills configured for this team.</p>
                  ) : coverage.map(c => (
                    <div key={c.skill} className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium text-gray-900">{c.skill}</span>
                        <span className="text-xs text-gray-400 ml-2">{c.category}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500">
                          {c.actual_count}/{c.required_count} people
                        </span>
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusStyle[c.status]}`}>
                          {statusLabel[c.status]}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
