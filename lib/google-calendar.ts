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
