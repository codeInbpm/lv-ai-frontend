import { http } from '../utils/request'

export interface CreatePlanDTO {
  departure: string
  departureLng?: number
  departureLat?: number
  destination: string
  destinationLng?: number
  destinationLat?: number
  startDate: string
  days: number
  budget?: number
  peopleCount?: number
  preferences?: string[]
  extraNote?: string
}

export interface TravelItem {
  id: number
  dayId: number
  planId: number
  sortOrder: number
  type: number
  name: string
  address: string
  lng?: number
  lat?: number
  startTime?: string
  endTime?: string
  duration?: number
  estimatedCost?: number
  actualCost?: number
  description?: string
  tips?: string
  checkedIn: number
  checkInTime?: string
  checkInNote?: string
}

export interface TravelDay {
  id: number
  planId: number
  dayIndex: number
  date: string
  title: string
  description?: string
  weather?: string
  mood?: string
  diary?: string
  finished: number
}

export interface TravelPlan {
  id: number
  userId: number
  title: string
  coverImage?: string
  departure: string
  destination: string
  startDate: string
  endDate: string
  days: number
  budget?: number
  actualCost?: number
  preferences?: string
  peopleCount?: number
  description?: string
  status: number
  isPublic: number
  viewCount: number
  collectCount: number
  createTime: string
}

export interface DayWithItems {
  day: TravelDay
  items: TravelItem[]
}

export interface PlanDetailVO {
  plan: TravelPlan
  days: DayWithItems[]
}

export interface PageResult<T> {
  records: T[]
  total: number
  size: number
  current: number
  pages: number
}

export const planApi = {
  /** AI生成行程 */
  createPlan: (data: CreatePlanDTO) => http.post<PlanDetailVO>('/plan/create', data, true),
  /** 获取行程详情 */
  getPlanDetail: (planId: number) => http.get<PlanDetailVO>(`/plan/${planId}`),
  /** 我的行程列表 */
  getMyPlans: (params?: { status?: number; page?: number; size?: number }) =>
    http.get<PageResult<TravelPlan>>('/plan/list', params),
  /** 更新行程 */
  updatePlan: (planId: number, data: Partial<TravelPlan>) =>
    http.put<TravelPlan>(`/plan/${planId}`, data),
  /** 删除行程 */
  deletePlan: (planId: number) => http.del(`/plan/${planId}`),
  /** 更新行程状态 */
  updatePlanStatus: (planId: number, status: number) =>
    http.put(`/plan/${planId}/status`, null),
  /** 收藏/取消收藏 */
  toggleCollect: (planId: number) => http.post<boolean>(`/plan/${planId}/collect`)
}
