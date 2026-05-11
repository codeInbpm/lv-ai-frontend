<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { discoverApi, type HotDestination } from '../../api/discover'
import type { TravelPlan } from '../../api/plan'

const hotList = ref<HotDestination[]>([])
const planList = ref<TravelPlan[]>([])
const keyword = ref('')
const loading = ref(false)
const hasMore = ref(true)
const page = ref(1)

const statusBarHeight = ref(0)

onMounted(async () => {
  const sysInfo = uni.getSystemInfoSync()
  statusBarHeight.value = sysInfo.statusBarHeight || 20
  await loadData()
})

async function loadData() {
  loading.value = true
  try {
    const [hot, plans] = await Promise.all([
      discoverApi.getHotDestinations(),
      discoverApi.getPublicPlans({ page: 1, size: 10 })
    ])
    hotList.value = hot
    planList.value = plans.records
    hasMore.value = plans.current < plans.pages
    page.value = 1
  } finally {
    loading.value = false
  }
}

async function loadMore() {
  if (!hasMore.value || loading.value) return
  loading.value = true
  page.value++
  try {
    const result = await discoverApi.getPublicPlans({ page: page.value, keyword: keyword.value, size: 10 })
    planList.value.push(...result.records)
    hasMore.value = result.current < result.pages
  } finally {
    loading.value = false
  }
}

async function search() {
  loading.value = true
  try {
    const result = await discoverApi.getPublicPlans({ keyword: keyword.value, page: 1, size: 10 })
    planList.value = result.records
    hasMore.value = result.current < result.pages
    page.value = 1
  } finally {
    loading.value = false
  }
}

function goPlanDetail(planId: number) {
  uni.navigateTo({ url: `/pages/plan/detail/index?planId=${planId}` })
}

function goCreate(destination?: string) {
  if (destination) {
    uni.setStorageSync('prefillDestination', destination)
  }
  uni.navigateTo({ url: '/pages/plan/create/index' })
}
</script>

<template>
  <view class="discover-page">
    <!-- 顶部 -->
    <view class="header" :style="{ paddingTop: statusBarHeight + 'px' }">
      <text class="header-title">✈ 发现好去处</text>
      <view class="search-box">
        <text class="search-icon">🔍</text>
        <input
          v-model="keyword"
          class="search-input"
          placeholder="搜索目的地或行程"
          confirm-type="search"
          @confirm="search"
        />
        <text class="search-btn" @click="search">搜索</text>
      </view>
    </view>

    <scroll-view class="scroll" scroll-y @scrolltolower="loadMore">

      <!-- 热门目的地 -->
      <view class="section">
        <view class="section-header">
          <text class="section-title">🔥 热门目的地</text>
        </view>
        <view class="hot-grid">
          <view
            class="hot-card"
            v-for="dest in hotList"
            :key="dest.name"
            @click="goCreate(dest.name)"
          >
            <view class="hot-img">
              <text class="hot-emoji">🏔</text>
            </view>
            <view class="hot-info">
              <text class="hot-name">{{ dest.name }}</text>
              <text class="hot-desc">{{ dest.desc }}</text>
            </view>
            <text class="hot-btn">规划 ›</text>
          </view>
        </view>
      </view>

      <!-- 精选攻略 -->
      <view class="section">
        <view class="section-header">
          <text class="section-title">📖 精选攻略</text>
        </view>

        <view v-if="!planList.length && !loading" class="empty">
          <text class="empty-icon">🗺️</text>
          <text>暂无攻略，快来发布第一篇吧</text>
        </view>

        <view class="plan-grid">
          <view
            class="plan-card"
            v-for="plan in planList"
            :key="plan.id"
            @click="goPlanDetail(plan.id)"
          >
            <view class="plan-cover">
              <text class="plan-emoji">✈️</text>
              <view class="plan-days-badge">{{ plan.days }}天</view>
            </view>
            <view class="plan-body">
              <text class="plan-title">{{ plan.title }}</text>
              <text class="plan-route">{{ plan.departure }} → {{ plan.destination }}</text>
              <view class="plan-footer">
                <text class="plan-date">{{ plan.startDate }}</text>
                <view class="plan-stats">
                  <text>👁 {{ plan.viewCount }}</text>
                  <text>❤️ {{ plan.collectCount }}</text>
                </view>
              </view>
            </view>
          </view>
        </view>

        <view v-if="loading" class="loading-more">
          <text>加载中...</text>
        </view>
        <view v-else-if="!hasMore && planList.length" class="no-more">
          <text>— 已经到底了 —</text>
        </view>
      </view>

      <view style="height: 100rpx" />
    </scroll-view>
  </view>
</template>

<style lang="scss" scoped>
.discover-page { min-height: 100vh; background: var(--bg-page); display: flex; flex-direction: column; }

.header {
  background: linear-gradient(135deg, #0369a1, #0ea5e9);
  padding: 0 32rpx 32rpx;
}
.header-title {
  font-size: 40rpx;
  font-weight: 800;
  color: #fff;
  display: block;
  padding: 24rpx 0 20rpx;
}

.search-box {
  display: flex;
  align-items: center;
  background: rgba(255,255,255,0.15);
  border-radius: 24rpx;
  padding: 16rpx 20rpx;
  gap: 12rpx;
}
.search-icon { font-size: 28rpx; }
.search-input { flex: 1; font-size: 28rpx; color: #fff; }
.search-btn { font-size: 26rpx; color: rgba(255,255,255,0.8); padding-left: 12rpx; border-left: 1rpx solid rgba(255,255,255,0.3); }

.scroll { flex: 1; }
.section { padding: 32rpx 32rpx 0; }
.section-header { margin-bottom: 20rpx; }
.section-title { font-size: 32rpx; font-weight: 700; color: var(--text-primary); }

.hot-grid { display: flex; flex-direction: column; gap: 16rpx; }
.hot-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 20rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
  box-shadow: var(--shadow-sm);
}
.hot-img {
  width: 80rpx; height: 80rpx;
  background: var(--primary-light);
  border-radius: 16rpx;
  display: flex; align-items: center; justify-content: center;
}
.hot-emoji { font-size: 40rpx; }
.hot-info { flex: 1; }
.hot-name { font-size: 30rpx; font-weight: 600; color: var(--text-primary); display: block; }
.hot-desc { font-size: 24rpx; color: var(--text-tertiary); margin-top: 4rpx; display: block; }
.hot-btn { font-size: 26rpx; color: var(--primary); font-weight: 600; }

.empty {
  display: flex; flex-direction: column; align-items: center;
  padding: 80rpx 0;
  gap: 16rpx;
  font-size: 28rpx;
  color: var(--text-tertiary);
}
.empty-icon { font-size: 80rpx; }

.plan-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16rpx; }
.plan-card {
  background: #fff;
  border-radius: 20rpx;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}
.plan-cover {
  height: 160rpx;
  background: linear-gradient(135deg, #bae6fd, #7dd3fc);
  display: flex; align-items: center; justify-content: center;
  position: relative;
}
.plan-emoji { font-size: 64rpx; }
.plan-days-badge {
  position: absolute;
  bottom: 10rpx; right: 10rpx;
  background: rgba(0,0,0,0.35);
  color: #fff;
  font-size: 20rpx;
  padding: 4rpx 10rpx;
  border-radius: 100rpx;
}
.plan-body { padding: 16rpx; }
.plan-title {
  font-size: 26rpx; font-weight: 600; color: var(--text-primary); display: block;
  overflow: hidden; white-space: nowrap; text-overflow: ellipsis;
  margin-bottom: 6rpx;
}
.plan-route { font-size: 22rpx; color: var(--text-tertiary); display: block; margin-bottom: 10rpx; }
.plan-footer { display: flex; justify-content: space-between; align-items: center; }
.plan-date { font-size: 20rpx; color: var(--text-tertiary); }
.plan-stats { display: flex; gap: 8rpx; font-size: 20rpx; color: var(--text-tertiary); }

.loading-more, .no-more {
  text-align: center;
  padding: 32rpx;
  font-size: 26rpx;
  color: var(--text-tertiary);
}
</style>
