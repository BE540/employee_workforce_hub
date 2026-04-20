import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../services/api'

interface Employee { id: number; name: string; employee_code: string; designation: string; team_id: number; team_name: string; project_name: string }
interface Team { id: number; name: string; project_name: string }
interface Project { id: number; name: string; description: string }

export default function NewTransferPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const prefillEmployeeId = searchParams.get('employee_id')

  const [currentStep, setCurrentStep] = useState(1)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<number | null>(null)
  const [employeeId, setEmployeeId] = useState(prefillEmployeeId || '')
  const [fromTeamId, setFromTeamId] = useState('')
  const [toTeamId, setToTeamId] = useState('')
  const [reason, setReason] = useState('')
  const [effectiveDate, setEffectiveDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const steps = [
    { id: 1, title: 'Select Employee', description: 'Choose employee to transfer' },
    { id: 2, title: 'Transfer Details', description: 'Specify transfer information' },
    { id: 3, title: 'Review & Submit', description: 'Confirm and submit request' }
  ]

  useEffect(() => {
    // Load user's accessible projects
    api.get('/projects').then(r => {
      setProjects(r.data.data)
      // Auto-select first project if available
      if (r.data.data.length > 0 && !selectedProject) {
        setSelectedProject(r.data.data[0].id)
      }
    })
  }, [])

  useEffect(() => {
    if (selectedProject) {
      // Load employees and teams for the selected project
      Promise.all([
        api.get('/employees', { params: { project_id: selectedProject } }),
        api.get('/teams', { params: { project_id: selectedProject } })
      ]).then(([eRes, tRes]) => {
        setEmployees(eRes.data.data)
        setTeams(tRes.data.data)
      })
    }
  }, [selectedProject])

  useEffect(() => {
    if (employeeId) {
      const emp = employees.find(e => String(e.id) === String(employeeId))
      if (emp?.team_id) setFromTeamId(String(emp.team_id))
    }
  }, [employeeId, employees])

  const handleSubmit = async () => {
    if (!employeeId || !fromTeamId || !toTeamId) {
      setError('Please fill in all required fields.')
      return
    }
    if (fromTeamId === toTeamId) {
      setError('Source and target teams must be different.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/transfers', {
        employee_id: Number(employeeId),
        from_team_id: Number(fromTeamId),
        to_team_id: Number(toTeamId),
        reason,
        effective_date: effectiveDate || null,
      })
      setResult(data)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit transfer')
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1: return employeeId !== ''
      case 2: return fromTeamId && toTeamId && reason
      case 3: return true
      default: return false
    }
  }

  const selectedEmp = employees.find(e => String(e.id) === String(employeeId))

  if (result) {
    return (
      <div className="p-8 max-w-2xl">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4 ${result.skill_gap_flag ? 'bg-amber-100' : 'bg-emerald-100'}`}>
            <span className="text-3xl">{result.skill_gap_flag ? '⚠' : '✓'}</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Transfer Submitted</h2>
          <p className="text-sm text-gray-500 mb-6">Transfer ID #{result.transfer_id}</p>

          <div className="text-left space-y-3 mb-6">
            <div className="flex justify-between text-sm py-2 border-b border-gray-100">
              <span className="text-gray-500">Status</span>
              <span className="font-medium capitalize text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full text-xs">
                {result.status.replace('_', ' ')}
              </span>
            </div>
            {result.skill_gap_flag && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                <p className="text-sm font-semibold text-amber-800 mb-1">⚠ Skill Redundancy Warning</p>
                <p className="text-sm text-amber-700">{result.skill_gap_note}</p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate('/transfers')}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
            >
              View All Transfers
            </button>
            <button
              onClick={() => { setResult(null); setEmployeeId(''); setFromTeamId(''); setToTeamId(''); setReason('') }}
              className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium py-2.5 rounded-lg text-sm transition-colors"
            >
              New Transfer
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Employee Transfer Request</h1>
          <p className="text-gray-600">Initiate a transfer request for team reallocation</p>
        </div>

        {/* Step Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                    step.id <= currentStep
                      ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg'
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {step.id < currentStep ? '✓' : step.id}
                  </div>
                  <div className="mt-2 text-center">
                    <p className={`text-sm font-medium ${step.id <= currentStep ? 'text-gray-900' : 'text-gray-500'}`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{step.description}</p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 mt-[-20px] transition-colors ${
                    step.id < currentStep ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Warning Alert Card */}
        <div className="mb-6 max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">!</span>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-yellow-800 mb-1">Transfer Impact Notice</h3>
                <p className="text-sm text-yellow-700">
                  This transfer will require approval from multiple stakeholders and may affect team utilization.
                  Please ensure all details are accurate before submission.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Project Selector */}
        <div className="mb-6 max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Select Project:</label>
              <select
                value={selectedProject || ''}
                onChange={(e) => setSelectedProject(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Select Employee */}
            {currentStep === 1 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Employee</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Choose Employee</label>
                    <select
                      value={employeeId}
                      onChange={e => setEmployeeId(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                    >
                      <option value="">Choose employee...</option>
                      {employees.map(e => (
                        <option key={e.id} value={e.id}>{e.name} ({e.employee_code}) — {e.designation}</option>
                      ))}
                    </select>
                  </div>
                  {selectedEmp && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-2">Employee Details</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Position:</span>
                          <span className="ml-2 font-medium">{selectedEmp.designation}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Employee Code:</span>
                          <span className="ml-2 font-medium">{selectedEmp.employee_code}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Current Team:</span>
                          <span className="ml-2 font-medium">{selectedEmp.team_name || 'Unassigned'}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Transfer Details */}
            {currentStep === 2 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Transfer Details</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">From Team</label>
                      <select
                        value={fromTeamId}
                        onChange={e => setFromTeamId(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                      >
                        <option value="">Select team...</option>
                        {teams.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">To Team</label>
                      <select
                        value={toTeamId}
                        onChange={e => setToTeamId(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                      >
                        <option value="">Select team...</option>
                        {teams.filter(t => String(t.id) !== fromTeamId).map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Effective Date</label>
                    <input
                      type="date"
                      value={effectiveDate}
                      onChange={e => setEffectiveDate(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Transfer</label>
                    <textarea
                      rows={4}
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                      placeholder="Describe the business reason for this transfer..."
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Review & Submit */}
            {currentStep === 3 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Review Transfer Request</h2>
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3">Transfer Summary</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Employee:</span>
                        <span className="font-medium">{selectedEmp?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">From Team:</span>
                        <span className="font-medium">{teams.find(t => String(t.id) === fromTeamId)?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">To Team:</span>
                        <span className="font-medium">{teams.find(t => String(t.id) === toTeamId)?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Effective Date:</span>
                        <span className="font-medium">{effectiveDate ? new Date(effectiveDate).toLocaleDateString() : 'Not specified'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-medium text-blue-900 mb-2">Reason for Transfer</h3>
                    <p className="text-sm text-blue-800">{reason}</p>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between">
              <button
                onClick={prevStep}
                disabled={currentStep === 1}
                className="px-6 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <div className="flex gap-3">
                {currentStep < steps.length ? (
                  <button
                    onClick={nextStep}
                    disabled={!canProceed()}
                    className="px-6 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="px-6 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium rounded-lg text-sm transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Submitting...' : 'Submit Transfer Request'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Status Overview */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Overview</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Current Status</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">Draft</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Approval Required</span>
                  <span className="text-sm font-medium text-gray-900">3 levels</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Estimated Timeline</span>
                  <span className="text-sm font-medium text-gray-900">2-3 weeks</span>
                </div>
              </div>
            </div>

            {/* Team Impact Analysis */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Impact Analysis</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-red-600 text-sm font-bold">⚠</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Source Team Impact</p>
                    <p className="text-xs text-gray-600">Potential skill gap in current projects</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 text-sm font-bold">✓</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Target Team Benefit</p>
                    <p className="text-xs text-gray-600">Enhances team capabilities</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 text-sm font-bold">ℹ</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Utilization Check</p>
                    <p className="text-xs text-gray-600">Auto-validated on submission</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-white hover:shadow-sm rounded-lg transition-colors">
                  📋 View Employee Profile
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-white hover:shadow-sm rounded-lg transition-colors">
                  📊 Check Team Utilization
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-white hover:shadow-sm rounded-lg transition-colors">
                  📈 Review Project Impact
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
