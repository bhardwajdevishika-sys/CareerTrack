import api from './api'

export const getInterviews = (filters = {}) => api.get('/interviews', { params: filters }).then((response) => response.data)
export const createInterview = (payload) => api.post('/interviews', payload).then((response) => response.data)
export const updateInterview = (id, payload) => api.put(`/interviews/${id}`, payload).then((response) => response.data)
export const deleteInterview = (id) => api.delete(`/interviews/${id}`).then((response) => response.data)
