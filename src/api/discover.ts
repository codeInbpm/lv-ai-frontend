import { http } from '../utils/request'
import type { TravelPlan, PageResult } from './plan'

export interface HotDestination {
  name: string
  image: string
  desc: string
}

export const discoverApi = {
  /** 公开行程列表 */
  getPublicPlans: (params?: { keyword?: string; destination?: string; page?: number; size?: number }) =>
    http.get<PageResult<TravelPlan>>('/discover/list', params),
  /** 热门目的地 */
  getHotDestinations: () => http.get<HotDestination[]>('/discover/hot'),
  /** 精选攻略列表 */
  getStrategies: (params?: { source?: string; keyword?: string; page?: number; size?: number }) =>
    http.get<any>('/strategy/list', params)
}
