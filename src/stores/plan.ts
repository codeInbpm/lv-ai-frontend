import { defineStore } from 'pinia'
import { ref } from 'vue'
import { planApi, type CreatePlanDTO, type PlanDetailVO, type TravelPlan } from '../api/plan'

export interface PlanExecutionRecord {
  id: number
  planId: number
  userId: number
  type: number
  itemId?: number
  dayId?: number
  content?: string
  amount?: number
  costType?: number
  images?: string[]
  locationName?: string
  createTime: string
}

export const usePlanStore = defineStore('plan', () => {
  const currentPlan = ref<PlanDetailVO | null>(null)
  const myPlans = ref<TravelPlan[]>([])
  const loading = ref(false)

  /** AI生成行程 */
  async function createPlan(dto: CreatePlanDTO): Promise<PlanDetailVO> {
    loading.value = true
    try {
      const result = await planApi.createPlan(dto)
      currentPlan.value = result
      return result
    } finally {
      loading.value = false
    }
  }

  /** 获取行程详情 */
  async function fetchPlanDetail(planId: number): Promise<PlanDetailVO> {
    const result = await planApi.getPlanDetail(planId)
    currentPlan.value = result
    return result
  }

  /** 获取我的行程列表 */
  async function fetchMyPlans(status?: number) {
    const result = await planApi.getMyPlans({ status, size: 20 })
    myPlans.value = result.records
    return result
  }

  /** 清空当前行程 */
  function clearCurrentPlan() {
    currentPlan.value = null
  }

  return {
    currentPlan,
    myPlans,
    loading,
    createPlan,
    fetchPlanDetail,
    fetchMyPlans,
    clearCurrentPlan
  }
})
