<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { planApi, type PlanDetailVO, type TravelItem } from '../../../api/plan'
import { executionApi } from '../../../api/execution'

const props = defineProps<{ planId?: string }>()
const detail = ref<PlanDetailVO | null>(null)
const loading = ref(true)
const activeDayIndex = ref(0)
const showCheckInModal = ref(false)
const currentItem = ref<TravelItem | null>(null)
const checkInNote = ref('')
const recordType = ref(1)
const amount = ref<number | undefined>(undefined)

const typeMap: Record<number, { icon: string; label: string; color: string }> = {
  1: { icon: '🏛️', label: '景点', color: '#0ea5e9' },
  2: { icon: '🍜', label: '美食', color: '#f97316' },
  3: { icon: '🏨', label: '住宿', color: '#8b5cf6' },
  4: { icon: '🚌', label: '交通', color: '#10b981' },
  5: { icon: '🛍️', label: '购物', color: '#ec4899' },
  6: { icon: '🎭', label: '活动', color: '#f59e0b' }
}

const statusMap: Record<number, { label: string; color: string }> = {
  0: { label: '草稿', color: '#94a3b8' },
  1: { label: '未开始', color: '#f59e0b' },
  2: { label: '进行中', color: '#10b981' },
  3: { label: '已完成', color: '#0ea5e9' }
}

onMounted(async () => {
  const planId = props.planId
  if (!planId) return uni.navigateBack()
  try {
    detail.value = await planApi.getPlanDetail(Number(planId))
  } finally {
    loading.value = false
  }
})

function openCheckIn(item: TravelItem) {
  currentItem.value = item
  showCheckInModal.value = true
  checkInNote.value = ''
  recordType.value = 1
  amount.value = undefined
}

async function submitCheckIn() {
  if (!currentItem.value || !detail.value) return
  try {
    await executionApi.checkIn({
      planId: detail.value.plan.id,
      dayId: currentItem.value.dayId,
      itemId: currentItem.value.id,
      type: recordType.value,
      content: checkInNote.value,
      amount: recordType.value === 2 ? amount.value : undefined
    })
    uni.showToast({ title: recordType.value === 1 ? '打卡成功！' : '记账成功！', icon: 'success' })
    showCheckInModal.value = false
    // 刷新数据
    detail.value = await planApi.getPlanDetail(detail.value.plan.id)
  } catch {
    uni.showToast({ title: '操作失败，请重试', icon: 'none' })
  }
}

function shareplan() {
  if (!detail.value) return
  uni.share?.({
    provider: 'weixin',
    scene: 'WXSceneSession',
    type: 0,
    title: detail.value.plan.title,
    summary: `${detail.value.plan.departure} → ${detail.value.plan.destination} ${detail.value.plan.days}天行程`,
    success() { uni.showToast({ title: '分享成功', icon: 'success' }) }
  })
}

async function togglePublic() {
  if (!detail.value) return
  const isPublic = detail.value.plan.isPublic === 1 ? 0 : 1
  await planApi.updatePlan(detail.value.plan.id, { isPublic })
  detail.value.plan.isPublic = isPublic
  uni.showToast({ title: isPublic ? '已设为公开' : '已设为私密', icon: 'none' })
}

async function startPlan() {
  if (!detail.value) return
  await planApi.updatePlan(detail.value.plan.id, { status: 2 })
  detail.value.plan.status = 2
  uni.showToast({ title: '行程已开始！祝旅途愉快 ✈️', icon: 'none' })
}

const progress = computed(() => {
  if (!detail.value) return 0
  const items = detail.value.days.flatMap(d => d.items)
  if (!items.length) return 0
  return Math.round(items.filter(i => i.checkedIn).length / items.length * 100)
})
</script>

<template>
  <view class="detail-page">
    <view v-if="loading" class="loading-center">
      <text>加载中...</text>
    </view>

    <template v-else-if="detail">
      <!-- 顶部信息 -->
      <view class="plan-hero">
        <view class="hero-overlay" />
        <view class="hero-content">
          <view class="status-badge" :style="{ background: statusMap[detail.plan.status]?.color }">
            {{ statusMap[detail.plan.status]?.label }}
          </view>
          <text class="hero-title">{{ detail.plan.title }}</text>
          <text class="hero-route">{{ detail.plan.departure }} ✈ {{ detail.plan.destination }}</text>
          <view class="hero-meta">
            <text>📅 {{ detail.plan.startDate }}</text>
            <text>·</text>
            <text>{{ detail.plan.days }}天</text>
            <text>·</text>
            <text>👥 {{ detail.plan.peopleCount || 2 }}人</text>
          </view>
        </view>
        <!-- 操作按钮 -->
        <view class="hero-actions">
          <view class="hero-action-btn" @click="shareplan">
            <text>分享</text>
          </view>
          <view class="hero-action-btn" @click="togglePublic">
            <text>{{ detail.plan.isPublic ? '私密' : '公开' }}</text>
          </view>
        </view>
      </view>

      <!-- 进度条（进行中显示） -->
      <view class="progress-section" v-if="detail.plan.status === 2">
        <view class="progress-header">
          <text class="progress-label">行程进度</text>
          <text class="progress-value">{{ progress }}%</text>
        </view>
        <view class="progress-bar">
          <view class="progress-fill" :style="{ width: progress + '%' }" />
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
            <text class="day-sub">{{ dayItem.day.date }}</text>
            <view class="day-dot" v-if="dayItem.day.finished" />
          </view>
        </view>
      </scroll-view>

      <!-- 行程明细 -->
      <scroll-view class="items-scroll" scroll-y>
        <view class="day-header" v-if="detail.days[activeDayIndex]">
          <text class="day-title">{{ detail.days[activeDayIndex].day.title }}</text>
          <text class="day-desc">{{ detail.days[activeDayIndex].day.description }}</text>
        </view>

        <view class="timeline" v-if="detail.days[activeDayIndex]">
          <view
            class="timeline-item"
            :class="{ 'checked-in': item.checkedIn }"
            v-for="(item, iIdx) in detail.days[activeDayIndex].items"
            :key="item.id"
          >
            <view class="t-left">
              <text class="t-time">{{ item.startTime || '' }}</text>
            </view>
            <view class="t-connector">
              <view class="t-dot" :style="{ background: typeMap[item.type]?.color || '#0ea5e9' }">
                <text class="t-dot-icon">{{ typeMap[item.type]?.icon }}</text>
              </view>
              <view class="t-line" v-if="iIdx < detail.days[activeDayIndex].items.length - 1" />
            </view>
            <view class="t-card">
              <view class="t-card-top">
                <text class="t-name">{{ item.name }}</text>
                <view
                  class="check-btn"
                  :class="{ done: item.checkedIn }"
                  @click="!item.checkedIn && openCheckIn(item)"
                >
                  <text>{{ item.checkedIn ? '✓ 已打卡' : '打卡' }}</text>
                </view>
              </view>
              <text class="t-addr" v-if="item.address">📍 {{ item.address }}</text>
              <text class="t-desc" v-if="item.description">{{ item.description }}</text>
              <view class="t-meta">
                <text class="t-duration" v-if="item.duration">⏱ {{ item.duration }}分钟</text>
                <text class="t-cost">{{ item.estimatedCost ? `¥${item.estimatedCost}` : '免费' }}</text>
              </view>
              <view class="t-tips" v-if="item.tips">
                <text>💡 {{ item.tips }}</text>
              </view>
              <!-- 打卡成功状态 -->
              <view class="check-success" v-if="item.checkedIn">
                <text>✅ 已打卡 · {{ item.checkInTime?.slice(0, 10) }}</text>
                <text v-if="item.checkInNote"> · {{ item.checkInNote }}</text>
              </view>
            </view>
          </view>
        </view>

        <view style="height: 200rpx" />
      </scroll-view>

      <!-- 开始行程按钮 -->
      <view class="bottom-bar" v-if="detail.plan.status === 1">
        <view class="start-btn" @click="startPlan">
          <text>🚀 开始行程</text>
        </view>
      </view>
    </template>

    <!-- 打卡弹窗 -->
    <view class="modal-mask" v-if="showCheckInModal" @click="showCheckInModal = false">
      <view class="modal-box" @click.stop>
        <text class="modal-title">{{ currentItem?.name }}</text>
        <view class="modal-tabs">
          <view
            class="modal-tab"
            :class="{ active: recordType === 1 }"
            @click="recordType = 1"
          >📷 打卡</view>
          <view
            class="modal-tab"
            :class="{ active: recordType === 2 }"
            @click="recordType = 2"
          >💰 记账</view>
        </view>
        <textarea
          v-model="checkInNote"
          class="modal-textarea"
          placeholder="写点什么..."
        />
        <view class="modal-amount" v-if="recordType === 2">
          <text class="amount-prefix">¥</text>
          <input v-model="amount" type="digit" placeholder="输入金额" class="amount-input" />
        </view>
        <view class="modal-actions">
          <view class="modal-cancel" @click="showCheckInModal = false">取消</view>
          <view class="modal-confirm" @click="submitCheckIn">确认</view>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.detail-page {
  min-height: 100vh;
  background: var(--bg-page);
  display: flex;
  flex-direction: column;
}

.loading-center {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  font-size: 28rpx;
  color: var(--text-tertiary);
}

.plan-hero {
  background: linear-gradient(135deg, #0c4a6e, #0369a1, #0ea5e9);
  padding: calc(env(safe-area-inset-top) + 80rpx) 32rpx 32rpx;
  position: relative;
}

.status-badge {
  display: inline-block;
  color: #fff;
  font-size: 22rpx;
  padding: 6rpx 16rpx;
  border-radius: 100rpx;
  margin-bottom: 16rpx;
}

.hero-title {
  font-size: 38rpx;
  font-weight: 800;
  color: #fff;
  display: block;
  margin-bottom: 8rpx;
}

.hero-route, .hero-meta {
  font-size: 26rpx;
  color: rgba(255,255,255,0.75);
  display: flex;
  gap: 12rpx;
  align-items: center;
  margin-bottom: 8rpx;
}

.hero-actions {
  position: absolute;
  top: calc(env(safe-area-inset-top) + 24rpx);
  right: 24rpx;
  display: flex;
  gap: 12rpx;
}

.hero-action-btn {
  background: rgba(255,255,255,0.2);
  color: #fff;
  font-size: 24rpx;
  padding: 10rpx 20rpx;
  border-radius: 100rpx;
  backdrop-filter: blur(10px);
}

.progress-section {
  background: #fff;
  padding: 24rpx 32rpx;
  border-bottom: 1rpx solid var(--border);
}
.progress-header { display: flex; justify-content: space-between; margin-bottom: 12rpx; }
.progress-label { font-size: 26rpx; color: var(--text-secondary); }
.progress-value { font-size: 26rpx; font-weight: 700; color: var(--primary); }
.progress-bar {
  height: 12rpx;
  background: var(--border);
  border-radius: 100rpx;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(to right, #0ea5e9, #10b981);
  border-radius: 100rpx;
  transition: width 0.5s;
}

.day-tabs { background: #fff; white-space: nowrap; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.05); }
.day-tab-list { display: inline-flex; padding: 0 12rpx; }
.day-tab {
  display: inline-flex; flex-direction: column; align-items: center;
  padding: 16rpx 24rpx;
  border-bottom: 4rpx solid transparent;
  position: relative;
  &.active { border-bottom-color: var(--primary); }
  &.active .day-num { color: var(--primary); }
}
.day-num { font-size: 26rpx; font-weight: 700; color: var(--text-tertiary); }
.day-sub { font-size: 20rpx; color: var(--text-tertiary); margin-top: 2rpx; }
.day-dot {
  position: absolute;
  top: 10rpx; right: 10rpx;
  width: 12rpx; height: 12rpx;
  background: #10b981;
  border-radius: 50%;
}

.items-scroll { flex: 1; }
.day-header {
  padding: 24rpx 32rpx;
  background: #f8fafc;
  border-bottom: 1rpx solid var(--border);
}
.day-title { font-size: 30rpx; font-weight: 700; color: var(--text-primary); display: block; }
.day-desc { font-size: 25rpx; color: var(--text-secondary); margin-top: 6rpx; display: block; }

.timeline { padding: 20rpx 16rpx; }
.timeline-item {
  display: flex;
  gap: 0;
  margin-bottom: 4rpx;
}

.t-left {
  width: 100rpx;
  display: flex;
  align-items: flex-start;
  padding-top: 12rpx;
}
.t-time { font-size: 22rpx; color: var(--text-tertiary); }

.t-connector {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 56rpx;
  flex-shrink: 0;
}
.t-dot {
  width: 48rpx; height: 48rpx;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 24rpx;
  flex-shrink: 0;
  z-index: 1;
}
.t-dot-icon { font-size: 24rpx; }
.t-line {
  width: 2rpx;
  flex: 1;
  min-height: 60rpx;
  background: var(--border);
  margin-top: 4rpx;
}

.t-card {
  flex: 1;
  background: #fff;
  border-radius: 20rpx;
  padding: 20rpx 24rpx;
  margin-left: 12rpx;
  margin-bottom: 16rpx;
  box-shadow: var(--shadow-sm);
}

.checked-in .t-card {
  border-left: 4rpx solid #10b981;
}

.t-card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8rpx;
}
.t-name { font-size: 30rpx; font-weight: 700; color: var(--text-primary); flex: 1; }
.check-btn {
  background: var(--primary);
  color: #fff;
  font-size: 22rpx;
  padding: 8rpx 16rpx;
  border-radius: 100rpx;
  flex-shrink: 0;
  margin-left: 12rpx;
  &.done { background: #10b981; }
}

.t-addr { font-size: 24rpx; color: var(--text-secondary); display: block; margin-bottom: 4rpx; }
.t-desc { font-size: 26rpx; color: var(--text-secondary); display: block; margin-bottom: 8rpx; line-height: 1.5; }
.t-meta { display: flex; gap: 16rpx; margin-top: 8rpx; }
.t-duration, .t-cost { font-size: 24rpx; color: var(--text-tertiary); }
.t-cost { color: var(--secondary); font-weight: 600; }
.t-tips {
  background: #fffbeb;
  border-radius: 12rpx;
  padding: 12rpx;
  margin-top: 12rpx;
  font-size: 24rpx;
  color: #92400e;
  line-height: 1.5;
}
.check-success {
  background: #f0fdf4;
  border-radius: 12rpx;
  padding: 12rpx;
  margin-top: 12rpx;
  font-size: 24rpx;
  color: #166534;
}

.bottom-bar {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  background: #fff;
  padding: 20rpx 32rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  box-shadow: 0 -4rpx 20rpx rgba(0,0,0,0.06);
}
.start-btn {
  background: linear-gradient(135deg, #0ea5e9, #0369a1);
  color: #fff;
  height: 90rpx;
  border-radius: 45rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: 700;
  box-shadow: 0 4rpx 16rpx rgba(14,165,233,0.35);
}

.modal-mask {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: flex-end;
  z-index: 999;
}
.modal-box {
  background: #fff;
  border-radius: 32rpx 32rpx 0 0;
  padding: 40rpx 32rpx;
  padding-bottom: calc(40rpx + env(safe-area-inset-bottom));
  width: 100%;
}
.modal-title { font-size: 34rpx; font-weight: 700; display: block; margin-bottom: 24rpx; color: var(--text-primary); }
.modal-tabs { display: flex; gap: 16rpx; margin-bottom: 24rpx; }
.modal-tab {
  flex: 1;
  padding: 16rpx;
  border-radius: 16rpx;
  text-align: center;
  font-size: 28rpx;
  background: #f1f5f9;
  color: var(--text-secondary);
  &.active { background: var(--primary-light); color: var(--primary-dark); font-weight: 600; }
}
.modal-textarea {
  width: 100%;
  height: 120rpx;
  background: #f8fafc;
  border-radius: 16rpx;
  padding: 16rpx;
  font-size: 28rpx;
  color: var(--text-primary);
  margin-bottom: 20rpx;
  box-sizing: border-box;
}
.modal-amount {
  display: flex;
  align-items: center;
  background: #f8fafc;
  border-radius: 16rpx;
  padding: 16rpx 24rpx;
  margin-bottom: 20rpx;
}
.amount-prefix { font-size: 32rpx; color: var(--secondary); font-weight: 700; margin-right: 12rpx; }
.amount-input { flex: 1; font-size: 32rpx; }
.modal-actions { display: flex; gap: 16rpx; }
.modal-cancel, .modal-confirm {
  flex: 1; height: 88rpx;
  display: flex; align-items: center; justify-content: center;
  border-radius: 44rpx;
  font-size: 30rpx; font-weight: 600;
}
.modal-cancel { background: #f1f5f9; color: var(--text-secondary); }
.modal-confirm { background: linear-gradient(135deg, #0ea5e9, #0369a1); color: #fff; }
</style>
