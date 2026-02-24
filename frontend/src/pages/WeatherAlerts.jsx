import { useState } from 'react'
import { CloudSun, MapPin, Droplets, Wind, Thermometer, RefreshCw } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useTheme } from '../context/ThemeContext'
import { useFarmer } from '../context/FarmerContext'
import GlassCard from '../components/ui/GlassCard'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import Alert from '../components/ui/Alert'
import { useApi } from '../hooks/useApi'
import { weatherApi } from '../services/weatherApi'

const WEATHER_EMOJIS = {
  Clear: '\u2600\uFE0F',
  Clouds: '\uD83C\uDF24\uFE0F',
  Rain: '\uD83C\uDF27\uFE0F',
  Drizzle: '\uD83C\uDF26\uFE0F',
  Thunderstorm: '\u26C8\uFE0F',
  Snow: '\u2744\uFE0F',
  Mist: '\uD83C\uDF2B\uFE0F',
  Fog: '\uD83C\uDF2B\uFE0F',
  Haze: '\uD83C\uDF2B\uFE0F',
  Smoke: '\uD83C\uDF2B\uFE0F',
  Dust: '\uD83C\uDF2A\uFE0F',
  Tornado: '\uD83C\uDF2A\uFE0F',
}

const TIP_TYPE_MAP = {
  alert: { alertType: 'error', label: 'Alert' },
  warning: { alertType: 'warning', label: 'Warning' },
  info: { alertType: 'info', label: 'Info' },
  success: { alertType: 'success', label: 'Good' },
}

function getDayLabel(index) {
  if (index === 0) return 'Today'
  if (index === 1) return 'Tomorrow'
  return `Day ${index + 1}`
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
  } catch {
    return dateStr
  }
}

function getWeatherEmoji(condition) {
  if (!condition) return '\uD83C\uDF24\uFE0F'
  const str = typeof condition === 'object' ? (condition.main || condition.description || '') : String(condition)
  for (const [key, emoji] of Object.entries(WEATHER_EMOJIS)) {
    if (str.toLowerCase().includes(key.toLowerCase())) return emoji
  }
  return '\uD83C\uDF24\uFE0F'
}

export default function WeatherAlerts() {
  const { isDark } = useTheme()
  const { farmer } = useFarmer()
  const { data, loading, error, execute } = useApi(weatherApi.getTips)

  const [lat, setLat] = useState('28.6139')
  const [lon, setLon] = useState('77.2090')
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState(null)

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser')
      return
    }

    setLocating(true)
    setLocationError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude.toFixed(4))
        setLon(position.coords.longitude.toFixed(4))
        setLocating(false)
      },
      (err) => {
        setLocationError(`Location access denied: ${err.message}`)
        setLocating(false)
      },
      { timeout: 10000, enableHighAccuracy: true }
    )
  }

  const handleGetForecast = async () => {
    const latitude = parseFloat(lat)
    const longitude = parseFloat(lon)

    if (isNaN(latitude) || isNaN(longitude)) {
      return
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return
    }

    try {
      await execute(latitude, longitude)
    } catch {
      // Error handled by useApi
    }
  }

  // Build chart data from dailyTips
  const chartData = data?.dailyTips?.map((day, index) => ({
    day: getDayLabel(index),
    tempMax: day.summary?.tempMax ?? day.summary?.temp_max ?? null,
    tempMin: day.summary?.tempMin ?? day.summary?.temp_min ?? null,
    rain: day.summary?.rainfall ?? day.summary?.rain ?? 0,
  })) || []

  // Collect multi-day alerts
  const multiDayAlerts = data?.alerts || data?.multiDayAlerts || []

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded-xl ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
          <CloudSun className={`w-7 h-7 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
        </div>
        <div>
          <h1 className={`text-2xl sm:text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Smart Weather Alerts
          </h1>
          <p className={`text-sm mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            7-day forecast with AI-powered farming tips
          </p>
        </div>
      </div>

      {/* Location Input Section */}
      <GlassCard hover={false}>
        <div className="space-y-4">
          <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Enter Location
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Latitude"
              type="number"
              step="0.0001"
              min="-90"
              max="90"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              placeholder="e.g. 28.6139"
            />
            <Input
              label="Longitude"
              type="number"
              step="0.0001"
              min="-180"
              max="180"
              value={lon}
              onChange={(e) => setLon(e.target.value)}
              placeholder="e.g. 77.2090"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUseMyLocation}
              loading={locating}
              disabled={locating}
            >
              <MapPin className="w-4 h-4" />
              Use My Location
            </Button>

            <Button
              onClick={handleGetForecast}
              loading={loading}
              disabled={loading || !lat || !lon}
            >
              <RefreshCw className="w-4 h-4" />
              Get Forecast
            </Button>
          </div>

          {locationError && (
            <Alert type="error">{locationError}</Alert>
          )}
        </div>
      </GlassCard>

      {/* Error State */}
      {error && (
        <Alert type="error">
          Failed to fetch weather data: {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <div className="py-12">
          <LoadingSpinner size="lg" />
          <p className={`text-center mt-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Fetching weather data and generating farming tips...
          </p>
        </div>
      )}

      {/* Forecast Display */}
      {data && !loading && (
        <div className="space-y-6">

          {/* Multi-day Alerts */}
          {multiDayAlerts.length > 0 && (
            <div className="space-y-3">
              <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Weather Alerts
              </h2>
              {multiDayAlerts.map((alert, index) => (
                <Alert
                  key={index}
                  type={alert.severity === 'high' ? 'error' : alert.severity === 'medium' ? 'warning' : 'info'}
                >
                  <div>
                    <span className="font-semibold">{alert.title || alert.type || 'Alert'}: </span>
                    {alert.message || alert.description || alert.text}
                  </div>
                </Alert>
              ))}
            </div>
          )}

          {/* 7-Day Forecast Timeline */}
          {data.dailyTips && data.dailyTips.length > 0 && (
            <div className="space-y-3">
              <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                7-Day Forecast
              </h2>

              <div className="flex overflow-x-auto lg:grid lg:grid-cols-7 gap-3 pb-2 -mx-1 px-1 scrollbar-thin">
                {data.dailyTips.map((day, index) => {
                  const summary = day.summary || {}
                  const weatherVal = summary.weather
                  const condition = (typeof weatherVal === 'object' && weatherVal !== null ? weatherVal.main || weatherVal.description : weatherVal) || summary.condition || summary.description || 'Clear'
                  const tempMax = summary.tempMax ?? summary.temp_max ?? '--'
                  const tempMin = summary.tempMin ?? summary.temp_min ?? '--'
                  const humidity = summary.humidity ?? '--'
                  const windSpeed = summary.windSpeed ?? summary.wind_speed ?? '--'
                  const rainProb = summary.rainProbability ?? summary.rain_probability ?? summary.pop ?? 0

                  return (
                    <GlassCard
                      key={index}
                      className="!p-4 min-w-[140px] flex-shrink-0 lg:min-w-0"
                      hover={false}
                    >
                      <div className="flex flex-col items-center gap-2 text-center">
                        {/* Day Label */}
                        <span className={`text-xs font-semibold uppercase tracking-wide ${
                          index === 0
                            ? isDark ? 'text-emerald-400' : 'text-emerald-600'
                            : isDark ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {getDayLabel(index)}
                        </span>

                        {/* Date */}
                        <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          {formatDate(summary.date || day.date)}
                        </span>

                        {/* Weather Emoji */}
                        <span className="text-3xl my-1">
                          {getWeatherEmoji(condition)}
                        </span>

                        {/* Condition Label */}
                        <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {condition}
                        </span>

                        {/* Temp High/Low */}
                        <div className="flex items-center gap-1">
                          <Thermometer className={`w-3.5 h-3.5 ${isDark ? 'text-orange-400' : 'text-orange-500'}`} />
                          <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {tempMax !== '--' ? `${Math.round(tempMax)}` : '--'}
                          </span>
                          <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>/</span>
                          <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {tempMin !== '--' ? `${Math.round(tempMin)}` : '--'}
                          </span>
                          <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>&deg;C</span>
                        </div>

                        {/* Humidity */}
                        <div className="flex items-center gap-1">
                          <Droplets className={`w-3.5 h-3.5 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
                          <span className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            {humidity}%
                          </span>
                        </div>

                        {/* Wind Speed */}
                        <div className="flex items-center gap-1">
                          <Wind className={`w-3.5 h-3.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                          <span className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            {windSpeed} km/h
                          </span>
                        </div>

                        {/* Rain Probability Bar */}
                        <div className="w-full mt-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Rain</span>
                            <span className={`text-[10px] font-medium ${
                              rainProb > 70
                                ? 'text-red-400'
                                : rainProb > 40
                                  ? 'text-orange-400'
                                  : isDark ? 'text-emerald-400' : 'text-emerald-600'
                            }`}>
                              {Math.round(rainProb)}%
                            </span>
                          </div>
                          <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                rainProb > 70
                                  ? 'bg-red-500'
                                  : rainProb > 40
                                    ? 'bg-orange-500'
                                    : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(Math.max(rainProb, 0), 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </GlassCard>
                  )
                })}
              </div>
            </div>
          )}

          {/* Temperature Chart */}
          {chartData.length > 0 && chartData.some(d => d.tempMax !== null || d.tempMin !== null) && (
            <GlassCard hover={false}>
              <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Temperature Trend
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}
                  />
                  <XAxis
                    dataKey="day"
                    tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 12 }}
                    axisLine={{ stroke: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 12 }}
                    axisLine={{ stroke: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
                    tickLine={false}
                    unit="\u00B0C"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? 'rgba(15,23,42,0.95)' : 'rgba(255,255,255,0.95)',
                      border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                      borderRadius: '12px',
                      backdropFilter: 'blur(8px)',
                      color: isDark ? '#f3f4f6' : '#1f2937',
                    }}
                    labelStyle={{ color: isDark ? '#e5e7eb' : '#374151', fontWeight: 600 }}
                    formatter={(value, name) => [
                      `${value}\u00B0C`,
                      name === 'tempMax' ? 'Max Temp' : 'Min Temp',
                    ]}
                  />
                  <Legend
                    formatter={(value) => (
                      <span style={{ color: isDark ? '#d1d5db' : '#4b5563' }}>
                        {value === 'tempMax' ? 'Max Temp' : 'Min Temp'}
                      </span>
                    )}
                  />
                  <Line
                    type="monotone"
                    dataKey="tempMax"
                    stroke="#f97316"
                    strokeWidth={2.5}
                    dot={{ fill: '#f97316', strokeWidth: 0, r: 4 }}
                    activeDot={{ fill: '#f97316', strokeWidth: 2, stroke: isDark ? '#0f172a' : '#ffffff', r: 6 }}
                    name="tempMax"
                  />
                  <Line
                    type="monotone"
                    dataKey="tempMin"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    dot={{ fill: '#3b82f6', strokeWidth: 0, r: 4 }}
                    activeDot={{ fill: '#3b82f6', strokeWidth: 2, stroke: isDark ? '#0f172a' : '#ffffff', r: 6 }}
                    name="tempMin"
                  />
                </LineChart>
              </ResponsiveContainer>
            </GlassCard>
          )}

          {/* Farming Tips Section */}
          {data.dailyTips && data.dailyTips.length > 0 && (
            <div className="space-y-4">
              <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Farming Tips & Advisories
              </h2>

              {data.dailyTips.map((day, dayIndex) => {
                const tips = day.tips || day.advice || []
                if (!tips.length) return null

                return (
                  <GlassCard key={dayIndex} hover={false}>
                    <div className="space-y-3">
                      {/* Day Header */}
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${
                          dayIndex === 0
                            ? isDark ? 'text-emerald-400' : 'text-emerald-600'
                            : isDark ? 'text-white' : 'text-gray-900'
                        }`}>
                          {getDayLabel(dayIndex)}
                        </span>
                        <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          {formatDate(day.summary?.date || day.date)}
                        </span>
                        <span className="text-lg">
                          {getWeatherEmoji(day.summary?.weather || day.summary?.condition || '')}
                        </span>
                      </div>

                      {/* Tips List */}
                      <div className="space-y-2">
                        {tips.map((tip, tipIndex) => {
                          const tipType = tip.type || tip.severity || 'info'
                          const mapped = TIP_TYPE_MAP[tipType] || TIP_TYPE_MAP.info

                          return (
                            <Alert key={tipIndex} type={mapped.alertType}>
                              <div className="space-y-0.5">
                                {tip.icon && (
                                  <span className="text-xs font-medium uppercase tracking-wide opacity-70">
                                    {tip.icon}
                                  </span>
                                )}
                                <p className="text-sm">
                                  {tip.text || tip.message || tip.description || tip}
                                </p>
                              </div>
                            </Alert>
                          )
                        })}
                      </div>
                    </div>
                  </GlassCard>
                )
              })}
            </div>
          )}

          {/* No Tips Fallback */}
          {data.dailyTips && data.dailyTips.length === 0 && (
            <GlassCard hover={false}>
              <p className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                No forecast data available for this location. Please try a different location.
              </p>
            </GlassCard>
          )}
        </div>
      )}

      {/* Empty State - Before any search */}
      {!data && !loading && !error && (
        <GlassCard hover={false}>
          <div className="text-center py-12 space-y-4">
            <CloudSun className={`w-16 h-16 mx-auto ${isDark ? 'text-blue-400/40' : 'text-blue-300'}`} />
            <div>
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Get Your Farm Weather Forecast
              </h3>
              <p className={`text-sm mt-1 max-w-md mx-auto ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Enter your farm coordinates or use your device location to get a 7-day weather forecast
                with AI-powered farming tips tailored to your conditions.
              </p>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  )
}
