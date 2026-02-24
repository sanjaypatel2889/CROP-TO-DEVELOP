export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
]

export const SOIL_TYPES = [
  'Alluvial', 'Black', 'Red', 'Laterite', 'Desert', 'Forest', 'Peaty', 'Saline',
]

export const IRRIGATION_TYPES = [
  { value: 'rainfed', label: 'Rainfed' },
  { value: 'canal', label: 'Canal' },
  { value: 'tubewell', label: 'Tubewell / Borewell' },
  { value: 'drip', label: 'Drip Irrigation' },
  { value: 'sprinkler', label: 'Sprinkler' },
]

export const INCOME_CATEGORIES = [
  { value: 'marginal', label: 'Marginal (< 1 ha)' },
  { value: 'small', label: 'Small (1-2 ha)' },
  { value: 'medium', label: 'Medium (2-10 ha)' },
  { value: 'large', label: 'Large (> 10 ha)' },
]

export const CROP_SEASONS = [
  { value: 'kharif', label: 'Kharif (Jun-Oct)' },
  { value: 'rabi', label: 'Rabi (Nov-Mar)' },
  { value: 'zaid', label: 'Zaid (Mar-Jun)' },
]

export const AFFECTED_PARTS = [
  { value: 'leaf', label: 'Leaf', emoji: '🍃' },
  { value: 'stem', label: 'Stem', emoji: '🌿' },
  { value: 'root', label: 'Root', emoji: '🌱' },
  { value: 'fruit', label: 'Fruit', emoji: '🍎' },
  { value: 'whole_plant', label: 'Whole Plant', emoji: '🌾' },
]

export const SPOT_COLORS = [
  { value: 'brown', label: 'Brown', hex: '#8B4513' },
  { value: 'yellow', label: 'Yellow', hex: '#FFD700' },
  { value: 'black', label: 'Black', hex: '#333333' },
  { value: 'white', label: 'White', hex: '#F5F5F5' },
  { value: 'orange', label: 'Orange', hex: '#FF8C00' },
  { value: 'red', label: 'Red', hex: '#DC143C' },
  { value: 'gray', label: 'Gray', hex: '#808080' },
]

export const SPOT_SHAPES = [
  { value: 'circular', label: 'Circular' },
  { value: 'irregular', label: 'Irregular' },
  { value: 'streaks', label: 'Streaks / Lines' },
  { value: 'rings', label: 'Ring-shaped' },
  { value: 'diamond', label: 'Diamond' },
  { value: 'elliptical', label: 'Elliptical / Oval' },
]

export const WEATHER_CONDITIONS = [
  { value: 'humid', label: 'Hot & Humid' },
  { value: 'rainy', label: 'Rainy / Wet' },
  { value: 'dry', label: 'Dry / Arid' },
  { value: 'cold', label: 'Cold / Winter' },
]

export const SCHEME_TYPES = [
  { value: 'financial_support', label: 'Financial Support' },
  { value: 'insurance', label: 'Crop Insurance' },
  { value: 'credit', label: 'Credit / Loans' },
  { value: 'subsidy', label: 'Subsidies' },
  { value: 'infrastructure', label: 'Infrastructure' },
  { value: 'training', label: 'Training / Extension' },
]
