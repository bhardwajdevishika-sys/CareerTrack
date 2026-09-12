import api from './api'

export const submitGameResult = async (data) => (await api.post('/games/result', data)).data
export const getGameStats = async () => (await api.get('/games/stats')).data
