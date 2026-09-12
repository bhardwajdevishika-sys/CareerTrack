import api from './api'

export const getGoals = async (filters = {}) => (await api.get('/goals', { params: filters })).data
export const createGoal = async (data) => (await api.post('/goals', data)).data
export const updateGoal = async (id, data) => (await api.put(`/goals/${id}`, data)).data
export const deleteGoal = async (id) => (await api.delete(`/goals/${id}`)).data
