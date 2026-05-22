const CLIENT_ID = '967081932065-vksvb2dcocit0adk9vpbacfu5n7jgvs5.apps.googleusercontent.com'
const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly'
const TOKEN_KEY = 'meu_agente_google_token'

export interface CalendarEvent {
  id: string
  summary: string
  start: { dateTime?: string; date?: string }
  end: { dateTime?: string; date?: string }
  location?: string
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function clearToken(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(TOKEN_KEY)
}

export function initTokenClient(
  onSuccess: (token: string) => void,
  onError: () => void
) {
  const g = (window as any).google
  if (!g?.accounts?.oauth2) return null
  return g.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: (response: any) => {
      if (response.error || !response.access_token) { onError(); return }
      localStorage.setItem(TOKEN_KEY, response.access_token)
      onSuccess(response.access_token)
    },
  })
}

export function revokeToken(): void {
  const token = getStoredToken()
  const g = (window as any).google
  if (token && g) g.accounts.oauth2.revoke(token, () => {})
  clearToken()
}

export async function fetchTodayEvents(token: string): Promise<CalendarEvent[]> {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

  const params = new URLSearchParams({
    timeMin: start.toISOString(),
    timeMax: end.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '15',
  })

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )

  if (res.status === 401) { clearToken(); throw new Error('token_expired') }
  if (!res.ok) throw new Error('fetch_failed')

  const data = await res.json()
  return (data.items || []) as CalendarEvent[]
}

export function formatEventTime(event: CalendarEvent): string {
  if (event.start.date && !event.start.dateTime) return 'Dia todo'
  if (!event.start.dateTime) return ''
  const fmt = (d: Date) => d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
  const start = new Date(event.start.dateTime)
  const end = event.end.dateTime ? new Date(event.end.dateTime) : null
  return end ? `${fmt(start)} – ${fmt(end)}` : fmt(start)
}

export function isEventNow(event: CalendarEvent): boolean {
  if (!event.start.dateTime || !event.end.dateTime) return false
  const now = Date.now()
  return new Date(event.start.dateTime).getTime() <= now && new Date(event.end.dateTime).getTime() >= now
}

export function isEventSoon(event: CalendarEvent): boolean {
  if (!event.start.dateTime) return false
  const diff = (new Date(event.start.dateTime).getTime() - Date.now()) / 60000
  return diff > 0 && diff <= 30
}

export async function fetchWeekEvents(token: string): Promise<CalendarEvent[]> {
  const now = new Date()
  const day = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1))
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)

  const params = new URLSearchParams({
    timeMin: monday.toISOString(),
    timeMax: sunday.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '50',
  })

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )

  if (res.status === 401) { clearToken(); throw new Error('token_expired') }
  if (!res.ok) throw new Error('fetch_failed')
  const data = await res.json()
  return (data.items || []) as CalendarEvent[]
}

export function getWeekDays(): Date[] {
  const now = new Date()
  const day = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1))
  monday.setHours(0, 0, 0, 0)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

export function getEventDateKey(event: CalendarEvent): string {
  const s = event.start.dateTime || event.start.date || ''
  return s.split('T')[0]
}

export function isoDateKey(d: Date): string {
  return d.toISOString().split('T')[0]
}
