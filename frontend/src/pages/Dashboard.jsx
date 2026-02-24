import { Link } from 'react-router-dom'
import { Bug, CloudSun, TrendingUp, FlaskConical, ShieldAlert, Landmark, User, MapPin, Sprout } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useFarmer } from '../context/FarmerContext'
import GlassCard from '../components/ui/GlassCard'
import Button from '../components/ui/Button'

const features = [
  {
    title: 'Disease Detector',
    path: '/disease-detector',
    icon: Bug,
    description: 'Upload symptoms & get AI diagnosis',
    color: 'emerald',
    iconBg: {
      dark: 'bg-emerald-500/20 text-emerald-400',
      light: 'bg-emerald-100 text-emerald-600',
    },
    border: {
      dark: 'group-hover:border-emerald-500/30',
      light: 'group-hover:border-emerald-300',
    },
  },
  {
    title: 'Weather Alerts',
    path: '/weather',
    icon: CloudSun,
    description: '7-day forecast with farming tips',
    color: 'blue',
    iconBg: {
      dark: 'bg-blue-500/20 text-blue-400',
      light: 'bg-blue-100 text-blue-600',
    },
    border: {
      dark: 'group-hover:border-blue-500/30',
      light: 'group-hover:border-blue-300',
    },
  },
  {
    title: 'Market Prices',
    path: '/market',
    icon: TrendingUp,
    description: 'Live mandi rates & buy/sell signals',
    color: 'orange',
    iconBg: {
      dark: 'bg-orange-500/20 text-orange-400',
      light: 'bg-orange-100 text-orange-600',
    },
    border: {
      dark: 'group-hover:border-orange-500/30',
      light: 'group-hover:border-orange-300',
    },
  },
  {
    title: 'Soil Health',
    path: '/soil',
    icon: FlaskConical,
    description: 'Analyze soil & get fertilizer plan',
    color: 'purple',
    iconBg: {
      dark: 'bg-purple-500/20 text-purple-400',
      light: 'bg-purple-100 text-purple-600',
    },
    border: {
      dark: 'group-hover:border-purple-500/30',
      light: 'group-hover:border-purple-300',
    },
  },
  {
    title: 'Pest Warning',
    path: '/pest-warning',
    icon: ShieldAlert,
    description: 'Early pest outbreak predictions',
    color: 'yellow',
    iconBg: {
      dark: 'bg-yellow-500/20 text-yellow-400',
      light: 'bg-yellow-100 text-yellow-600',
    },
    border: {
      dark: 'group-hover:border-yellow-500/30',
      light: 'group-hover:border-yellow-300',
    },
  },
  {
    title: 'Govt Schemes',
    path: '/schemes',
    icon: Landmark,
    description: 'Find matching subsidies & schemes',
    color: 'cyan',
    iconBg: {
      dark: 'bg-cyan-500/20 text-cyan-400',
      light: 'bg-cyan-100 text-cyan-600',
    },
    border: {
      dark: 'group-hover:border-cyan-500/30',
      light: 'group-hover:border-cyan-300',
    },
  },
]

export default function Dashboard() {
  const { isDark } = useTheme()
  const { farmer } = useFarmer()

  return (
    <div className="space-y-6">
      {/* Greeting Bar */}
      <GlassCard hover={false}>
        {farmer ? (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className={`text-2xl sm:text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Namaste, {farmer.name}!
              </h1>
              <div className="flex flex-wrap items-center gap-4 mt-2">
                {farmer.state && (
                  <span className={`inline-flex items-center gap-1.5 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    <MapPin className="w-4 h-4" />
                    {farmer.village ? `${farmer.village}, ` : ''}{farmer.district ? `${farmer.district}, ` : ''}{farmer.state}
                  </span>
                )}
                {farmer.primaryCrop && (
                  <span className={`inline-flex items-center gap-1.5 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    <Sprout className="w-4 h-4" />
                    {farmer.primaryCrop}
                  </span>
                )}
                {farmer.landSize && (
                  <span className={`inline-flex items-center gap-1.5 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {farmer.landSize} ha
                  </span>
                )}
              </div>
            </div>
            <Link to="/profile">
              <Button variant="ghost" size="sm">
                <User className="w-4 h-4" />
                Edit Profile
              </Button>
            </Link>
          </div>
        ) : (
          <div className="text-center py-4">
            <h1 className={`text-2xl sm:text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Welcome to KisanAI
            </h1>
            <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Your AI-powered farming companion for smarter agriculture
            </p>
          </div>
        )}
      </GlassCard>

      {/* Profile CTA if no farmer profile */}
      {!farmer && (
        <GlassCard hover={false} className={`border-2 ${isDark ? 'border-emerald-500/30' : 'border-emerald-400/40'}`}>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className={`p-3 rounded-xl ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
              <User className={`w-8 h-8 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Set Up Your Farm Profile
              </h2>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Get personalized recommendations based on your location, crop, and soil type.
              </p>
            </div>
            <Link to="/profile">
              <Button>Set Up Your Profile</Button>
            </Link>
          </div>
        </GlassCard>
      )}

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((feature) => {
          const Icon = feature.icon
          return (
            <Link key={feature.path} to={feature.path} className="group">
              <GlassCard className={`h-full ${isDark ? feature.border.dark : feature.border.light}`}>
                <div className="flex flex-col gap-3">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${isDark ? feature.iconBg.dark : feature.iconBg.light}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {feature.title}
                    </h3>
                    <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {feature.description}
                    </p>
                  </div>
                  <div className={`text-sm font-medium ${isDark ? `text-${feature.color}-400` : `text-${feature.color}-600`} group-hover:translate-x-1 transition-transform duration-200`}>
                    Explore &rarr;
                  </div>
                </div>
              </GlassCard>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
