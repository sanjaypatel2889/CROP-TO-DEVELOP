import { useState, useRef } from 'react'
import {
  Bug,
  Upload,
  Search,
  X,
  ChevronDown,
  ChevronUp,
  Leaf,
  Shield,
  Beaker,
  AlertTriangle,
  ImageIcon,
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useFarmer } from '../context/FarmerContext'
import { useApi } from '../hooks/useApi'
import { diseaseApi } from '../services/diseaseApi'
import GlassCard from '../components/ui/GlassCard'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Badge from '../components/ui/Badge'
import Alert from '../components/ui/Alert'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import {
  AFFECTED_PARTS,
  SPOT_COLORS,
  SPOT_SHAPES,
  WEATHER_CONDITIONS,
} from '../utils/constants'

const SYMPTOM_OPTIONS = [
  'Yellow spots',
  'Brown spots',
  'Wilting',
  'Curling leaves',
  'Black spots',
  'White powder',
  'Holes in leaves',
  'Stunted growth',
  'Rotting',
  'Discoloration',
]

const severityConfig = {
  mild: { color: 'green', label: 'Mild - Early Stage' },
  moderate: { color: 'orange', label: 'Moderate - Needs Treatment' },
  severe: { color: 'red', label: 'Severe - Immediate Action' },
  low: { color: 'green', label: 'Low Severity' },
  medium: { color: 'orange', label: 'Medium Severity' },
  high: { color: 'red', label: 'High Severity' },
  critical: { color: 'red', label: 'Critical' },
}

export default function DiseaseDetector() {
  const { isDark } = useTheme()
  const { farmer } = useFarmer()
  const { data: results, loading, error, execute, reset } = useApi(diseaseApi.detect)
  const fileInputRef = useRef(null)

  // Form state
  const [cropName, setCropName] = useState(farmer?.primaryCrop || '')
  const [affectedPart, setAffectedPart] = useState('')
  const [symptoms, setSymptoms] = useState([])
  const [spotColor, setSpotColor] = useState('')
  const [spotShape, setSpotShape] = useState('')
  const [fungalGrowth, setFungalGrowth] = useState(null)
  const [recentWeather, setRecentWeather] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [expandedMatch, setExpandedMatch] = useState(0)

  const toggleSymptom = (symptom) => {
    setSymptoms((prev) =>
      prev.includes(symptom)
        ? prev.filter((s) => s !== symptom)
        : [...prev, symptom]
    )
  }

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (ev) => setImagePreview(ev.target.result)
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!cropName.trim()) return

    const formData = new FormData()
    formData.append('cropName', cropName.trim())
    if (affectedPart) formData.append('affectedPart', affectedPart)
    if (symptoms.length > 0) formData.append('symptoms', JSON.stringify(symptoms))
    if (spotColor) formData.append('spotColor', spotColor)
    if (spotShape) formData.append('spotShape', spotShape)
    if (fungalGrowth !== null) formData.append('hasFungalGrowth', fungalGrowth)
    if (recentWeather) formData.append('weatherRecent', recentWeather)
    if (imageFile) formData.append('image', imageFile)

    try {
      await execute(formData)
      setExpandedMatch(0)
    } catch {
      // error is handled by useApi
    }
  }

  const handleReset = () => {
    setCropName(farmer?.primaryCrop || '')
    setAffectedPart('')
    setSymptoms([])
    setSpotColor('')
    setSpotShape('')
    setFungalGrowth(null)
    setRecentWeather('')
    removeImage()
    reset()
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded-xl ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
          <Bug className={`w-6 h-6 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
        </div>
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Crop Disease Detector
          </h1>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Identify diseases from symptoms and get treatment recommendations
          </p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Input Form */}
        <GlassCard hover={false}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Describe Symptoms
            </h2>

            {/* Crop Name */}
            <Input
              label="Crop Name *"
              placeholder="e.g. Rice, Wheat, Tomato"
              value={cropName}
              onChange={(e) => setCropName(e.target.value)}
              error={!cropName.trim() ? undefined : undefined}
            />

            {/* Affected Plant Part */}
            <div className="space-y-2">
              <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Affected Plant Part
              </label>
              <div className="flex flex-wrap gap-2">
                {AFFECTED_PARTS.map((part) => (
                  <button
                    key={part.value}
                    type="button"
                    onClick={() => setAffectedPart(affectedPart === part.value ? '' : part.value)}
                    className={`
                      inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium
                      transition-all duration-200
                      ${affectedPart === part.value
                        ? isDark
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                          : 'bg-emerald-100 border-emerald-400 text-emerald-700'
                        : isDark
                          ? 'bg-white/[0.06] border-white/[0.12] text-gray-300 hover:bg-white/[0.1]'
                          : 'bg-white/70 border-gray-300 text-gray-700 hover:bg-white'
                      }
                    `}
                  >
                    <span>{part.emoji}</span>
                    {part.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Symptoms Checkboxes */}
            <div className="space-y-2">
              <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Symptoms
              </label>
              <div className="grid grid-cols-2 gap-2">
                {SYMPTOM_OPTIONS.map((symptom) => (
                  <label
                    key={symptom}
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded-xl border text-sm cursor-pointer
                      transition-all duration-200
                      ${symptoms.includes(symptom)
                        ? isDark
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                          : 'bg-emerald-100 border-emerald-400 text-emerald-700'
                        : isDark
                          ? 'bg-white/[0.06] border-white/[0.12] text-gray-300 hover:bg-white/[0.1]'
                          : 'bg-white/70 border-gray-300 text-gray-700 hover:bg-white'
                      }
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={symptoms.includes(symptom)}
                      onChange={() => toggleSymptom(symptom)}
                      className="sr-only"
                    />
                    <div className={`
                      w-4 h-4 rounded border flex items-center justify-center flex-shrink-0
                      ${symptoms.includes(symptom)
                        ? isDark
                          ? 'bg-emerald-500 border-emerald-500'
                          : 'bg-emerald-500 border-emerald-500'
                        : isDark
                          ? 'border-gray-500'
                          : 'border-gray-400'
                      }
                    `}>
                      {symptoms.includes(symptom) && (
                        <svg className="w-3 h-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    {symptom}
                  </label>
                ))}
              </div>
            </div>

            {/* Spot Color */}
            <div className="space-y-2">
              <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Spot Color
              </label>
              <div className="flex flex-wrap gap-3">
                {SPOT_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setSpotColor(spotColor === color.value ? '' : color.value)}
                    className="flex flex-col items-center gap-1 group"
                    title={color.label}
                  >
                    <div
                      className={`
                        w-8 h-8 rounded-full border-2 transition-all duration-200
                        ${spotColor === color.value
                          ? 'ring-2 ring-emerald-500 ring-offset-2 scale-110'
                          : 'hover:scale-105'
                        }
                        ${isDark ? 'ring-offset-gray-900' : 'ring-offset-white'}
                      `}
                      style={{ backgroundColor: color.hex, borderColor: spotColor === color.value ? '#10b981' : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)') }}
                    />
                    <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {color.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Spot Shape */}
            <Select
              label="Spot Shape"
              options={SPOT_SHAPES}
              placeholder="Select spot shape"
              value={spotShape}
              onChange={(e) => setSpotShape(e.target.value)}
            />

            {/* Fungal Growth */}
            <div className="space-y-2">
              <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Fungal Growth Visible?
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setFungalGrowth(fungalGrowth === true ? null : true)}
                  className={`
                    px-4 py-2 rounded-xl border text-sm font-medium transition-all duration-200
                    ${fungalGrowth === true
                      ? isDark
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                        : 'bg-emerald-100 border-emerald-400 text-emerald-700'
                      : isDark
                        ? 'bg-white/[0.06] border-white/[0.12] text-gray-300 hover:bg-white/[0.1]'
                        : 'bg-white/70 border-gray-300 text-gray-700 hover:bg-white'
                    }
                  `}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setFungalGrowth(fungalGrowth === false ? null : false)}
                  className={`
                    px-4 py-2 rounded-xl border text-sm font-medium transition-all duration-200
                    ${fungalGrowth === false
                      ? isDark
                        ? 'bg-orange-500/20 border-orange-500/40 text-orange-400'
                        : 'bg-orange-100 border-orange-400 text-orange-700'
                      : isDark
                        ? 'bg-white/[0.06] border-white/[0.12] text-gray-300 hover:bg-white/[0.1]'
                        : 'bg-white/70 border-gray-300 text-gray-700 hover:bg-white'
                    }
                  `}
                >
                  No
                </button>
              </div>
            </div>

            {/* Recent Weather */}
            <Select
              label="Recent Weather"
              options={WEATHER_CONDITIONS}
              placeholder="Select recent weather"
              value={recentWeather}
              onChange={(e) => setRecentWeather(e.target.value)}
            />

            {/* Image Upload */}
            <div className="space-y-2">
              <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Upload Image (Optional)
              </label>
              {imagePreview ? (
                <div className="relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Crop preview"
                    className="w-full max-w-[200px] h-auto rounded-xl border border-white/20 object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 p-1 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`
                    w-full flex flex-col items-center gap-2 p-6 rounded-xl border-2 border-dashed
                    transition-all duration-200 cursor-pointer
                    ${isDark
                      ? 'border-white/[0.15] text-gray-400 hover:border-emerald-500/40 hover:bg-white/[0.04]'
                      : 'border-gray-300 text-gray-500 hover:border-emerald-400 hover:bg-emerald-50/50'
                    }
                  `}
                >
                  <ImageIcon className="w-8 h-8" />
                  <span className="text-sm">Click to upload an image of the affected crop</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>

            {/* Submit & Reset */}
            <div className="flex gap-3 pt-2">
              <Button type="submit" size="lg" loading={loading} disabled={!cropName.trim()} className="flex-1">
                <Search className="w-4 h-4" />
                Detect Disease
              </Button>
              <Button type="button" variant="ghost" size="lg" onClick={handleReset}>
                Reset
              </Button>
            </div>
          </form>
        </GlassCard>

        {/* Right Column: Results */}
        <div className="space-y-4">
          {/* Loading State */}
          {loading && (
            <GlassCard hover={false}>
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <LoadingSpinner size="lg" />
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Analyzing symptoms...
                </p>
              </div>
            </GlassCard>
          )}

          {/* Error State */}
          {error && !loading && (
            <Alert type="error">{error}</Alert>
          )}

          {/* Empty State */}
          {!results && !loading && !error && (
            <GlassCard hover={false}>
              <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                <div className={`p-4 rounded-full ${isDark ? 'bg-white/[0.06]' : 'bg-gray-100'}`}>
                  <Bug className={`w-10 h-10 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                </div>
                <div>
                  <p className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    No results yet
                  </p>
                  <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    Fill in symptoms and click Detect to see results
                  </p>
                </div>
              </div>
            </GlassCard>
          )}

          {/* Results */}
          {results && !loading && (
            <div className="space-y-4">
              {/* Severity Badge & Disclaimer */}
              <GlassCard hover={false}>
                <div className="space-y-3">
                  {results.severity && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-orange-400" />
                        <Badge
                          color={results.severity.color || severityConfig[results.severity.level]?.color || 'gray'}
                          size="md"
                        >
                          {severityConfig[results.severity.level]?.label || results.severity.level || 'Unknown'}
                        </Badge>
                      </div>
                      {results.severity.message && (
                        <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{results.severity.message}</p>
                      )}
                    </div>
                  )}
                  {results.disclaimer && (
                    <Alert type="warning">
                      {results.disclaimer}
                    </Alert>
                  )}
                </div>
              </GlassCard>

              {/* Match Cards */}
              {results.topMatches && results.topMatches.length > 0 ? (
                results.topMatches.map((match, index) => (
                  <GlassCard key={index} hover={false}>
                    {/* Header - always visible */}
                    <button
                      type="button"
                      onClick={() => setExpandedMatch(expandedMatch === index ? -1 : index)}
                      className="w-full text-left"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {match.name}
                            </h3>
                            {match.nameHindi && (
                              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                ({match.nameHindi})
                              </span>
                            )}
                          </div>

                          {/* Confidence Bar */}
                          {match.confidence !== undefined && (
                            <div className="mt-2 flex items-center gap-3">
                              <div className={`flex-1 h-2.5 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    match.confidence >= 70
                                      ? 'bg-emerald-500'
                                      : match.confidence >= 40
                                        ? 'bg-orange-500'
                                        : 'bg-red-500'
                                  }`}
                                  style={{ width: `${Math.min(match.confidence, 100)}%` }}
                                />
                              </div>
                              <span className={`text-sm font-medium min-w-[3rem] text-right ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                {match.confidence}%
                              </span>
                            </div>
                          )}

                          {/* Pathogen Badge */}
                          {match.pathogenType && (
                            <div className="mt-2">
                              <Badge color="purple" size="sm">
                                {match.pathogenType}
                              </Badge>
                            </div>
                          )}
                        </div>
                        <div className={`p-1 rounded-lg ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {expandedMatch === index ? (
                            <ChevronUp className="w-5 h-5" />
                          ) : (
                            <ChevronDown className="w-5 h-5" />
                          )}
                        </div>
                      </div>
                    </button>

                    {/* Expanded Content */}
                    {expandedMatch === index && (
                      <div className={`mt-4 pt-4 border-t space-y-4 ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                        {/* Treatment */}
                        {match.treatment && match.treatment.length > 0 && (
                          <div>
                            <h4 className={`flex items-center gap-2 text-sm font-semibold mb-2 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                              <Beaker className="w-4 h-4" />
                              Treatment
                            </h4>
                            <ol className={`list-decimal list-inside space-y-1.5 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                              {match.treatment.map((step, i) => (
                                <li key={i}>{step}</li>
                              ))}
                            </ol>
                          </div>
                        )}

                        {/* Prevention */}
                        {match.prevention && match.prevention.length > 0 && (
                          <div>
                            <h4 className={`flex items-center gap-2 text-sm font-semibold mb-2 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                              <Shield className="w-4 h-4" />
                              Prevention Tips
                            </h4>
                            <ul className={`list-disc list-inside space-y-1.5 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                              {match.prevention.map((tip, i) => (
                                <li key={i}>{tip}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Organic Alternatives */}
                        {match.organicTreatment && match.organicTreatment.length > 0 && (
                          <div>
                            <h4 className={`flex items-center gap-2 text-sm font-semibold mb-2 ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                              <Leaf className="w-4 h-4" />
                              Organic Alternatives
                            </h4>
                            <ul className={`list-disc list-inside space-y-1.5 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                              {match.organicTreatment.map((alt, i) => (
                                <li key={i}>{alt}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </GlassCard>
                ))
              ) : (
                <GlassCard hover={false}>
                  <div className="text-center py-8">
                    <p className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      No diseases matched the given symptoms
                    </p>
                    <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      Try adding more symptoms or adjusting your input
                    </p>
                  </div>
                </GlassCard>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
