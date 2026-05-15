import { http } from '../utils/request'
import type { CommentVO } from './strategy'

export const noteApi = {
  /**
   * 发布笔记
   */
  publishNote(data: any) {
    return http.post('/note/publish', data)
  },

  /**
   * 获取笔记详情
   */
  getDetail(id: string) {
    return http.get<any>(`/note/${id}`)
  },

  /**
   * 获取笔记列表
   */
  getList(params: any) {
    return http.get<any>('/note/list', params)
  },

  /**
   * 点赞笔记
   */
  toggleLike(id: number) {
    return http.post<boolean>(`/note/interaction/${id}/like`)
  },

  /**
   * 收藏笔记
   */
  toggleCollect(id: number) {
    return http.post<boolean>(`/note/interaction/${id}/collect`)
  },

  /**
   * 获取交互状态
   */
  getInteractionStatus(id: number) {
    return http.get<any>(`/note/interaction/${id}/status`)
  },

  /**
   * 删除笔记
   */
  deleteNote(id: number) {
    return http.del(`/note/${id}`)
  },

  /**
   * 获取评论列表
   */
  getComments(id: number, sort: string = 'latest') {
    return http.get<CommentVO[]>(`/note/interaction/${id}/comments`, { sort })
  },

  /**
   * 发表评论
   */
  addComment(id: number, data: { content: string; parentId?: number }) {
    return http.post<CommentVO>(`/note/interaction/${id}/comment`, data)
  },

  /**
   * 点赞评论
   */
  toggleCommentLike(commentId: number) {
    return http.post<boolean>(`/note/interaction/comment/${commentId}/like`)
  }
}
