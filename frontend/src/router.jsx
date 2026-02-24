import { createBrowserRouter } from 'react-router-dom'
import App from './App'
import Dashboard from './pages/Dashboard'
import DiseaseDetector from './pages/DiseaseDetector'
import WeatherAlerts from './pages/WeatherAlerts'
import MarketPrices from './pages/MarketPrices'
import SoilHealth from './pages/SoilHealth'
import PestWarning from './pages/PestWarning'
import SchemesFinder from './pages/SchemesFinder'
import FarmerProfile from './pages/FarmerProfile'
import NotFound from './pages/NotFound'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <NotFound />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'disease-detector', element: <DiseaseDetector /> },
      { path: 'weather', element: <WeatherAlerts /> },
      { path: 'market', element: <MarketPrices /> },
      { path: 'soil', element: <SoilHealth /> },
      { path: 'pest-warning', element: <PestWarning /> },
      { path: 'schemes', element: <SchemesFinder /> },
      { path: 'profile', element: <FarmerProfile /> },
    ],
  },
])
