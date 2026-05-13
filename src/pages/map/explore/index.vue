<script setup lang="ts">
import { ref, onMounted } from 'vue'
import NavBar from '../../../components/common/NavBar.vue'
import { discoverApi } from '../../../api/discover'

const mapContext = ref<any>(null)
const latitude = ref(39.90469) // 默认北京
const longitude = ref(116.40717)
const markers = ref<any[]>([])
const selectedPoi = ref<any>(null)
const keyword = ref('')

onMounted(() => {
  mapContext.value = uni.createMapContext('exploreMap')
  // 获取当前位置
  uni.getLocation({
    type: 'gcj02',
    success: (res) => {
      latitude.value = res.latitude
      longitude.value = res.longitude
      searchNearby()
    }
  })
})

async function searchNearby() {
  if (!latitude.value || !longitude.value) return
  try {
    const res = await uni.request({
      url: 'http://127.0.0.1:8080/api/map/nearby', // 后续封装进 API
      data: { lat: latitude.value, lng: longitude.value, keyword: keyword.value || '景点' },
      header: { Authorization: uni.getStorageSync('token') }
    })
    const list = (res.data as any).data || []
    markers.value = list.map((item: any) => ({
      id: item.id,
      latitude: item.lat,
      longitude: item.lng,
      title: item.name,
      iconPath: '/static/icons/marker.png', // 需要一张 marker 占位图
      width: 32,
      height: 32,
      joinCluster: true,
      callout: { content: item.name, padding: 8, borderRadius: 8, display: 'ALWAYS' }
    }))
  } catch (e) {
    console.error(e)
  }
}

function onSearch() {
  searchNearby()
}

function onMarkerTap(e: any) {
  const markerId = e.detail.markerId
  selectedPoi.value = markers.value.find(m => m.id === markerId)
}

function onMapTap(e: any) {
  selectedPoi.value = null
  latitude.value = e.detail.latitude
  longitude.value = e.detail.longitude
  searchNearby()
}

function goCreatePlan() {
  if (!selectedPoi.value) return
  uni.setStorageSync('prefillDestination', selectedPoi.value.title)
  uni.navigateTo({ url: '/pages/plan/create/index' })
}
</script>

<template>
  <view class="explore-page">
    <NavBar fixed back title="地图导览" />
    
    <view class="search-bar">
      <input v-model="keyword" class="search-input" placeholder="搜索区域/景点/美食" @confirm="onSearch" />
      <view class="search-btn" @click="onSearch">搜索</view>
    </view>

    <map
      id="exploreMap"
      class="map-view"
      :latitude="latitude"
      :longitude="longitude"
      :markers="markers"
      scale="14"
      show-location
      @markertap="onMarkerTap"
      @tap="onMapTap"
    ></map>

    <view v-if="selectedPoi" class="bottom-panel">
      <view class="poi-info">
        <text class="poi-name">{{ selectedPoi.title }}</text>
        <text class="poi-desc">位置坐标: {{ selectedPoi.latitude.toFixed(4) }}, {{ selectedPoi.longitude.toFixed(4) }}</text>
      </view>
      <view class="action-btn" @click="goCreatePlan">
        一键生成该区域行程
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.explore-page {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
}
.search-bar {
  display: flex;
  padding: 20rpx;
  background: #fff;
  align-items: center;
  gap: 16rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
  z-index: 10;
}
.search-input {
  flex: 1;
  height: 72rpx;
  background: #f1f5f9;
  border-radius: 36rpx;
  padding: 0 32rpx;
  font-size: 28rpx;
}
.search-btn {
  background: var(--primary);
  color: #fff;
  height: 72rpx;
  line-height: 72rpx;
  padding: 0 32rpx;
  border-radius: 36rpx;
  font-size: 28rpx;
}
.map-view {
  flex: 1;
  width: 100%;
}
.bottom-panel {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  background: #fff;
  padding: 40rpx;
  border-radius: 32rpx 32rpx 0 0;
  box-shadow: 0 -4rpx 20rpx rgba(0,0,0,0.1);
  box-sizing: border-box;
  animation: slideUp 0.3s ease;
  padding-bottom: calc(40rpx + env(safe-area-inset-bottom));
}
.poi-info {
  margin-bottom: 24rpx;
}
.poi-name {
  font-size: 36rpx;
  font-weight: bold;
  display: block;
  margin-bottom: 8rpx;
}
.poi-desc {
  font-size: 26rpx;
  color: var(--text-secondary);
}
.action-btn {
  background: linear-gradient(135deg, #0ea5e9, #0369a1);
  color: #fff;
  height: 96rpx;
  border-radius: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: 600;
}
@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
</style>
