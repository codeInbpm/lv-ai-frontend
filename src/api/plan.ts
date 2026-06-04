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
  drivingPolicy?: string
  plateNumber?: string
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

export interface AiPlanModifyDTO {
  planId: number
  dayId: number
  message: string
  sessionId: string
}

export interface AiPlanModifyResultVO {
  explanation: string
  success: boolean
  affectedDayId?: number
}

export interface PageResult<T> {
  records: T[]
  total: number
  size: number
  current: number
  pages: number
}

export const planApi = {
  /** AI生成行程 (等待时间较长，设置2分钟超时) */
  createPlan: (data: CreatePlanDTO) => http.post<PlanDetailVO>('/plan/create', data, true, 120000),
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
    http.put(`/plan/${planId}/status`, null, false, undefined, { status }),
  /** 收藏/取消收藏 */
  toggleCollect: (planId: number) => http.post<boolean>(`/plan/${planId}/collect`),
  
  /** 添加行程明细项 */
  addPlanItem: (data: Partial<TravelItem>) => http.post<TravelItem>('/plan/item', data),
  /** 修改行程明细项 */
  updatePlanItem: (itemId: number, data: Partial<TravelItem>) => http.put<TravelItem>(`/plan/item/${itemId}`, data),
  /** 删除行程明细项 */
  deletePlanItem: (itemId: number) => http.del(`/plan/item/${itemId}`),
  /** 批量重排行程项 */
  sortPlanItems: (itemIds: number[]) => http.put<void>('/plan/items/sort', itemIds),
  
  /** 修改每日行程的主题描述 */
  updatePlanDay: (dayId: number, data: Partial<TravelDay>) => http.put<TravelDay>(`/plan/day/${dayId}`, data),
  /** 为行程增加一天 */
  addPlanDay: (planId: number) => http.post<TravelDay>('/plan/day', null, false, undefined, { planId }),
  /** 删除行程的一天 */
  deletePlanDay: (dayId: number) => http.del<void>(`/plan/day/${dayId}`),
  /** AI 对话式增量修改行程细项 */
  aiPlanModify: (data: AiPlanModifyDTO) => http.post<AiPlanModifyResultVO>('/ai/plan/modify', data),
  /** 安全拉取腾讯地图开发者Key */
  getMapKey: () => http.get<string>('/map/key'),
  /** 原子拉取行程明细项详情 */
  getPlanItemDetail: (itemId: number) => http.get<TravelItem>(`/plan/item/${itemId}`),
  /** 获取打卡AI建议 */
  getCheckinAiSuggest: (itemId: number, userInput?: string) =>
    http.post<any>(`/plan/checkin/ai-suggest?itemId=${itemId}&userInput=${encodeURIComponent(userInput || '')}`),
  /** 生成今日行程与记账的AI总结 */
  getDailySummary: (planId: number, dayId: number) =>
    http.post<any>(`/plan/checkin/daily-summary?planId=${planId}&dayId=${dayId}`)
}
