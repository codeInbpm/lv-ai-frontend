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
  getHotDestinations: () => http.get<HotDestination[]>('/discover/hot')
}
