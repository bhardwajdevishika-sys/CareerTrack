import api from './api'

export const getNotifications = () => api.get('/notifications').then((response) => response.data)
export const markNotificationRead = (id) => api.put(`/notifications/${id}/read`).then((response) => response.data)
export const markAllNotificationsRead = () => api.put('/notifications/read-all').then((response) => response.data)
