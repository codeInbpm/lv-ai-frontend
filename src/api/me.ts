import { http } from '../utils/request'
import type { TravelPlan, PageResult } from './plan'

export interface FootprintStats {
  cityCount: number
  provinceCount: number
  totalFootprints: number
  checkinDays: number
}

export interface FootprintItem {
  id: number
  userId: number
  planId?: number
  itemId?: number
  locationName: string
  address?: string
  lat?: number
  lng?: number
  content?: string
  images?: string
  province?: string
  city?: string
  country?: string
  createTime: string
}

export interface FootprintResult {
  list: FootprintItem[]
  stats: FootprintStats
}

export interface CountryGroup {
  country: string
  cityCount: number
  footprintCount: number
}

export interface CityGroup {
  city: string
  country: string
  days: number
  footprintCount: number
  coverImages: string
  firstTime: string
}

export interface SettingsInfo {
  userId: number
  nickname: string
  avatar: string
  phone?: string
  gender?: number
}

export const meApi = {
  getTrips: (params?: { status?: number; page?: number; size?: number }) =>
    http.get<PageResult<TravelPlan>>('/me/trips', params),
  getSettings: () =>
    http.get<SettingsInfo>('/me/settings'),
  getFootprints: () =>
    http.get<FootprintResult>('/me/footprints'),
  getCountryGroups: () =>
    http.get<CountryGroup[]>('/me/footprints/countries'),
  getCityGroups: () =>
    http.get<CityGroup[]>('/me/footprints/cities'),
  addFootprint: (data: Partial<FootprintItem>) =>
    http.post<FootprintItem>('/footprint/add', data)
}
