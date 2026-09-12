import api from './api'

export const getTopics = async () => (await api.get('/topics')).data
export const createTopic = async (data) => (await api.post('/topics', data)).data
export const updateTopic = async (id, data) => (await api.put(`/topics/${id}`, data)).data
export const deleteTopic = async (id) => (await api.delete(`/topics/${id}`)).data
