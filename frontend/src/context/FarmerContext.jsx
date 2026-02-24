import { createContext, useState, useEffect, useContext } from 'react'

const FarmerContext = createContext(null)

export function FarmerProvider({ children }) {
  const [farmer, setFarmer] = useState(() => {
    try {
      const saved = localStorage.getItem('kisanai_farmer')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    if (farmer) {
      localStorage.setItem('kisanai_farmer', JSON.stringify(farmer))
    }
  }, [farmer])

  const updateFarmer = (data) => setFarmer(prev => ({ ...prev, ...data }))

  const clearFarmer = () => {
    localStorage.removeItem('kisanai_farmer')
    setFarmer(null)
  }

  return (
    <FarmerContext.Provider value={{ farmer, setFarmer, updateFarmer, clearFarmer }}>
      {children}
    </FarmerContext.Provider>
  )
}

export const useFarmer = () => {
  const context = useContext(FarmerContext)
  if (!context) throw new Error('useFarmer must be used within FarmerProvider')
  return context
}
