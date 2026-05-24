<script setup lang="ts">
import { ref, onMounted } from 'vue'
import NavBar from '../../components/common/NavBar.vue'
import { useNavBar } from '../../composables/useNavBar'
import { meApi } from '../../api/me'
import type { TravelPlan } from '../../api/plan'
import { useUserStore } from '../../stores/user'

const { totalHeight: navTotalHeight } = useNavBar()
const userStore = useUserStore()

const tabs = [
  { label: '全部行程', value: 0 },
  { label: '进行中', value: 2 },
  { label: '已完成', value: 3 }
]
const activeTab = ref(0)
const tripList = ref<TravelPlan[]>([])
const loading = ref(false)

onMounted(() => {
  console.log('[trips] mounted, isLogin:', userStore.isLogin, 'token:', !!userStore.token)
  if (userStore.isLogin) {
    fetchTrips()
  } else {
    loading.value = false
  }
})

async function fetchTrips() {
  loading.value = true
  try {
    const res = await meApi.getTrips({ status: activeTab.value, page: 1, size: 50 })
    console.log('[trips] response:', JSON.stringify(res))
    tripList.value = res?.records || []
  } catch (e: any) {
    console.error('[trips] fetchTrips error:', e)
    tripList.value = []
  } finally { loading.value = false }
}

function onTabChange(val: number) {
  activeTab.value = val
  fetchTrips()
}

function goDetail(id: number) {
  uni.navigateTo({ url: `/pages/plan/detail/index?id=${id}` })
}

function goCreate() {
  uni.navigateTo({ url: '/pages/plan/create/index' })
}

function statusLabel(status: number) {
  return ['', '未开始', '进行中', '已完成'][status] || '未知'
}
function statusClass(status: number) {
  return ['', 'status-upcoming', 'status-ongoing', 'status-done'][status] || ''
}
function formatDate(d?: string) {
  if (!d) return ''
  return d.substring(0, 10)
}
</script>

<template>
  <view class="trips-page">
    <NavBar fixed back title="我的行程" textColor="#ffffff"
      background="linear-gradient(135deg, #0c4a6e, #0ea5e9)" :placeholder="true" />

    <!-- Tab -->
    <view class="tab-bar">
      <view v-for="t in tabs" :key="t.value"
        :class="['tab-item', { active: activeTab === t.value }]"
        @click="onTabChange(t.value)">
        <text class="tab-text">{{ t.label }}</text>
        <view v-if="activeTab === t.value" class="tab-line" />
      </view>
    </view>

    <!-- 列表 -->
    <scroll-view scroll-y class="trip-scroll" refresher-enabled
      :refresher-triggered="loading" @refresherrefresh="fetchTrips">
      <!-- 未登录 -->
      <view v-if="!userStore.isLogin" class="empty-state">
        <text class="empty-icon"> </text>
        <text class="empty-title">请先登录</text>
        <text class="empty-desc">登录后查看你的旅行行程</text>
        <button class="empty-btn" @click="uni.navigateTo({ url: '/pages/login/index' })">去登录</button>
      </view>

      <!-- 加载中 -->
      <view v-else-if="loading" class="empty-state">
        <text class="empty-icon">⏳</text>
        <text class="empty-title">加载中...</text>
      </view>

      <!-- 空状态 -->
      <view v-else-if="tripList.length === 0" class="empty-state">
        <text class="empty-icon"> </text>
        <text class="empty-title">还没有行程</text>
        <text class="empty-desc">快去规划一场说走就走的旅行吧</text>
        <button class="empty-btn" @click="goCreate">AI一键规划行程</button>
      </view>

      <!-- 卡片列表 -->
      <view v-for="item in tripList" :key="item.id" class="trip-card card" @click="goDetail(item.id)">
        <view class="card-header">
          <text class="card-title">{{ item.title }}</text>
          <view :class="['status-tag', statusClass(item.status)]">
            <text class="status-text">{{ statusLabel(item.status) }}</text>
          </view>
        </view>
        <view class="card-meta">
          <text class="meta-item">  {{ formatDate(item.startDate) }} ~ {{ formatDate(item.endDate) }}</text>
          <text class="meta-item">  {{ item.destination }}</text>
        </view>
        <view class="card-footer">
          <text class="meta-item" v-if="item.peopleCount"> ‍‍‍ {{ item.peopleCount }}人</text>
          <text class="meta-item" v-if="item.budget">  ¥{{ item.budget }}</text>
          <text class="meta-item" v-if="item.days">⏱ {{ item.days }}天</text>
        </view>
      </view>

      <view style="height: 40rpx" />
    </scroll-view>
  </view>
</template>

<style lang="scss" scoped>
.trips-page {
  min-height: 100vh;
  background: var(--bg-page);
  display: flex;
  flex-direction: column;
}
.tab-bar {
  display: flex;
  background: #fff;
  padding: 0 32rpx;
  box-shadow: var(--shadow-sm);
  flex-shrink: 0;
}
.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24rpx 0;
  position: relative;
}
.tab-text {
  font-size: 28rpx;
  color: var(--text-secondary);
  font-weight: 500;
}
.tab-item.active .tab-text {
  color: var(--primary);
  font-weight: 700;
}
.tab-line {
  position: absolute;
  bottom: 0;
  width: 48rpx;
  height: 4rpx;
  border-radius: 2rpx;
  background: var(--primary);
}
.trip-scroll {
  flex: 1;
  height: 0;
  padding: 24rpx;
}
.trip-card {
  margin-bottom: 20rpx;
  padding: 28rpx;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16rpx;
}
.card-title {
  font-size: 30rpx;
  font-weight: 700;
  color: var(--text-primary);
  flex: 1;
  margin-right: 16rpx;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
}
.status-tag {
  padding: 4rpx 16rpx;
  border-radius: 100rpx;
  flex-shrink: 0;
}
.status-text { font-size: 22rpx; font-weight: 600; }
.status-ongoing { background: #dcfce7; color: #16a34a; }
.status-done { background: #e0f2fe; color: #0284c7; }
.status-upcoming { background: #fef3c7; color: #d97706; }
.card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
  margin-bottom: 12rpx;
}
.meta-item {
  font-size: 24rpx;
  color: var(--text-secondary);
}
.card-footer {
  display: flex;
  gap: 24rpx;
  padding-top: 12rpx;
  border-top: 1rpx solid var(--border);
}
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 0;
}
.empty-icon { font-size: 120rpx; margin-bottom: 24rpx; }
.empty-title { font-size: 32rpx; font-weight: 700; color: var(--text-primary); margin-bottom: 12rpx; }
.empty-desc { font-size: 26rpx; color: var(--text-tertiary); margin-bottom: 40rpx; }
.empty-btn {
  background: linear-gradient(135deg, #0ea5e9, #0369a1);
  color: #fff;
  border-radius: 50rpx;
  padding: 20rpx 48rpx;
  font-size: 28rpx;
  font-weight: 600;
  border: none;
  &::after { border: none; }
}
</style>
