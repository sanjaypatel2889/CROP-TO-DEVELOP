import api from './api'

export const diseaseApi = {
  detect: (formData) => api.post('/diseases/detect', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  list: (params) => api.get('/diseases/list', { params }),
  getById: (id) => api.get(`/diseases/${id}`),
}
