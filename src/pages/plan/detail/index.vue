<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { planApi, type PlanDetailVO, type TravelItem, type TravelDay, type DayWithItems } from '../../../api/plan'
import { http } from '../../../utils/request'
import NavBar from '../../../components/common/NavBar.vue'
import { useNavBar } from '../../../composables/useNavBar'

const planId = ref<number>(0)
const detail = ref<PlanDetailVO | null>(null)
const loading = ref(true)
const activeDayIndex = ref(0)
const { totalHeight: navTotalHeight } = useNavBar()
// 编辑日程状态
const isEditing = ref(false)

// 拖拽排序相关状态
const dragIndex = ref<number | null>(null) // 当前拖拽的项的物理原索引
const dragTargetIndex = ref<number | null>(null) // 手势滑行中的虚拟目标落点索引
const dragDeltaY = ref(0) // 拖拽手势 vertical 物理位移 (px)
let dragStartY = 0 // 拖放触碰初始 clientY 坐标

// AI 对话微调日程状态
const showAiDrawer = ref(false)
const isThinking = ref(false)
const inputMsg = ref('')
const chatMessages = ref<Array<{ role: 'user' | 'assistant'; content: string }>>([])
const lastMsgId = ref('')

// 新增/修改明细弹窗表单状态
const showItemForm = ref(false)
const isEditingItem = ref(false)
const editingItemId = ref<number | null>(null)
const itemForm = ref<any>({
  type: 3,
  name: '',
  address: '',
  startTime: '10:00',
  endTime: '12:00',
  duration: 120,
  estimatedCost: '',
  description: '',
  tips: '',
  lat: null,
  lng: null
})

const itemTypeOptions = [
  { value: 1, label: '✈️ 交通', color: '#10b981' },
  { value: 2, label: '🏨 住宿', color: '#8b5cf6' },
  { value: 3, label: '🏛️ 景点', color: '#0ea5e9' },
  { value: 4, label: '🍽️ 餐饮', color: '#f97316' },
  { value: 5, label: '🛍️ 购物', color: '#ec4899' },
  { value: 6, label: '🎭 其他/活动', color: '#a855f7' }
]

onLoad((options: any) => {
  const id = options.planId || options.id
  if (id) planId.value = Number(id)
})

onMounted(async () => {
  if (planId.value) {
    try {
      await loadData()
      uni.$on('refreshPlanDetail', loadData)
    } catch {
      uni.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      loading.value = false
    }
  }
})

import { onUnload } from '@dcloudio/uni-app'
onUnload(() => {
  uni.$off('refreshPlanDetail', loadData)
})

async function loadData() {
  if (!planId.value) return
  const [detailRes, checkinsRes] = await Promise.all([
    planApi.getPlanDetail(planId.value),
    http.get(`/plan/${planId.value}/checkins`).catch(() => [])
  ])
  const detailData = detailRes
  const checkins = (checkinsRes || []) as any[]
  detailData.days.forEach(day => {
    day.items.forEach(item => {
      const record = checkins.find(c => c.itemId === item.id)
      if (record) {
        item.checkedIn = 1
        item.checkinRecord = record
        if (record.images && typeof record.images === 'string') {
           try { item.checkinRecord.images = JSON.parse(record.images) } catch {}
        }
      }
    })
  })
  detail.value = detailData
}

const plan = computed(() => detail.value?.plan)
const days = computed(() => detail.value?.days ?? [])
const currentDay = computed(() => days.value[activeDayIndex.value])

// 🗺️ 地图路线打点状态
const viewMode = ref<'list' | 'map'>('list') // 当前视图模式
const mapCenter = ref({ latitude: 24.476, longitude: 118.082 })
const mapScale = ref(13)
const activeCardIndex = ref(0) // 当前底部激活聚焦的卡片索引
const showAllCallouts = ref(false) // 是否默认展示全部景点的名称气泡

// 🏛️ 景点详情抽屉弹窗状态
const showItemDetailDrawer = ref(false)
const selectedItemForDetail = ref<TravelItem | null>(null)

function openItemDetail(item: TravelItem) {
  selectedItemForDetail.value = item
  showItemDetailDrawer.value = true
}

function closeItemDetailDrawer() {
  showItemDetailDrawer.value = false
  // 延迟清空 selectedItemForDetail，以防动画未结束发生文字闪烁
  setTimeout(() => {
    if (!showItemDetailDrawer.value) {
      selectedItemForDetail.value = null
    }
  }, 350)
}

// 计算属性：动态清洗并生成地图 Markers
const mapMarkers = computed(() => {
  if (!currentDay.value) return []
  console.log('--- 当前天 items 经纬度数据 ---', currentDay.value.items.map(i => ({ name: i.name, lat: i.lat, lng: i.lng })))
  const markers: any[] = []
  currentDay.value.items.forEach((item, idx) => {
    if (item.lat && item.lng) {
      markers.push({
        id: idx, // 这样 id 就是 currentDay.value.items 中的原始索引！
        latitude: item.lat,
        longitude: item.lng,
        title: item.name,
        iconPath: '/static/icons/marker.png', // 极精美的定位图标路径
        width: 28,
        height: 38,
        // 数字气泡 Callout
        callout: {
          content: `${markers.length + 1}. ${item.name}\n🕒 ${item.startTime?.slice(0, 5) || ''}`,
          color: '#ffffff',
          fontSize: 12,
          borderRadius: 8,
          bgColor: '#0284c7', // 蔚蓝色背景
          padding: 8,
          display: showAllCallouts.value ? 'ALWAYS' : (activeCardIndex.value === idx ? 'ALWAYS' : 'BYCLICK')
        },
        label: {
          content: String(markers.length + 1),
          color: '#ffffff',
          fontSize: 10,
          x: -4, // 微调使数字居中于 Marker icon
          y: -26
        }
      })
    }
  })
  return markers
})

// 计算属性：生成带方向箭头的连线 Polyline
const mapPolylines = computed(() => {
  if (!currentDay.value) return []
  const points = currentDay.value.items
    .filter(item => item.lat && item.lng)
    .map(item => ({
      latitude: item.lat!,
      longitude: item.lng!
    }))
    
  if (points.length < 2) return []
  return [{
    points,
    color: '#0ea5e980', // 半透明浅蓝色
    width: 6,
    arrowLine: true, // 启用腾讯地图带方向箭头样式！
    borderColor: '#0284c7',
    borderWidth: 1
  }]
})

// 监听当前天数或日程项列表的变化，自适应地图镜头中心
watch([activeDayIndex, () => currentDay.value?.items], () => {
  if (currentDay.value?.items) {
    const validItems = currentDay.value.items.filter(item => item.lat && item.lng)
    if (validItems.length > 0) {
      const firstValidIdx = currentDay.value.items.findIndex(item => item.lat && item.lng)
      if (firstValidIdx !== -1) {
        const firstValidItem = currentDay.value.items[firstValidIdx]
        mapCenter.value = {
          latitude: firstValidItem.lat!,
          longitude: firstValidItem.lng!
        }
        activeCardIndex.value = firstValidIdx
        mapScale.value = 13
      }
    }
  }
}, { immediate: true, deep: true })

// 🌟 核心联动方法：点击 Marker 时，底部卡片联动滚动，并且直接从下方弹出景点详情半屏抽屉
function onMarkerTap(e: any) {
  const markerId = e.detail.markerId
  activeCardIndex.value = markerId
  
  // 地图对齐中心
  const targetItem = currentDay.value.items[markerId]
  if (targetItem && targetItem.lat && targetItem.lng) {
    mapCenter.value = {
      latitude: targetItem.lat,
      longitude: targetItem.lng
    }
    // 联动触发：直接打开景点详情抽屉弹窗！
    openItemDetail(targetItem)
  }
}

// 🌟 核心联动方法：用户点击底部卡片，地图对焦并弹出气泡
function focusOnItem(index: number) {
  activeCardIndex.value = index
  const targetItem = currentDay.value.items[index]
  if (targetItem && targetItem.lat && targetItem.lng) {
    mapCenter.value = {
      latitude: targetItem.lat,
      longitude: targetItem.lng
    }
    mapScale.value = 14 // 轻微拉近镜头，体验极为高级
  }
}

// 🗺️ 腾讯地图原生导航
function goNavigation(item: any) {
  if (item.lat && item.lng) {
    uni.openLocation({
      latitude: Number(item.lat),
      longitude: Number(item.lng),
      name: item.name,
      address: item.address || '',
      success: () => {
        console.log('导航拉起成功')
      }
    })
  }
}

// 状态映射
const statusMap: Record<number, { label: string; color: string; bg: string }> = {
  0: { label: '生成中', color: '#64748b', bg: 'rgba(100,116,139,0.2)' },
  1: { label: '未开始', color: '#d97706', bg: 'rgba(217,119,6,0.2)' },
  2: { label: '进行中', color: '#10b981', bg: 'rgba(16,185,129,0.2)' },
  3: { label: '已完成', color: '#0369a1', bg: 'rgba(3,105,161,0.2)' },
  4: { label: '生成失败', color: '#ef4444', bg: 'rgba(239,68,68,0.2)' }
}

// 行程项类型图标和颜色
const typeConfig: Record<number, { icon: string; color: string; bg: string }> = {
  1: { icon: '✈️', color: '#fff', bg: '#10b981' },  // 交通
  2: { icon: '🏨', color: '#fff', bg: '#8b5cf6' },  // 住宿
  3: { icon: '🏛️', color: '#fff', bg: '#0ea5e9' },  // 景点
  4: { icon: '🍽️', color: '#fff', bg: '#f97316' },  // 餐饮
  5: { icon: '🛍️', color: '#fff', bg: '#ec4899' },  // 购物
  6: { icon: '🎭', color: '#fff', bg: '#a855f7' },  // 娱乐
}
const defaultType = { icon: '📍', color: '#fff', bg: '#64748b' }

function getTypeConfig(type: number) {
  return typeConfig[type] || defaultType
}

// 计算行程进度
const progress = computed(() => {
  if (!days.value.length) return 0
  let totalItems = 0
  let finishedItems = 0
  days.value.forEach(d => {
    if (d.items) {
      totalItems += d.items.length
      finishedItems += d.items.filter(item => item.checkedIn).length
    }
  })
  if (totalItems === 0) return 0
  return Math.round((finishedItems / totalItems) * 100)
})

// 格式化费用
function formatCost(cost?: number) {
  if (!cost) return '免费'
  return `¥${cost.toLocaleString()}`
}

// 打卡
async function checkIn(item: TravelItem) {
  if (item.checkedIn) return
  uni.showModal({
    title: '打卡确认',
    content: `确认在「${item.name}」打卡吗？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          // 打卡动作
          item.checkedIn = 1
          uni.showToast({ title: '打卡成功！', icon: 'success' })
        } catch {
          uni.showToast({ title: '打卡失败', icon: 'none' })
        }
      }
    }
  })
}

// 判断是否是需要外部预订的交通工具
function isExternalTransport(item: any) {
  const isTrafficType = item.type === 1 || item.type === 4; 
  const isSelfDrive = /租车|自驾/.test(item.name);
  const isExternal = /飞机|火车|高铁|动车|航班|客车|大巴/.test(item.name);
  return isTrafficType && isExternal && !isSelfDrive;
}

// 点击打卡按钮
function handleCheckInBtnClick(item: any) {
  if (isEditing.value) return // 编辑模式下禁用打卡
  if (isExternalTransport(item)) {
    uni.showModal({
      title: '前往预订',
      content: '即将跳转到携程/12306小程序',
      confirmText: '跳转',
      success: (res) => {
        if (res.confirm) {
          uni.showToast({ title: '体验版暂未关联外部小程序', icon: 'none' })
        }
      }
    })
    return
  }
  checkIn(item)
}

// 点击行程单项
function handleItemClick(item: any) {
  if (isEditing.value) {
    // 编辑模式下点击行程项直接弹出修改表单弹窗
    openEditItem(item)
    return
  }

  if (isExternalTransport(item)) {
    uni.showModal({
      title: '前往预订',
      content: '即将跳转到携程/12306小程序',
      confirmText: '跳转',
      success: (res) => {
        if (res.confirm) {
          uni.showToast({ title: '体验版暂未关联外部小程序', icon: 'none' })
        }
      }
    })
    return
  }
  
  // 普通节点进入详情
  uni.setStorageSync('currentPlanItem', { ...item, planId: planId.value })
  uni.navigateTo({ url: `/pages/plan/item/index?id=${item.id}` })
}

function goChat() {
  openAiDrawer()
}

function sharePlan() {
  uni.showToast({ title: '分享功能开发中', icon: 'none' })
}

/* ───────────────────────────────────────────────────
   ✏️ 手动日程编辑 & 重排 核心业务方法
   ─────────────────────────────────────────────────── */

// 1. 新增一天
async function addDay() {
  if (!planId.value) return
  uni.showLoading({ title: '添加天数中...' })
  try {
    await planApi.addPlanDay(planId.value)
    await loadData()
    // 自动切到最新的一天
    activeDayIndex.value = days.value.length - 1
    uni.showToast({ title: '天数已增加', icon: 'success' })
  } catch (err) {
    uni.showToast({ title: '添加天数失败', icon: 'none' })
  } finally {
    uni.hideLoading()
  }
}

// 2. 删除这一天
async function deleteDay(dayId: number, dayIndex: number) {
  uni.showModal({
    title: '确认删除天数',
    content: `确定要删除第 ${dayIndex} 天吗？该天下的所有日程明细都将被物理删除，且后续天数会自动前移合并，无法恢复！`,
    success: async (res) => {
      if (res.confirm) {
        uni.showLoading({ title: '删除天数中...' })
        try {
          await planApi.deletePlanDay(dayId)
          if (activeDayIndex.value >= days.value.length - 1) {
            activeDayIndex.value = Math.max(0, days.value.length - 2)
          }
          await loadData()
          uni.showToast({ title: '已删除', icon: 'success' })
        } catch {
          uni.showToast({ title: '删除失败', icon: 'none' })
        } finally {
          uni.hideLoading()
        }
      }
    }
  })
}

/* ☰ 工业级防抖手势拖拽排序核心方法 */
function onTouchStart(e: TouchEvent, index: number) {
  if (!isEditing.value) return
  
  dragIndex.value = index
  dragTargetIndex.value = index
  dragDeltaY.value = 0
  dragStartY = e.touches[0].clientY
}

function onTouchMove(e: TouchEvent) {
  if (dragIndex.value === null) return
  
  const clientY = e.touches[0].clientY
  const deltaY = clientY - dragStartY
  dragDeltaY.value = deltaY
  
  const items = currentDay.value?.items
  if (!items) return
  
  // 核心身位换算算法：以每张行程卡片平均高度 200px 作为一个高度单位
  const offset = Math.round(deltaY / 200)
  let target = dragIndex.value + offset
  
  // 严格限定越界值
  target = Math.max(0, Math.min(items.length - 1, target))
  dragTargetIndex.value = target
}

async function onTouchEnd() {
  if (dragIndex.value === null) return
  
  const originalIndex = dragIndex.value
  const targetIndex = dragTargetIndex.value
  
  // 复位手势跟手临时状态
  dragIndex.value = null
  dragTargetIndex.value = null
  dragDeltaY.value = 0
  
  const items = currentDay.value?.items
  if (!items) return
  
  // 仅在目标位置发生实质性挪移时，才真正修改物理数组项并持久化
  if (targetIndex !== null && targetIndex !== originalIndex) {
    const [removed] = items.splice(originalIndex, 1)
    items.splice(targetIndex, 0, removed)
    
    const sortedIds = items.map(i => i.id)
    uni.showLoading({ title: '保存排序并重整时间...' })
    try {
      await planApi.sortPlanItems(sortedIds)
      // 重新对本地 sortOrder 校正
      items.forEach((item, idx) => item.sortOrder = idx + 1)
      uni.showToast({ title: '已重新排序并调整时间', icon: 'success' })
      // 级联重整需要重新拉取后端数据以展现无感重组后的startTime和endTime！
      await loadData()
    } catch {
      uni.showToast({ title: '保存排序失败', icon: 'none' })
      await loadData()
    } finally {
      uni.hideLoading()
    }
  }
}

// 3. 上下微调行程项位置（重排）
async function moveItem(index: number, direction: 'up' | 'down') {
  const items = currentDay.value?.items
  if (!items) return
  const targetIndex = direction === 'up' ? index - 1 : index + 1
  if (targetIndex < 0 || targetIndex >= items.length) return
  
  // 临时在内存中交换位置，提升响应速度
  const temp = items[index]
  items[index] = items[targetIndex]
  items[targetIndex] = temp
  
  const sortedIds = items.map(i => i.id)
  
  uni.showLoading({ title: '正在重新排版...' })
  try {
    await planApi.sortPlanItems(sortedIds)
    // 更新本地内存中的 sortOrder
    items.forEach((item, idx) => item.sortOrder = idx + 1)
    uni.showToast({ title: '排序已更新', icon: 'none' })
  } catch {
    uni.showToast({ title: '排序更新失败', icon: 'none' })
    await loadData()
  } finally {
    uni.hideLoading()
  }
}

// 4. 删除某行程明细项
async function deleteItem(itemId: number) {
  uni.showModal({
    title: '删除日程确认',
    content: '确定要删除这条日程安排吗？',
    success: async (res) => {
      if (res.confirm) {
        uni.showLoading({ title: '正在删除项...' })
        try {
          await planApi.deletePlanItem(itemId)
          await loadData()
          uni.showToast({ title: '已删除', icon: 'success' })
        } catch {
          uni.showToast({ title: '删除失败', icon: 'none' })
        } finally {
          uni.hideLoading()
        }
      }
    }
  })
}

// 5. 打开添加明细弹窗
function openAddItem() {
  isEditingItem.value = false
  editingItemId.value = null
  itemForm.value = {
    type: 3,
    name: '',
    address: '',
    startTime: '10:00',
    endTime: '12:00',
    duration: 120,
    estimatedCost: '',
    description: '',
    tips: '',
    lat: null,
    lng: null
  }
  showItemForm.value = true
}

// 6. 打开编辑明细弹窗
function openEditItem(item: any) {
  isEditingItem.value = true
  editingItemId.value = item.id
  itemForm.value = {
    type: item.type,
    name: item.name,
    address: item.address || '',
    startTime: item.startTime ? item.startTime.slice(0, 5) : '10:00',
    endTime: item.endTime ? item.endTime.slice(0, 5) : '12:00',
    duration: item.duration || 120,
    estimatedCost: item.estimatedCost !== undefined ? String(item.estimatedCost) : '',
    description: item.description || '',
    tips: item.tips || '',
    lat: item.lat || null,
    lng: item.lng || null
  }
  showItemForm.value = true
}

// 🗺️ 原生地图选址并自动回填表单
function chooseLocationOnMap() {
  uni.chooseLocation({
    success: (res) => {
      if (res.name) {
        if (!itemForm.value.name) {
          itemForm.value.name = res.name
        }
      }
      if (res.address) {
        itemForm.value.address = res.address
      }
      itemForm.value.lat = res.latitude
      itemForm.value.lng = res.longitude
      
      uni.showToast({ title: '位置及坐标已成功回填', icon: 'success' })
    },
    fail: (err) => {
      console.log('地图选址失败或取消', err)
    }
  })
}

// 7. 保存行程项
async function submitItemForm() {
  if (!itemForm.value.name) {
    return uni.showToast({ title: '请输入日程名称', icon: 'none' })
  }
  uni.showLoading({ title: '正在保存修改...' })
  try {
    const payload = {
      ...itemForm.value,
      estimatedCost: itemForm.value.estimatedCost ? Number(itemForm.value.estimatedCost) : 0,
      startTime: itemForm.value.startTime + ':00',
      endTime: itemForm.value.endTime + ':00'
    }
    if (isEditingItem.value && editingItemId.value) {
      await planApi.updatePlanItem(editingItemId.value, payload)
      uni.showToast({ title: '修改成功', icon: 'success' })
    } else {
      await planApi.addPlanItem({
        ...payload,
        dayId: currentDay.value.day.id,
        planId: planId.value
      })
      uni.showToast({ title: '添加成功', icon: 'success' })
    }
    showItemForm.value = false
    await loadData()
  } catch {
    uni.showToast({ title: '保存失败', icon: 'none' })
  } finally {
    uni.hideLoading()
  }
}

// 8. 失去焦点自动更新当天的标题与描述
async function saveDayInfo() {
  if (!currentDay.value) return
  const day = currentDay.value.day
  try {
    await planApi.updatePlanDay(day.id, {
      title: day.title,
      description: day.description
    })
  } catch {
    uni.showToast({ title: '更新今日主题失败', icon: 'none' })
  }
}

// 💬 AI 智能助手微调行程方法组
function openAiDrawer() {
  showAiDrawer.value = true
}

function closeAiDrawer() {
  showAiDrawer.value = false
  isThinking.value = false
}

async function sendAiModifyRequest() {
  if (!inputMsg.value.trim() || isThinking.value) return
  
  const text = inputMsg.value
  inputMsg.value = ''
  
  chatMessages.value.push({ role: 'user', content: text })
  isThinking.value = true
  lastMsgId.value = 'msg-' + (chatMessages.value.length - 1)
  
  try {
    const res = await planApi.aiPlanModify({
      planId: planId.value,
      dayId: currentDay.value.day.id,
      message: text,
      sessionId: 'session_' + planId.value
    })
    
    if (res.success) {
      chatMessages.value.push({ role: 'assistant', content: res.explanation })
      
      // 🌟 德芙般静默数据重载刷新
      await loadData()
      uni.showToast({ title: '日程已智能同步', icon: 'success' })
    } else {
      chatMessages.value.push({ role: 'assistant', content: '抱歉，行程智能微调失败，您可以再尝试一次。' })
    }
  } catch (err: any) {
    const errorMsg = err?.data?.message || 'AI 思考开小差了，请再交代一次试试。'
    chatMessages.value.push({ role: 'assistant', content: '提示：' + errorMsg })
  } finally {
    isThinking.value = false
    setTimeout(() => {
      lastMsgId.value = 'msg-' + (chatMessages.value.length - 1)
    }, 150)
  }
}

function recreatePlan() {
  if (plan.value) {
    uni.setStorageSync('prefillPlanData', {
      destination: plan.value.destination,
      days: plan.value.days,
      budget: plan.value.budget,
      preferences: [] // 默认为空
    })
    uni.redirectTo({
      url: '/pages/plan/create/index'
    })
  }
}

function goBackToList() {
  uni.switchTab({
    url: '/pages/plan/list/index'
  })
}
</script>

<template>
  <view class="detail-page">
    <!-- 导航栏 -->
    <NavBar
      transparent fixed back
      textColor="#ffffff"
      background="linear-gradient(135deg, #0c4a6e, #0369a1)"
      :placeholder="false"
    />

    <template v-if="plan">
      <!-- 顶部 Hero -->
      <view class="hero">
        <view :style="{ height: navTotalHeight + 'px' }" />

        <!-- 状态标签 & 编辑按钮 -->
        <view class="hero-top-row">
          <view class="status-badge" :style="{ background: statusMap[plan.status]?.bg }">
            <text :style="{ color: statusMap[plan.status]?.color }">
              {{ statusMap[plan.status]?.label }}
            </text>
          </view>
          
          <view class="edit-toggle-btn" @click="isEditing = !isEditing" v-if="plan.status !== 0">
            <text class="edit-btn-icon">{{ isEditing ? '✓' : '✏️' }}</text>
            <text class="edit-btn-text">{{ isEditing ? '完成编辑' : '手动编辑' }}</text>
          </view>
        </view>

        <!-- 标题 -->
        <text class="plan-title">{{ plan.title }}</text>

        <!-- 路线 -->
        <text class="plan-route">{{ plan.departure }} ➜ {{ plan.destination }}</text>

        <!-- 基础信息 -->
        <view class="hero-meta">
          <view class="meta-item">
            <text class="meta-icon">📅</text>
            <text class="meta-text">{{ plan.startDate }} · {{ plan.days }}天</text>
          </view>
          <view class="meta-item">
            <text class="meta-icon">👥</text>
            <text class="meta-text">{{ plan.peopleCount || 1 }}人</text>
          </view>
        </view>

        <!-- 进度条 -->
        <view class="progress-wrap">
          <view class="progress-header">
            <text class="progress-label">行程进度</text>
            <text class="progress-pct">{{ progress }}%</text>
          </view>
          <view class="progress-bar">
            <view class="progress-fill" :style="{ width: progress + '%' }" />
          </view>
        </view>
      </view>

      <!-- Day 标签栏 (仅非生成中状态显示) -->
      <view class="day-tabs-wrap" v-if="plan.status !== 0">
        <scroll-view class="day-tabs" scroll-x>
          <view class="day-tabs-inner">
            <view
              class="day-tab"
              :class="{ active: activeDayIndex === idx }"
              v-for="(dw, idx) in days"
              :key="dw.day.id"
              @click="activeDayIndex = idx"
            >
              <text class="day-tab-title">Day{{ dw.day.dayIndex }}</text>
              <text class="day-tab-date">{{ dw.day.date?.slice(5) }}</text>
            </view>
            <!-- ➕ 增加一天按钮 -->
            <view class="day-tab add-day-tab" v-if="isEditing" @click="addDay">
              <text class="add-day-icon">＋</text>
              <text class="add-day-text">加一天</text>
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- 正在生成中提示区 -->
      <view class="generating-box" v-if="plan.status === 0">
        <view class="loading-spinner" />
        <text class="gen-title">AI正在快马加鞭为您规划专属行程</text>
        <text class="gen-sub">可稍后在“我的行程”列表中查看结果...</text>
      </view>

      <!-- AI 规划生成失败友好提示区 -->
      <view class="generating-box fail-box" v-else-if="plan.status === 4">
        <text class="fail-warn-icon">⚠️</text>
        <text class="gen-title fail-title">AI 行程规划未成功完成</text>
        <view class="fail-reason-card">
          <text class="fail-reason-text">{{ plan.description || '规划行程时 AI 旅伴可能有些心不在焉，建议您尝试重新生成。' }}</text>
        </view>
        <view class="fail-actions">
          <button class="fail-btn secondary" @click="goBackToList">返回我的行程</button>
          <button class="fail-btn primary" @click="recreatePlan">重新生成行程</button>
        </view>
      </view>

      <!-- 异常空数据提示区 (如历史遗留的失败记录) -->
      <view class="generating-box" v-else-if="days.length === 0">
        <text style="font-size: 80rpx; margin-bottom: 20rpx">⚠️</text>
        <text class="gen-title">行程数据异常</text>
        <text class="gen-sub">此行程似乎没有生成任何路线内容，建议重新生成</text>
      </view>

      <!-- 当天内容 - 列表视图 -->
      <scroll-view class="scroll-content" scroll-y v-else-if="viewMode === 'list'">
        <template v-if="currentDay">
          <!-- 当日标题 (预览与编辑模式切换) -->
          <view class="day-header" v-if="!isEditing">
            <text class="day-title">{{ currentDay.day.title }}</text>
            <text class="day-desc" v-if="currentDay.day.description">{{ currentDay.day.description }}</text>
          </view>
          
          <view class="day-header editing" v-else>
            <view class="day-header-inputs">
              <input 
                class="edit-day-title" 
                v-model="currentDay.day.title" 
                placeholder="输入当天日程主题(如：初抵丽江·古城初探)" 
                @blur="saveDayInfo"
              />
              <textarea 
                class="edit-day-desc" 
                v-model="currentDay.day.description" 
                placeholder="添加当天行程简介描述..." 
                auto-height
                @blur="saveDayInfo"
              />
            </view>
            <view class="delete-day-btn" v-if="days.length > 1" @click="deleteDay(currentDay.day.id, currentDay.day.dayIndex)">
              <text class="del-icon">🗑️</text>
              <text class="del-text">删此天</text>
            </view>
          </view>

          <!-- 时间线 -->
          <view class="timeline">
            <block
              v-for="(item, idx) in currentDay.items"
              :key="item.id"
            >
              <!-- 往上拖时，在目标项的前面渲染指示器 -->
              <view 
                class="drag-insert-indicator" 
                v-if="dragIndex !== null && dragTargetIndex === idx && dragTargetIndex < dragIndex"
              >
                <view class="indicator-time-placeholder" />
                <view class="indicator-line-wrap">
                  <view class="indicator-dot-glow" />
                  <view class="indicator-line" />
                </view>
                <view class="indicator-card-outline">
                  <text class="indicator-text">⬇ 放手后将移至此处 (时间线将自动级联重整)</text>
                </view>
              </view>

              <view class="timeline-item">
                <!-- 时间 -->
                <view class="timeline-time">
                  <text class="time-text">{{ item.startTime?.slice(0, 5) || '' }}</text>
                </view>

                <!-- 时间轴线 -->
                <view class="timeline-line-wrap">
                  <view
                    class="timeline-dot"
                    :style="{ background: getTypeConfig(item.type).bg }"
                  >
                    <text class="dot-icon">{{ getTypeConfig(item.type).icon }}</text>
                  </view>
                  <view class="timeline-line" v-if="idx < currentDay.items.length - 1" />
                </view>

                <!-- 活动卡片 -->
                <view 
                  class="item-card" 
                  :class="{ 
                    checked: item.checkedIn && !isEditing, 
                    'is-dragging': dragIndex === idx 
                  }" 
                  :style="dragIndex === idx ? { transform: 'translateY(' + dragDeltaY + 'px)', zIndex: 999 } : {}"
                  @click="handleItemClick(item)"
                >
                  <!-- 卡片头部 -->
                  <view class="item-card-header">
                    <text class="item-name">{{ item.name }}</text>
                    
                    <!-- 正常打卡按钮 -->
                    <view
                      v-if="!isEditing"
                      class="checkin-btn"
                      :class="{ done: item.checkedIn }"
                      @click.stop="item.checkedIn ? null : handleCheckInBtnClick(item)"
                    >
                      <text>{{ item.checkedIn ? '✓已打卡' : '打卡' }}</text>
                    </view>
                    
                    <!-- 编辑重排/删除工具组 (拖拽手柄模式) -->
                    <view class="edit-tools-group" v-else @click.stop>
                      <view 
                        class="drag-handle-bar"
                        @touchstart="onTouchStart($event, idx)"
                        @touchmove.stop.prevent="onTouchMove"
                        @touchend="onTouchEnd"
                      >
                        ☰ 拖动
                      </view>
                      <view class="tool-btn delete" @click="deleteItem(item.id)">
                        🗑️
                      </view>
                    </view>
                  </view>

                  <!-- 地址 -->
                  <view class="item-address" v-if="item.address">
                    <text class="addr-dot">●</text>
                    <text class="addr-text">{{ item.address }}</text>
                  </view>

                  <!-- 描述 -->
                  <text class="item-desc" v-if="item.description">{{ item.description }}</text>

                  <!-- 时长 & 费用 -->
                  <view class="item-meta">
                    <view class="item-meta-row">
                      <text class="meta-clock">🕐</text>
                      <text class="meta-duration" v-if="item.duration">{{ item.duration }}分钟</text>
                      <text class="meta-cost">{{ formatCost(item.estimatedCost) }}</text>
                    </view>
                  </view>

                  <!-- 贴士 -->
                  <view class="item-tips" v-if="item.tips">
                    <text class="tips-icon">💡</text>
                    <text class="tips-text">{{ item.tips }}</text>
                  </view>
                  
                  <!-- 历史打卡记录区 -->
                  <view class="checkin-record-box" v-if="item.checkinRecord && !isEditing">
                    <view class="record-header">
                      <text class="record-title">📸 我的打卡足迹</text>
                      <text class="record-cost" v-if="item.checkinRecord.cost > 0">花费: ¥{{ item.checkinRecord.cost }}</text>
                    </view>
                    <text class="record-content" v-if="item.checkinRecord.content">{{ item.checkinRecord.content }}</text>
                    <view class="record-images" v-if="item.checkinRecord.images && item.checkinRecord.images.length > 0">
                      <image v-for="(img, imgIdx) in item.checkinRecord.images" :key="imgIdx" :src="img" mode="aspectFill" class="r-img" />
                    </view>
                  </view>
                </view>
              </view>

              <!-- 往下拖时，在目标项的后面渲染指示器 -->
              <view 
                class="drag-insert-indicator" 
                v-if="dragIndex !== null && dragTargetIndex === idx && dragTargetIndex > dragIndex"
              >
                <view class="indicator-time-placeholder" />
                <view class="indicator-line-wrap">
                  <view class="indicator-dot-glow" />
                  <view class="indicator-line" />
                </view>
                <view class="indicator-card-outline">
                  <text class="indicator-text">⬇ 放手后将移至此处 (时间线将自动级联重整)</text>
                </view>
              </view>
            </block>

            <!-- ➕ 新增行程明细按钮占位框 -->
            <view class="add-item-card-placeholder" v-if="isEditing" @click="openAddItem">
              <text class="add-card-plus">＋</text>
              <text class="add-card-text">添加日程项目(交通、酒店、景点、餐饮等)</text>
            </view>

            <!-- 空状态 -->
            <view v-if="!currentDay.items.length && !isEditing" class="empty-items">
              <text>当日暂无安排</text>
            </view>
          </view>
        </template>

        <view style="height: 180rpx" />
      </scroll-view>

      <!-- 当天内容 - 地图足迹视图 -->
      <view class="map-view-container" v-else-if="viewMode === 'map' && currentDay">
        <!-- 微信原生 Map 组件 -->
        <map
          id="itineraryMap"
          class="route-map"
          :latitude="mapCenter.latitude"
          :longitude="mapCenter.longitude"
          :scale="mapScale"
          :markers="mapMarkers"
          :polyline="mapPolylines"
          @markertap="onMarkerTap"
          show-location
        />

        <!-- 地图工具栏 (高品质悬浮磨砂玻璃气泡名称开关) -->
        <view class="map-toolbar">
          <view 
            class="toolbar-item" 
            :class="{ active: showAllCallouts }" 
            @click="showAllCallouts = !showAllCallouts"
          >
            <text class="tool-icon">{{ showAllCallouts ? '👁️' : '🙈' }}</text>
            <text class="tool-text">{{ showAllCallouts ? '隐藏名称' : '显示名称' }}</text>
          </view>
        </view>

        <!-- 底部横向左右滑动卡片滑块 -->
        <scroll-view 
          class="map-card-slider" 
          scroll-x 
          scroll-with-animation
          :scroll-into-view="'map-card-' + activeCardIndex"
        >
          <view class="slider-inner">
            <view 
              v-for="(item, idx) in currentDay.items" 
              :key="item.id"
              :id="'map-card-' + idx"
              class="slider-card"
              :class="{ active: activeCardIndex === idx }"
              @click="focusOnItem(idx); openItemDetail(item)"
            >
              <view class="card-left">
                <text class="card-seq">{{ idx + 1 }}</text>
              </view>
              <view class="card-right">
                <view class="card-title-row">
                  <text class="item-time">{{ item.startTime?.slice(0, 5) || '' }}</text>
                  <!-- 🗺️ 精致的导航小标签按钮 -->
                  <view class="nav-mini-btn" v-if="item.lat && item.lng" @click.stop="goNavigation(item)">
                    🗺️ 导航
                  </view>
                </view>
                <text class="item-name">{{ item.name }}</text>
                <text class="item-addr" v-if="item.address">{{ item.address }}</text>
                <text class="item-desc-short" v-if="item.description">{{ item.description }}</text>
              </view>
            </view>
          </view>
        </scroll-view>
      </view>
    </template>

    <!-- 加载中 -->
    <view v-else-if="loading" class="loading-state">
      <view class="loading-spinner" />
      <text>正在加载行程...</text>
    </view>

    <!-- 底部操作栏 -->
    <view class="footer" v-if="plan && plan.status !== 0 && plan.status !== 4">
      <template v-if="!isEditing">
        <button class="footer-btn secondary" @click="sharePlan">分享行程</button>
        <button class="footer-btn primary" @click="goChat">智能旅伴 / 修改</button>
      </template>
      <template v-else>
        <button class="footer-btn primary edit-exit-btn" @click="isEditing = false">✓ 完成日程编辑</button>
      </template>
    </view>

    <!-- 📝 行程项属性编辑表单抽屉弹窗 -->
    <view class="popup-mask" v-if="showItemForm" @click="showItemForm = false">
      <view class="popup-content" @click.stop>
        <view class="popup-header">
          <text class="popup-title">{{ isEditingItem ? '📝 修改日程安排' : '✨ 新增日程项' }}</text>
          <text class="close-icon" @click="showItemForm = false">✕</text>
        </view>
        
        <scroll-view class="popup-form-scroll" scroll-y>
          <view class="form-item">
            <text class="form-label">日程类型</text>
            <view class="type-selector">
              <view 
                v-for="opt in itemTypeOptions" 
                :key="opt.value"
                class="type-opt"
                :class="{ active: itemForm.type === opt.value }"
                :style="{ 
                  color: itemForm.type === opt.value ? '#ffffff' : '#64748b', 
                  background: itemForm.type === opt.value ? opt.color : '#f1f5f9' 
                }"
                @click="itemForm.type = opt.value"
              >
                {{ opt.label }}
              </view>
            </view>
          </view>

          <view class="form-item">
            <text class="form-label">项目名称</text>
            <input class="form-input" v-model="itemForm.name" placeholder="如：北京故宫博物院、阿婆腊排骨下午茶" />
          </view>

          <view class="form-item">
            <view class="form-label-row">
              <text class="form-label">详细地址</text>
              <view class="choose-location-btn" @click="chooseLocationOnMap">🗺️ 地图选址</view>
            </view>
            <input class="form-input" v-model="itemForm.address" placeholder="选择或输入详细地址(可选)" />
          </view>

          <view class="form-row-grid">
            <view class="form-item">
              <text class="form-label">开始时间</text>
              <picker mode="time" :value="itemForm.startTime" @change="(e:any) => itemForm.startTime = e.detail.value">
                <view class="form-input time-picker">{{ itemForm.startTime }}</view>
              </picker>
            </view>
            <view class="form-item">
              <text class="form-label">结束时间</text>
              <picker mode="time" :value="itemForm.endTime" @change="(e:any) => itemForm.endTime = e.detail.value">
                <view class="form-input time-picker">{{ itemForm.endTime }}</view>
              </picker>
            </view>
          </view>

          <view class="form-row-grid">
            <view class="form-item">
              <text class="form-label">停留时长 (分钟)</text>
              <input class="form-input" type="number" v-model="itemForm.duration" placeholder="120" />
            </view>
            <view class="form-item">
              <text class="form-label">人均预估花费 (元)</text>
              <input class="form-input" type="digit" v-model="itemForm.estimatedCost" placeholder="0" />
            </view>
          </view>

          <view class="form-item">
            <text class="form-label">推荐亮点 & 描述</text>
            <textarea class="form-textarea" v-model="itemForm.description" placeholder="说明该日程点的游玩亮点或推荐原因..." />
          </view>

          <view class="form-item">
            <text class="form-label">AI 避坑贴士</text>
            <textarea class="form-textarea tips-area" v-model="itemForm.tips" placeholder="写写注意细节或AI小贴士..." />
          </view>
        </scroll-view>

        <button class="form-submit-btn" @click="submitItemForm">保存日程安排</button>
      </view>
    </view>
  </view>

  <!-- AI 智能修改全手写遮罩抽屉 -->
  <view class="ai-popup-mask" :class="{ show: showAiDrawer }" @click="closeAiDrawer" v-if="currentDay">
    <view class="ai-popup-container" @click.stop>
      <!-- 顶部拖动条与标题 -->
      <view class="drawer-header">
        <view class="handle-bar" />
        <text class="drawer-title">✨ 智能行程微调助手</text>
        <text class="drawer-close" @click="closeAiDrawer">✕</text>
      </view>
      
      <!-- 聊天记录滚动区 -->
      <scroll-view class="chat-list" scroll-y :scroll-into-view="lastMsgId">
        <view class="chat-welcome">
          <text class="welcome-title">您好！我是您的智能行程规划师 🗺️</text>
          <text class="welcome-sub">您可以直接对我说：“帮我把今天下午的活动换成去外滩散步，呆1小时”，我会自动为您更新数据库并重整全天时间表哦！</text>
        </view>
        
        <view 
          v-for="(msg, idx) in chatMessages" 
          :key="idx" 
          :id="'msg-' + idx"
          class="chat-bubble-wrap"
          :class="msg.role"
        >
          <view class="chat-avatar">{{ msg.role === 'user' ? '👤' : '✨' }}</view>
          <view class="chat-bubble">
            <text class="bubble-content">{{ msg.content }}</text>
          </view>
        </view>
        
        <!-- AI 正在思考中态 -->
        <view class="thinking-box" v-if="isThinking">
          <view class="dot-loader">
            <view class="dot" />
            <view class="dot" />
            <view class="dot" />
          </view>
          <text class="thinking-text">AI 正在进行行程级联重整...</text>
        </view>
      </scroll-view>
      
      <!-- 底部打字输入区 (软键盘自动避让) -->
      <view class="chat-input-bar">
        <input 
          class="chat-input" 
          v-model="inputMsg" 
          placeholder="如：把下午的安排换成去静安寺"
          confirm-type="send"
          :cursor-spacing="20"
          :adjust-position="true"
          @confirm="sendAiModifyRequest"
        />
        <view class="send-btn" :class="{ active: inputMsg.trim() }" @click="sendAiModifyRequest">
          发送
        </view>
      </view>
    </view>
  </view>

  <!-- 视图切换毛玻璃悬浮胶囊 -->
  <view class="view-switch-capsule" v-if="plan && plan.status !== 0 && plan.status !== 4">
    <view 
      class="capsule-item" 
      :class="{ active: viewMode === 'list' }" 
      @click="viewMode = 'list'"
    >
      📋 列表
    </view>
    <view 
      class="capsule-item" 
      :class="{ active: viewMode === 'map' }" 
      @click="viewMode = 'map'"
    >
      🗺️ 地图
    </view>
  </view>

  <!-- 景点详情/游玩建议手写半屏遮罩抽屉 -->
  <view class="item-detail-mask" :class="{ show: showItemDetailDrawer }" @click="closeItemDetailDrawer" v-if="selectedItemForDetail">
    <view class="item-detail-container" @click.stop>
      <!-- 顶部拖动条与标题 -->
      <view class="drawer-header">
        <view class="handle-bar" />
        <text class="drawer-title">🏛️ 景点详情 & AI 建议</text>
        <text class="drawer-close" @click="closeItemDetailDrawer">✕</text>
      </view>
      
      <!-- 景点详情内容滚动区 -->
      <scroll-view class="detail-scroll-view" scroll-y>
        <view class="detail-hero-box">
          <text class="detail-item-name">{{ selectedItemForDetail.name }}</text>
          <view class="detail-item-tags">
            <view class="detail-tag" :style="{ background: getTypeConfig(selectedItemForDetail.type).bg + '20', color: getTypeConfig(selectedItemForDetail.type).bg }">
              {{ getTypeConfig(selectedItemForDetail.type).icon }} {{ getTypeConfig(selectedItemForDetail.type).label || '行程点' }}
            </view>
            <view class="detail-tag cost-tag" v-if="selectedItemForDetail.estimatedCost">
              💰 ¥{{ selectedItemForDetail.estimatedCost }}/人
            </view>
          </view>
        </view>

        <!-- 基础信息行 -->
        <view class="detail-info-card">
          <view class="info-row" v-if="selectedItemForDetail.startTime">
            <text class="info-icon">🕐</text>
            <text class="info-label">建议时间：</text>
            <text class="info-val">{{ selectedItemForDetail.startTime?.slice(0, 5) }} - {{ selectedItemForDetail.endTime?.slice(0, 5) }} ({{ selectedItemForDetail.duration }}分钟)</text>
          </view>
          <view class="info-row" v-if="selectedItemForDetail.address" @click="goNavigation(selectedItemForDetail)">
            <text class="info-icon">📍</text>
            <text class="info-label">详细地址：</text>
            <text class="info-val addr-link">{{ selectedItemForDetail.address }} ➔</text>
          </view>
        </view>

        <!-- AI 游玩建议 & 亮点 -->
        <view class="detail-section" v-if="selectedItemForDetail.description">
          <view class="section-title">
            <text class="title-spark">✨</text>
            <text>AI 推荐游玩亮点</text>
          </view>
          <view class="section-content description-box">
            <text>{{ selectedItemForDetail.description }}</text>
          </view>
        </view>

        <!-- AI 避坑贴士 -->
        <view class="detail-section" v-if="selectedItemForDetail.tips">
          <view class="section-title warning-title">
            <text class="title-spark">💡</text>
            <text>AI 独家避坑贴士</text>
          </view>
          <view class="section-content tips-box">
            <text>{{ selectedItemForDetail.tips }}</text>
          </view>
        </view>
        
        <view style="height: 60rpx;" />
      </scroll-view>
      
      <!-- 底部导航大按钮 -->
      <view class="drawer-footer-bar">
        <button class="nav-large-btn" @click="goNavigation(selectedItemForDetail)" :disabled="!selectedItemForDetail.lat || !selectedItemForDetail.lng">
          <text class="btn-icon">🗺️</text>
          <text>{{ selectedItemForDetail.lat && selectedItemForDetail.lng ? '唤起手机地图导航' : '暂无空间位置(无法导航)' }}</text>
        </button>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.detail-page {
  min-height: 100vh;
  background: #f0f9ff;
  display: flex;
  flex-direction: column;
}

/* ── Hero ── */
.hero {
  background: linear-gradient(160deg, #0c4a6e 0%, #0369a1 50%, #0ea5e9 100%);
  padding: 0 32rpx 40rpx;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 6rpx 20rpx;
  border-radius: 100rpx;
  margin-top: 16rpx;
  margin-bottom: 20rpx;
  font-size: 22rpx;
  font-weight: 600;
}

.plan-title {
  font-size: 38rpx;
  font-weight: 800;
  color: #fff;
  line-height: 1.4;
  display: block;
  margin-bottom: 12rpx;
}

.plan-route {
  font-size: 26rpx;
  color: rgba(255,255,255,0.8);
  display: block;
  margin-bottom: 20rpx;
}

.hero-meta {
  display: flex;
  gap: 24rpx;
  margin-bottom: 28rpx;
}
.meta-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
}
.meta-icon { font-size: 28rpx; }
.meta-text { font-size: 24rpx; color: rgba(255,255,255,0.85); }

.progress-wrap {
  background: rgba(255,255,255,0.12);
  border-radius: 20rpx;
  padding: 20rpx 24rpx;
}
.progress-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12rpx;
}
.progress-label { font-size: 24rpx; color: rgba(255,255,255,0.8); }
.progress-pct { font-size: 24rpx; font-weight: 700; color: #fff; }
.progress-bar {
  height: 8rpx;
  background: rgba(255,255,255,0.2);
  border-radius: 100rpx;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: #38bdf8;
  border-radius: 100rpx;
  transition: width 0.5s ease;
}

/* ── Day 标签 ── */
.day-tabs-wrap {
  background: #fff;
  border-bottom: 1rpx solid #e2e8f0;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.05);
}
.day-tabs { white-space: nowrap; }
.day-tabs-inner {
  display: inline-flex;
  padding: 0 16rpx;
  gap: 0;
}
.day-tab {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx 28rpx;
  border-bottom: 4rpx solid transparent;
  transition: all 0.2s;
  white-space: nowrap;

  &.active {
    border-bottom-color: #0ea5e9;
    .day-tab-title { color: #0ea5e9; font-weight: 800; }
    .day-tab-date { color: #0ea5e9; }
  }
}
.day-tab-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #94a3b8;
  margin-bottom: 4rpx;
}
.day-tab-date {
  font-size: 20rpx;
  color: #cbd5e1;
}

/* ── 当日内容 ── */
.scroll-content {
  flex: 1;
}

.day-header {
  padding: 32rpx 32rpx 16rpx;
}
.day-title {
  font-size: 34rpx;
  font-weight: 800;
  color: #0f172a;
  display: block;
  margin-bottom: 8rpx;
}
.day-desc {
  font-size: 26rpx;
  color: #64748b;
  line-height: 1.6;
  display: block;
}

/* ── 时间线 ── */
.timeline {
  padding: 0 0 0 16rpx;
}

.timeline-item {
  display: flex;
  align-items: flex-start;
  gap: 0;
}

.timeline-time {
  width: 120rpx;
  padding-top: 24rpx;
  flex-shrink: 0;
  text-align: right;
  padding-right: 16rpx;
}
.time-text {
  font-size: 22rpx;
  color: #94a3b8;
  font-weight: 500;
}

.timeline-line-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 60rpx;
  flex-shrink: 0;
  padding-top: 20rpx;
}
.timeline-dot {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  z-index: 1;
}
.dot-icon { font-size: 26rpx; }
.timeline-line {
  width: 4rpx;
  flex: 1;
  min-height: 40rpx;
  background: #e2e8f0;
  margin-top: 8rpx;
  border-radius: 2rpx;
}

/* ── 拖拽插入落点指示器 (Insert Indicator) ── */
.drag-insert-indicator {
  display: flex;
  align-items: center;
  gap: 0;
  width: 100%;
  animation: indicator-slide-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes indicator-slide-in {
  from {
    opacity: 0;
    transform: scaleY(0.4);
    max-height: 0;
  }
  to {
    opacity: 1;
    transform: scaleY(1);
    max-height: 200rpx;
  }
}

.indicator-time-placeholder {
  width: 120rpx;
  padding-right: 16rpx;
  flex-shrink: 0;
}

.indicator-line-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 60rpx;
  flex-shrink: 0;
}

.indicator-dot-glow {
  width: 20rpx;
  height: 20rpx;
  border-radius: 50%;
  background: #0ea5e9;
  box-shadow: 0 0 12rpx #0ea5e9, 0 0 24rpx rgba(14, 165, 233, 0.6);
  animation: indicator-pulse 1.2s infinite ease-in-out;
}

@keyframes indicator-pulse {
  0%, 100% {
    transform: scale(0.9);
    opacity: 0.7;
    box-shadow: 0 0 12rpx #0ea5e9, 0 0 24rpx rgba(14, 165, 233, 0.6);
  }
  50% {
    transform: scale(1.25);
    opacity: 1;
    box-shadow: 0 0 24rpx #0ea5e9, 0 0 48rpx rgba(14, 165, 233, 0.9);
  }
}

.indicator-line {
  width: 4rpx;
  height: 40rpx;
  background: linear-gradient(to bottom, #0ea5e9, transparent);
  margin-top: 6rpx;
}

.indicator-card-outline {
  flex: 1;
  background: rgba(240, 249, 255, 0.75); /* 极轻灵淡雅的毛玻璃蓝色背景 */
  backdrop-filter: blur(8px);
  border: 3rpx dashed #0ea5e9;
  border-radius: 20rpx;
  padding: 24rpx;
  margin: 12rpx 24rpx 12rpx 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  box-shadow: 0 8rpx 24rpx rgba(14, 165, 233, 0.12);
  
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 8rpx;
    height: 100%;
    background: linear-gradient(to bottom, #0ea5e9, #38bdf8);
  }
}

.indicator-text {
  font-size: 24rpx;
  color: #0369a1;
  font-weight: 700;
  letter-spacing: 1.5rpx;
  animation: text-glow 1.5s infinite alternate ease-in-out;
}

@keyframes text-glow {
  from {
    opacity: 0.75;
    text-shadow: 0 0 4rpx rgba(14, 165, 233, 0.1);
  }
  to {
    opacity: 1;
    text-shadow: 0 0 12rpx rgba(14, 165, 233, 0.4);
  }
}

/* ── 活动卡片 ── */
.item-card {
  flex: 1;
  background: #fff;
  border-radius: 20rpx;
  padding: 20rpx 24rpx;
  margin: 12rpx 24rpx 12rpx 12rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06);
  transition: opacity 0.2s, transform 0.2s;

  &.checked { opacity: 0.7; }
  
  &.is-dragging {
    box-shadow: 0 16rpx 40rpx rgba(3, 105, 161, 0.22) !important;
    transform: scale(1.03) !important;
    background: #f0f9ff !important;
    border: 1rpx solid #bae6fd !important;
    opacity: 0.96 !important;
    z-index: 9999 !important;
    transition: none !important; /* 关键：拖动时必须为零过渡，确保极致跟手 */
  }
}

.item-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10rpx;
}
.item-name {
  font-size: 30rpx;
  font-weight: 700;
  color: #0f172a;
  flex: 1;
  margin-right: 16rpx;
}

.checkin-btn {
  background: #0ea5e9;
  color: #fff;
  font-size: 22rpx;
  font-weight: 600;
  padding: 8rpx 20rpx;
  border-radius: 100rpx;
  white-space: nowrap;
  flex-shrink: 0;

  &.done {
    background: #d1fae5;
    color: #059669;
  }
}

.item-address {
  display: flex;
  align-items: flex-start;
  gap: 8rpx;
  margin-bottom: 8rpx;
}
.addr-dot {
  font-size: 16rpx;
  color: #ef4444;
  margin-top: 4rpx;
  flex-shrink: 0;
}
.addr-text {
  font-size: 24rpx;
  color: #64748b;
  line-height: 1.5;
}

.item-desc {
  font-size: 26rpx;
  color: #475569;
  line-height: 1.6;
  display: block;
  margin-bottom: 12rpx;
}

.item-meta { margin-bottom: 10rpx; }
.item-meta-row {
  display: flex;
  align-items: center;
  gap: 8rpx;
}
.meta-clock { font-size: 24rpx; }
.meta-duration {
  font-size: 24rpx;
  color: #64748b;
}
.meta-cost {
  font-size: 24rpx;
  color: #0369a1;
  font-weight: 600;
  margin-left: 12rpx;
}

.item-tips {
  background: #fef9c3;
  border-radius: 12rpx;
  padding: 14rpx 16rpx;
  display: flex;
  align-items: flex-start;
  gap: 8rpx;
}
.tips-icon { font-size: 24rpx; flex-shrink: 0; }
.tips-text { font-size: 24rpx; color: #92400e; line-height: 1.5; }

.empty-items {
  text-align: center;
  padding: 80rpx;
  color: #94a3b8;
  font-size: 28rpx;
}

.checkin-record-box {
  margin-top: 24rpx;
  padding: 20rpx;
  background: #f8fafc;
  border-radius: 16rpx;
  border: 1rpx solid #e2e8f0;
}
.record-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12rpx;
}
.record-title {
  font-size: 26rpx;
  font-weight: 600;
  color: #0369a1;
}
.record-cost {
  font-size: 24rpx;
  color: #ef4444;
  font-weight: bold;
}
.record-content {
  font-size: 26rpx;
  color: #475569;
  line-height: 1.5;
  margin-bottom: 16rpx;
  display: block;
}
.record-images {
  display: flex;
  gap: 12rpx;
  flex-wrap: wrap;
}
.r-img {
  width: 140rpx;
  height: 140rpx;
  border-radius: 12rpx;
}

/* ── 生成中与加载 ── */
.generating-box {
  padding: 120rpx 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.gen-title {
  margin-top: 40rpx;
  font-size: 32rpx;
  font-weight: 600;
  color: #0369a1;
}
.gen-sub {
  margin-top: 16rpx;
  font-size: 26rpx;
  color: #64748b;
}

.loading-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24rpx;
  color: #94a3b8;
  font-size: 26rpx;
}
.loading-spinner {
  width: 60rpx; height: 60rpx;
  border: 4rpx solid #e2e8f0;
  border-top-color: #0ea5e9;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── 底部操作 ── */
.footer {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  background: #fff;
  padding: 20rpx 32rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  display: flex;
  gap: 20rpx;
  border-top: 1rpx solid #f1f5f9;
  box-shadow: 0 -4rpx 20rpx rgba(0,0,0,0.05);
  z-index: 99;
}
.footer-btn {
  flex: 1; height: 88rpx; border-radius: 44rpx;
  font-size: 30rpx; font-weight: 600; border: none;
  display: flex; align-items: center; justify-content: center;
  
  &.secondary { background: #f1f5f9; color: #475569; }
  &.primary { background: linear-gradient(135deg, #0ea5e9, #0369a1); color: #fff; }
  
  &.edit-exit-btn {
    background: linear-gradient(135deg, #10b981, #059669);
    box-shadow: 0 6rpx 20rpx rgba(16, 185, 129, 0.25);
  }
}

/* ── ✏️ 行程手动编辑高保真样式 ── */

.hero-top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16rpx;
  margin-bottom: 20rpx;
}

.edit-toggle-btn {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border: 1rpx solid rgba(255, 255, 255, 0.25);
  padding: 8rpx 24rpx;
  border-radius: 100rpx;
  display: flex;
  align-items: center;
  gap: 8rpx;
  transition: all 0.2s;
  
  &:active {
    background: rgba(255, 255, 255, 0.35);
  }
  
  .edit-btn-icon {
    color: #ffffff;
    font-size: 24rpx;
  }
  .edit-btn-text {
    color: #ffffff;
    font-size: 24rpx;
    font-weight: bold;
  }
}

.add-day-tab {
  background: #f8fafc !important;
  border: 2rpx dashed #cbd5e1 !important;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12rpx 20rpx !important;
  border-radius: 16rpx;
  margin-left: 16rpx;
  
  .add-day-icon {
    font-size: 26rpx;
    color: #94a3b8;
    font-weight: bold;
  }
  .add-day-text {
    font-size: 20rpx;
    color: #94a3b8;
    margin-top: 4rpx;
  }
}

.day-header.editing {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
  padding: 32rpx;
  background: #fff;
  border-radius: 24rpx;
  margin: 24rpx 32rpx 16rpx;
  box-shadow: var(--shadow-sm);
  box-sizing: border-box;
}

.day-header-inputs {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.edit-day-title {
  font-size: 32rpx;
  font-weight: 800;
  color: #1e293b;
  border-bottom: 2rpx dashed #cbd5e1;
  padding-bottom: 6rpx;
  width: 100%;
}

.edit-day-desc {
  font-size: 26rpx;
  color: #64748b;
  line-height: 1.5;
  width: 100%;
  border-bottom: 2rpx dashed #f1f5f9;
  padding-bottom: 6rpx;
}

.delete-day-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #fef2f2;
  border: 1rpx solid #fee2e2;
  border-radius: 16rpx;
  width: 100rpx;
  height: 100rpx;
  flex-shrink: 0;
  
  &:active {
    background: #fee2e2;
  }
  
  .del-icon {
    font-size: 34rpx;
  }
  .del-text {
    font-size: 18rpx;
    color: #ef4444;
    font-weight: bold;
    margin-top: 4rpx;
  }
}

/* 编辑模式下的手柄重排及删除工具组 */
.edit-tools-group {
  display: flex;
  align-items: center;
  gap: 12rpx;
  
  .drag-handle-bar {
    background: #f1f5f9;
    border: 1rpx solid #e2e8f0;
    color: #475569;
    font-size: 22rpx;
    font-weight: bold;
    padding: 10rpx 24rpx;
    border-radius: 100rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: grab;
    user-select: none;
    box-shadow: 0 2rpx 6rpx rgba(0,0,0,0.03);
    transition: all 0.15s;
    
    &:active {
      background: #e2e8f0;
      cursor: grabbing;
      transform: scale(0.96);
    }
  }

  .tool-btn {
    width: 52rpx;
    height: 52rpx;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
    
    &.delete {
      background: #fef2f2;
      color: #ef4444;
      border: 1rpx solid #fee2e2;
      
      &:active {
        background: #fee2e2;
        transform: scale(0.9);
      }
    }
  }
}

/* 新增行程项占位虚线卡片 */
.add-item-card-placeholder {
  background: rgba(255,255,255,0.7);
  border: 3rpx dashed #cbd5e1;
  border-radius: 20rpx;
  padding: 32rpx;
  margin: 24rpx 32rpx 32rpx 148rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  box-sizing: border-box;
  transition: all 0.2s;
  
  &:active {
    background: #e0f2fe;
    border-color: #0ea5e9;
    .add-card-plus {
      color: #0ea5e9;
      transform: scale(1.1);
    }
    .add-card-text {
      color: #0ea5e9;
    }
  }
  
  .add-card-plus {
    font-size: 48rpx;
    color: #94a3b8;
    font-weight: 500;
    transition: all 0.2s;
  }
  
  .add-card-text {
    font-size: 24rpx;
    color: #94a3b8;
    font-weight: 600;
    text-align: center;
  }
}

/* 📝 表单弹窗样式 */
.popup-mask {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(8px);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
}

.popup-content {
  background: #ffffff;
  width: 100%;
  border-radius: 36rpx 36rpx 0 0;
  padding: 40rpx 32rpx calc(32rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
  box-shadow: 0 -12rpx 36rpx rgba(15, 23, 42, 0.15);
  max-height: 85vh;
  display: flex;
  flex-direction: column;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32rpx;
  flex-shrink: 0;
}

.popup-title {
  font-size: 34rpx;
  font-weight: 800;
  color: #1e293b;
}

.close-icon {
  font-size: 38rpx;
  color: #94a3b8;
  padding: 10rpx;
  &:active {
    color: #475569;
  }
}

.popup-form-scroll {
  flex: 1;
  overflow-y: scroll;
  padding-bottom: 40rpx;
}

.form-item {
  margin-bottom: 28rpx;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.form-label {
  font-size: 26rpx;
  color: #475569;
  font-weight: 700;
}

.form-input {
  background: #f8fafc;
  border: 1rpx solid #e2e8f0;
  height: 84rpx;
  border-radius: 16rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  color: #1e293b;
  display: flex;
  align-items: center;
  box-sizing: border-box;
  
  &.time-picker {
    justify-content: center;
    font-weight: bold;
    color: #0284c7;
    background: #e0f2fe20;
    border-color: #bae6fd;
  }
}

.form-row-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
}

.form-textarea {
  width: 100%;
  height: 140rpx;
  background: #f8fafc;
  border: 1rpx solid #e2e8f0;
  border-radius: 16rpx;
  padding: 20rpx;
  font-size: 28rpx;
  color: #1e293b;
  box-sizing: border-box;
  
  &.tips-area {
    background: #fffbeb;
    border-color: #fef3c7;
    color: #92400e;
  }
}

.type-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.type-opt {
  font-size: 24rpx;
  padding: 12rpx 24rpx;
  border-radius: 100rpx;
  font-weight: bold;
  transition: all 0.2s;
  
  &.active {
    transform: scale(1.05);
    box-shadow: 0 4rpx 10rpx rgba(0,0,0,0.08);
  }
}

.form-submit-btn {
  background: linear-gradient(135deg, #0ea5e9, #0369a1);
  color: #ffffff;
  font-size: 32rpx;
  font-weight: bold;
  height: 94rpx;
  border-radius: 47rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6rpx 20rpx rgba(14, 165, 233, 0.35);
  margin-top: 24rpx;
  flex-shrink: 0;
  border: none;
  
  &:active {
    transform: scale(0.98);
    opacity: 0.9;
  }
}

/* ── 自定义全手写 AI 智能微调遮罩抽屉 ── */
.ai-popup-mask {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(16px);
  z-index: 99999;
  opacity: 0;
  visibility: hidden;
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  align-items: flex-end;
  
  &.show {
    opacity: 1;
    visibility: visible;
    .ai-popup-container {
      transform: translateY(0);
    }
  }
}

.ai-popup-container {
  width: 100%;
  height: 75vh;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(30px);
  border-top-left-radius: 40rpx;
  border-top-right-radius: 40rpx;
  box-shadow: 0 -20rpx 60rpx rgba(15, 23, 42, 0.2);
  transform: translateY(100%);
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 32rpx 32rpx calc(24rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

.drawer-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  padding-bottom: 24rpx;
  border-bottom: 1rpx solid rgba(226, 232, 240, 0.6);
  flex-shrink: 0;
  
  .handle-bar {
    width: 80rpx;
    height: 8rpx;
    background: #cbd5e1;
    border-radius: 100rpx;
    margin-bottom: 16rpx;
  }
  .drawer-title {
    font-size: 32rpx;
    font-weight: 800;
    color: #0f172a;
  }
  .drawer-close {
    position: absolute;
    right: 8rpx;
    top: 8rpx;
    font-size: 36rpx;
    color: #64748b;
    padding: 10rpx;
  }
}

.chat-list {
  flex: 1;
  min-height: 0; /* 极致关键：防内容将flex父容器撑破导致输入框被挤出屏幕 */
  padding: 24rpx 0;
}

.chat-welcome {
  background: rgba(14, 165, 233, 0.08);
  border: 1rpx dashed rgba(14, 165, 233, 0.3);
  border-radius: 24rpx;
  padding: 24rpx;
  margin-bottom: 32rpx;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  
  .welcome-title { font-size: 26rpx; font-weight: 700; color: #0369a1; }
  .welcome-sub { font-size: 22rpx; color: #475569; line-height: 1.5; }
}

.chat-bubble-wrap {
  display: flex;
  gap: 16rpx;
  margin-bottom: 24rpx;
  animation: bubble-fade-in 0.3s forwards ease-out;
  
  &.user {
    flex-direction: row-reverse;
    .chat-bubble {
      background: linear-gradient(135deg, #0ea5e9, #0284c7);
      color: #fff;
      border-top-right-radius: 4rpx;
    }
  }
  &.assistant {
    .chat-bubble {
      background: #fff;
      color: #0f172a;
      border-top-left-radius: 4rpx;
      box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.04);
    }
  }
  
  .chat-avatar {
    width: 60rpx;
    height: 60rpx;
    border-radius: 50%;
    background: rgba(226, 232, 240, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28rpx;
    box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.05);
  }
  .chat-bubble {
    max-width: 70%;
    padding: 18rpx 24rpx;
    border-radius: 20rpx;
    
    .bubble-content {
      font-size: 26rpx;
      line-height: 1.6;
    }
  }
}

@keyframes bubble-fade-in {
  from { opacity: 0; transform: translateY(15rpx); }
  to { opacity: 1; transform: translateY(0); }
}

.chat-input-bar {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 20rpx 0;
  border-top: 1rpx solid rgba(226, 232, 240, 0.6);
  flex-shrink: 0; /* 极致关键：防输入栏被撑破挤扁 */
  background: transparent;
  box-sizing: border-box;
  
  .chat-input {
    flex: 1;
    background: #f1f5f9;
    border-radius: 100rpx;
    padding: 18rpx 32rpx;
    font-size: 26rpx;
    color: #0f172a;
  }
  .send-btn {
    background: #cbd5e1;
    color: #fff;
    font-size: 26rpx;
    font-weight: 700;
    padding: 18rpx 36rpx;
    border-radius: 100rpx;
    transition: all 0.2s;
    
    &.active {
      background: linear-gradient(135deg, #0ea5e9, #8b5cf6);
      box-shadow: 0 4rpx 12rpx rgba(14, 165, 233, 0.3);
    }
  }
}

/* AI 思考中态 dot-loader */
.thinking-box {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 12rpx 24rpx;
  
  .thinking-text { font-size: 22rpx; color: #94a3b8; }
  
  .dot-loader {
    display: flex;
    gap: 6rpx;
    .dot {
      width: 10rpx;
      height: 10rpx;
      background: #0ea5e9;
      border-radius: 50%;
      animation: thinking-dot 1.2s infinite ease-in-out;
      
      &:nth-child(2) { animation-delay: 0.2s; }
      &:nth-child(3) { animation-delay: 0.4s; }
    }
  }
}

@keyframes thinking-dot {
  0%, 100% { transform: scale(0.6); opacity: 0.4; }
  50% { transform: scale(1.2); opacity: 1; }
}

/* ── 📋 / 🗺️ 视图切换毛玻璃胶囊 ── */
.view-switch-capsule {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  bottom: calc(140rpx + env(safe-area-inset-bottom)); /* 稳稳立在底栏之上 */
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(16px);
  border: 1rpx solid rgba(226, 232, 240, 0.8);
  border-radius: 100rpx;
  display: flex;
  padding: 6rpx;
  box-shadow: 0 8rpx 32rpx rgba(15, 23, 42, 0.12);
  z-index: 999;
  transition: all 0.3s ease;
  
  .capsule-item {
    padding: 12rpx 36rpx;
    font-size: 24rpx;
    font-weight: 700;
    color: #64748b;
    border-radius: 100rpx;
    transition: all 0.25s ease;
    white-space: nowrap;
    
    &.active {
      background: linear-gradient(135deg, #0ea5e9, #0369a1);
      color: #fff;
      box-shadow: 0 4rpx 12rpx rgba(14, 165, 233, 0.3);
    }
  }
}

/* ── 🗺️ 地图轨迹视图容器 ── */
.map-view-container {
  position: relative;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 120rpx); /* 精准扣除头部导航栏高度 */
  background: #f8fafc;
  
  .route-map {
    width: 100%;
    height: 65%; /* 地图占上半身 65% 空间 */
  }
}

/* ── 底部横向行程滑块 ── */
.map-card-slider {
  height: 35%; /* 卡片滑块占下半身 35% 空间 */
  background: linear-gradient(to bottom, #f8fafc, #f0f9ff);
  box-sizing: border-box;
  padding: 20rpx 0;
  
  .slider-inner {
    display: inline-flex;
    padding: 0 32rpx;
    gap: 24rpx;
    height: 100%;
    box-sizing: border-box;
    align-items: center;
  }
  
  .slider-card {
    display: flex;
    background: #ffffff;
    border: 2rpx solid rgba(226, 232, 240, 0.8);
    border-radius: 24rpx;
    width: 480rpx; /* 固定宽度，支持横向划动 */
    height: 90%;
    padding: 24rpx;
    box-sizing: border-box;
    box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.03);
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    
    &.active {
      border-color: #0ea5e9;
      background: #f0f9ff;
      box-shadow: 0 10rpx 28rpx rgba(14, 165, 233, 0.15);
      transform: scale(1.02);
    }
    
    .card-left {
      width: 60rpx;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      flex-shrink: 0;
      
      .card-seq {
        width: 40rpx; height: 40rpx;
        border-radius: 50%;
        background: #0284c7;
        color: #fff;
        font-size: 22rpx;
        font-weight: 700;
        display: flex; align-items: center; justify-content: center;
      }
    }
    
    .card-right {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 6rpx;
      overflow: hidden;
      
      .card-title-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .item-time {
        font-size: 22rpx;
        color: #0284c7;
        font-weight: 700;
      }
      
      .nav-mini-btn {
        background: linear-gradient(135deg, #38bdf8, #0284c7);
        color: #fff;
        font-size: 20rpx;
        font-weight: 700;
        padding: 4rpx 16rpx;
        border-radius: 100rpx;
        box-shadow: 0 2rpx 8rpx rgba(2, 132, 199, 0.2);
        transition: all 0.2s;
        
        &:active {
          transform: scale(0.92);
          opacity: 0.9;
        }
      }
      
      .item-name {
        font-size: 28rpx;
        font-weight: 700;
        color: #0f172a;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }
      
      .item-addr {
        font-size: 22rpx;
        color: #64748b;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }
      
      .item-desc-short {
        font-size: 20rpx;
        color: #94a3b8;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        margin-top: 4rpx;
      }
    }
  }
}

/* ── 🏛️ 景点详情 & AI 游玩建议半屏抽屉样式 ── */
.item-detail-mask {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(16px);
  z-index: 99999;
  opacity: 0;
  visibility: hidden;
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  align-items: flex-end;
  
  &.show {
    opacity: 1;
    visibility: visible;
    .item-detail-container {
      transform: translateY(0);
    }
  }
}

.item-detail-container {
  width: 100%;
  height: 75vh;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(30px);
  border-top-left-radius: 40rpx;
  border-top-right-radius: 40rpx;
  box-shadow: 0 -20rpx 60rpx rgba(15, 23, 42, 0.2);
  transform: translateY(100%);
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 32rpx 32rpx calc(24rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

.detail-scroll-view {
  flex: 1;
  min-height: 0;
  padding: 12rpx 0;
}

.detail-hero-box {
  margin-bottom: 28rpx;
  
  .detail-item-name {
    font-size: 38rpx;
    font-weight: 800;
    color: #0f172a;
    line-height: 1.3;
    display: block;
    margin-bottom: 16rpx;
  }
  
  .detail-item-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 12rpx;
  }
  
  .detail-tag {
    font-size: 22rpx;
    font-weight: 700;
    padding: 6rpx 20rpx;
    border-radius: 100rpx;
    
    &.cost-tag {
      background: #f0fdf4;
      color: #16a34a;
    }
  }
}

.detail-info-card {
  background: #ffffff;
  border: 1rpx solid rgba(226, 232, 240, 0.8);
  border-radius: 24rpx;
  padding: 24rpx;
  margin-bottom: 32rpx;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  box-shadow: 0 4rpx 12rpx rgba(15, 23, 42, 0.02);
  
  .info-row {
    display: flex;
    align-items: flex-start;
    gap: 12rpx;
    
    .info-icon {
      font-size: 28rpx;
      line-height: 1.2;
    }
    
    .info-label {
      font-size: 24rpx;
      color: #64748b;
      font-weight: 700;
      white-space: nowrap;
    }
    
    .info-val {
      font-size: 24rpx;
      color: #334155;
      font-weight: 600;
      line-height: 1.4;
      
      &.addr-link {
        color: #0ea5e9;
        text-decoration: underline;
        transition: opacity 0.2s;
        &:active { opacity: 0.7; }
      }
    }
  }
}

.detail-section {
  margin-bottom: 32rpx;
  
  .section-title {
    display: flex;
    align-items: center;
    gap: 8rpx;
    margin-bottom: 16rpx;
    font-size: 28rpx;
    font-weight: 800;
    color: #0f172a;
    
    .title-spark {
      font-size: 28rpx;
      color: #0ea5e9;
    }
    
    &.warning-title {
      .title-spark {
        color: #f59e0b;
      }
    }
  }
  
  .section-content {
    font-size: 26rpx;
    line-height: 1.6;
    padding: 20rpx 24rpx;
    border-radius: 20rpx;
    
    &.description-box {
      background: rgba(14, 165, 233, 0.06);
      color: #334155;
      border: 1rpx solid rgba(14, 165, 233, 0.1);
    }
    
    &.tips-box {
      background: #fffbeb;
      color: #92400e;
      border: 1rpx solid #fef3c7;
    }
  }
}

.drawer-footer-bar {
  padding: 20rpx 0;
  border-top: 1rpx solid rgba(226, 232, 240, 0.6);
  flex-shrink: 0;
  
  .nav-large-btn {
    width: 100%;
    height: 96rpx;
    border-radius: 48rpx;
    background: linear-gradient(135deg, #0ea5e9, #8b5cf6);
    color: #ffffff;
    font-size: 30rpx;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12rpx;
    border: none;
    box-shadow: 0 8rpx 24rpx rgba(14, 165, 233, 0.35);
    transition: all 0.2s;
    
    &:active {
      transform: scale(0.98);
      opacity: 0.92;
    }
    
    &[disabled] {
      background: #cbd5e1;
      color: #94a3b8;
      box-shadow: none;
      transform: none;
      opacity: 1;
    }
    
    .btn-icon {
      font-size: 32rpx;
    }
  }
}

/* ── 🗺️ 新增/修改表单中地图选址后缀按钮 ── */
.form-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.choose-location-btn {
  font-size: 22rpx;
  font-weight: 700;
  color: #0ea5e9;
  background: rgba(14, 165, 233, 0.08);
  padding: 4rpx 16rpx;
  border-radius: 100rpx;
  transition: all 0.2s;
  
  &:active {
    transform: scale(0.95);
    background: rgba(14, 165, 233, 0.16);
  }
}

/* ── 🗺️ 地图上方的悬浮工具栏 ── */
.map-toolbar {
  position: absolute;
  right: 24rpx;
  top: 140rpx; /* 避开顶部区域 */
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  z-index: 999;
  
  .toolbar-item {
    display: flex;
    align-items: center;
    gap: 8rpx;
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(12px);
    border: 1rpx solid rgba(226, 232, 240, 0.8);
    border-radius: 100rpx;
    padding: 12rpx 24rpx;
    box-shadow: 0 4rpx 16rpx rgba(15, 23, 42, 0.08);
    transition: all 0.25s ease;
    
    &.active {
      background: linear-gradient(135deg, #0ea5e9, #0369a1);
      border-color: rgba(14, 165, 233, 0.2);
      box-shadow: 0 4rpx 16rpx rgba(14, 165, 233, 0.3);
      
      .tool-icon, .tool-text {
        color: #ffffff;
      }
    }
    
    .tool-icon {
      font-size: 24rpx;
      color: #64748b;
    }
    
    .tool-text {
      font-size: 20rpx;
      font-weight: 700;
      color: #64748b;
    }
    
    &:active {
      transform: scale(0.95);
    }
  }
}

/* ── ⚠️ AI 生成失败高情商卡片排版样式 ── */
.fail-box {
  background: linear-gradient(to bottom, #fff5f5, #fffbeb);
  border-radius: 36rpx;
  border: 2rpx solid #fee2e2;
  padding: 80rpx 48rpx !important;
  margin: 100rpx 48rpx;
  box-shadow: 0 12rpx 36rpx rgba(239, 68, 68, 0.05);
  box-sizing: border-box;
  animation: fail-card-fade-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  
  .fail-warn-icon {
    font-size: 100rpx;
    margin-bottom: 24rpx;
    display: block;
    animation: warn-pulse 1.5s infinite alternate ease-in-out;
  }
  
  .fail-title {
    color: #ef4444 !important;
    font-size: 36rpx !important;
    font-weight: 800 !important;
    letter-spacing: 2rpx;
  }
  
  .fail-reason-card {
    background: #ffffff;
    border: 1rpx solid #fee2e2;
    border-radius: 20rpx;
    padding: 24rpx;
    margin: 32rpx 0 48rpx;
    width: 100%;
    box-sizing: border-box;
    box-shadow: inset 0 2rpx 6rpx rgba(15, 23, 42, 0.02);
    
    .fail-reason-text {
      font-size: 26rpx;
      line-height: 1.6;
      color: #7f1d1d;
      font-weight: 700;
      text-align: center;
      display: block;
      word-break: break-all;
    }
  }
  
  .fail-actions {
    display: flex;
    flex-direction: column;
    gap: 20rpx;
    width: 100%;
  }
  
  .fail-btn {
    width: 100%;
    height: 88rpx;
    border-radius: 44rpx;
    font-size: 28rpx;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    transition: all 0.2s;
    
    &.secondary {
      background: #f8fafc;
      border: 1rpx solid #e2e8f0;
      color: #64748b;
      
      &:active {
        background: #f1f5f9;
        transform: scale(0.98);
      }
    }
    
    &.primary {
      background: linear-gradient(135deg, #ef4444, #f59e0b);
      color: #ffffff;
      box-shadow: 0 8rpx 20rpx rgba(239, 68, 68, 0.25);
      
      &:active {
        opacity: 0.9;
        transform: scale(0.98);
      }
    }
  }
}

@keyframes fail-card-fade-in {
  from { opacity: 0; transform: translateY(20rpx) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes warn-pulse {
  from { transform: scale(0.96); opacity: 0.85; }
  to { transform: scale(1.06); opacity: 1; }
}
</style>
