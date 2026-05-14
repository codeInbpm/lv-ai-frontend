import { http } from '../utils/request'
import type { PageResult } from './plan'

export interface UserNote {
  id: number
  userId: number
  title: string
  content: string
  coverUrl: string
  likeCount: number
  commentCount: number
  status: number
  createTime: string
}

export const noteApi = {
  publishNote: (data: Partial<UserNote>) => http.post<UserNote>('/note/publish', data),
  getMyNotes: (params: { page?: number; size?: number }) => http.get<PageResult<UserNote>>('/note/list', params),
  getMyLiked: (params: { page?: number; size?: number }) => http.get<PageResult<any>>('/note/liked', params),
  getMyCollected: (params: { page?: number; size?: number }) => http.get<PageResult<any>>('/note/collected', params)
}
