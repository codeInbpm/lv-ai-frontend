<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { planApi, type PlanDetailVO, type TravelItem } from '../../../api/plan'

const props = defineProps<{ planId?: string }>()
const detail = ref<PlanDetailVO | null>(null)
const loading = ref(true)
const activeDayIndex = ref(0)

const typeMap: Record<number, { icon: string; label: string; color: string }> = {
  1: { icon: '🏛️', label: '景点', color: '#0ea5e9' },
  2: { icon: '🍜', label: '美食', color: '#f97316' },
  3: { icon: '🏨', label: '住宿', color: '#8b5cf6' },
  4: { icon: '🚌', label: '交通', color: '#10b981' },
  5: { icon: '🛍️', label: '购物', color: '#ec4899' },
  6: { icon: '🎭', label: '活动', color: '#f59e0b' }
}

onMounted(async () => {
  const planId = props.planId || (uni.getStorageSync('lastPlanId'))
  if (!planId) return

  try {
    detail.value = await planApi.getPlanDetail(Number(planId))
  } finally {
    loading.value = false
  }
})

function goDetail() {
  if (!detail.value) return
  uni.navigateTo({ url: `/pages/plan/detail/index?planId=${detail.value.plan.id}` })
}

function savePlan() {
  uni.showToast({ title: '行程已保存', icon: 'success' })
  setTimeout(() => {
    uni.navigateTo({ url: `/pages/plan/detail/index?planId=${detail.value?.plan.id}` })
  }, 1000)
}

function regenerate() {
  uni.navigateBack()
}

function getItemColor(type: number) {
  return typeMap[type]?.color || '#0ea5e9'
}

function formatCost(cost?: number) {
  if (!cost) return '免费'
  return `¥${cost}`
}
</script>

<template>
  <view class="result-page">
    <!-- 加载状态 -->
    <view v-if="loading" class="loading-state">
      <view class="ai-loading">
        <text class="ai-icon">🤖</text>
        <text class="loading-title">AI正在为你规划行程</text>
        <text class="loading-sub">综合分析偏好 · 优化行程路线 · 精选推荐景点</text>
        <view class="loading-dots">
          <view class="dot" v-for="i in 3" :key="i" />
        </view>
      </view>
    </view>

    <!-- 内容区 -->
    <template v-else-if="detail">
      <!-- 行程头部 -->
      <view class="plan-header">
        <view class="route-badge">
          <text>{{ detail.plan.departure }}</text>
          <text class="route-arrow"> ✈ </text>
          <text>{{ detail.plan.destination }}</text>
        </view>
        <text class="plan-title">{{ detail.plan.title }}</text>
        <text class="plan-desc">{{ detail.plan.description }}</text>
        <view class="plan-tags">
          <view class="plan-tag">📅 {{ detail.plan.days }}天</view>
          <view class="plan-tag">👥 {{ detail.plan.peopleCount || 2 }}人</view>
          <view class="plan-tag" v-if="detail.plan.budget">💰 ¥{{ detail.plan.budget }}</view>
        </view>
      </view>

      <!-- 天数Tab -->
      <scroll-view class="day-tabs" scroll-x>
        <view class="day-tab-list">
          <view
            class="day-tab"
            :class="{ active: activeDayIndex === idx }"
            v-for="(dayItem, idx) in detail.days"
            :key="idx"
            @click="activeDayIndex = idx"
          >
            <text class="day-num">Day{{ dayItem.day.dayIndex }}</text>
            <text class="day-title-short">{{ dayItem.day.title?.slice(0, 5) }}</text>
          </view>
        </view>
      </scroll-view>

      <!-- 当天行程内容 -->
      <scroll-view class="day-content" scroll-y v-if="detail.days[activeDayIndex]">
        <view class="day-info">
          <text class="day-full-title">Day{{ detail.days[activeDayIndex].day.dayIndex }} · {{ detail.days[activeDayIndex].day.title }}</text>
          <text class="day-desc">{{ detail.days[activeDayIndex].day.description }}</text>
        </view>

        <!-- 时间轴 -->
        <view class="timeline">
          <view
            class="timeline-item"
            v-for="(item, iIdx) in detail.days[activeDayIndex].items"
            :key="item.id"
          >
            <!-- 时间线左侧 -->
            <view class="timeline-left">
              <text class="item-time">{{ item.startTime || '' }}</text>
              <view class="timeline-line" :class="{ last: iIdx === detail.days[activeDayIndex].items.length - 1 }" />
            </view>
            <!-- 节点 -->
            <view class="timeline-dot" :style="{ background: getItemColor(item.type) }">
              <text>{{ typeMap[item.type]?.icon }}</text>
            </view>
            <!-- 内容卡片 -->
            <view class="timeline-card">
              <view class="item-header">
                <view class="item-type-badge" :style="{ background: getItemColor(item.type) + '20', color: getItemColor(item.type) }">
                  {{ typeMap[item.type]?.label }}
                </view>
                <text class="item-cost">{{ formatCost(item.estimatedCost) }}</text>
              </view>
              <text class="item-name">{{ item.name }}</text>
              <text class="item-address" v-if="item.address">📍 {{ item.address }}</text>
              <text class="item-duration" v-if="item.duration">⏱ 约{{ item.duration }}分钟</text>
              <text class="item-desc" v-if="item.description">{{ item.description }}</text>
              <view class="item-tips" v-if="item.tips">
                <text class="tips-icon">💡</text>
                <text class="tips-text">{{ item.tips }}</text>
              </view>
            </view>
          </view>
        </view>
        <view style="height: 180rpx" />
      </scroll-view>

      <!-- 底部操作 -->
      <view class="action-bar">
        <view class="action-btn secondary" @click="regenerate">重新生成</view>
        <view class="action-btn primary" @click="savePlan">保存行程 ›</view>
      </view>
    </template>
  </view>
</template>

<style lang="scss" scoped>
.result-page {
  min-height: 100vh;
  background: var(--bg-page);
  display: flex;
  flex-direction: column;
}

.loading-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}

.ai-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx;
}
.ai-icon { font-size: 120rpx; margin-bottom: 32rpx; }
.loading-title { font-size: 36rpx; font-weight: 700; color: var(--text-primary); margin-bottom: 16rpx; }
.loading-sub { font-size: 26rpx; color: var(--text-tertiary); text-align: center; margin-bottom: 40rpx; }
.loading-dots { display: flex; gap: 12rpx; }
.dot {
  width: 16rpx; height: 16rpx;
  background: var(--primary);
  border-radius: 50%;
  animation: bounce 1.2s infinite ease-in-out;
  &:nth-child(2) { animation-delay: 0.2s; }
  &:nth-child(3) { animation-delay: 0.4s; }
}
@keyframes bounce {
  0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
  40% { transform: scale(1.2); opacity: 1; }
}

.plan-header {
  background: linear-gradient(135deg, #0369a1, #0ea5e9);
  padding: 40rpx 32rpx 32rpx;
}

.route-badge {
  display: inline-flex;
  align-items: center;
  background: rgba(255,255,255,0.2);
  border-radius: 100rpx;
  padding: 10rpx 20rpx;
  font-size: 26rpx;
  color: rgba(255,255,255,0.9);
  margin-bottom: 16rpx;
}
.route-arrow { font-size: 28rpx; }

.plan-title {
  font-size: 38rpx;
  font-weight: 800;
  color: #fff;
  display: block;
  margin-bottom: 12rpx;
  line-height: 1.4;
}

.plan-desc {
  font-size: 26rpx;
  color: rgba(255,255,255,0.75);
  display: block;
  margin-bottom: 20rpx;
  line-height: 1.6;
}

.plan-tags { display: flex; gap: 12rpx; flex-wrap: wrap; }
.plan-tag {
  background: rgba(255,255,255,0.2);
  color: #fff;
  font-size: 22rpx;
  padding: 8rpx 16rpx;
  border-radius: 100rpx;
}

.day-tabs {
  background: #fff;
  white-space: nowrap;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.05);
}
.day-tab-list { display: inline-flex; padding: 0 12rpx; }
.day-tab {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx 24rpx;
  border-bottom: 4rpx solid transparent;
  transition: all 0.2s;
  &.active {
    border-bottom-color: var(--primary);
    .day-num { color: var(--primary); }
    .day-title-short { color: var(--primary-dark); }
  }
}
.day-num { font-size: 28rpx; font-weight: 700; color: var(--text-tertiary); }
.day-title-short { font-size: 22rpx; color: var(--text-tertiary); margin-top: 4rpx; }

.day-content { flex: 1; }

.day-info {
  padding: 24rpx 32rpx 16rpx;
  border-bottom: 1rpx solid var(--border);
}
.day-full-title { font-size: 30rpx; font-weight: 700; color: var(--text-primary); display: block; }
.day-desc { font-size: 25rpx; color: var(--text-secondary); margin-top: 6rpx; display: block; }

.timeline { padding: 24rpx 16rpx; }

.timeline-item {
  display: flex;
  align-items: flex-start;
  gap: 0;
  margin-bottom: 8rpx;
  position: relative;
}

.timeline-left {
  width: 100rpx;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.item-time { font-size: 22rpx; color: var(--text-tertiary); margin-bottom: 8rpx; }
.timeline-line {
  width: 2rpx;
  flex: 1;
  min-height: 120rpx;
  background: linear-gradient(to bottom, var(--border), var(--border));
  margin-top: 4rpx;
  &.last { background: transparent; }
}

.timeline-dot {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  flex-shrink: 0;
  margin-top: 0;
  z-index: 1;
}

.timeline-card {
  flex: 1;
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx;
  margin-left: 12rpx;
  box-shadow: var(--shadow-sm);
  margin-bottom: 16rpx;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}
.item-type-badge {
  font-size: 22rpx;
  padding: 6rpx 14rpx;
  border-radius: 100rpx;
  font-weight: 600;
}
.item-cost { font-size: 26rpx; font-weight: 700; color: var(--secondary); }

.item-name {
  font-size: 30rpx;
  font-weight: 700;
  color: var(--text-primary);
  display: block;
  margin-bottom: 8rpx;
}
.item-address, .item-duration {
  font-size: 24rpx;
  color: var(--text-secondary);
  display: block;
  margin-bottom: 6rpx;
}
.item-desc {
  font-size: 26rpx;
  color: var(--text-secondary);
  display: block;
  margin-top: 8rpx;
  line-height: 1.6;
}

.item-tips {
  display: flex;
  gap: 8rpx;
  background: #fffbeb;
  border-radius: 12rpx;
  padding: 16rpx;
  margin-top: 12rpx;
}
.tips-icon { font-size: 26rpx; flex-shrink: 0; }
.tips-text { font-size: 24rpx; color: #92400e; line-height: 1.5; }

.action-bar {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  background: #fff;
  padding: 20rpx 32rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  display: flex;
  gap: 20rpx;
  box-shadow: 0 -4rpx 20rpx rgba(0,0,0,0.06);
}
.action-btn {
  flex: 1;
  height: 90rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 45rpx;
  font-size: 30rpx;
  font-weight: 700;
  &.primary {
    background: linear-gradient(135deg, #0ea5e9, #0369a1);
    color: #fff;
    box-shadow: 0 4rpx 16rpx rgba(14,165,233,0.35);
  }
  &.secondary {
    background: #f1f5f9;
    color: var(--text-secondary);
  }
}
</style>
