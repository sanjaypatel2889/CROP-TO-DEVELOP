import { useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import { useFarmer } from '../context/FarmerContext'
import GlassCard from '../components/ui/GlassCard'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Badge from '../components/ui/Badge'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import Alert from '../components/ui/Alert'
import { useApi } from '../hooks/useApi'
import { schemeApi } from '../services/schemeApi'
import { INDIAN_STATES, INCOME_CATEGORIES, IRRIGATION_TYPES } from '../utils/constants'
import { Landmark, ChevronDown, ChevronUp, FileText, Phone, ExternalLink, CheckCircle } from 'lucide-react'

const SCHEME_TYPE_LABELS = {
  financial_support: { label: 'Financial Support', color: 'green' },
  insurance: { label: 'Insurance', color: 'blue' },
  credit: { label: 'Credit / Loans', color: 'purple' },
  subsidy: { label: 'Subsidy', color: 'orange' },
  infrastructure: { label: 'Infrastructure', color: 'yellow' },
  training: { label: 'Training', color: 'gray' },
}

export default function SchemesFinder() {
  const { isDark } = useTheme()
  const { farmer } = useFarmer()
  const { data: result, loading, error, execute } = useApi(schemeApi.match)

  const [form, setForm] = useState({
    state: farmer?.state || '',
    landSize: farmer?.land_size_hectares || farmer?.landSize || '',
    incomeCategory: farmer?.income_category || farmer?.incomeCategory || '',
    primaryCrop: farmer?.primary_crop || farmer?.primaryCrop || '',
    irrigationType: farmer?.irrigation_type || farmer?.irrigationType || '',
  })
  const [expandedScheme, setExpandedScheme] = useState(null)
  const [filterType, setFilterType] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await execute(form)
    } catch {}
  }

  const filteredSchemes = result?.matchedSchemes?.filter(
    s => !filterType || s.schemeType === filterType
  ) || []

  const getMatchColor = (score) => {
    if (score >= 80) return 'green'
    if (score >= 50) return 'yellow'
    return 'orange'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
          <Landmark className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Government Scheme Finder</h1>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Find subsidies, insurance, and financial support you qualify for</p>
        </div>
      </div>

      {/* Input Form */}
      <GlassCard hover={false}>
        <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Your Farm Details</h2>
        {farmer && (
          <Alert type="info" className="mb-4">
            Auto-filled from your profile. Update below if needed.
          </Alert>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Select label="State" value={form.state}
              onChange={e => setForm(prev => ({ ...prev, state: e.target.value }))}
              options={INDIAN_STATES} placeholder="Select state..." />
            <Input label="Land Size (hectares)" type="number" step="0.1" placeholder="e.g. 2.5"
              value={form.landSize}
              onChange={e => setForm(prev => ({ ...prev, landSize: e.target.value }))} />
            <Select label="Income Category" value={form.incomeCategory}
              onChange={e => setForm(prev => ({ ...prev, incomeCategory: e.target.value }))}
              options={INCOME_CATEGORIES} placeholder="Select..." />
            <Input label="Primary Crop" placeholder="e.g. Rice, Wheat"
              value={form.primaryCrop}
              onChange={e => setForm(prev => ({ ...prev, primaryCrop: e.target.value }))} />
            <Select label="Irrigation Type" value={form.irrigationType}
              onChange={e => setForm(prev => ({ ...prev, irrigationType: e.target.value }))}
              options={IRRIGATION_TYPES} placeholder="Select..." />
          </div>
          <Button type="submit" loading={loading}>
            <Landmark className="w-4 h-4" /> Find My Schemes
          </Button>
        </form>
      </GlassCard>

      {loading && <GlassCard hover={false}><LoadingSpinner className="py-12" /></GlassCard>}
      {error && <Alert type="error">{error}</Alert>}

      {result && !loading && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <GlassCard hover={false} className="text-center">
              <div className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{result.matchedCount}</div>
              <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Schemes Matched</div>
            </GlassCard>
            <GlassCard hover={false} className="text-center">
              <div className={`text-3xl font-bold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{result.totalSchemes}</div>
              <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total in Database</div>
            </GlassCard>
            <GlassCard hover={false} className="text-center col-span-2 sm:col-span-1">
              <div className="text-3xl font-bold text-emerald-400">
                {filteredSchemes.filter(s => s.matchScore >= 80).length}
              </div>
              <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Highly Eligible</div>
            </GlassCard>
          </div>

          {/* Type Filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterType('')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                !filterType
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : isDark ? 'text-gray-400 border-white/10 hover:bg-white/5' : 'text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              All ({result.matchedCount})
            </button>
            {Object.entries(SCHEME_TYPE_LABELS).map(([type, config]) => {
              const count = result.matchedSchemes?.filter(s => s.schemeType === type).length || 0
              if (count === 0) return null
              return (
                <button
                  key={type}
                  onClick={() => setFilterType(type === filterType ? '' : type)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                    filterType === type
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : isDark ? 'text-gray-400 border-white/10 hover:bg-white/5' : 'text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {config.label} ({count})
                </button>
              )
            })}
          </div>

          {/* Scheme Cards */}
          <div className="space-y-3">
            {filteredSchemes.map((scheme, i) => (
              <GlassCard key={i} hover={false}>
                <button
                  onClick={() => setExpandedScheme(expandedScheme === i ? null : i)}
                  className="w-full text-left"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{scheme.name}</h3>
                        {scheme.shortCode && (
                          <Badge color={SCHEME_TYPE_LABELS[scheme.schemeType]?.color || 'gray'} size="sm">
                            {scheme.shortCode}
                          </Badge>
                        )}
                      </div>
                      {scheme.nameHindi && (
                        <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{scheme.nameHindi}</p>
                      )}
                      <p className={`text-xs mt-1 line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{scheme.description}</p>
                      {scheme.benefitAmount && (
                        <p className="text-sm mt-2 font-semibold text-emerald-400">{scheme.benefitAmount}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="text-right">
                        <div className={`text-lg font-bold ${getMatchColor(scheme.matchScore) === 'green' ? 'text-emerald-400' : getMatchColor(scheme.matchScore) === 'yellow' ? 'text-yellow-400' : 'text-orange-400'}`}>
                          {scheme.matchScore}%
                        </div>
                        <div className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>match</div>
                      </div>
                      {expandedScheme === i ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>
                  </div>
                </button>

                {expandedScheme === i && (
                  <div className="mt-4 space-y-4">
                    {/* Match Reasons */}
                    {scheme.matchReasons?.length > 0 && (
                      <div className={`p-3 rounded-xl ${isDark ? 'bg-emerald-500/5 border border-emerald-500/10' : 'bg-emerald-50'}`}>
                        <div className="text-xs font-medium text-emerald-400 mb-2 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Why you qualify
                        </div>
                        <div className={`text-xs space-y-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {scheme.matchReasons.map((r, j) => <div key={j}>✓ {r}</div>)}
                        </div>
                      </div>
                    )}

                    {/* Required Documents */}
                    {scheme.requiredDocuments?.length > 0 && (
                      <div>
                        <div className={`text-xs font-medium mb-2 flex items-center gap-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          <FileText className="w-3 h-3" /> Required Documents
                        </div>
                        <div className={`text-xs space-y-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {scheme.requiredDocuments.map((d, j) => (
                            <div key={j} className="flex items-center gap-2">
                              <div className={`w-4 h-4 rounded border flex items-center justify-center ${isDark ? 'border-white/10' : 'border-gray-300'}`}>
                                <span className="text-[8px]">{j + 1}</span>
                              </div>
                              {d}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Application Steps */}
                    {scheme.applicationProcess?.steps?.length > 0 && (
                      <div>
                        <div className={`text-xs font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          How to Apply
                        </div>
                        <div className={`text-xs space-y-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {scheme.applicationProcess.steps.map((step, j) => (
                            <div key={j} className="flex gap-2">
                              <span className="text-emerald-400 font-bold">{j + 1}.</span>
                              <span>{step}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Links */}
                    <div className="flex flex-wrap gap-3">
                      {scheme.applicationUrl && (
                        <a href={scheme.applicationUrl} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:underline">
                          <ExternalLink className="w-3 h-3" /> Apply Online
                        </a>
                      )}
                      {scheme.helpline && (
                        <span className="inline-flex items-center gap-1 text-xs text-blue-400">
                          <Phone className="w-3 h-3" /> Helpline: {scheme.helpline}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </GlassCard>
            ))}

            {filteredSchemes.length === 0 && (
              <Alert type="info">No schemes found matching the selected filter.</Alert>
            )}
          </div>
        </>
      )}

      {!result && !loading && !error && (
        <GlassCard hover={false}>
          <div className="text-center py-12">
            <Landmark className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              Enter your farm details and click "Find My Schemes" to discover government programs you qualify for
            </p>
          </div>
        </GlassCard>
      )}
    </div>
  )
}
