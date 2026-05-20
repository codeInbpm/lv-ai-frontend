import { http } from '../utils/request'

export const destinationApi = {
  /**
   * 收藏/取消收藏目的地
   */
  toggleCollect: (id: string | number) =>
    http.post<boolean>(`/destination/interaction/${id}/collect`),

  /**
   * 获取当前目的地/景区收藏状态
   */
  getInteractionStatus: (id: string | number) =>
    http.get<{ hasLiked: boolean; hasCollected: boolean }>(`/destination/interaction/${id}/status`)
}
