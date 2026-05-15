import { http } from '../utils/request'

export interface CommunityStats {
  followingCount: number
  followersCount: number
  likesAndFavsCount: number
}

export const communityApi = {
  /**
   * 获取社区统计数据
   */
  getStats() {
    return http.get<CommunityStats>('/community/stats')
  },
  
  /**
   * 获取用户收藏列表
   */
  getCollections(type: number) {
    return http.get<any[]>(`/community/collections/${type}`)
  },
  
  /**
   * 获取用户浏览历史
   */
  getHistory() {
    return http.get<any[]>('/community/history')
  },

  /**
   * 获取用户草稿箱
   */
  getDrafts() {
    return http.get<any[]>('/community/drafts')
  }
}
