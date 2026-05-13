<script setup lang="ts">
import { ref, onMounted } from 'vue'
import NavBar from '../../components/common/NavBar.vue'

const mapContext = ref<any>(null)
const latitude = ref(39.90469)
const longitude = ref(116.40717)
const markers = ref<any[]>([])
const footprints = ref<any[]>([])

onMounted(() => {
  mapContext.value = uni.createMapContext('footprintMap')
  fetchFootprints()
})

async function fetchFootprints() {
  try {
    // 模拟从后端获取用户的打卡足迹
    const list = [
      { id: 1, locationName: '天安门广场', lat: 39.90469, lng: 116.40717, createTime: '2023-10-01 10:00', content: '祖国万岁！' },
      { id: 2, locationName: '故宫博物院', lat: 39.91634, lng: 116.39715, createTime: '2023-10-01 13:00', content: '历史的厚重感。' },
    ]
    footprints.value = list
    markers.value = list.map((item: any) => ({
      id: item.id,
      latitude: item.lat,
      longitude: item.lng,
      title: item.locationName,
      iconPath: '/static/icons/marker.png',
      width: 32,
      height: 32,
      callout: { content: item.locationName, padding: 8, borderRadius: 8, display: 'ALWAYS' }
    }))
    
    if (list.length > 0) {
      latitude.value = list[0].lat
      longitude.value = list[0].lng
    }
  } catch (e) {
    console.error(e)
  }
}
</script>

<template>
  <view class="footprint-page">
    <NavBar fixed back title="旅行打卡" />
    
    <view class="map-container">
      <map
        id="footprintMap"
        class="map-view"
        :latitude="latitude"
        :longitude="longitude"
        :markers="markers"
        scale="12"
        show-location
      ></map>
    </view>

    <view class="timeline-container">
      <view class="section-title">我的足迹</view>
      
      <view class="timeline" v-if="footprints.length">
        <view class="timeline-item" v-for="(item, index) in footprints" :key="item.id">
          <view class="timeline-dot"></view>
          <view class="timeline-content card">
            <view class="time">{{ item.createTime }}</view>
            <view class="location-name">{{ item.locationName }}</view>
            <view class="note">{{ item.content }}</view>
          </view>
          <view class="timeline-line" v-if="index !== footprints.length - 1"></view>
        </view>
      </view>
      <view class="empty-state" v-else>
        <text>还没有打卡记录，快去旅行吧！</text>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.footprint-page {
  min-height: 100vh;
  background: var(--bg-page);
  display: flex;
  flex-direction: column;
}
.map-container {
  width: 100%;
  height: 40vh;
}
.map-view {
  width: 100%;
  height: 100%;
}
.timeline-container {
  flex: 1;
  background: #fff;
  border-radius: 32rpx 32rpx 0 0;
  margin-top: -32rpx;
  padding: 40rpx 32rpx;
  position: relative;
  z-index: 10;
  box-shadow: 0 -4rpx 20rpx rgba(0,0,0,0.05);
}
.section-title {
  font-size: 36rpx;
  font-weight: bold;
  margin-bottom: 40rpx;
  color: var(--text-primary);
}
.timeline {
  position: relative;
}
.timeline-item {
  position: relative;
  padding-left: 60rpx;
  margin-bottom: 40rpx;
}
.timeline-dot {
  position: absolute;
  left: 0;
  top: 10rpx;
  width: 24rpx;
  height: 24rpx;
  border-radius: 50%;
  background: var(--primary);
  border: 6rpx solid var(--primary-light);
  z-index: 2;
}
.timeline-line {
  position: absolute;
  left: 11rpx;
  top: 34rpx;
  bottom: -40rpx;
  width: 2rpx;
  background: #e2e8f0;
  z-index: 1;
}
.card {
  background: #f8fafc;
  border-radius: 16rpx;
  padding: 24rpx;
}
.time {
  font-size: 24rpx;
  color: var(--text-tertiary);
  margin-bottom: 8rpx;
}
.location-name {
  font-size: 32rpx;
  font-weight: bold;
  color: var(--text-primary);
  margin-bottom: 12rpx;
}
.note {
  font-size: 28rpx;
  color: var(--text-secondary);
}
.empty-state {
  text-align: center;
  color: var(--text-tertiary);
  padding: 80rpx 0;
}
</style>
