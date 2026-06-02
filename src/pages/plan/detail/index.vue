<script setup lang="ts">
import { ref, onMounted } from 'vue'
import NavBar from '../../../components/common/NavBar.vue'

const planId = ref('')
const detail = ref<any>({
  title: '香港澳门经典3日线路',
  coverUrl: 'https://images.unsplash.com/photo-1543886518-e87f1bf51998?w=800',
  daysCount: 3,
  suitableFor: '所有人',
  season: '全年皆宜',
  favCount: 20,
  intro: '3天的时间走遍香港、澳门那些必打卡的景点，还可以欣赏到绝美海岛风光',
  routeSummary: [
    { day: 1, route: '星光大道 - 太平山顶 - 浅水湾 - 维多利亚港' },
    { day: 2, route: '南丫岛' },
    { day: 3, route: '妈阁庙 - 金莲花广场 - 大三巴牌坊' }
  ],
  days: [
    {
      day: 1,
      title: '香港经典必打卡',
      spots: [
        { name: '星光大道', image: '' },
        { name: '太平山顶', image: '' }
      ]
    }
  ]
})

onMounted(() => {
  const pages = getCurrentPages()
  const options = pages[pages.length - 1].options
  if (options && options.id) {
    planId.value = options.id
    // TODO: fetch detail by ID
  }
})
</script>

<template>
  <view class="plan-detail">
    <NavBar title="" back transparent fixed />
    
    <scroll-view scroll-y class="detail-scroll">
      <!-- 封面图 -->
      <view class="cover-section">
        <image class="cover-img" :src="detail.coverUrl" mode="aspectFill"></image>
        <view class="cover-badge">印澳\n象门</view>
      </view>
      
      <view class="content-container">
        <!-- 标题 -->
        <text class="title">{{ detail.title }}</text>
        
        <!-- 路线概览卡片 -->
        <view class="summary-card">
          <view class="card-header">
            <text class="icon">🛤️</text>
            <text class="c-title">{{ detail.daysCount }}日游路线</text>
          </view>
          
          <view class="route-list">
            <view class="r-item" v-for="(item, idx) in detail.routeSummary" :key="idx">
              <view class="r-num">{{ item.day }}</view>
              <view class="r-text">{{ item.route }}</view>
            </view>
          </view>
          
          <view class="card-footer">
            <view class="f-item">
              <view class="f-label"><text class="icon">👥</text> 适合人群</view>
              <view class="f-value">{{ detail.suitableFor }}</view>
            </view>
            <view class="f-item">
              <view class="f-label"><text class="icon">📅</text> 适合季节</view>
              <view class="f-value">{{ detail.season }}</view>
            </view>
          </view>
        </view>
        
        <!-- 引言/行程特色 -->
        <view class="intro-section">
          <view class="bg-text">引言</view>
          <view class="intro-box">
            <view class="box-title">
              <view class="indicator"></view>
              <text>行程特色</text>
            </view>
            <view class="box-content">{{ detail.intro }}</view>
          </view>
        </view>
        
        <!-- 详细日程 (DAY 1) -->
        <view class="day-section">
          <view class="bg-text">DAY 1</view>
          <!-- 这里可以展开具体的每日行程 UI -->
        </view>
        
      </view>
    </scroll-view>
    
    <!-- 底部操作栏 -->
    <view class="bottom-bar">
      <view class="action-item">
        <text class="icon">↗</text>
        <text class="text">分享</text>
      </view>
      <view class="action-item">
        <text class="icon">☆</text>
        <text class="text">收藏 {{ detail.favCount }}</text>
      </view>
      <view class="use-btn">
        <text class="icon">🛒</text>
        同款路线
      </view>
    </view>
  </view>
</template>

<style scoped>
.plan-detail {
  min-height: 100vh;
  background-color: #fff;
  display: flex;
  flex-direction: column;
}

.detail-scroll {
  flex: 1;
  height: 0;
}

.cover-section {
  width: 100%;
  height: 460rpx;
  position: relative;
}

.cover-img {
  width: 100%;
  height: 100%;
}

.cover-badge {
  position: absolute;
  bottom: 40rpx;
  right: 40rpx;
  background: #dc2626;
  color: #fff;
  padding: 10rpx 20rpx;
  font-size: 28rpx;
  font-weight: bold;
  border: 4rpx solid #fff;
  text-align: center;
  line-height: 1.2;
}

.content-container {
  padding: 40rpx 30rpx;
  padding-bottom: 140rpx;
}

.title {
  font-size: 48rpx;
  font-weight: 900;
  color: #333;
  margin-bottom: 40rpx;
  display: block;
}

.summary-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.04);
  margin-bottom: 40rpx;
}

.card-header {
  display: flex;
  align-items: center;
  margin-bottom: 30rpx;
}

.card-header .icon {
  font-size: 36rpx;
  margin-right: 12rpx;
}

.card-header .c-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #d97706;
}

.route-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  margin-bottom: 30rpx;
}

.r-item {
  display: flex;
  align-items: flex-start;
  background: #fff7ed;
  padding: 16rpx 20rpx;
  border-radius: 8rpx;
}

.r-num {
  width: 36rpx;
  height: 36rpx;
  background: #f59e0b;
  color: #fff;
  font-size: 24rpx;
  font-weight: bold;
  text-align: center;
  line-height: 36rpx;
  border-radius: 18rpx;
  margin-right: 16rpx;
  margin-top: 4rpx;
}

.r-text {
  flex: 1;
  font-size: 28rpx;
  color: #92400e;
  line-height: 1.5;
}

.card-footer {
  display: flex;
  border-top: 2rpx dashed #f1f5f9;
  padding-top: 30rpx;
}

.f-item {
  flex: 1;
}

.f-label {
  font-size: 24rpx;
  color: #94a3b8;
  margin-bottom: 8rpx;
}

.f-value {
  font-size: 28rpx;
  color: #334155;
  font-weight: bold;
  padding-left: 40rpx;
}

.intro-section {
  position: relative;
  margin-bottom: 60rpx;
  margin-top: 60rpx;
}

.bg-text {
  font-size: 100rpx;
  font-weight: 900;
  color: #fff7ed;
  position: absolute;
  top: -40rpx;
  left: -10rpx;
  z-index: 0;
  letter-spacing: 4rpx;
}

.intro-box {
  position: relative;
  z-index: 1;
  padding-top: 20rpx;
}

.box-title {
  display: flex;
  align-items: center;
  font-size: 32rpx;
  font-weight: bold;
  color: #0f172a;
  margin-bottom: 20rpx;
}

.indicator {
  width: 8rpx;
  height: 32rpx;
  background: #f59e0b;
  margin-right: 16rpx;
  border-radius: 4rpx;
}

.box-content {
  font-size: 30rpx;
  color: #334155;
  line-height: 1.6;
}

.day-section {
  position: relative;
  margin-top: 80rpx;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  background: #fff;
  display: flex;
  align-items: center;
  padding: 20rpx 40rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  box-shadow: 0 -4rpx 20rpx rgba(0,0,0,0.05);
  box-sizing: border-box;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 60rpx;
}

.action-item .icon {
  font-size: 40rpx;
  color: #334155;
  margin-bottom: 4rpx;
}

.action-item .text {
  font-size: 24rpx;
  color: #64748b;
}

.use-btn {
  flex: 1;
  background: #f97316;
  color: #fff;
  height: 88rpx;
  border-radius: 100rpx;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 32rpx;
  font-weight: bold;
}

.use-btn .icon {
  margin-right: 12rpx;
  font-size: 36rpx;
}
</style>
