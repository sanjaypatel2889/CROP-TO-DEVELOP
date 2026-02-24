import api from './api'

export const marketApi = {
  getPrices: (crop, state) => api.get('/market/prices', { params: { crop, state } }),
  getSignal: (crop, state) => api.get('/market/signal', { params: { crop, state } }),
  getHistory: (crop, state) => api.get('/market/history', { params: { crop, state } }),
}
