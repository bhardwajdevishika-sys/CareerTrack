import api from './api'

export const getResumes = () =>
  api.get('/resume').then((response) => response.data)

export const uploadResume = (formData) =>
  api.post('/resume', formData).then((response) => response.data)

export const analyzeResume = (id) =>
  api.post(`/resume/${id}/analyze`).then((response) => response.data)

export const deleteResume = (id) =>
  api.delete(`/resume/${id}`).then((response) => response.data)

export const downloadResume = async (id, fileName) => {
  const response = await api.get(`/resume/${id}/download`, {
    responseType: 'blob'
  })

  const url = window.URL.createObjectURL(response.data)
  const link = document.createElement('a')

  link.href = url
  link.download = fileName

  document.body.appendChild(link)
  link.click()
  link.remove()

  window.URL.revokeObjectURL(url)
}