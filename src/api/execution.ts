import { http } from '../utils/request'
import type { PlanExecutionRecord } from '../stores/plan'

export interface CheckInDTO {
  planId: number
  dayId?: number
  itemId?: number
  type: number
  content?: string
  amount?: number
  costType?: number
  images?: string[]
  locationName?: string
  lng?: number
  lat?: number
}

export const executionApi = {
  /** 打卡/记账/日记 */
  checkIn: (data: CheckInDTO) => http.post<PlanExecutionRecord>('/execution/check-in', data),
  /** 获取执行记录 */
  getRecords: (planId: number) => http.get<PlanExecutionRecord[]>(`/execution/records/${planId}`),
  /** 费用统计 */
  getStats: (planId: number) => http.get(`/execution/stats/${planId}`)
}
