import { useEffect, useState } from 'react'
import api from '../services/api'

interface SkillGap {
  team: string; skill: string; required_level: string
  required_count: number; actual_count: number; gap: number
}

export default function AnalyticsPage() {
  const [gaps, setGaps] = useState<SkillGap[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/analytics/skill-gaps')
      .then(r => setGaps(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Skill Gap Analysis</h1>
        <p className="text-sm text-gray-500 mt-1">Teams where required skills are not fully covered</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            {loading ? 'Loading...' : `${gaps.length} gaps identified`}
          </span>
          {gaps.length > 0 && (
            <span className="text-xs bg-red-100 text-red-700 px-2.5 py-1 rounded-full font-medium">Action Required</span>
          )}
        </div>
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400">Analyzing skill coverage...</div>
        ) : gaps.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-2xl mb-3">✅</p>
            <p className="text-sm font-medium text-gray-700">All teams are fully covered</p>
            <p className="text-xs text-gray-400 mt-1">No skill gaps detected across active teams</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Team</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Missing Skill</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Level Needed</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Coverage</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Gap</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {gaps.map((g, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-5 py-4 text-sm font-medium text-gray-900">{g.team}</td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-gray-800">{g.skill}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="capitalize text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">{g.required_level}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-red-500 h-2 rounded-full"
                          style={{ width: `${Math.min((g.actual_count / g.required_count) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-600">{g.actual_count}/{g.required_count}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      g.gap >= 2 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      -{g.gap} {g.gap === 1 ? 'person' : 'people'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {gaps.length > 0 && (
        <div className="mt-6 bg-gray-900 rounded-xl p-6 text-white">
          <h3 className="text-sm font-semibold mb-3">Recommendations</h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>• Consider transferring employees with matching skills from bench teams</li>
            <li>• Initiate upskilling programs for employees with adjacent skills</li>
            <li>• Flag critical gaps to HR for external recruitment planning</li>
          </ul>
        </div>
      )}
    </div>
  )
}
