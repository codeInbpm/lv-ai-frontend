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
const searchType = ref('')
const circles = ref<any[]>([])


const suggestList = ref<any[]>([])
const suggestVisible = ref(false)

let searchTimer: any = null


onMounted(() => {
  mapContext.value = uni.createMapContext('exploreMap')
  // 获取当前位置
  uni.getLocation({
    type: 'gcj02',
    success: (res) => {
      latitude.value = res.latitude
      longitude.value = res.longitude
      searchNearby()
      updateSearchCircle(
          res.latitude,
          res.longitude
      )
    }
  })
})

async function searchNearby() {
  if (!latitude.value || !longitude.value) return
  try {
    const res = await uni.request({
      url: 'http://127.0.0.1:8080/api/map/nearby',
      data: { lat: latitude.value, lng: longitude.value, searchType: searchType.value || '景点' },
      header: { Authorization: uni.getStorageSync('token') }
    })

    const list = (res.data as any).data || []

    markers.value = list.map((item: any) => ({
      id: item.id,
      latitude: item.location.lat,
      longitude: item.location.lng,
      title: item.title,
      address: item.address,
      distance: item._distance,
      iconPath: '/static/icons/marker.png', // 可以按类型换图标
      width: 32,
      height: 32,
      joinCluster: true,
      callout: {
        content: `${item.title}\n${item.address}\n${item._distance.toFixed(0)}米`,
        padding: 8,
        borderRadius: 8,
        display: 'ALWAYS'
      }
    }))

    // 如果有结果，把地图中心移动到第一个 POI
    if (list.length > 0) {
      latitude.value = list[0].location.lat
      longitude.value = list[0].location.lng
      mapContext.value.moveToLocation({
        latitude: latitude.value,
        longitude: longitude.value
      })
    }

  } catch (e) {
    console.error(e)
  }
}
async function searchKeyword() {
  if (!latitude.value || !longitude.value || !keyword.value) return

  try {
    const res = await uni.request({
      url: 'http://127.0.0.1:8080/api/map/search',
      data: {
        lat: latitude.value,
        lng: longitude.value,
        searchType: searchType.value || '景点',
        keyword: keyword.value
      },
      header: { Authorization: uni.getStorageSync('token') }
    })

    const list = (res.data as any).data || []

    markers.value = list.map((item: any) => ({
      id: item.id,
      latitude: item.location.lat,
      longitude: item.location.lng,
      title: item.title,
      address: item.address,
      distance: item._distance,
      iconPath: '/static/icons/marker.png',
      width: 32,
      height: 32,
      joinCluster: true,
      callout: {
        content: `${item.title}\n${item.address}\n${item._distance.toFixed(0)}米`,
        padding: 8,
        borderRadius: 8,
        display: 'ALWAYS'
      }
    }))

    // 移动地图到第一个结果
    if (list.length > 0) {
      latitude.value = list[0].location.lat
      longitude.value = list[0].location.lng
      mapContext.value.moveToLocation({
        latitude: latitude.value,
        longitude: longitude.value
      })
    }

    // 更新搜索圆圈
    if (list.length > 0) {
      updateSearchCircle(list[0].location.lat, list[0].location.lng)
    }

    suggestVisible.value = false // 搜索完成后不显示列表

  } catch (e) {
    console.error(e)
  }
}

function updateSearchCircle(lat: number, lng: number) {

  circles.value = [
    {
      latitude: lat,
      longitude: lng,

      radius: 1000,

      strokeWidth: 2,

      color: '#3b82f680',

      fillColor: '#3b82f633'
    }
  ]
}

function onSearch() {
  searchKeyword()
}

function onInput(e: any) {
  const value = e.detail.value
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    getSuggest(value)
  // 防抖
  }, 400)
}

async function getSuggest(keywordValue: string) {
  if (!keywordValue || keywordValue.trim().length < 2) {
    suggestList.value = []
    suggestVisible.value = false
    return
  }
  try {
    const res = await uni.request({
      url: 'http://127.0.0.1:8080/api/map/get-suggest',
      data: {
        lat: latitude.value,
        lng: longitude.value,
        keyword: keywordValue
      },
      header: {
        Authorization: uni.getStorageSync('token')
      }
    })

    const list = (res.data as any).data || []
    suggestList.value = list
    suggestVisible.value = true
  } catch (e) {
    console.error(e)
  }
}
// 点击关键字联想内容
function selectSuggest(item: any) {
  suggestVisible.value = false

  keyword.value = item.title

  latitude.value = item.location.lat
  longitude.value = item.location.lng

  // 更新搜索区域
  updateSearchCircle(
      item.location.lat,
      item.location.lng
  )

  // 地图中心移动
  mapContext.value.moveToLocation({
    latitude: item.location.lat,
    longitude: item.location.lng
  })

  // 查询周边
  searchNearby()
}

function onMarkerTap(e: any) {
  const markerId = e.detail.markerId
  const poi = markers.value.find(m => m.id === markerId)
  if (poi) {
    selectedPoi.value = {
      title: poi.title,
      address: poi.address,
      latitude: poi.latitude,
      longitude: poi.longitude,
      distance: poi.distance
    }
  }
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
      <input v-model="keyword" class="search-input" placeholder="搜索区域/景点/美食" @input="onInput" @confirm="onSearch" />
      <view class="search-btn" @click="onSearch">搜索</view>
      <!-- 联想列表 -->
      <view
          v-if="suggestVisible && suggestList.length"
          class="suggest-panel"
      >
        <view
            v-for="item in suggestList"
            :key="item.id"
            class="suggest-item"
            @click="selectSuggest(item)"
        >
          <view class="suggest-title">{{ item.title }}</view>
          <view class="suggest-address">{{ item.address }}</view>
        </view>
      </view>
    </view>


    <map
        id="exploreMap"
        class="map-view"
        :latitude="latitude"
        :longitude="longitude"
        :markers="markers"
        :circles="circles"
        scale="14"
        show-location
        enable-3D
        enable-overlooking
        enable-zoom
        @markertap="onMarkerTap"
        @tap="onMapTap"
    />

    <view v-if="selectedPoi" class="bottom-panel">
      <view class="poi-name">
        {{ selectedPoi.title }}
      </view>

      <view class="poi-desc">
        {{ selectedPoi.address }}
      </view>

      <view class="poi-distance">
        距离约 {{ selectedPoi.distance.toFixed(0) }} 米
      </view>

    </view>

    <view
        class="action-btn"
        @click="goCreatePlan"
    >
      去这里
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

  position: relative;

  display: flex;

  padding: 20rpx;

  background: #fff;

  align-items: center;

  gap: 16rpx;

  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);

  z-index: 1000;
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

  position: fixed;

  left: 20rpx;

  right: 20rpx;

  bottom: 30rpx;

  z-index: 99999;

  background: #fff;

  padding: 28rpx;

  border-radius: 28rpx;

  box-shadow: 0 8rpx 32rpx rgba(0,0,0,0.18);

  animation: slideUp 0.25s ease;

  box-sizing: border-box;
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
.search-wrapper {
  position: relative;
  width: 100%;
}

.suggest-panel {
  position: absolute;
  top: 100%; /* 紧贴搜索框下方 */
  left: 0;
  right: 0;
  background: #fff;
  border-radius: 12rpx;
  max-height: 400rpx;
  overflow-y: auto;
  z-index: 999;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.15);
}

.suggest-item {

  padding: 24rpx;

  border-bottom: 1rpx solid #f1f5f9;
}

.suggest-title {

  font-size: 30rpx;

  font-weight: 600;

  color: #111827;
}

.suggest-address {

  margin-top: 8rpx;

  font-size: 24rpx;

  color: #6b7280;
}

.poi-card-left {

  flex: 1;

  overflow: hidden;
}

.poi-name {

  font-size: 32rpx;

  font-weight: 700;

  color: #111827;

  margin-bottom: 12rpx;
}

.poi-desc {

  font-size: 24rpx;

  color: #6b7280;

  overflow: hidden;

  text-overflow: ellipsis;

  white-space: nowrap;
}

.poi-distance {

  margin-top: 10rpx;

  font-size: 24rpx;

  color: #0ea5e9;

  font-weight: 600;
}

.bottom-panel {

  display: flex;

  align-items: center;

  gap: 24rpx;
}

.action-btn {

  flex-shrink: 0;

  background: linear-gradient(
          135deg,
          #0ea5e9,
          #0369a1
  );

  color: #fff;

  width: 180rpx;

  height: 72rpx;

  border-radius: 36rpx;

  display: flex;

  align-items: center;

  justify-content: center;

  font-size: 28rpx;

  font-weight: 600;
}
</style>
