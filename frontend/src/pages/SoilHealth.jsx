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
import { soilApi } from '../services/soilApi'
import { SOIL_TYPES } from '../utils/constants'
import { FlaskConical, Leaf, RotateCw, Beaker, ChevronDown, ChevronUp } from 'lucide-react'
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts'

export default function SoilHealth() {
  const { isDark } = useTheme()
  const { farmer } = useFarmer()
  const { data: result, loading, error, execute } = useApi(soilApi.analyze)

  const [mode, setMode] = useState('simple') // 'simple' or 'detailed'
  const [form, setForm] = useState({
    soil_type: farmer?.soil_type || '',
    ph_value: '',
    nitrogen_kg_per_ha: '',
    phosphorus_kg_per_ha: '',
    potassium_kg_per_ha: '',
    organic_carbon_percent: '',
    zinc_ppm: '',
    iron_ppm: '',
    manganese_ppm: '',
  })
  const [expandedSection, setExpandedSection] = useState(null)

  const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await execute(form)
    } catch {}
  }

  const getStatusColor = (status) => {
    if (status === 'deficient' || status === 'strongly_acidic' || status === 'strongly_alkaline') return 'red'
    if (status === 'adequate' || status === 'neutral') return 'green'
    if (status === 'excessive' || status === 'acidic' || status === 'alkaline') return 'orange'
    return 'gray'
  }

  const getRadarData = () => {
    if (!result?.assessment) return []
    const nutrients = ['nitrogen', 'phosphorus', 'potassium', 'organicCarbon', 'zinc', 'iron']
    const labels = ['N', 'P', 'K', 'OC', 'Zn', 'Fe']
    return nutrients.map((n, i) => ({
      nutrient: labels[i],
      value: result.assessment[n]?.level === 'high' ? 90 : result.assessment[n]?.level === 'medium' ? 60 : result.assessment[n]?.level === 'low' ? 25 : 0,
      fullMark: 100,
    }))
  }

  const toggleSection = (section) => setExpandedSection(prev => prev === section ? null : section)

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <FlaskConical className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Soil Health Analyzer</h1>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Get fertilizer recommendations and crop rotation plans</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <GlassCard hover={false}>
          <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Soil Data Input</h2>

          {/* Mode toggle */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setMode('simple')}
              className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all ${
                mode === 'simple'
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  : isDark ? 'text-gray-400 border border-white/10' : 'text-gray-600 border border-gray-200'
              }`}
            >
              I know my soil type
            </button>
            <button
              onClick={() => setMode('detailed')}
              className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all ${
                mode === 'detailed'
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  : isDark ? 'text-gray-400 border border-white/10' : 'text-gray-600 border border-gray-200'
              }`}
            >
              I have soil test report
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Select
              label="Soil Type"
              value={form.soil_type}
              onChange={e => updateField('soil_type', e.target.value)}
              options={SOIL_TYPES.map(s => ({ value: s.toLowerCase(), label: s }))}
              placeholder="Select soil type..."
            />

            {mode === 'detailed' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="pH Value" type="number" step="0.1" min="0" max="14" placeholder="e.g. 6.8"
                    value={form.ph_value} onChange={e => updateField('ph_value', e.target.value)} />
                  <Input label="Organic Carbon (%)" type="number" step="0.01" placeholder="e.g. 0.65"
                    value={form.organic_carbon_percent} onChange={e => updateField('organic_carbon_percent', e.target.value)} />
                </div>

                <div className={`text-xs font-medium uppercase tracking-wider mt-4 mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  Macronutrients (kg/ha)
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Input label="Nitrogen (N)" type="number" step="1" placeholder="280"
                    value={form.nitrogen_kg_per_ha} onChange={e => updateField('nitrogen_kg_per_ha', e.target.value)} />
                  <Input label="Phosphorus (P)" type="number" step="0.1" placeholder="15"
                    value={form.phosphorus_kg_per_ha} onChange={e => updateField('phosphorus_kg_per_ha', e.target.value)} />
                  <Input label="Potassium (K)" type="number" step="1" placeholder="200"
                    value={form.potassium_kg_per_ha} onChange={e => updateField('potassium_kg_per_ha', e.target.value)} />
                </div>

                <div className={`text-xs font-medium uppercase tracking-wider mt-4 mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  Micronutrients (ppm)
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Input label="Zinc" type="number" step="0.1" placeholder="0.8"
                    value={form.zinc_ppm} onChange={e => updateField('zinc_ppm', e.target.value)} />
                  <Input label="Iron" type="number" step="0.1" placeholder="5.0"
                    value={form.iron_ppm} onChange={e => updateField('iron_ppm', e.target.value)} />
                  <Input label="Manganese" type="number" step="0.1" placeholder="3.0"
                    value={form.manganese_ppm} onChange={e => updateField('manganese_ppm', e.target.value)} />
                </div>
              </>
            )}

            <Button type="submit" loading={loading} className="w-full mt-4">
              <FlaskConical className="w-4 h-4" /> Analyze Soil
            </Button>
          </form>
        </GlassCard>

        {/* Results */}
        <div className="space-y-4">
          {loading && <GlassCard hover={false}><LoadingSpinner className="py-12" /></GlassCard>}
          {error && <Alert type="error">{error}</Alert>}

          {result && !loading && (
            <>
              {/* Health Score */}
              <GlassCard hover={false}>
                <div className="text-center">
                  <div className={`text-5xl font-bold mb-2 ${
                    result.healthScore >= 70 ? 'text-emerald-400' :
                    result.healthScore >= 40 ? 'text-orange-400' : 'text-red-400'
                  }`}>
                    {result.healthScore}%
                  </div>
                  <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Soil Health Score</p>
                  <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{result.summary}</p>
                </div>
              </GlassCard>

              {/* Radar Chart */}
              {getRadarData().some(d => d.value > 0) && (
                <GlassCard hover={false}>
                  <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Nutrient Profile</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <RadarChart data={getRadarData()}>
                      <PolarGrid stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} />
                      <PolarAngleAxis dataKey="nutrient" tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 12 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                      <Radar name="Level" dataKey="value" stroke="#a855f7" fill="#a855f7" fillOpacity={0.3} />
                    </RadarChart>
                  </ResponsiveContainer>
                </GlassCard>
              )}

              {/* Nutrient Assessment */}
              <GlassCard hover={false}>
                <button onClick={() => toggleSection('nutrients')} className="w-full flex items-center justify-between">
                  <h3 className={`text-sm font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    <Beaker className="w-4 h-4 text-purple-400" /> Nutrient Assessment
                  </h3>
                  {expandedSection === 'nutrients' ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>
                {expandedSection === 'nutrients' && (
                  <div className="mt-4 space-y-3">
                    {Object.entries(result.assessment).map(([key, val]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className={`text-sm capitalize ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{key.replace(/([A-Z])/g, ' $1')}</span>
                        <div className="flex items-center gap-2">
                          <Badge color={getStatusColor(val.status)} size="sm">{val.status}</Badge>
                          {val.value != null && <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{val.value} {val.unit || ''}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>

              {/* Fertilizer Plan */}
              {result.fertilizerPlan?.length > 0 && (
                <GlassCard hover={false}>
                  <button onClick={() => toggleSection('fertilizer')} className="w-full flex items-center justify-between">
                    <h3 className={`text-sm font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      <Leaf className="w-4 h-4 text-emerald-400" /> Fertilizer Recommendations
                    </h3>
                    {expandedSection === 'fertilizer' ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </button>
                  {expandedSection === 'fertilizer' && (
                    <div className="mt-4 space-y-4">
                      {result.fertilizerPlan.map((rec, i) => (
                        <div key={i} className={`p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                          <div className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{rec.nutrient}</div>
                          <div className={`text-sm mt-1 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{rec.fertilizer} — {rec.quantity}</div>
                          <div className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{rec.application}</div>
                          {rec.alternative && <div className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Alt: {rec.alternative}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </GlassCard>
              )}

              {/* Crop Rotation */}
              {result.rotationPlan && (
                <GlassCard hover={false}>
                  <button onClick={() => toggleSection('rotation')} className="w-full flex items-center justify-between">
                    <h3 className={`text-sm font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      <RotateCw className="w-4 h-4 text-blue-400" /> Crop Rotation Plan
                    </h3>
                    {expandedSection === 'rotation' ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </button>
                  {expandedSection === 'rotation' && (
                    <div className="mt-4 space-y-3">
                      {result.rotationPlan.rotation.map((r, i) => (
                        <div key={i} className={`p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                          <div className={`text-xs font-medium ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{r.season}</div>
                          <div className={`font-medium text-sm mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{r.crop}</div>
                          <div className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{r.reason}</div>
                        </div>
                      ))}
                      {result.rotationPlan.notes?.map((note, i) => (
                        <Alert key={i} type="info">{note}</Alert>
                      ))}
                    </div>
                  )}
                </GlassCard>
              )}

              {/* Amendments */}
              {result.amendments?.length > 0 && (
                <GlassCard hover={false}>
                  <button onClick={() => toggleSection('amendments')} className="w-full flex items-center justify-between">
                    <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Soil Amendments</h3>
                    {expandedSection === 'amendments' ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </button>
                  {expandedSection === 'amendments' && (
                    <div className="mt-4 space-y-3">
                      {result.amendments.map((a, i) => (
                        <div key={i} className={`p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                          <div className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{a.type}</div>
                          <div className={`text-sm mt-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{a.amendment}</div>
                          <div className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{a.timing}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </GlassCard>
              )}
            </>
          )}

          {!result && !loading && !error && (
            <GlassCard hover={false}>
              <div className="text-center py-12">
                <FlaskConical className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  Enter your soil data and click Analyze to see recommendations
                </p>
              </div>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  )
}
