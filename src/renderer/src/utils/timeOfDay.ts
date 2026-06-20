export type ClockState = 'sunrise' | 'day' | 'sunset' | 'night'

export type WeatherState = 'clear' | 'cloudy' | 'rain' | 'thunderstorm'

/**
 * Maps WMO weather interpretation codes (used by Open-Meteo) to our four states.
 * https://open-meteo.com/en/docs#weathervariables
 *   0–1   → clear
 *   2–3, 45, 48 → cloudy
 *   51–67, 80–82 → rain
 *   95–99 → thunderstorm
 */
export function getWeatherState(wmoCode: number): WeatherState {
  if (wmoCode <= 1) return 'clear'
  if (wmoCode <= 48) return 'cloudy'
  if (wmoCode <= 82) return 'rain'
  return 'thunderstorm'
}

export function getClockState(date: Date): ClockState {
  const hour = date.getHours()
  const minute = date.getMinutes()
  const totalMinutes = hour * 60 + minute

  if (totalMinutes >= 5 * 60 && totalMinutes < 8 * 60) return 'sunrise'
  if (totalMinutes >= 8 * 60 && totalMinutes < 18 * 60) return 'day'
  if (totalMinutes >= 18 * 60 && totalMinutes < 20 * 60) return 'sunset'
  return 'night'
}

export function formatTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

export function formatDate(date: Date): string {
  const day = date.getDate()
  const suffix = getDaySuffix(day)
  const month = date.toLocaleDateString('en-GB', { month: 'long' })
  return `${day}${suffix} ${month}`
}

export function formatDay(date: Date): string {
  return date.toLocaleDateString('en-GB', { weekday: 'long' })
}

function getDaySuffix(day: number): string {
  if (day >= 11 && day <= 13) return 'th'
  switch (day % 10) {
    case 1:
      return 'st'
    case 2:
      return 'nd'
    case 3:
      return 'rd'
    default:
      return 'th'
  }
}
