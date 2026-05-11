import { http } from '../utils/request'

export interface WxLoginDTO {
  code: string
  nickname?: string
  avatar?: string
  gender?: number
}

export interface LoginVO {
  token: string
  tokenTimeout: number
  userId: number
  nickname: string
  avatar: string
  isNew: boolean
}

export interface UserInfo {
  id: number
  openid: string
  nickname: string
  avatar: string
  phone?: string
  gender?: number
  coupleId?: number
  inviteCode?: string
  points?: number
  createTime?: string
}

export const userApi = {
  /** 微信一键登录 */
  login: (data: WxLoginDTO) => http.post<LoginVO>('/user/login', data),
  /** 获取当前用户信息 */
  getUserInfo: () => http.get<UserInfo>('/user/info'),
  /** 更新用户信息 */
  updateUserInfo: (data: Partial<UserInfo>) => http.put<UserInfo>('/user/info', data),
  /** 退出登录 */
  logout: () => http.post('/user/logout'),
  /** 获取邀请码 */
  getInviteCode: () => http.get<string>('/user/invite-code'),
  /** 绑定情侣 */
  bindCouple: (inviteCode: string) => http.post('/user/bind-couple', null, false)
}
