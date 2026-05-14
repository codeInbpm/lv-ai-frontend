import { http } from '../utils/request'

export interface CommentVO {
  id: number
  content: string
  createTime: string
  userId: number
  nickname: string
  avatar: string
  parentId: number
}

export const strategyApi = {
  getDetail: (id: string | number) => http.get<any>(`/strategy/${id}/detail`),

  toggleLike: (id: string | number) => http.post<boolean>(`/strategy/interaction/${id}/like`),

  toggleCollect: (id: string | number) => http.post<boolean>(`/strategy/interaction/${id}/collect`),

  addComment: (id: string | number, data: { content: string; parentId?: number, replyToId?: number }) =>
    http.post<CommentVO>(`/strategy/interaction/${id}/comment`, data),

  getComments: (id: string | number, sort: 'latest' | 'hot' = 'latest') => http.get<CommentVO[]>(`/strategy/interaction/${id}/comments?sort=${sort}`),

  getInteractionStatus: (id: string | number) =>
    http.get<{ hasLiked: boolean; hasCollected: boolean }>(`/strategy/interaction/${id}/status`),

  toggleCommentLike: (id: string | number) => http.post<boolean>(`/strategy/interaction/comment/${id}/like`),

  deleteComment: (id: string | number) => http.del<void>(`/strategy/interaction/comment/${id}`)
}
