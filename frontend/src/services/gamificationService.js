import api from './api'

export const getGamificationStatus = async () => (await api.get('/gamification/status')).data
export const getXPHistory = async () => (await api.get('/gamification/xp-history')).data
export const claimDailyReward = async () => (await api.post('/gamification/daily-reward')).data
export const getChallenges = async () => (await api.get('/gamification/challenges')).data
export const getAchievements = async () => (await api.get('/gamification/achievements')).data
export const buyStreakFreeze = async () => (await api.post('/gamification/freeze')).data
export const getLeaderboard = async (period = 'all') => (await api.get('/gamification/leaderboard', { params: { period } })).data
