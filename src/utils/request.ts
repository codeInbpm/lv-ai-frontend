import { useUserStore } from '../stores/user'

const BASE_URL = 'http://localhost:8080/api'

interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  showLoading?: boolean
}

export function request<T = any>(options: RequestOptions): Promise<T> {
  const { url, method = 'GET', data, showLoading = false } = options
  const userStore = useUserStore()

  if (showLoading) {
    uni.showLoading({ title: '加载中...', mask: true })
  }

  return new Promise((resolve, reject) => {
    uni.request({
      url: BASE_URL + url,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        Authorization: userStore.token || ''
      },
      success(res: any) {
        if (showLoading) uni.hideLoading()
        const result = res.data as any
        if (result.code === 200) {
          resolve(result.data)
        } else if (result.code === 401) {
          userStore.logout()
          uni.navigateTo({ url: '/pages/login/index' })
          reject(new Error(result.message))
        } else {
          uni.showToast({ title: result.message || '请求失败', icon: 'none' })
          reject(new Error(result.message))
        }
      },
      fail(err) {
        if (showLoading) uni.hideLoading()
        uni.showToast({ title: '网络请求失败，请检查网络', icon: 'none' })
        reject(err)
      }
    })
  })
}

export const http = {
  get: <T = any>(url: string, data?: any, showLoading?: boolean) =>
    request<T>({ url, method: 'GET', data, showLoading }),
  post: <T = any>(url: string, data?: any, showLoading?: boolean) =>
    request<T>({ url, method: 'POST', data, showLoading }),
  put: <T = any>(url: string, data?: any) =>
    request<T>({ url, method: 'PUT', data }),
  del: <T = any>(url: string, data?: any) =>
    request<T>({ url, method: 'DELETE', data })
}
