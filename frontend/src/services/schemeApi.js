import api from './api'

export const schemeApi = {
  match: (profile) => api.post('/schemes/match', profile),
  list: (params) => api.get('/schemes/list', { params }),
  getById: (id) => api.get(`/schemes/${id}`),
}
