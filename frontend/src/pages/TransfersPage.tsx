import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../hooks/useAuth'

interface Transfer {
  id: number; status: string; reason: string; effective_date: string
  skill_gap_flag: number; skill_gap_note: string; created_at: string
  employee_name: string; employee_code: string; designation: string
  from_team: string; to_team: string
  requested_by_name: string
}

const statusStyle: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  pending_director: 'bg-blue-100 text-blue-700',
  pending_vp: 'bg-purple-100 text-purple-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
  executed: 'bg-emerald-100 text-emerald-800',
}
const statusLabel: Record<string, string> = {
  draft: 'Draft',
  pending_director: 'Pending Director',
  pending_vp: 'Pending VP',
  approved: 'Approved',
  rejected: 'Rejected',
  executed: 'Executed ✓',
}

export default function TransfersPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  const fetchTransfers = () => {
    setLoading(true)
    const params: any = {}
    if (filterStatus) params.status = filterStatus
    api.get('/transfers', { params })
      .then(r => setTransfers(r.data.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchTransfers() }, [filterStatus])

  const handleAction = async (transferId: number, action: 'approved' | 'rejected') => {
    setActionLoading(transferId)
    try {
      await api.patch(`/transfers/${transferId}/approve`, { action, note: `${action} by ${user?.name}` })
      fetchTransfers()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Action failed')
    } finally {
      setActionLoading(null)
    }
  }

  const canApprove = user?.role === 'director' || user?.role === 'vp'

  const canActOn = (t: Transfer) => {
    if (!canApprove) return false
    if (user?.role === 'director' && t.status === 'pending_director') return true
    if (user?.role === 'vp' && (t.status === 'pending_vp' || t.status === 'pending_director')) return true
    return false
  }

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transfer Requests</h1>
          <p className="text-sm text-gray-500 mt-1">Manage internal team mobility approvals</p>
        </div>
        <button
          onClick={() => navigate('/transfers/new')}
          className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          + New Transfer
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { label: 'All', value: '' },
          { label: 'Pending Director', value: 'pending_director' },
          { label: 'Pending VP', value: 'pending_vp' },
          { label: 'Executed', value: 'executed' },
          { label: 'Rejected', value: 'rejected' },
        ].map(f => (
          <button
            key={f.value}
            onClick={() => setFilterStatus(f.value)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filterStatus === f.value
                ? 'bg-gray-900 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Transfer Cards */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-48 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-72" />
            </div>
          ))
        ) : transfers.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-gray-400 text-sm">No transfers found.</p>
            <button onClick={() => navigate('/transfers/new')} className="mt-3 text-sm text-red-600 hover:underline">
              Create the first transfer →
            </button>
          </div>
        ) : transfers.map(t => (
          <div key={t.id} className={`bg-white rounded-xl border p-5 transition-all ${canActOn(t) ? 'border-blue-200 shadow-sm' : 'border-gray-200'}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold text-gray-500 flex-shrink-0">
                  {t.employee_name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-gray-900">{t.employee_name}</p>
                    <span className="text-xs text-gray-400">{t.employee_code}</span>
                    {t.skill_gap_flag === 1 && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">⚠ Skill Gap</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{t.designation}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="bg-gray-100 px-2 py-1 rounded font-medium">{t.from_team}</span>
                    <span className="text-gray-300">→</span>
                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded font-medium">{t.to_team}</span>
                  </div>
                  {t.reason && (
                    <p className="text-xs text-gray-400 mt-2 italic">"{t.reason}"</p>
                  )}
                  {t.skill_gap_flag === 1 && t.skill_gap_note && (
                    <p className="text-xs text-amber-600 mt-1">{t.skill_gap_note}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end gap-3">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyle[t.status] || 'bg-gray-100 text-gray-600'}`}>
                  {statusLabel[t.status] || t.status}
                </span>
                <span className="text-xs text-gray-400">
                  By {t.requested_by_name} · {new Date(t.created_at).toLocaleDateString()}
                </span>

                {canActOn(t) && (
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() => handleAction(t.id, 'rejected')}
                      disabled={actionLoading === t.id}
                      className="text-xs font-medium px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleAction(t.id, 'approved')}
                      disabled={actionLoading === t.id}
                      className="text-xs font-medium px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      {actionLoading === t.id ? '...' : 'Approve'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
