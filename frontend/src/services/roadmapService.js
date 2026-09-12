import api from './api'

export const getRoadmaps = () => api.get('/roadmap').then((response) => response.data)
export const createRoadmap = (payload) => api.post('/roadmap', payload).then((response) => response.data)
export const updateRoadmap = (id, payload) => api.put(`/roadmap/${id}`, payload).then((response) => response.data)
export const deleteRoadmap = (id) => api.delete(`/roadmap/${id}`).then((response) => response.data)
export const toggleRoadmapItem = (roadmapId, itemId) => api.put(`/roadmap/${roadmapId}/items/${itemId}/toggle`).then((response) => response.data)
