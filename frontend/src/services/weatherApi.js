import api from './api'

export const weatherApi = {
  getForecast: (lat, lon) => api.get('/weather/forecast', { params: { lat, lon } }),
  getTips: (lat, lon) => api.get('/weather/tips', { params: { lat, lon } }),
}
