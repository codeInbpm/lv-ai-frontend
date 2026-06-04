import { defineStore } from 'pinia'
import { ref } from 'vue'
import { dictApi, type SysDict } from '../api/dict'

export const useDictStore = defineStore('dict', () => {
  // 本地字典数据缓存，以键值对存取
  const dictMap = ref<Record<string, SysDict[]>>({})
  
  // 防止重复加载同个字典的 Promise 加载状态映射
  const loadingMap = ref<Record<string, Promise<any>>>({})

  /**
   * 同步从本地获取某个字典的选项列表
   * @param type 字典类型
   */
  const getDict = (type: string): SysDict[] => {
    return dictMap.value[type] || []
  }

  /**
   * 翻译字典值为中文显示标签
   * @param type 字典类型
   * @param value 存取的 dict_value
   * @returns 翻译后的中文标签(找不到则返回原 value 值)
   */
  const getLabel = (type: string, value: string | number): string => {
    const list = getDict(type)
    const item = list.find(d => String(d.dictValue) === String(value))
    return item ? item.dictLabel : String(value)
  }

  /**
   * 批量预加载字典(已加载的不再重复请求)
   * @param types 字典类型列表
   */
  const loadDicts = async (types: string[]): Promise<void> => {
    // 过滤得到本地没有缓存的类型
    const neededTypes = types.filter(t => !dictMap.value[t])
    if (neededTypes.length === 0) {
      return
    }

    try {
      const res = await dictApi.getDictsByTypes(neededTypes)
      if (res) {
        // 合并入缓存
        dictMap.value = {
          ...dictMap.value,
          ...res
        }
      }
    } catch (e) {
      console.error('Failed to batch load dicts', e)
    }
  }

  /**
   * 异步加载/获取单个字典(防并发重复请求)
   * @param type 字典类型
   */
  const loadDict = async (type: string): Promise<SysDict[]> => {
    if (dictMap.value[type]) {
      return dictMap.value[type]
    }

    // 若已经有该类型的网络请求在挂起中，则直接复用
    if (loadingMap.value[type]) {
      return loadingMap.value[type]
    }

    const loadPromise = dictApi.getDictByType(type)
      .then(res => {
        dictMap.value[type] = res || []
        delete loadingMap.value[type]
        return dictMap.value[type]
      })
      .catch(err => {
        delete loadingMap.value[type]
        return []
      })

    loadingMap.value[type] = loadPromise
    return loadPromise
  }

  /**
   * 清除本地内存的全部字典缓存
   */
  const clearAllLocalCache = () => {
    dictMap.value = {}
  }

  return {
    dictMap,
    getDict,
    getLabel,
    loadDict,
    loadDicts,
    clearAllLocalCache
  }
})
