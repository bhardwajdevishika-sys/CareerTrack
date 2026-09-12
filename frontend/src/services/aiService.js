import api from './api'

export const chatWithAI = async (message, type = 'chat') => (await api.post('/ai/chat', { message, type })).data
export const getAIInsight = async (type) => (await api.get(`/ai/insight/${type}`)).data
