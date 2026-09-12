import api from './api'

export const getNotes = async (filters = {}) => (await api.get('/notes', { params: filters })).data
export const createNote = async (data) => (await api.post('/notes', data)).data
export const updateNote = async (id, data) => (await api.put(`/notes/${id}`, data)).data
export const deleteNote = async (id) => (await api.delete(`/notes/${id}`)).data
