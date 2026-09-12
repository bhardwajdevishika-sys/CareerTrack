import api from './api'

export const getSQLProblems = async (filters = {}) => (await api.get('/sql', { params: filters })).data
export const createSQLProblem = async (data) => (await api.post('/sql', data)).data
export const updateSQLProblem = async (id, data) => (await api.put(`/sql/${id}`, data)).data
export const deleteSQLProblem = async (id) => (await api.delete(`/sql/${id}`)).data
