import { useState } from 'react'
import { User, Save, Trash2, CheckCircle } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useFarmer } from '../context/FarmerContext'
import GlassCard from '../components/ui/GlassCard'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Alert from '../components/ui/Alert'
import {
  INDIAN_STATES,
  SOIL_TYPES,
  IRRIGATION_TYPES,
  INCOME_CATEGORIES,
} from '../utils/constants'

const initialFormState = {
  name: '',
  phone: '',
  state: '',
  district: '',
  village: '',
  landSize: '',
  soilType: '',
  primaryCrop: '',
  irrigationType: '',
  incomeCategory: '',
}

export default function FarmerProfile() {
  const { isDark } = useTheme()
  const { farmer, setFarmer, clearFarmer } = useFarmer()

  const [form, setForm] = useState(() => {
    if (farmer) {
      return {
        name: farmer.name || '',
        phone: farmer.phone || '',
        state: farmer.state || '',
        district: farmer.district || '',
        village: farmer.village || '',
        landSize: farmer.landSize || '',
        soilType: farmer.soilType || '',
        primaryCrop: farmer.primaryCrop || '',
        irrigationType: farmer.irrigationType || '',
        incomeCategory: farmer.incomeCategory || '',
      }
    }
    return { ...initialFormState }
  })

  const [errors, setErrors] = useState({})
  const [successMsg, setSuccessMsg] = useState('')

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
    if (successMsg) setSuccessMsg('')
  }

  const validate = () => {
    const newErrors = {}
    if (!form.name.trim()) {
      newErrors.name = 'Name is required'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return

    const profileData = {
      ...form,
      landSize: form.landSize ? parseFloat(form.landSize) : null,
    }

    setFarmer(profileData)
    setSuccessMsg('Profile saved successfully!')
    setTimeout(() => setSuccessMsg(''), 4000)
  }

  const handleClear = () => {
    clearFarmer()
    setForm({ ...initialFormState })
    setErrors({})
    setSuccessMsg('')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded-xl ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
          <User className={`w-6 h-6 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
        </div>
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            My Farm Profile
          </h1>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Set up your profile for personalized recommendations
          </p>
        </div>
      </div>

      {/* Success Message */}
      {successMsg && (
        <Alert type="success">
          <span className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            {successMsg}
          </span>
        </Alert>
      )}

      {/* Profile Form */}
      <GlassCard hover={false}>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Personal Info Section */}
          <div>
            <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Personal Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Name *"
                placeholder="Enter your name"
                value={form.name}
                onChange={handleChange('name')}
                error={errors.name}
              />
              <Input
                label="Phone"
                type="tel"
                placeholder="Enter phone number"
                value={form.phone}
                onChange={handleChange('phone')}
              />
            </div>
          </div>

          {/* Location Section */}
          <div>
            <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Location
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="State"
                options={INDIAN_STATES}
                placeholder="Select your state"
                value={form.state}
                onChange={handleChange('state')}
              />
              <Input
                label="District"
                placeholder="Enter district"
                value={form.district}
                onChange={handleChange('district')}
              />
              <Input
                label="Village"
                placeholder="Enter village name"
                value={form.village}
                onChange={handleChange('village')}
                className="sm:col-span-2"
              />
            </div>
          </div>

          {/* Farm Details Section */}
          <div>
            <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Farm Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Land Size (Hectares)"
                type="number"
                placeholder="e.g. 2.5"
                min="0"
                step="0.1"
                value={form.landSize}
                onChange={handleChange('landSize')}
              />
              <Select
                label="Soil Type"
                options={SOIL_TYPES}
                placeholder="Select soil type"
                value={form.soilType}
                onChange={handleChange('soilType')}
              />
              <Input
                label="Primary Crop"
                placeholder="e.g. Rice, Wheat, Cotton"
                value={form.primaryCrop}
                onChange={handleChange('primaryCrop')}
              />
              <Select
                label="Irrigation Type"
                options={IRRIGATION_TYPES}
                placeholder="Select irrigation type"
                value={form.irrigationType}
                onChange={handleChange('irrigationType')}
              />
              <Select
                label="Income Category"
                options={INCOME_CATEGORIES}
                placeholder="Select category"
                value={form.incomeCategory}
                onChange={handleChange('incomeCategory')}
                className="sm:col-span-2"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className={`flex flex-col sm:flex-row gap-3 pt-4 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
            <Button type="submit" size="lg" className="flex-1 sm:flex-none">
              <Save className="w-4 h-4" />
              Save Profile
            </Button>
            {farmer && (
              <Button
                type="button"
                variant="danger"
                size="lg"
                onClick={handleClear}
                className="flex-1 sm:flex-none"
              >
                <Trash2 className="w-4 h-4" />
                Clear Profile
              </Button>
            )}
          </div>
        </form>
      </GlassCard>
    </div>
  )
}
