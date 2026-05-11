import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { userApi, type LoginVO, type UserInfo } from '../api/user'

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(uni.getStorageSync('token') || '')
  const userInfo = ref<UserInfo | null>(null)
  const isLogin = computed(() => !!token.value)

  /** 初始化：App启动时恢复状态 */
  async function initUser() {
    const savedToken = uni.getStorageSync('token')
    if (savedToken) {
      token.value = savedToken
      try {
        const info = await userApi.getUserInfo()
        userInfo.value = info
      } catch {
        logout()
      }
    }
  }

  /** 微信一键登录 */
  async function wxLogin() {
    return new Promise<void>((resolve, reject) => {
      uni.login({
        provider: 'weixin',
        async success(loginRes) {
          try {
            // 获取用户头像和昵称（微信新规需用户主动点击授权）
            const result: LoginVO = await userApi.login({
              code: loginRes.code
            })
            setLoginState(result)
            // 拉取完整用户信息
            const info = await userApi.getUserInfo()
            userInfo.value = info
            resolve()
          } catch (err) {
            reject(err)
          }
        },
        fail(err) {
          reject(err)
        }
      })
    })
  }

  function setLoginState(loginVO: LoginVO) {
    token.value = loginVO.token
    uni.setStorageSync('token', loginVO.token)
  }

  /** 更新用户信息（昵称/头像授权后调用） */
  async function updateProfile(data: { nickname?: string; avatar?: string; gender?: number }) {
    const result = await userApi.updateUserInfo(data)
    userInfo.value = result
  }

  function logout() {
    token.value = ''
    userInfo.value = null
    uni.removeStorageSync('token')
  }

  /** 检查是否已登录，未登录则跳转 */
  function requireLogin(): boolean {
    if (!isLogin.value) {
      uni.navigateTo({ url: '/pages/login/index' })
      return false
    }
    return true
  }

  return {
    token,
    userInfo,
    isLogin,
    initUser,
    wxLogin,
    setLoginState,
    updateProfile,
    logout,
    requireLogin
  }
})
