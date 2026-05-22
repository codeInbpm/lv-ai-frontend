import { http } from '../utils/request'

export const historyApi = {
  /**
   * 获取浏览历史列表
   */
  getList(userId: number, page: number, size: number) {
    return http.get<any>(`/history/list?userId=${userId}&page=${page}&size=${size}`)
  },
  
  /**
   * 增加浏览历史
   */
  add(data: { userId: number; targetType: number; targetId: number; title: string; coverUrl?: string }) {
    return http.post('/history/add', data)
  },
  
  /**
   * 清空全部浏览历史
   */
  clearAll(userId: number) {
    return http.post('/history/clear', { userId })
  },
  
  /**
   * 清空单条浏览历史
   */
  clearTarget(userId: number, targetType: number, targetId: number) {
    return http.post('/history/clear/target', { userId, targetType, targetId })
  }
}
