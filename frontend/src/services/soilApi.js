import api from './api'

export const soilApi = {
  getTypes: () => api.get('/soil/types'),
  getTypeByName: (name) => api.get(`/soil/types/${name}`),
  analyze: (data) => api.post('/soil/analyze', data),
  saveTest: (data) => api.post('/soil/tests', data),
  getTests: (farmerId) => api.get(`/soil/tests/${farmerId}`),
}
