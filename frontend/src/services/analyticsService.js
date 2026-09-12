import api from './api'

export const getAnalytics = async () => (await api.get('/analytics')).data
