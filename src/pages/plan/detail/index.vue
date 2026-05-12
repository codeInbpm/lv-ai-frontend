<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { planApi, type PlanDetailVO, type TravelItem, type DayWithItems } from '../../../api/plan'
import NavBar from '../../../components/common/NavBar.vue'
import { useNavBar } from '../../../composables/useNavBar'

const planId = ref<number>(0)
const detail = ref<PlanDetailVO | null>(null)
const loading = ref(true)
const activeDayIndex = ref(0)
const { totalHeight: navTotalHeight } = useNavBar()

onLoad((options: any) => {
  if (options.planId) planId.value = Number(options.planId)
})

onMounted(async () => {
  if (planId.value) {
    try {
      detail.value = await planApi.getPlanDetail(planId.value)
    } catch {
      uni.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      loading.value = false
    }
  }
})

const plan = computed(() => detail.value?.plan)
const days = computed(() => detail.value?.days ?? [])
const currentDay = computed(() => days.value[activeDayIndex.value])

// 状态映射
const statusMap: Record<number, { label: string; color: string; bg: string }> = {
  0: { label: '草稿', color: '#64748b', bg: 'rgba(100,116,139,0.2)' },
  1: { label: '未开始', color: '#d97706', bg: 'rgba(217,119,6,0.2)' },
  2: { label: '进行中', color: '#10b981', bg: 'rgba(16,185,129,0.2)' },
  3: { label: '已完成', color: '#0369a1', bg: 'rgba(3,105,161,0.2)' }
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
  const finished = days.value.filter(d => d.day.finished).length
  return Math.round((finished / days.value.length) * 100)
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
          // TODO: 调用打卡API
          item.checkedIn = 1
          uni.showToast({ title: '打卡成功！', icon: 'success' })
        } catch {
          uni.showToast({ title: '打卡失败', icon: 'none' })
        }
      }
    }
  })
}

function sharePlan() {
  uni.showToast({ title: '分享功能开发中', icon: 'none' })
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

        <!-- 状态标签 -->
        <view class="status-badge" :style="{ background: statusMap[plan.status]?.bg }">
          <text :style="{ color: statusMap[plan.status]?.color }">
            {{ statusMap[plan.status]?.label }}
          </text>
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

      <!-- Day 标签栏 -->
      <view class="day-tabs-wrap">
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
              <text class="day-tab-date">{{ dw.day.date }}</text>
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- 当天内容 -->
      <scroll-view class="scroll-content" scroll-y>
        <template v-if="currentDay">
          <!-- 当日标题 -->
          <view class="day-header">
            <text class="day-title">{{ currentDay.day.title }}</text>
            <text class="day-desc" v-if="currentDay.day.description">{{ currentDay.day.description }}</text>
          </view>

          <!-- 时间线 -->
          <view class="timeline">
            <view
              class="timeline-item"
              v-for="(item, idx) in currentDay.items"
              :key="item.id"
            >
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
              <view class="item-card" :class="{ checked: item.checkedIn }">
                <!-- 卡片头部 -->
                <view class="item-card-header">
                  <text class="item-name">{{ item.name }}</text>
                  <view
                    class="checkin-btn"
                    :class="{ done: item.checkedIn }"
                    @click="checkIn(item)"
                  >
                    <text>{{ item.checkedIn ? '✓已打卡' : '打卡' }}</text>
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
              </view>
            </view>

            <!-- 空状态 -->
            <view v-if="!currentDay.items.length" class="empty-items">
              <text>当日暂无安排</text>
            </view>
          </view>
        </template>

        <view style="height: 160rpx" />
      </scroll-view>
    </template>

    <!-- 加载中 -->
    <view v-else-if="loading" class="loading-state">
      <view class="loading-spinner" />
      <text>正在加载行程...</text>
    </view>

    <!-- 底部操作栏 -->
    <view class="footer" v-if="plan">
      <button class="footer-btn secondary" @click="sharePlan">分享行程</button>
      <button class="footer-btn primary" @click="uni.navigateTo({ url: `/pages/plan/create/index` })">私信修改</button>
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

/* ── 活动卡片 ── */
.item-card {
  flex: 1;
  background: #fff;
  border-radius: 20rpx;
  padding: 20rpx 24rpx;
  margin: 12rpx 24rpx 12rpx 12rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06);
  transition: opacity 0.2s;

  &.checked { opacity: 0.7; }
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

/* ── 加载 ── */
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
}
.footer-btn {
  flex: 1; height: 88rpx; border-radius: 44rpx;
  font-size: 30rpx; font-weight: 600; border: none;
  display: flex; align-items: center; justify-content: center;
  
  &.secondary { background: #f1f5f9; color: #475569; }
  &.primary { background: linear-gradient(135deg, #0ea5e9, #0369a1); color: #fff; }
}
</style>
