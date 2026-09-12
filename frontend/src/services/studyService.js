import api from './api'

export const getSessions = async (filters = {}) => (await api.get('/study', { params: filters })).data
export const getStudyStats = async () => (await api.get('/study/stats')).data
export const createSession = async (data) => (await api.post('/study', data)).data
export const deleteSession = async (id) => (await api.delete(`/study/${id}`)).data
