import { useUserStore } from '../stores/user'

const BASE_URL = 'http://localhost:8080/api'

export const commonApi = {
  /**
   * 上传文件
   * @param filePath 本地文件路径
   * @param folder 文件夹名称
   */
  upload(filePath: string, folder?: string): Promise<string> {
    const userStore = useUserStore()
    return new Promise((resolve, reject) => {
      let url = BASE_URL + '/file/upload'
      if (folder) {
        url += `?folder=${folder}`
      }
      uni.uploadFile({
        url: url,
        filePath: filePath,
        name: 'file',
        header: {
          Authorization: userStore.token || ''
        },
        success: (res) => {
          const data = JSON.parse(res.data)
          if (data.code === 200) {
            resolve(data.data)
          } else {
            uni.showToast({ title: data.message || '上传失败', icon: 'none' })
            reject(new Error(data.message))
          }
        },
        fail: (err) => {
          uni.showToast({ title: '网络错误', icon: 'none' })
          reject(err)
        }
      })
    })
  }
}
