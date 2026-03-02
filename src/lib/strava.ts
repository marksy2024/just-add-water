const STRAVA_API = 'https://www.strava.com/api/v3'
const STRAVA_OAUTH = 'https://www.strava.com/oauth'

interface StravaTokens {
  access_token: string
  refresh_token: string
  expires_at: number
  athlete: {
    id: number
    firstname: string
    lastname: string
  }
}

interface StravaActivity {
  id: number
  name: string
  type: string
  sport_type: string
  start_date: string
  distance: number // meters
  moving_time: number // seconds
  elapsed_time: number
  start_latlng: [number, number] | null
  end_latlng: [number, number] | null
  map: {
    summary_polyline: string
  }
}

/**
 * Generate Strava OAuth authorization URL
 */
export function getStravaAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/strava/callback`,
    response_type: 'code',
    scope: 'activity:read_all',
    approval_prompt: 'auto',
  })
  return `${STRAVA_OAUTH}/authorize?${params}`
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeStravaCode(code: string): Promise<StravaTokens> {
  const res = await fetch(`${STRAVA_OAUTH}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Strava token exchange failed: ${err}`)
  }

  return res.json()
}

/**
 * Refresh an expired access token
 */
export async function refreshStravaToken(refreshToken: string): Promise<{
  access_token: string
  refresh_token: string
  expires_at: number
}> {
  const res = await fetch(`${STRAVA_OAUTH}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  if (!res.ok) {
    throw new Error('Strava token refresh failed')
  }

  return res.json()
}

/**
 * Fetch a Strava activity by ID
 */
export async function fetchStravaActivity(
  accessToken: string,
  activityId: number
): Promise<StravaActivity> {
  const res = await fetch(`${STRAVA_API}/activities/${activityId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch Strava activity ${activityId}`)
  }

  return res.json()
}

/**
 * Fetch recent activities from Strava (last 30 days, up to 30 activities)
 */
export async function fetchStravaActivities(
  accessToken: string,
  after?: number,
): Promise<StravaActivity[]> {
  const params = new URLSearchParams({
    per_page: '30',
  })
  if (after) params.set('after', after.toString())

  const res = await fetch(`${STRAVA_API}/athlete/activities?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!res.ok) {
    throw new Error('Failed to fetch Strava activities')
  }

  return res.json()
}

/**
 * Check if an activity type is a paddling activity
 */
export function isPaddlingActivity(type: string, sportType: string): boolean {
  const paddleTypes = ['kayaking', 'canoeing', 'standup_paddling', 'rowing']
  return paddleTypes.includes(type.toLowerCase()) || paddleTypes.includes(sportType.toLowerCase())
}
