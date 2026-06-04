import { defineStore } from 'pinia'
import { ref } from 'vue'
import { noteApi } from '../api/note'
import { http } from '../utils/request'

export interface NoteTemplate {
  name: string
  description: string
  placeholder: string
}

export const noteTemplates: Record<'note' | 'guide' | 'travel', NoteTemplate> = {
  note: {
    name: '笔记',
    description: '记录旅行中的点滴小事',
    placeholder: '分享你今天的旅行随笔或生活点滴...'
  },
  guide: {
    name: '攻略',
    description: '为他人提供实用的旅行指南',
    placeholder: '请在此输入这篇攻略的概况描述...'
  },
  travel: {
    name: '游记',
    description: '记录一次完整的旅行故事',
    placeholder: '记录一段充满故事的完整旅行足迹...'
  }
}

// 攻略结构定义
export interface GuideSpot {
  name: string
  reason: string
  duration: string
  ticket: string
  traffic: string
}

export interface GuideData {
  overview: string
  practicalInfo: {
    complaintPhone: string
    attention: string
    medicalService: string
    localWebsite: string
  }
  traffic: string
  routes: string
  accommodation: string
  spots: GuideSpot[]
  food: string
  shopping: string
  others: {
    budget: string
    clothing: string
  }
}

// 游记每日内容定义
export interface TravelDayItem {
  dayIndex: number
  date: string
  title: string
  moodWeather: string
  content: string
  images: string[]
  location: string
}

// 游记结构定义
export interface TravelData {
  destination: string
  totalDays: number
  daysList: TravelDayItem[]
  summary: string
  costSummary: string
  tips: string
}

export const useNotePublishStore = defineStore('notePublish', () => {
  const id = ref<number | null>(null)
  const draftId = ref<number | null>(null)
  const type = ref<'note' | 'guide' | 'travel'>('note')

  // 通用字段
  const title = ref('')
  const content = ref('')
  const coverUrl = ref('')
  const images = ref<string[]>([])
  const location = ref<{
    name: string
    address: string
    longitude: number
    latitude: number
  } | null>(null)
  const selectedTopics = ref<string[]>([])

  // 专属字段：主表辅助字段
  const days = ref<number | null>(null)
  const cost = ref<number | null>(null)
  const season = ref('')
  const tripDate = ref('')
  const companions = ref('')

  // 结构化攻略专属响应式状态
  const guideData = ref<GuideData>({
    overview: '',
    practicalInfo: {
      complaintPhone: '',
      attention: '',
      medicalService: '',
      localWebsite: ''
    },
    traffic: '',
    routes: '',
    accommodation: '',
    spots: [],
    food: '',
    shopping: '',
    others: {
      budget: '',
      clothing: ''
    }
  })

  // 结构化游记专属响应式状态
  const travelData = ref<TravelData>({
    destination: '',
    totalDays: 1,
    daysList: [
      {
        dayIndex: 1,
        date: '',
        title: '',
        moodWeather: '',
        content: '',
        images: [],
        location: ''
      }
    ],
    summary: '',
    costSummary: '',
    tips: ''
  })

  // 重置表单
  function resetForm(newType: 'note' | 'guide' | 'travel' = 'note') {
    id.value = null
    draftId.value = null
    type.value = newType
    title.value = ''
    content.value = ''
    coverUrl.value = ''
    images.value = []
    location.value = null
    selectedTopics.value = []
    days.value = null
    cost.value = null
    season.value = ''
    tripDate.value = ''
    companions.value = ''

    // 重置攻略结构
    guideData.value = {
      overview: '',
      practicalInfo: {
        complaintPhone: '',
        attention: '',
        medicalService: '',
        localWebsite: ''
      },
      traffic: '',
      routes: '',
      accommodation: '',
      spots: [],
      food: '',
      shopping: '',
      others: {
        budget: '',
        clothing: ''
      }
    }

    // 重置游记结构
    travelData.value = {
      destination: '',
      totalDays: 1,
      daysList: [
        {
          dayIndex: 1,
          date: '',
          title: '',
          moodWeather: '',
          content: '',
          images: [],
          location: ''
        }
      ],
      summary: '',
      costSummary: '',
      tips: ''
    }
  }

  // 恢复草稿并深度反序列化
  function restoreFromDraft(draftData: any, dId: number) {
    resetForm(draftData.type || 'note')
    id.value = draftData.noteId || null
    draftId.value = dId
    title.value = draftData.title || ''
    content.value = draftData.content || ''
    coverUrl.value = draftData.coverUrl || ''
    images.value = Array.isArray(draftData.images) ? draftData.images : []
    
    if (draftData.locationName) {
      location.value = {
        name: draftData.locationName,
        address: draftData.locationAddress || '',
        longitude: draftData.longitude || 0,
        latitude: draftData.latitude || 0
      }
    } else {
      location.value = null
    }

    selectedTopics.value = typeof draftData.topicTags === 'string' && draftData.topicTags
      ? draftData.topicTags.split(',').filter(Boolean)
      : (Array.isArray(draftData.topics) ? draftData.topics : [])

    // 辅助字段回显
    if (draftData.type === 'guide') {
      days.value = draftData.days || null
      cost.value = draftData.cost || null
      season.value = draftData.season || ''
    } else if (draftData.type === 'travel') {
      tripDate.value = draftData.tripDate || ''
      companions.value = draftData.companions || ''
    }

    // 解析 extraData 结构数据
    if (draftData.extraData) {
      try {
        const extra = typeof draftData.extraData === 'string' ? JSON.parse(draftData.extraData) : draftData.extraData
        if (draftData.type === 'guide') {
          guideData.value = {
            overview: extra.overview || '',
            practicalInfo: {
              complaintPhone: extra.practicalInfo?.complaintPhone || '',
              attention: extra.practicalInfo?.attention || '',
              medicalService: extra.practicalInfo?.medicalService || '',
              localWebsite: extra.practicalInfo?.localWebsite || ''
            },
            traffic: extra.traffic || '',
            routes: extra.routes || '',
            accommodation: extra.accommodation || '',
            spots: Array.isArray(extra.spots) ? extra.spots : [],
            food: extra.food || '',
            shopping: extra.shopping || '',
            others: {
              budget: extra.others?.budget || '',
              clothing: extra.others?.clothing || ''
            }
          }
        } else if (draftData.type === 'travel') {
          travelData.value = {
            destination: extra.destination || '',
            totalDays: extra.totalDays || 1,
            daysList: Array.isArray(extra.daysList) ? extra.daysList : [],
            summary: extra.summary || '',
            costSummary: extra.costSummary || '',
            tips: extra.tips || ''
          }
        }
      } catch (e) {
        console.error('Failed to parse extraData:', e)
      }
    }
  }

  // 校验表单
  function validate(isDraft: boolean = false) {
    if (!title.value.trim()) {
      return '请输入标题'
    }

    // 正式发布时的强校验
    if (!isDraft) {
      if (type.value === 'note') {
        if (!content.value.trim()) return '请输入笔记正文'
        if (images.value.length === 0) return '请至少上传一张照片'
      }

      if (type.value === 'guide') {
        if (days.value === null || days.value === undefined || days.value <= 0) {
          return '请输入有效的游玩天数'
        }
        if (cost.value === null || cost.value === undefined || cost.value < 0) {
          return '请输入人均花费'
        }
        if (!season.value) {
          return '请选择最佳出游时间'
        }
        if (!guideData.value.overview.trim()) {
          return '请输入目的地概况'
        }
        // 校验景点卡片
        for (let i = 0; i < guideData.value.spots.length; i++) {
          if (!guideData.value.spots[i].name.trim()) {
            return `请输入景点 ${i + 1} 的名称`
          }
        }
      }

      if (type.value === 'travel') {
        if (!travelData.value.destination.trim()) {
          return '请输入目的地'
        }
        if (!tripDate.value) {
          return '请选择出行日期'
        }
        if (!companions.value) {
          return '请选择同行伙伴'
        }
        // 每日游记校验
        if (travelData.value.daysList.length === 0) {
          return '请至少添加一天的行程'
        }
        for (let i = 0; i < travelData.value.daysList.length; i++) {
          const day = travelData.value.daysList[i]
          if (!day.title.trim()) {
            return `请输入第 ${day.dayIndex} 天的标题`
          }
          if (!day.content.trim()) {
            return `请输入第 ${day.dayIndex} 天的内容随笔`
          }
        }
      }
    }
    return null
  }

  // 提交接口
  async function submit(isDraft: boolean = false) {
    const errorMsg = validate(isDraft)
    if (errorMsg) {
      uni.showToast({ title: errorMsg, icon: 'none' })
      return Promise.reject(new Error(errorMsg))
    }

    uni.showLoading({ title: isDraft ? '暂存中...' : '发布中...', mask: true })

    // 填充 extraData 逻辑
    let extraDataStr = null
    if (type.value === 'guide') {
      // 攻略：将 days/season 同步
      guideData.value.overview = content.value // 同步第一正文为概况
      extraDataStr = JSON.stringify(guideData.value)
    } else if (type.value === 'travel') {
      // 游记：把 destination 放入
      extraDataStr = JSON.stringify(travelData.value)
    }

    // 设置默认封面图（如果有图片列表，把第一张提取作为封面）
    let calculatedCover = coverUrl.value
    if (!calculatedCover) {
      if (type.value === 'note' && images.value.length > 0) {
        calculatedCover = images.value[0]
      } else if (type.value === 'guide' && images.value.length > 0) {
        calculatedCover = images.value[0]
      } else if (type.value === 'travel') {
        // 取第一天的第一张图作为封面
        const firstDayWithImg = travelData.value.daysList.find(d => d.images && d.images.length > 0)
        if (firstDayWithImg) {
          calculatedCover = firstDayWithImg.images[0]
        }
      }
    }

    // 统一收集发布荷载
    const payload = {
      id: id.value,
      draftId: draftId.value,
      title: title.value || '无标题草稿',
      content: type.value === 'guide'
        ? (content.value || guideData.value.overview || '旅行攻略')
        : (type.value === 'travel' 
            ? (travelData.value.summary || travelData.value.daysList[0]?.content || '旅行日志')
            : (content.value || '')),
      coverUrl: calculatedCover || '',
      images: type.value === 'travel' 
        ? JSON.stringify(travelData.value.daysList.flatMap(d => d.images || [])) // 汇总游记所有图片
        : JSON.stringify(images.value),
      locationName: location.value?.name || '',
      locationAddress: location.value?.address || '',
      longitude: location.value?.longitude || null,
      latitude: location.value?.latitude || null,
      topicTags: selectedTopics.value.join(','),
      type: type.value,
      // 辅助主表字段
      days: type.value === 'guide' ? days.value : (type.value === 'travel' ? travelData.value.totalDays : null),
      cost: type.value === 'guide' ? cost.value : null,
      season: type.value === 'guide' ? season.value : null,
      tripDate: type.value === 'travel' && tripDate.value ? tripDate.value : null,
      companions: type.value === 'travel' ? companions.value : null,
      extraData: extraDataStr,
      isDraft: isDraft
    }

    try {
      const res = await noteApi.publishNote(payload)
      uni.hideLoading()
      uni.showToast({ title: isDraft ? '已存入草稿箱' : '发布成功', icon: 'success' })
      
      if (!isDraft) {
        resetForm(type.value)
      }
      return res
    } catch (e: any) {
      uni.hideLoading()
      uni.showToast({ title: e.message || '操作失败', icon: 'none' })
      return Promise.reject(e)
    }
  }

  return {
    id,
    draftId,
    type,
    title,
    content,
    coverUrl,
    images,
    location,
    selectedTopics,
    days,
    cost,
    season,
    tripDate,
    companions,
    guideData,
    travelData,
    resetForm,
    restoreFromDraft,
    validate,
    submit
  }
})
