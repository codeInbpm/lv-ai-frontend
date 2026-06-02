
const BASE_URL = 'http://localhost:8080/api'
// const BASE_URL = 'http://192.168.110.55:8080/api'

/** 防止多个请求同时 401 导致多次跳转登录页 */
let isRedirectingToLogin = false

interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  showLoading?: boolean
  timeout?: number
}

/**
 * 清理请求参数：过滤掉值为 undefined 或 null 的字段，
 * 防止 uni.request 将 undefined 序列化为字符串 "undefined" 发送给后端。
 */
function cleanParams(data: any): any {
  if (data === null || data === undefined) return undefined
  if (typeof data !== 'object' || Array.isArray(data)) return data
  const result: Record<string, any> = {}
  for (const key of Object.keys(data)) {
    const val = data[key]
    if (val !== undefined && val !== null) {
      result[key] = val
    }
  }
  return Object.keys(result).length ? result : undefined
}

export function request<T = any>(options: RequestOptions): Promise<T> {
  const { url, method = 'GET', data, showLoading = false } = options

  if (showLoading) {
    uni.showLoading({ title: '加载中...', mask: true })
  }

  // 过滤 undefined/null 参数，防止 uni.request 将 undefined 序列化为 "undefined"
  const cleanedData = cleanParams(data)

  return new Promise((resolve, reject) => {
    uni.request({
      url: BASE_URL + url,
      method,
      data: cleanedData,
      timeout: options.timeout || 60000,
      header: {
        'Content-Type': 'application/json',
        Authorization: uni.getStorageSync('token') || ''
      },
      success(res: any) {
        if (showLoading) uni.hideLoading()
        const result = res.data as any
        if (result.code === 200) {
          resolve(result.data)
        } else if (result.code === 401) {
          if (!isRedirectingToLogin) {
            isRedirectingToLogin = true
            uni.removeStorageSync('token')
            uni.navigateTo({
              url: '/pages/login/index',
              complete() {
                isRedirectingToLogin = false
              }
            })
          }
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
  get: <T = any>(url: string, data?: any, showLoading?: boolean, timeout?: number) =>
    request<T>({ url, method: 'GET', data, showLoading, timeout }),
  post: <T = any>(url: string, data?: any, showLoading?: boolean, timeout?: number) =>
    request<T>({ url, method: 'POST', data, showLoading, timeout }),
  put: <T = any>(url: string, data?: any, timeout?: number) =>
    request<T>({ url, method: 'PUT', data, timeout }),
  del: <T = any>(url: string, data?: any) =>
    request<T>({ url, method: 'DELETE', data })
}
