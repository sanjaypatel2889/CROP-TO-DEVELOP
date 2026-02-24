import api from './api'

export const pestApi = {
  predict: (params) => api.get('/pests/predict', { params }),
  list: () => api.get('/pests/list'),
  getById: (id) => api.get(`/pests/${id}`),
}
