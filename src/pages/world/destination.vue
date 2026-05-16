<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useNavBar } from '../../composables/useNavBar'
import { useWorldStore } from '../../stores/world'

const worldStore = useWorldStore()
const { statusBarHeight, navBarHeight, totalHeight } = useNavBar()
const cityId = ref<number | null>(null)

const cityName = computed(() => worldStore.currentDestination?.name || '城市')

onLoad((options: any) => {
  if (options.id) {
    cityId.value = Number(options.id)
    worldStore.fetchDestinationDetail(cityId.value)
  }
})

const activeTab = ref(0)
const tabs = ['去玩', '去吃', '去住', '去买']
const subTabs = ['一日游', '跟团游', '定制游', '民宿', '低价机票', '火车票']

const markers = computed(() => {
  if (!worldStore.currentDestination?.spots) return []
  return worldStore.currentDestination.spots.map(spot => ({
    id: spot.id,
    latitude: spot.lat,
    longitude: spot.lng,
    title: spot.name,
    iconPath: '/static/icons/marker.png',
    width: 30,
    height: 30
  }))
})

const mapCenter = computed(() => {
  if (worldStore.currentDestination?.lat) {
    return { lat: worldStore.currentDestination.lat, lng: worldStore.currentDestination.lng }
  }
  if (worldStore.currentDestination?.spots?.length) {
    return { lat: worldStore.currentDestination.spots[0].lat, lng: worldStore.currentDestination.spots[0].lng }
  }
  return { lat: 29.5637, lng: 106.5504 }
})

function handleBack() {
  uni.navigateBack()
}
</script>

<template>
  <view class="destination-page">
    <!-- 顶部导航 -->
    <view class="custom-nav" :style="{ paddingTop: statusBarHeight + 'px', height: totalHeight + 'px' }">
      <view class="nav-content" :style="{ height: navBarHeight + 'px' }">
        <view class="back-icon" @click="handleBack">‹</view>
        <text class="city-name">{{ cityName }}</text>
        <view class="search-box">
          <text class="s-icon">🔍</text>
          <input placeholder="搜索当地玩乐、美食" placeholder-class="ph" />
        </view>
      </view>
    </view>
    <view :style="{ height: totalHeight + 'px' }" />

    <scroll-view class="scroll-body" scroll-y>
      <!-- 功能入口 -->
      <view class="icon-nav">
        <view class="nav-item">
          <view class="icon-wrap red"><text>📕</text></view>
          <text>攻略</text>
        </view>
        <view class="nav-item">
          <view class="icon-wrap yellow"><text>🏨</text></view>
          <text>酒店</text>
        </view>
        <view class="nav-item">
          <view class="icon-wrap blue"><text>📷</text></view>
          <text>酒店防偷拍</text>
        </view>
        <view class="nav-item">
          <view class="icon-wrap cyan"><text>👤</text></view>
          <text>P掉路人</text>
        </view>
        <view class="nav-item">
          <view class="icon-wrap green"><text>🏞️</text></view>
          <text>必玩景点</text>
        </view>
      </view>

      <!-- 子分类Tab -->
      <scroll-view class="sub-tabs" scroll-x show-scrollbar="false">
        <view v-for="(t, i) in subTabs" :key="i" class="s-tab">
          <text>{{ t }}</text>
        </view>
      </scroll-view>

      <!-- 核心内容区 -->
      <view class="main-grid">
        <!-- AI行程规划 -->
        <view class="ai-card grid-item">
          <view class="card-header">
            <text class="title">AI行程规划</text>
            <text class="desc">AI行程助手为你一键生成热门路线，让旅行规划更轻松</text>
          </view>
          <image src="https://images.unsplash.com/photo-1524850011238-e3d235c7d4c9?w=400" mode="aspectFill" class="map-preview" />
          <view class="ai-bot">
            <view class="bot-icon">🤖</view>
            <text>AI Hi~</text>
          </view>
        </view>

        <!-- 趣玩地图 -->
        <view class="map-card grid-item">
          <view class="card-header">
            <text class="title">趣玩地图</text>
            <text class="desc">重庆精华景点地图——藏在地图里的这些打卡点你都去过...</text>
          </view>
          <map 
            class="mini-map"
            :latitude="mapCenter.lat"
            :longitude="mapCenter.lng"
            :markers="markers"
            :show-location="true"
          ></map>
        </view>

        <!-- 必看景点列表 (去玩 Tab 下展示) -->
        <view class="spot-card grid-item" v-if="activeTab === 0">
          <view class="card-header">
            <text class="title">必看景点</text>
            <text class="sub-title">大家都在看 ›</text>
          </view>
          <view class="rank-list">
            <view class="rank-item" v-for="(spot, idx) in worldStore.currentDestination?.spots?.slice(0, 3)" :key="spot.id">
              <view class="rank-num" :class="'top' + (idx + 1)">{{ idx + 1 }}</view>
              <image :src="spot.imageUrl" mode="aspectFill" class="item-img" />
              <view class="item-info">
                <text class="name">{{ spot.name }}</text>
                <view class="meta">
                  <text class="score">评分 {{ spot.score }}</text>
                  <text class="count">{{ (spot.commentCount / 1000).toFixed(1) }}k点评</text>
                </view>
              </view>
            </view>
          </view>
        </view>

        <!-- 必吃榜 (去吃 Tab 下展示) -->
        <view class="spot-card grid-item" v-if="activeTab === 1">
          <view class="card-header">
            <text class="title">必吃榜</text>
            <text class="sub-title">当地特色美食 ›</text>
          </view>
          <view class="rank-list">
            <view class="rank-item" v-for="(food, idx) in worldStore.currentDestination?.foods?.slice(0, 3)" :key="food.id">
              <view class="rank-num" :class="'top' + (idx + 1)">{{ idx + 1 }}</view>
              <image :src="food.imageUrl" mode="aspectFill" class="item-img" />
              <view class="item-info">
                <text class="name">{{ food.name }}</text>
                <view class="meta">
                  <text class="score">评分 {{ food.score }}</text>
                  <text class="count">¥{{ food.averageCost }}/人</text>
                </view>
              </view>
            </view>
          </view>
        </view>

        <!-- 必体验 -->
        <view class="exp-card grid-item">
          <image src="https://images.unsplash.com/photo-1534430480872-3498386e7a56?w=400" mode="aspectFill" class="bg" />
          <view class="info">
            <text class="t">重庆必体验</text>
            <text class="d">感受山城重庆的独特魅力</text>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 底部 TabBar -->
    <view class="bottom-tabs">
      <view 
        v-for="(t, i) in tabs" 
        :key="i" 
        class="tab-item"
        :class="{ active: activeTab === i }"
        @click="activeTab = i"
      >
        <text>{{ t }}</text>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.destination-page {
  min-height: 100vh;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
}

.custom-nav {
  position: fixed; top: 0; left: 0; width: 100%; background: #fff; z-index: 100;
  .nav-content {
    display: flex; align-items: center; padding: 0 32rpx;
    .back-icon { font-size: 60rpx; color: #334155; margin-right: 10rpx; }
    .city-name { font-size: 34rpx; font-weight: 700; color: #1e293b; margin-right: 20rpx; }
    .search-box {
      flex: 1; height: 72rpx; background: #f1f5f9; border-radius: 36rpx;
      display: flex; align-items: center; padding: 0 24rpx;
      .s-icon { font-size: 28rpx; color: #94a3b8; margin-right: 12rpx; }
      input { flex: 1; font-size: 26rpx; }
      .ph { color: #cbd5e1; }
    }
  }
}

.scroll-body { flex: 1; }

.icon-nav {
  display: flex; justify-content: space-around; padding: 30rpx 20rpx; background: #fff;
  .nav-item {
    display: flex; flex-direction: column; align-items: center; gap: 12rpx;
    text { font-size: 24rpx; color: #334155; font-weight: 500; }
    .icon-wrap {
      width: 90rpx; height: 90rpx; border-radius: 20rpx;
      display: flex; align-items: center; justify-content: center; font-size: 44rpx;
      &.red { background: #fee2e2; }
      &.yellow { background: #fef3c7; }
      &.blue { background: #dbeafe; }
      &.cyan { background: #ccfbf1; }
      &.green { background: #dcfce7; }
    }
  }
}

.sub-tabs {
  white-space: nowrap; padding: 20rpx 32rpx; background: #fff;
  .s-tab {
    display: inline-block; padding: 12rpx 30rpx; background: #f8fafc;
    border-radius: 100rpx; margin-right: 16rpx; font-size: 26rpx; color: #64748b;
  }
}

.main-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 20rpx; padding: 20rpx;
  .grid-item {
    background: #fff; border-radius: 24rpx; overflow: hidden; padding: 20rpx;
    box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.03);
  }
}

.card-header {
  margin-bottom: 20rpx;
  .title { font-size: 32rpx; font-weight: 800; color: #1e293b; display: block; }
  .desc { font-size: 22rpx; color: #94a3b8; line-height: 1.4; margin-top: 6rpx; display: block; }
  .sub-title { font-size: 24rpx; color: #64748b; margin-top: 4rpx; display: block; }
}

.ai-card {
  background: #f0fdf4 !important;
  .map-preview { width: 100%; height: 180rpx; border-radius: 12rpx; margin-top: 10rpx; }
  .ai-bot {
    display: flex; align-items: center; gap: 10rpx; margin-top: 16rpx;
    .bot-icon { width: 48rpx; height: 48rpx; background: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 28rpx; }
    text { font-size: 24rpx; font-weight: 700; color: #166534; }
  }
}

.map-card {
  .mini-map { width: 100%; height: 280rpx; border-radius: 12rpx; }
}

.stay-card {
  grid-column: span 1;
  .rank-list {
    display: flex; flex-direction: column; gap: 20rpx;
    .rank-item {
      display: flex; align-items: center; gap: 16rpx;
      .rank-num {
        width: 36rpx; height: 36rpx; border-radius: 8rpx; font-size: 22rpx;
        display: flex; align-items: center; justify-content: center; color: #fff;
        &.top1 { background: #1e293b; }
        &.top2 { background: #64748b; }
        &.top3 { background: #94a3b8; }
      }
      .item-img { width: 80rpx; height: 80rpx; border-radius: 12rpx; }
      .item-info {
        flex: 1;
        .name { font-size: 24rpx; font-weight: 600; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; }
        .meta { font-size: 20rpx; color: #94a3b8; margin-top: 4rpx; }
      }
    }
  }
}

.exp-card {
  position: relative; height: 320rpx;
  .bg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
  .info {
    position: absolute; left: 0; bottom: 0; width: 100%; padding: 20rpx;
    background: linear-gradient(to top, rgba(0,0,0,0.6), transparent);
    .t { font-size: 28rpx; font-weight: 700; color: #fff; display: block; }
    .d { font-size: 20rpx; color: rgba(255,255,255,0.8); }
  }
}

.bottom-tabs {
  height: 100rpx; background: #fff; border-top: 1rpx solid #f1f5f9;
  display: flex; align-items: center; justify-content: space-around;
  padding-bottom: env(safe-area-inset-bottom);
  .tab-item {
    font-size: 30rpx; color: #64748b; font-weight: 600;
    &.active { color: #0ea5e9; position: relative;
      &::after { content: ''; position: absolute; bottom: -10rpx; left: 50%; transform: translateX(-50%); width: 40rpx; height: 6rpx; background: #0ea5e9; border-radius: 3rpx; }
    }
  }
}
</style>
