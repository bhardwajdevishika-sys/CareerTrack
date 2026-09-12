import api from './api'

export const getApplications = async (filters = {}) => (await api.get('/jobs', { params: filters })).data
export const createApplication = async (data) => (await api.post('/jobs', data)).data
export const updateApplication = async (id, data) => (await api.put(`/jobs/${id}`, data)).data
export const deleteApplication = async (id) => (await api.delete(`/jobs/${id}`)).data
