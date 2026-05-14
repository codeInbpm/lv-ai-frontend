import { http } from '../utils/request'
import type { TravelPlan, PageResult } from './plan'

export const profileApi = {
  /** 我的收藏 */
  getCollections: (params?: { page?: number; size?: number }) =>
    http.get<PageResult<TravelPlan>>('/profile/collections', params),
  /** 我的足迹 */
  getFootprints: () => http.get<any[]>('/profile/footprints'),
  /** 旅行统计 */
  getStats: () => http.get<{ totalPlans: number; completedPlans: number; ongoingPlans: number; notesCount: number }>('/profile/stats')
}
