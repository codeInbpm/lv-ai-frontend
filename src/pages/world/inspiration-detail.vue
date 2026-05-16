<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useNavBar } from '../../composables/useNavBar'

const { statusBarHeight, navBarHeight, totalHeight } = useNavBar()

const markers = ref([
  { id: 1, latitude: 24.8716, longitude: 102.8397, title: '滇池', iconPath: '/static/icons/marker.png', width: 40, height: 40, label: { content: '滇池', bgColor: '#fff', padding: 4, borderRadius: 4 } },
  { id: 2, latitude: 24.8800, longitude: 102.8500, title: '云南省博物馆', iconPath: '/static/icons/marker.png', width: 40, height: 40, label: { content: '云南省博物馆', bgColor: '#fff', padding: 4, borderRadius: 4 } }
])

const activeAttraction = ref({
  name: '滇池',
  score: 4.7,
  commentCount: '5.4k',
  tags: '中国第六大淡水湖',
  openTime: '9:00-18:00',
  ticketInfo: '门票信息',
  address: '云南省昆明市西山区滇池路1318号'
})

function handleBack() {
  uni.navigateBack()
}
</script>

<template>
  <view class="inspiration-detail">
    <!-- 顶部地图 -->
    <view class="map-container">
      <map 
        class="main-map"
        :latitude="24.8716"
        :longitude="102.8397"
        :markers="markers"
        scale="12"
      ></map>
      
      <!-- 悬浮导航栏 -->
      <view class="float-nav" :style="{ paddingTop: statusBarHeight + 'px' }">
        <view class="nav-content" :style="{ height: navBarHeight + 'px' }">
          <view class="back-btn" @click="handleBack">‹</view>
          <view class="search-bar">
            <text class="s-city">昆明 ▾</text>
            <text class="s-icon">🔍</text>
            <input placeholder="搜索景点/目的地" />
          </view>
          <view class="right-icons">
            <text class="icon">⭐</text>
            <text class="icon">💬</text>
          </view>
        </view>
        
        <!-- 子分类 -->
        <view class="cat-tabs">
          <view class="c-tab active">全部景点</view>
          <view class="c-tab">热门打卡</view>
          <view class="c-tab">深度体验</view>
          <view class="c-tab">热门酒店</view>
        </view>
      </view>
    </view>

    <!-- 底部详情卡片 -->
    <view class="detail-panel">
      <view class="panel-header">
        <view class="tabs">
          <text class="active">景点介绍</text>
          <text>附近酒店</text>
        </view>
        <view class="actions">
          <text class="icon">⤴️</text>
          <text class="icon">×</text>
        </view>
      </view>

      <scroll-view class="panel-body" scroll-y>
        <image src="https://images.unsplash.com/photo-1541849546-216509ae21f9?w=800" mode="aspectFill" class="cover-img" />
        
        <view class="info-section">
          <view class="title-row">
            <text class="name">{{ activeAttraction.name }}</text>
            <view class="rank-badge">
              <text class="r-text">TOP 1</text>
              <text class="r-sub">城市必玩 · 昆明</text>
            </view>
          </view>
          
          <view class="score-row">
            <text class="score">{{ activeAttraction.score }}</text>
            <text class="comments">{{ activeAttraction.commentCount }} 点评 ›</text>
            <text class="tag">{{ activeAttraction.tags }}</text>
          </view>

          <view class="meta-list">
            <view class="meta-item">
              <text class="label">开放时间</text>
              <text class="val">{{ activeAttraction.openTime }}</text>
              <text class="link">实用信息 ›</text>
            </view>
            <view class="meta-item">
              <text class="label">门票信息</text>
              <text class="val">服务设施 · 联系方式</text>
            </view>
            <view class="meta-item">
              <text class="val address">{{ activeAttraction.address }}</text>
              <text class="link blue">地图 · 导航 ›</text>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.inspiration-detail {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.map-container {
  flex: 1;
  position: relative;
  .main-map { width: 100%; height: 100%; }
}

.float-nav {
  position: absolute; top: 0; left: 0; width: 100%; z-index: 10;
  background: linear-gradient(to bottom, rgba(255,255,255,0.9), transparent);
  .nav-content {
    display: flex; align-items: center; padding: 0 32rpx; gap: 20rpx;
    .back-btn { font-size: 60rpx; color: #334155; }
    .search-bar {
      flex: 1; height: 72rpx; background: #fff; border-radius: 36rpx;
      box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.1);
      display: flex; align-items: center; padding: 0 24rpx;
      .s-city { font-size: 26rpx; font-weight: 700; color: #1e293b; margin-right: 12rpx; }
      .s-icon { font-size: 28rpx; color: #94a3b8; margin-right: 10rpx; }
      input { flex: 1; font-size: 26rpx; }
    }
    .right-icons { display: flex; gap: 24rpx; .icon { font-size: 40rpx; } }
  }
}

.cat-tabs {
  display: flex; gap: 16rpx; padding: 20rpx 32rpx;
  .c-tab {
    padding: 10rpx 24rpx; background: #fff; border-radius: 100rpx;
    font-size: 24rpx; color: #475569; box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.05);
    &.active { background: #0ea5e9; color: #fff; }
  }
}

.detail-panel {
  height: 45vh;
  background: #fff;
  border-radius: 40rpx 40rpx 0 0;
  box-shadow: 0 -10rpx 30rpx rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  z-index: 20;
}

.panel-header {
  padding: 32rpx;
  display: flex; justify-content: space-between; align-items: center;
  border-bottom: 1rpx solid #f1f5f9;
  .tabs {
    display: flex; gap: 40rpx;
    text { font-size: 32rpx; font-weight: 700; color: #94a3b8;
      &.active { color: #1e293b; position: relative;
        &::after { content: ''; position: absolute; bottom: -12rpx; left: 0; width: 100%; height: 6rpx; background: #0ea5e9; border-radius: 3rpx; }
      }
    }
  }
  .actions { display: flex; gap: 30rpx; .icon { font-size: 40rpx; color: #64748b; } }
}

.panel-body { flex: 1; }

.cover-img { width: 100%; height: 400rpx; }

.info-section {
  padding: 32rpx;
  .title-row {
    display: flex; justify-content: space-between; align-items: flex-start;
    .name { font-size: 44rpx; font-weight: 800; color: #1e293b; }
    .rank-badge {
      background: #fef3c7; border-radius: 12rpx; padding: 10rpx 16rpx; text-align: right;
      .r-text { font-size: 24rpx; font-weight: 800; color: #92400e; display: block; }
      .r-sub { font-size: 18rpx; color: #b45309; }
    }
  }
  
  .score-row {
    display: flex; align-items: center; gap: 16rpx; margin-top: 16rpx;
    .score { font-size: 34rpx; font-weight: 800; color: #0ea5e9; }
    .comments { font-size: 26rpx; color: #0ea5e9; font-weight: 600; }
    .tag { font-size: 26rpx; color: #64748b; }
  }

  .meta-list {
    margin-top: 40rpx;
    .meta-item {
      display: flex; align-items: center; padding: 24rpx 0; border-top: 1rpx solid #f8fafc;
      .label { font-size: 28rpx; font-weight: 700; color: #1e293b; width: 140rpx; }
      .val { flex: 1; font-size: 28rpx; color: #475569; }
      .link { font-size: 26rpx; color: #0ea5e9; font-weight: 600; }
      .link.blue { color: #0ea5e9; }
      .address { font-size: 26rpx; color: #64748b; }
    }
  }
}
</style>
