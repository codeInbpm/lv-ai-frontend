<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '../../stores/user'
import { discoverApi, type HotDestination } from '../../api/discover'
import type { TravelPlan } from '../../api/plan'
import NavBar from '../../components/common/NavBar.vue'
import { useNavBar } from '../../composables/useNavBar'

const userStore = useUserStore()
const hotDestinations = ref<HotDestination[]>([])
const publicPlans = ref<TravelPlan[]>([])

const { totalHeight: navTotalHeight } = useNavBar()

const bannerList = ref([
  { title: '三亚·蓝色天堂', tag: '海岛度假', gradient: 'linear-gradient(135deg, #0ea5e9, #06b6d4)' },
  { title: '云南·彩云之南', tag: '自然风光', gradient: 'linear-gradient(135deg, #10b981, #059669)' },
  { title: '成都·慢生活', tag: '美食文化', gradient: 'linear-gradient(135deg, #f97316, #dc2626)' }
])

onMounted(async () => {
  try {
    const [hot, plans] = await Promise.all([
      discoverApi.getHotDestinations(),
      discoverApi.getPublicPlans({ size: 4 })
    ])
    hotDestinations.value = hot
    publicPlans.value = plans.records
  } catch {}
})

function goCreatePlan() {
  if (!userStore.requireLogin()) return
  uni.navigateTo({ url: '/pages/plan/create/index' })
}

function goPlanDetail(planId: number) {
  uni.navigateTo({ url: `/pages/plan/detail/index?planId=${planId}` })
}

const features = [
  { icon: '🤖', label: 'AI规划', color: '#0ea5e9', path: '/pages/plan/create/index' },
  { icon: '🗺️', label: '地图导览', color: '#10b981', path: '/pages/map/explore/index' },
  { icon: '📷', label: '旅行打卡', color: '#f97316', path: '/pages/footprint/index' },
  { icon: '💰', label: '记账统计', color: '#8b5cf6', path: '/pages/expense/index' }
]

function goFeature(path: string) {
  if (!userStore.requireLogin()) return
  if(path) {
    uni.navigateTo({ url: path })
  }
}

function goDestinationDetail(id: number) {
  uni.navigateTo({ url: `/pages/destination/detail/index?id=${id}` })
}
</script>

<template>
  <view class="index-page">
    <!-- 沉浸式导航栏，不插入占位（由 header 自己控制） -->
    <NavBar
      transparent
      fixed
      textColor="#ffffff"
      background="linear-gradient(135deg, #0369a1, #0ea5e9)"
      :placeholder="false"
    />

    <!-- 顶部 Header：包含导航栏占位 + 用户信息 -->
    <view class="header">
      <!-- 精确占位：等于导航栏实际高度 -->
      <view :style="{ height: navTotalHeight + 'px' }" />

      <view class="header-content">
        <view>
          <text class="greeting">{{ userStore.userInfo?.nickname ? `你好，${userStore.userInfo.nickname}` : '你好，旅行者 👋' }}</text>
          <text class="sub-greeting">今天想去哪里？</text>
        </view>
        <view class="avatar-wrap" @click="userStore.requireLogin()">
          <image
            v-if="userStore.userInfo?.avatar"
            :src="userStore.userInfo.avatar"
            class="avatar"
            mode="aspectFill"
          />
          <view v-else class="avatar-placeholder">
            <text>👤</text>
          </view>
        </view>
      </view>

      <view class="create-btn" @click="goCreatePlan">
        <text class="create-icon">✨</text>
        <text class="create-text">AI智能规划，一键生成专属行程</text>
        <text class="create-arrow">→</text>
      </view>
    </view>

    <!-- 滚动内容区 -->
    <scroll-view class="scroll-content" scroll-y>

      <!-- 功能入口 -->
      <view class="section features-section">
        <view
          class="feature-card"
          v-for="feat in features"
          :key="feat.label"
          @click="goFeature(feat.path)"
        >
          <view class="feat-icon-wrap" :style="{ background: feat.color + '20' }">
            <text class="feat-icon">{{ feat.icon }}</text>
          </view>
          <text class="feat-label">{{ feat.label }}</text>
        </view>
      </view>

      <!-- Banner轮播 -->
      <view class="section">
        <swiper class="banner-swiper" autoplay indicator-dots circular :interval="3000">
          <swiper-item v-for="(item, idx) in bannerList" :key="idx">
            <view class="banner-item" :style="{ background: item.gradient }" @click="goCreatePlan">
              <view class="banner-content">
                <view class="banner-tag">{{ item.tag }}</view>
                <text class="banner-title">{{ item.title }}</text>
                <text class="banner-cta">立即规划 →</text>
              </view>
              <text class="banner-emoji">🌏</text>
            </view>
          </swiper-item>
        </swiper>
      </view>

      <!-- 热门目的地 -->
      <view class="section" v-if="hotDestinations.length">
        <view class="section-header">
          <text class="section-title">热门目的地</text>
          <text class="section-more" @click="uni.switchTab({url:'/pages/discover/index'})">更多 ›</text>
        </view>
        <scroll-view class="hot-scroll" scroll-x>
          <view class="hot-list">
            <view
              class="hot-item"
              v-for="dest in hotDestinations"
              :key="dest.name"
              @click="goDestinationDetail(dest.id)"
            >
              <view class="hot-img-wrap">
                <text class="hot-emoji">🏔</text>
              </view>
              <text class="hot-name">{{ dest.name }}</text>
              <text class="hot-desc">{{ dest.desc }}</text>
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- 精选攻略 -->
      <view class="section" v-if="publicPlans.length">
        <view class="section-header">
          <text class="section-title">精选攻略</text>
          <text class="section-more" @click="uni.switchTab({url:'/pages/discover/index'})">更多 ›</text>
        </view>
        <view class="plan-list">
          <view
            class="plan-card"
            v-for="plan in publicPlans"
            :key="plan.id"
            @click="goPlanDetail(plan.id)"
          >
            <view class="plan-cover">
              <text class="plan-emoji">✈️</text>
            </view>
            <view class="plan-info">
              <text class="plan-title">{{ plan.title }}</text>
              <text class="plan-route">{{ plan.departure }} → {{ plan.destination }}</text>
              <view class="plan-meta">
                <text class="plan-days">{{ plan.days }}天</text>
                <text class="plan-collect">❤️ {{ plan.collectCount }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <view style="height: 120rpx" />
    </scroll-view>

    <!-- 悬浮创建按钮 -->
    <view class="fab" @click="goCreatePlan">
      <text class="fab-icon">✈</text>
      <text class="fab-text">AI规划</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.index-page {
  min-height: 100vh;
  background: var(--bg-page);
  display: flex;
  flex-direction: column;
}

.header {
  background: linear-gradient(135deg, #0369a1, #0ea5e9);
  padding: 0 32rpx 32rpx;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 0 24rpx;
}

.greeting {
  font-size: 36rpx;
  font-weight: 700;
  color: #fff;
  display: block;
}
.sub-greeting {
  font-size: 26rpx;
  color: rgba(255,255,255,0.7);
  margin-top: 6rpx;
  display: block;
}

.avatar-wrap { width: 80rpx; height: 80rpx; }
.avatar { width: 80rpx; height: 80rpx; border-radius: 50%; border: 3rpx solid rgba(255,255,255,0.5); }
.avatar-placeholder {
  width: 80rpx; height: 80rpx;
  border-radius: 50%;
  background: rgba(255,255,255,0.2);
  display: flex; align-items: center; justify-content: center;
  font-size: 40rpx;
}

.create-btn {
  background: rgba(255,255,255,0.15);
  border-radius: 24rpx;
  padding: 24rpx 28rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
  backdrop-filter: blur(10px);
}
.create-icon { font-size: 36rpx; }
.create-text { flex: 1; font-size: 28rpx; color: rgba(255,255,255,0.9); }
.create-arrow { font-size: 32rpx; color: rgba(255,255,255,0.7); }

.scroll-content { flex: 1; height: 0; }

.section { padding: 32rpx 32rpx 0; }

.features-section {
  display: flex;
  gap: 20rpx;
  padding-top: 32rpx;
}

.feature-card {
  flex: 1;
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  box-shadow: var(--shadow-sm);
}
.feat-icon-wrap {
  width: 72rpx; height: 72rpx;
  border-radius: 20rpx;
  display: flex; align-items: center; justify-content: center;
}
.feat-icon { font-size: 36rpx; }
.feat-label { font-size: 24rpx; color: var(--text-primary); font-weight: 500; }

.banner-swiper { height: 240rpx; border-radius: 24rpx; overflow: hidden; margin-top: 16rpx; }
.banner-item {
  height: 100%;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 40rpx;
}
.banner-content { flex: 1; }
.banner-tag {
  display: inline-block;
  background: rgba(255,255,255,0.25);
  color: #fff;
  font-size: 22rpx;
  padding: 6rpx 16rpx;
  border-radius: 100rpx;
  margin-bottom: 12rpx;
}
.banner-title { font-size: 40rpx; font-weight: 800; color: #fff; display: block; margin-bottom: 12rpx; }
.banner-cta { font-size: 26rpx; color: rgba(255,255,255,0.8); }
.banner-emoji { font-size: 100rpx; }

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}
.section-title { font-size: 34rpx; font-weight: 700; color: var(--text-primary); }
.section-more { font-size: 26rpx; color: var(--primary); }

.hot-scroll { white-space: nowrap; }
.hot-list { display: inline-flex; gap: 20rpx; padding-bottom: 8rpx; }
.hot-item {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  background: #fff;
  border-radius: 20rpx;
  padding: 20rpx 24rpx;
  box-shadow: var(--shadow-sm);
  min-width: 140rpx;
}
.hot-img-wrap {
  width: 80rpx; height: 80rpx;
  background: var(--primary-light);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 12rpx;
}
.hot-emoji { font-size: 40rpx; }
.hot-name { font-size: 28rpx; font-weight: 600; color: var(--text-primary); margin-bottom: 4rpx; }
.hot-desc { font-size: 22rpx; color: var(--text-tertiary); white-space: normal; text-align: center; max-width: 120rpx; }

.plan-list { display: flex; flex-direction: column; gap: 20rpx; }
.plan-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx;
  display: flex;
  gap: 20rpx;
  box-shadow: var(--shadow-sm);
}
.plan-cover {
  width: 120rpx; height: 120rpx;
  background: linear-gradient(135deg, #bae6fd, #7dd3fc);
  border-radius: 16rpx;
  display: flex; align-items: center; justify-content: center;
  font-size: 56rpx;
  flex-shrink: 0;
}
.plan-info { flex: 1; display: flex; flex-direction: column; justify-content: space-between; }
.plan-title {
  font-size: 30rpx; font-weight: 600; color: var(--text-primary); margin-bottom: 8rpx;
  overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
}
.plan-route { font-size: 24rpx; color: var(--text-secondary); margin-bottom: 12rpx; }
.plan-meta { display: flex; align-items: center; gap: 16rpx; }
.plan-days {
  background: var(--primary-light);
  color: var(--primary-dark);
  font-size: 22rpx;
  padding: 4rpx 12rpx;
  border-radius: 100rpx;
}
.plan-collect { font-size: 22rpx; color: var(--text-tertiary); }

.fab {
  position: fixed;
  right: 40rpx;
  bottom: calc(120rpx + env(safe-area-inset-bottom));
  width: 120rpx;
  height: 120rpx;
  background: linear-gradient(135deg, #0ea5e9, #0369a1);
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(14,165,233,0.4);
  gap: 4rpx;
}
.fab-icon { font-size: 40rpx; color: #fff; }
.fab-text { font-size: 20rpx; color: rgba(255,255,255,0.9); font-weight: 600; }
</style>
