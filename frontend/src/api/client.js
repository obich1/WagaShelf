// Talking to the WagaShelf API (the FastAPI backend).
import { useCallback } from 'react'

import { useSession } from '../auth'
import { API_URL } from '../config'

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

// Turn FastAPI's error bodies into one readable sentence.
function messageFrom(status, body) {
  if (typeof body?.detail === 'string') return body.detail
  if (Array.isArray(body?.detail)) return 'Some of the details entered aren\'t valid.'
  if (status >= 500) return 'Something went wrong on the server. Please try again.'
  return `Request failed (${status}).`
}

export async function request(path, { method = 'GET', body, token, params } = {}) {
  const url = new URL(API_URL + path)
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value)
  })

  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  let response
  try {
    response = await fetch(url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })
  } catch {
    // fetch only throws when the server can't be reached at all (offline, server down, CORS).
    throw new ApiError("Can't reach WagaShelf right now. Check your connection and try again.", 0)
  }

  if (response.status === 204) return null
  const data = await response.json().catch(() => null)
  if (!response.ok) throw new ApiError(messageFrom(response.status, data), response.status)
  return data
}

// A request function that adds the signed-in user's Clerk token automatically.
export function useApi() {
  const { getToken } = useSession()
  return useCallback(
    async (path, options = {}) => request(path, { ...options, token: await getToken() }),
    [getToken],
  )
}
