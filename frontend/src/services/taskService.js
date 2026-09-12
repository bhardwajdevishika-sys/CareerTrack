import api from './api'

export const getTasks = async (filters = {}) => (await api.get('/tasks', { params: filters })).data
export const createTask = async (data) => (await api.post('/tasks', data)).data
export const updateTask = async (id, data) => (await api.put(`/tasks/${id}`, data)).data
export const deleteTask = async (id) => (await api.delete(`/tasks/${id}`)).data
