import api from './api'

export const getProblems = async (filters = {}) => (await api.get('/problems', { params: filters })).data
export const createProblem = async (data) => (await api.post('/problems', data)).data
export const updateProblem = async (id, data) => (await api.put(`/problems/${id}`, data)).data
export const deleteProblem = async (id) => (await api.delete(`/problems/${id}`)).data
