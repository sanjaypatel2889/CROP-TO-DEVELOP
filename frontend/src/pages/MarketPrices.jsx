import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Minus, IndianRupee, BarChart3, ArrowRight, Search } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { useTheme } from '../context/ThemeContext'
import { useFarmer } from '../context/FarmerContext'
import GlassCard from '../components/ui/GlassCard'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import Alert from '../components/ui/Alert'
import { useApi } from '../hooks/useApi'
import { marketApi } from '../services/marketApi'
import { INDIAN_STATES } from '../utils/constants'

const SIGNAL_CONFIG = {
  BUY: {
    color: 'green',
    icon: TrendingUp,
    bgDark: 'bg-emerald-500/15 border-emerald-500/30',
    bgLight: 'bg-emerald-50 border-emerald-300',
    textDark: 'text-emerald-400',
    textLight: 'text-emerald-700',
    label: 'BUY',
  },
  SELL: {
    color: 'red',
    icon: TrendingDown,
    bgDark: 'bg-red-500/15 border-red-500/30',
    bgLight: 'bg-red-50 border-red-300',
    textDark: 'text-red-400',
    textLight: 'text-red-700',
    label: 'SELL',
  },
  HOLD: {
    color: 'yellow',
    icon: Minus,
    bgDark: 'bg-yellow-500/15 border-yellow-500/30',
    bgLight: 'bg-yellow-50 border-yellow-300',
    textDark: 'text-yellow-400',
    textLight: 'text-yellow-700',
    label: 'HOLD',
  },
}

function formatPrice(price) {
  if (price === null || price === undefined) return '--'
  return Number(price).toLocaleString('en-IN')
}

function formatDate(dateStr) {
  if (!dateStr) return '--'
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })
  } catch {
    return dateStr
  }
}

export default function MarketPrices() {
  const { isDark } = useTheme()
  const { farmer } = useFarmer()
  const { data, loading, error, execute } = useApi(marketApi.getSignal)

  const [crop, setCrop] = useState('')
  const [state, setState] = useState('')

  // Pre-fill from farmer profile
  useEffect(() => {
    if (farmer?.primaryCrop && !crop) {
      setCrop(farmer.primaryCrop)
    }
    if (farmer?.state && !state) {
      setState(farmer.state)
    }
  }, [farmer]) // eslint-disable-line react-hooks/exhaustive-deps

  const stateOptions = INDIAN_STATES.map((s) => ({ value: s, label: s }))

  const handleGetSignal = async () => {
    if (!crop.trim() || !state) return

    try {
      await execute(crop.trim(), state)
    } catch {
      // Error handled by useApi
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && crop.trim() && state) {
      handleGetSignal()
    }
  }

  // Resolve signal configuration
  const signalType = data?.signal?.toUpperCase() || data?.recommendation?.toUpperCase() || 'HOLD'
  const signalConfig = SIGNAL_CONFIG[signalType] || SIGNAL_CONFIG.HOLD
  const SignalIcon = signalConfig.icon

  // Chart data
  const priceHistory = data?.priceHistory || data?.history || []
  const chartData = priceHistory.map((entry) => ({
    date: formatDate(entry.date),
    price: entry.price || entry.modal_price || entry.modalPrice || 0,
  }))

  const msp = data?.msp || data?.mspPrice || null
  const currentPrice = data?.currentPrice || data?.price || data?.latestPrice || null
  const confidence = data?.confidence || data?.confidencePercent || null
  const trend = data?.trend || data?.priceTrend || null
  const predictedRange = data?.predictedRange || data?.prediction?.nextWeek || data?.nextWeekRange || null
  const reasons = data?.reasons || data?.reasoning || data?.factors || []

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded-xl ${isDark ? 'bg-orange-500/20' : 'bg-orange-100'}`}>
          <TrendingUp className={`w-7 h-7 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
        </div>
        <div>
          <h1 className={`text-2xl sm:text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Market Price Tracker
          </h1>
          <p className={`text-sm mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Live mandi rates with AI buy/sell signals
          </p>
        </div>
      </div>

      {/* Top Controls */}
      <GlassCard hover={false}>
        <div className="space-y-4">
          <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Check Market Signal
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Crop Name"
              type="text"
              value={crop}
              onChange={(e) => setCrop(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. Wheat, Rice, Cotton"
            />
            <Select
              label="State"
              options={stateOptions}
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="Select State..."
            />
          </div>

          <Button
            onClick={handleGetSignal}
            loading={loading}
            disabled={loading || !crop.trim() || !state}
          >
            <Search className="w-4 h-4" />
            Get Signal
          </Button>
        </div>
      </GlassCard>

      {/* Error State */}
      {error && (
        <Alert type="error">
          Failed to fetch market data: {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <div className="py-12">
          <LoadingSpinner size="lg" />
          <p className={`text-center mt-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Analyzing market data and generating signal...
          </p>
        </div>
      )}

      {/* Signal Display */}
      {data && !loading && (
        <div className="space-y-6">

          {/* Signal Card */}
          <GlassCard hover={false} className={`border-2 ${isDark ? signalConfig.bgDark : signalConfig.bgLight}`}>
            <div className="space-y-5">
              {/* Signal Badge + Icon */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`p-4 rounded-2xl ${isDark ? signalConfig.bgDark : signalConfig.bgLight}`}>
                    <SignalIcon className={`w-10 h-10 ${isDark ? signalConfig.textDark : signalConfig.textLight}`} />
                  </div>
                  <div>
                    <Badge color={signalConfig.color} size="lg">
                      {signalConfig.label}
                    </Badge>
                    {confidence !== null && (
                      <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Confidence: <span className={`font-semibold ${isDark ? signalConfig.textDark : signalConfig.textLight}`}>
                          {confidence}%
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Trend Indicator */}
                {trend && (
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Trend:</span>
                    <Badge
                      color={
                        trend.toLowerCase().includes('up') || trend.toLowerCase().includes('bull')
                          ? 'green'
                          : trend.toLowerCase().includes('down') || trend.toLowerCase().includes('bear')
                            ? 'red'
                            : 'yellow'
                      }
                      size="sm"
                    >
                      {trend}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Price Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Current Price */}
                {currentPrice !== null && (
                  <div className={`p-4 rounded-xl ${isDark ? 'bg-white/[0.05]' : 'bg-white/50'}`}>
                    <p className={`text-xs uppercase tracking-wide font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      Current Price
                    </p>
                    <div className="flex items-baseline gap-1 mt-1">
                      <IndianRupee className={`w-5 h-5 ${isDark ? 'text-white' : 'text-gray-900'}`} />
                      <span className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {formatPrice(currentPrice)}
                      </span>
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>/quintal</span>
                    </div>
                  </div>
                )}

                {/* MSP */}
                {msp !== null && (
                  <div className={`p-4 rounded-xl ${isDark ? 'bg-white/[0.05]' : 'bg-white/50'}`}>
                    <p className={`text-xs uppercase tracking-wide font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      MSP (Minimum Support Price)
                    </p>
                    <div className="flex items-baseline gap-1 mt-1">
                      <IndianRupee className={`w-5 h-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                      <span className={`text-2xl font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                        {formatPrice(msp)}
                      </span>
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>/quintal</span>
                    </div>
                    {currentPrice !== null && msp !== null && (
                      <p className={`text-xs mt-1 ${
                        currentPrice >= msp
                          ? isDark ? 'text-emerald-400' : 'text-emerald-600'
                          : isDark ? 'text-red-400' : 'text-red-600'
                      }`}>
                        {currentPrice >= msp
                          ? `${((currentPrice - msp) / msp * 100).toFixed(1)}% above MSP`
                          : `${((msp - currentPrice) / msp * 100).toFixed(1)}% below MSP`
                        }
                      </p>
                    )}
                  </div>
                )}

                {/* Predicted Range */}
                {predictedRange && (
                  <div className={`p-4 rounded-xl ${isDark ? 'bg-white/[0.05]' : 'bg-white/50'}`}>
                    <p className={`text-xs uppercase tracking-wide font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      Next Week Prediction
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Rs {formatPrice(predictedRange.min || predictedRange.low)}
                      </span>
                      <ArrowRight className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                      <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Rs {formatPrice(predictedRange.max || predictedRange.high)}
                      </span>
                    </div>
                    <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      per quintal
                    </p>
                  </div>
                )}
              </div>
            </div>
          </GlassCard>

          {/* Reasoning Section */}
          {reasons.length > 0 && (
            <GlassCard hover={false}>
              <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Why this signal?
              </h2>
              <ul className="space-y-3">
                {reasons.map((reason, index) => {
                  const reasonText = typeof reason === 'string' ? reason : reason.text || reason.message || reason.description || ''
                  const reasonType = typeof reason === 'object' ? (reason.type || reason.impact || 'info') : 'info'

                  const iconColor = reasonType === 'positive' || reasonType === 'bullish'
                    ? isDark ? 'text-emerald-400' : 'text-emerald-600'
                    : reasonType === 'negative' || reasonType === 'bearish'
                      ? isDark ? 'text-red-400' : 'text-red-600'
                      : isDark ? 'text-blue-400' : 'text-blue-600'

                  return (
                    <li key={index} className="flex items-start gap-3">
                      <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${
                        reasonType === 'positive' || reasonType === 'bullish'
                          ? 'bg-emerald-500'
                          : reasonType === 'negative' || reasonType === 'bearish'
                            ? 'bg-red-500'
                            : 'bg-blue-500'
                      }`} />
                      <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {reasonText}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </GlassCard>
          )}

          {/* Price History Chart */}
          {chartData.length > 0 && (
            <GlassCard hover={false}>
              <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Price History
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 11 }}
                    axisLine={{ stroke: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
                    tickLine={false}
                    angle={-35}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 12 }}
                    axisLine={{ stroke: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
                    tickLine={false}
                    tickFormatter={(val) => `Rs ${val}`}
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
                    formatter={(value) => [`Rs ${formatPrice(value)}/q`, 'Price']}
                  />
                  {msp !== null && (
                    <ReferenceLine
                      y={msp}
                      stroke={isDark ? '#10b981' : '#059669'}
                      strokeDasharray="8 4"
                      strokeWidth={1.5}
                      label={{
                        value: `MSP: Rs ${formatPrice(msp)}`,
                        fill: isDark ? '#10b981' : '#059669',
                        fontSize: 11,
                        position: 'insideTopRight',
                      }}
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke={isDark ? '#f97316' : '#ea580c'}
                    strokeWidth={2.5}
                    dot={{ fill: isDark ? '#f97316' : '#ea580c', strokeWidth: 0, r: 3 }}
                    activeDot={{
                      fill: isDark ? '#f97316' : '#ea580c',
                      strokeWidth: 2,
                      stroke: isDark ? '#0f172a' : '#ffffff',
                      r: 6,
                    }}
                    name="Price"
                  />
                </LineChart>
              </ResponsiveContainer>
            </GlassCard>
          )}

          {/* Mandi Price Table */}
          {priceHistory.length > 0 && (
            <GlassCard hover={false}>
              <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Recent Mandi Prices
              </h2>
              <div className="overflow-x-auto -mx-2">
                <table className="w-full min-w-[500px]">
                  <thead>
                    <tr className={`${isDark ? 'text-gray-400 border-white/10' : 'text-gray-500 border-gray-200'} border-b`}>
                      <th className="text-left text-xs font-semibold uppercase tracking-wide py-3 px-3">Date</th>
                      <th className="text-left text-xs font-semibold uppercase tracking-wide py-3 px-3">Mandi</th>
                      <th className="text-right text-xs font-semibold uppercase tracking-wide py-3 px-3">Price (Rs/q)</th>
                      <th className="text-right text-xs font-semibold uppercase tracking-wide py-3 px-3">Arrivals (tonnes)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {priceHistory.map((entry, index) => {
                      const entryPrice = entry.price || entry.modal_price || entry.modalPrice || '--'
                      const entryMandi = entry.mandi || entry.market || entry.apmc || '--'
                      const entryArrivals = entry.arrivals || entry.arrival || entry.quantity || '--'
                      const entryDate = formatDate(entry.date)

                      const priceAboveMsp = msp && entryPrice !== '--' && Number(entryPrice) >= msp
                      const priceBelowMsp = msp && entryPrice !== '--' && Number(entryPrice) < msp

                      return (
                        <tr
                          key={index}
                          className={`${isDark ? 'text-gray-300 border-white/5' : 'text-gray-700 border-gray-100'} border-b transition-colors duration-150 ${
                            isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-gray-50/50'
                          }`}
                        >
                          <td className="py-3 px-3 text-sm">{entryDate}</td>
                          <td className="py-3 px-3 text-sm font-medium">{entryMandi}</td>
                          <td className="py-3 px-3 text-sm text-right">
                            <span className={`font-semibold ${
                              priceAboveMsp
                                ? isDark ? 'text-emerald-400' : 'text-emerald-600'
                                : priceBelowMsp
                                  ? isDark ? 'text-red-400' : 'text-red-600'
                                  : isDark ? 'text-white' : 'text-gray-900'
                            }`}>
                              {entryPrice !== '--' ? `Rs ${formatPrice(entryPrice)}` : '--'}
                            </span>
                          </td>
                          <td className={`py-3 px-3 text-sm text-right ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {entryArrivals !== '--' ? Number(entryArrivals).toLocaleString('en-IN') : '--'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* MSP Legend */}
              {msp !== null && (
                <div className={`flex items-center gap-4 mt-4 pt-3 border-t text-xs ${isDark ? 'border-white/5 text-gray-500' : 'border-gray-100 text-gray-400'}`}>
                  <div className="flex items-center gap-1.5">
                    <span className={`inline-block w-3 h-3 rounded-sm ${isDark ? 'bg-emerald-500/30' : 'bg-emerald-100'}`} />
                    <span className={isDark ? 'text-emerald-400' : 'text-emerald-600'}>Above MSP</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`inline-block w-3 h-3 rounded-sm ${isDark ? 'bg-red-500/30' : 'bg-red-100'}`} />
                    <span className={isDark ? 'text-red-400' : 'text-red-600'}>Below MSP</span>
                  </div>
                  <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>
                    MSP: Rs {formatPrice(msp)}/quintal
                  </span>
                </div>
              )}
            </GlassCard>
          )}
        </div>
      )}

      {/* Empty State - Before any search */}
      {!data && !loading && !error && (
        <GlassCard hover={false}>
          <div className="text-center py-12 space-y-4">
            <BarChart3 className={`w-16 h-16 mx-auto ${isDark ? 'text-orange-400/40' : 'text-orange-300'}`} />
            <div>
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Get Market Intelligence
              </h3>
              <p className={`text-sm mt-1 max-w-md mx-auto ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Enter your crop and state to get AI-powered buy/sell signals,
                mandi price analysis, and market trend predictions.
              </p>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  )
}
