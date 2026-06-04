import { http } from '../utils/request'

export interface SysDict {
  id: number
  dictType: string
  dictLabel: string
  dictValue: string
  sortOrder: number
  isDefault: number
  status: number
  remark: string
}

export const dictApi = {
  /**
   * 根据字典类型获取字典数据列表
   * @param type 字典类型
   */
  getDictByType(type: string) {
    return http.get<SysDict[]>(`/dict/type/${type}`)
  },

  /**
   * 批量根据多个字典类型获取字典数据
   * @param types 字典类型列表
   */
  getDictsByTypes(types: string[]) {
    return http.get<Record<string, SysDict[]>>('/dict/batch', { types: types.join(',') })
  }
}
