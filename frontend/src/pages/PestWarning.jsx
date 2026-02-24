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
import { pestApi } from '../services/pestApi'
import { INDIAN_STATES } from '../utils/constants'
import { ShieldAlert, Bug, ChevronDown, ChevronUp, AlertTriangle, Leaf, FlaskConical, Tractor } from 'lucide-react'
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export default function PestWarning() {
  const { isDark } = useTheme()
  const { farmer } = useFarmer()
  const { data: result, loading, error, execute } = useApi(pestApi.predict)

  const [form, setForm] = useState({
    crop: farmer?.primary_crop || farmer?.primaryCrop || '',
    state: farmer?.state || '',
    month: new Date().getMonth() + 1,
    temp: '',
    humidity: '',
  })
  const [expandedPest, setExpandedPest] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.crop) return
    try {
      await execute(form)
    } catch {}
  }

  const getRiskColor = (level) => {
    switch (level) {
      case 'low': return { color: 'green', bg: 'bg-emerald-500', text: 'text-emerald-400' }
      case 'medium': return { color: 'yellow', bg: 'bg-yellow-500', text: 'text-yellow-400' }
      case 'high': return { color: 'orange', bg: 'bg-orange-500', text: 'text-orange-400' }
      case 'critical': return { color: 'red', bg: 'bg-red-500', text: 'text-red-400' }
      default: return { color: 'gray', bg: 'bg-gray-500', text: 'text-gray-400' }
    }
  }

  const gaugeData = result ? [{
    name: 'Risk',
    value: result.overallScore || 0,
    fill: result.overallRisk === 'critical' ? '#ef4444' :
          result.overallRisk === 'high' ? '#f97316' :
          result.overallRisk === 'medium' ? '#eab308' : '#22c55e',
  }] : []

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
          <ShieldAlert className="w-5 h-5 text-yellow-400" />
        </div>
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Pest Early Warning</h1>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Predict pest outbreaks based on weather, season, and region</p>
        </div>
      </div>

      {/* Input Form */}
      <GlassCard hover={false}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Input label="Crop Name *" placeholder="e.g. Rice" value={form.crop}
              onChange={e => setForm(prev => ({ ...prev, crop: e.target.value }))} />
            <Select label="State" value={form.state}
              onChange={e => setForm(prev => ({ ...prev, state: e.target.value }))}
              options={INDIAN_STATES} placeholder="Select state..." />
            <Select label="Month" value={form.month}
              onChange={e => setForm(prev => ({ ...prev, month: parseInt(e.target.value) }))}
              options={MONTHS.map((m, i) => ({ value: i + 1, label: m }))} />
            <Input label="Temperature (\u00b0C)" type="number" placeholder="30" value={form.temp}
              onChange={e => setForm(prev => ({ ...prev, temp: e.target.value }))} />
            <Input label="Humidity (%)" type="number" placeholder="75" value={form.humidity}
              onChange={e => setForm(prev => ({ ...prev, humidity: e.target.value }))} />
          </div>
          <Button type="submit" loading={loading}>
            <ShieldAlert className="w-4 h-4" /> Predict Pest Risk
          </Button>
        </form>
      </GlassCard>

      {loading && <GlassCard hover={false}><LoadingSpinner className="py-12" /></GlassCard>}
      {error && <Alert type="error">{error}</Alert>}

      {result && !loading && (
        <>
          {/* Overall Risk Gauge */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <GlassCard hover={false} className="flex flex-col items-center justify-center">
              <ResponsiveContainer width="100%" height={200}>
                <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" startAngle={180} endAngle={0} data={gaugeData}>
                  <RadialBar dataKey="value" cornerRadius={10} background={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="text-center -mt-16 mb-4">
                <div className={`text-3xl font-bold ${getRiskColor(result.overallRisk).text}`}>
                  {result.overallScore}
                </div>
                <Badge color={getRiskColor(result.overallRisk).color} size="lg">
                  {(result.overallRisk || '').toUpperCase()} RISK
                </Badge>
              </div>
            </GlassCard>

            {/* Stats */}
            <GlassCard hover={false} className="lg:col-span-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{result.totalPestsTracked}</div>
                  <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Pests Tracked</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-400">{result.highRiskCount}</div>
                  <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>High Risk</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{result.cropName}</div>
                  <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Crop</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{MONTHS[(result.month || 1) - 1]?.slice(0, 3)}</div>
                  <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Month</div>
                </div>
              </div>

              {result.pests?.length > 0 && (
                <div className="mt-4">
                  <div className={`text-xs font-medium uppercase tracking-wider mb-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    Risk Distribution
                  </div>
                  <div className="flex gap-1 h-3 rounded-full overflow-hidden">
                    {result.pests.map((p, i) => (
                      <div
                        key={i}
                        className={`${getRiskColor(p.riskLevel).bg} transition-all`}
                        style={{ width: `${100 / result.pests.length}%`, opacity: 0.4 + (p.riskScore / 100) * 0.6 }}
                        title={`${p.name}: ${p.riskScore}`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </GlassCard>
          </div>

          {/* Pest Cards */}
          <div className="space-y-3">
            <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Pest Risk Details ({result.pests?.length || 0})
            </h2>
            {result.pests?.map((pest, i) => (
              <GlassCard key={i} hover={false}>
                <button
                  onClick={() => setExpandedPest(expandedPest === i ? null : i)}
                  className="w-full flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getRiskColor(pest.riskLevel).bg}/20`}>
                      <Bug className={`w-4 h-4 ${getRiskColor(pest.riskLevel).text}`} />
                    </div>
                    <div className="text-left">
                      <div className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {pest.name} {pest.nameHindi && <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>({pest.nameHindi})</span>}
                      </div>
                      <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{pest.pestType}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className={`text-lg font-bold ${getRiskColor(pest.riskLevel).text}`}>{pest.riskScore}</div>
                    </div>
                    <Badge color={getRiskColor(pest.riskLevel).color} size="sm">
                      {pest.riskLevel}
                    </Badge>
                    {expandedPest === i ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </button>

                {expandedPest === i && (
                  <div className="mt-4 space-y-4">
                    {/* Risk Details */}
                    {pest.details?.length > 0 && (
                      <div className={`text-xs space-y-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {pest.details.map((d, j) => <div key={j}>- {d}</div>)}
                      </div>
                    )}

                    {/* Damage Symptoms */}
                    {pest.damageSymptoms?.length > 0 && (
                      <div>
                        <div className={`text-xs font-medium mb-2 flex items-center gap-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          <AlertTriangle className="w-3 h-3" /> Damage Symptoms
                        </div>
                        <div className={`text-xs space-y-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {pest.damageSymptoms.map((s, j) => <div key={j}>- {s}</div>)}
                        </div>
                      </div>
                    )}

                    {/* Control Measures - Tabs */}
                    <div className="space-y-3">
                      {pest.controlMeasures?.chemical?.length > 0 && (
                        <div className={`p-3 rounded-xl ${isDark ? 'bg-red-500/5 border border-red-500/10' : 'bg-red-50'}`}>
                          <div className="text-xs font-medium text-red-400 mb-1 flex items-center gap-1">
                            <FlaskConical className="w-3 h-3" /> Chemical Control
                          </div>
                          <div className={`text-xs space-y-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            {pest.controlMeasures.chemical.map((c, j) => <div key={j}>- {c}</div>)}
                          </div>
                        </div>
                      )}
                      {pest.controlMeasures?.biological?.length > 0 && (
                        <div className={`p-3 rounded-xl ${isDark ? 'bg-emerald-500/5 border border-emerald-500/10' : 'bg-emerald-50'}`}>
                          <div className="text-xs font-medium text-emerald-400 mb-1 flex items-center gap-1">
                            <Leaf className="w-3 h-3" /> Biological Control
                          </div>
                          <div className={`text-xs space-y-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            {pest.controlMeasures.biological.map((c, j) => <div key={j}>- {c}</div>)}
                          </div>
                        </div>
                      )}
                      {pest.controlMeasures?.cultural?.length > 0 && (
                        <div className={`p-3 rounded-xl ${isDark ? 'bg-blue-500/5 border border-blue-500/10' : 'bg-blue-50'}`}>
                          <div className="text-xs font-medium text-blue-400 mb-1 flex items-center gap-1">
                            <Tractor className="w-3 h-3" /> Cultural Control
                          </div>
                          <div className={`text-xs space-y-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            {pest.controlMeasures.cultural.map((c, j) => <div key={j}>- {c}</div>)}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Preventive Actions */}
                    {pest.preventiveActions?.length > 0 && (
                      <Alert type="info">
                        <strong>Recommended Actions:</strong>
                        <ul className="mt-1 space-y-1">
                          {pest.preventiveActions.map((a, j) => <li key={j}>- {a}</li>)}
                        </ul>
                      </Alert>
                    )}
                  </div>
                )}
              </GlassCard>
            ))}
          </div>
        </>
      )}

      {!result && !loading && !error && (
        <GlassCard hover={false}>
          <div className="text-center py-12">
            <ShieldAlert className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              Enter your crop and location details to predict pest risks
            </p>
          </div>
        </GlassCard>
      )}
    </div>
  )
}
