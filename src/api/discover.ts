import { http } from '../utils/request'
import type { TravelPlan, PageResult } from './plan'

export interface HotDestination {
  id: number
  name: string
  imageUrl: string
  description: string
}

export const discoverApi = {
  /** 公开行程列表 */
  getPublicPlans: (params?: { keyword?: string; destination?: string; page?: number; size?: number }) =>
    http.get<PageResult<TravelPlan>>('/discover/list', params),
  /** 热门目的地 */
  getHotDestinations: (limit?: number) => http.get<HotDestination[]>('/world/destinations/hot', { limit }),
  /** 精选攻略列表 */
  getStrategies: (params?: { source?: string; keyword?: string; page?: number; size?: number }) =>
    http.get<any>('/strategy/list', params)
}
