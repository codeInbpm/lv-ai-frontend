<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import NavBar from '../../../components/common/NavBar.vue'

const detail = ref<any>(null)
const loading = ref(true)

onLoad((options: any) => {
  if (options.id) {
    fetchDetail(options.id)
  }
})

async function fetchDetail(id: string) {
  try {
    loading.value = true
    const res = await uni.request({
      url: `http://127.0.0.1:8080/api/destination/${id}/detail`,
      header: { Authorization: uni.getStorageSync('token') }
    })
    detail.value = (res.data as any).data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function goCreatePlan() {
  if (!detail.value?.destination?.name) return
  uni.setStorageSync('prefillDestination', detail.value.destination.name)
  uni.navigateTo({ url: '/pages/plan/create/index' })
}
</script>

<template>
  <view class="destination-detail">
    <NavBar fixed back :title="detail?.destination?.name || '目的地详情'" />
    
    <view v-if="loading" class="loading-state">加载中...</view>
    
    <scroll-view v-else class="content" scroll-y>
      <!-- 头图区 -->
      <view class="hero">
        <image class="hero-bg" :src="detail?.destination?.imageUrl || 'https://images.unsplash.com/photo-1543883391-4e782e4e1a0b?q=80&w=1000'" mode="aspectFill" />
        <view class="hero-overlay"></view>
        <view class="hero-content">
          <text class="hero-title">{{ detail?.destination?.name }}</text>
          <text class="hero-desc">{{ detail?.destination?.viewCount || 0 }} 人浏览 · {{ detail?.destination?.likeCount || 0 }} 人想去</text>
        </view>
      </view>

      <!-- 简介区 -->
      <view class="section card">
        <text class="section-title">✨ 城市名片</text>
        <text class="intro-text">{{ detail?.destination?.description || '暂无介绍' }}</text>
      </view>

      <!-- 必选景点 -->
      <view class="section" v-if="detail?.spots?.length">
        <text class="section-title">🏞️ 必打卡景点</text>
        <scroll-view scroll-x class="h-scroll">
          <view class="h-list">
            <view class="spot-card" v-for="spot in detail.spots" :key="spot.id">
              <image class="spot-img" :src="spot.imageUrl || 'https://images.unsplash.com/photo-1506744626753-1fa44f4ab4f9?q=80&w=400'" mode="aspectFill" />
              <view class="spot-info">
                <text class="spot-name">{{ spot.name }}</text>
                <text class="spot-tag" v-if="spot.isMustVisit">必打卡</text>
              </view>
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- 必吃美食 -->
      <view class="section" v-if="detail?.foods?.length">
        <text class="section-title">🍜 本地必吃美食</text>
        <scroll-view scroll-x class="h-scroll">
          <view class="h-list">
            <view class="food-card" v-for="food in detail.foods" :key="food.id">
              <image class="food-img" :src="food.imageUrl || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=400'" mode="aspectFill" />
              <view class="food-info">
                <text class="food-name">{{ food.name }}</text>
                <text class="food-price" v-if="food.averageCost">人均 ¥{{ food.averageCost }}</text>
              </view>
            </view>
          </view>
        </scroll-view>
      </view>

      <view style="height: 140rpx;" />
    </scroll-view>

    <view class="bottom-bar" v-if="!loading">
      <view class="primary-btn" @click="goCreatePlan">一键 AI 规划专属行程</view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.destination-detail {
  min-height: 100vh;
  background: var(--bg-page);
  display: flex;
  flex-direction: column;
}
.content {
  flex: 1;
  height: 0;
}
.hero {
  position: relative;
  height: 500rpx;
}
.hero-bg {
  width: 100%;
  height: 100%;
}
.hero-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.7));
}
.hero-content {
  position: absolute;
  bottom: 40rpx;
  left: 40rpx;
  color: #fff;
}
.hero-title {
  font-size: 56rpx;
  font-weight: 800;
  display: block;
  margin-bottom: 12rpx;
}
.hero-desc {
  font-size: 26rpx;
  color: rgba(255,255,255,0.8);
}
.section {
  padding: 40rpx;
}
.card {
  background: #fff;
  margin: -30rpx 32rpx 0;
  position: relative;
  border-radius: 24rpx;
  box-shadow: var(--shadow-sm);
  padding: 32rpx;
}
.section-title {
  font-size: 34rpx;
  font-weight: bold;
  margin-bottom: 24rpx;
  display: block;
  color: var(--text-primary);
}
.intro-text {
  font-size: 28rpx;
  color: var(--text-secondary);
  line-height: 1.6;
}
.h-scroll {
  white-space: nowrap;
}
.h-list {
  display: inline-flex;
  gap: 24rpx;
  padding-bottom: 8rpx;
}
.spot-card, .food-card {
  width: 280rpx;
  background: #fff;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}
.spot-img, .food-img {
  width: 100%;
  height: 200rpx;
}
.spot-info, .food-info {
  padding: 16rpx;
}
.spot-name, .food-name {
  font-size: 28rpx;
  font-weight: bold;
  display: block;
  margin-bottom: 8rpx;
  white-space: normal;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.spot-tag {
  font-size: 20rpx;
  color: var(--primary-dark);
  background: var(--primary-light);
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
}
.food-price {
  font-size: 24rpx;
  color: #f97316;
}
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  background: #fff;
  padding: 24rpx 40rpx calc(24rpx + env(safe-area-inset-bottom));
  box-shadow: 0 -4rpx 20rpx rgba(0,0,0,0.05);
  box-sizing: border-box;
}
.primary-btn {
  background: linear-gradient(135deg, #0ea5e9, #0369a1);
  color: #fff;
  height: 96rpx;
  border-radius: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: bold;
}
.loading-state {
  padding: 100rpx;
  text-align: center;
  color: var(--text-tertiary);
}
</style>
