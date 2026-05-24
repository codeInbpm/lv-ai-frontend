<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import NavBar from '../../components/common/NavBar.vue'
import ChinaMap from '../../components/map/ChinaMap.vue'
import { useNavBar } from '../../composables/useNavBar'
import { meApi, type FootprintItem, type FootprintStats, type CountryGroup, type CityGroup } from '../../api/me'
import { useUserStore } from '../../stores/user'

const { totalHeight: navTotalHeight } = useNavBar()
const userStore = useUserStore()

// 数据
const footprintList = ref<FootprintItem[]>([])
const stats = ref<FootprintStats>({ cityCount: 0, provinceCount: 0, totalFootprints: 0, checkinDays: 0 })
const countryGroups = ref<CountryGroup[]>([])
const cityGroups = ref<CityGroup[]>([])
const loading = ref(true)

// 城市详情弹窗
const showCityPopup = ref(false)
const selectedCity = ref<CityGroup | null>(null)
const selectedCityFootprints = ref<FootprintItem[]>([])

// Tab
const tabs = [
  { label: '世界', value: 'world' },
  { label: '城市', value: 'city' },
  { label: '角落', value: 'spot' },
  { label: '打卡', value: 'checkin' }
]
const activeTab = ref('world')

// 角落当前位置
const currentLat = ref(35.0)
const currentLng = ref(105.0)
const spotMarkers = ref<any[]>([])

// 打卡时间线
const checkinList = computed(() => {
  const sorted = [...footprintList.value].sort((a, b) =>
    (b.createTime || '').localeCompare(a.createTime || '')
  )
  const map = new Map<string, FootprintItem[]>()
  sorted.forEach(f => {
    const day = (f.createTime || '').substring(0, 10)
    if (!day) return
    if (!map.has(day)) map.set(day, [])
    map.get(day)!.push(f)
  })
  return Array.from(map.entries()).map(([date, items]) => ({ date, items }))
})

onMounted(() => {
  fetchAll()
})

async function fetchAll() {
  if (!userStore.isLogin) { loading.value = false; return }
  loading.value = true
  try {
    const [fpRes, countryRes, cityRes] = await Promise.all([
      meApi.getFootprints(),
      meApi.getCountryGroups(),
      meApi.getCityGroups()
    ])
    console.log('[footprint] fpRes:', JSON.stringify(fpRes))
    console.log('[footprint] countryRes:', JSON.stringify(countryRes))
    console.log('[footprint] cityRes:', JSON.stringify(cityRes))
    footprintList.value = fpRes?.list || []
    stats.value = fpRes?.stats || { cityCount: 0, provinceCount: 0, totalFootprints: 0, checkinDays: 0 }
    countryGroups.value = countryRes || []
    cityGroups.value = cityRes || []
  } catch (e) {
    console.error('[footprint] fetchAll error:', e)
  }
  loading.value = false
}

function onTabChange(val: string) {
  activeTab.value = val
  if (val === 'spot') initSpotMap()
}

function initSpotMap() {
  uni.getLocation({
    type: 'gcj02',
    success(res) {
      currentLat.value = res.latitude
      currentLng.value = res.longitude
      spotMarkers.value = footprintList.value
        .filter(f => f.lat && f.lng)
        .map(f => ({
          id: f.id,
          latitude: Number(f.lat),
          longitude: Number(f.lng),
          title: f.locationName,
          iconPath: '/static/icons/marker.png',
          width: 28,
          height: 28,
          callout: { content: f.locationName, padding: 6, borderRadius: 6, display: 'BYCLICK' }
        }))
    }
  })
}

function goAdd() {
  uni.navigateTo({ url: '/pages/footprint/add' })
}

function onCityTap(group: CityGroup) {
  selectedCity.value = group
  selectedCityFootprints.value = footprintList.value.filter(f => f.city === group.city)
  showCityPopup.value = true
}

function closeCityPopup() {
  showCityPopup.value = false
}

function getCityFirstLocation(): string {
  const fps = selectedCityFootprints.value
  if (!fps.length) return ''
  const withName = fps.find(f => f.locationName)
  return withName?.locationName || ''
}

function getCityAllImages(): string[] {
  const result: string[] = []
  selectedCityFootprints.value.forEach(f => {
    parseImages(f.images).forEach(img => {
      if (img && !result.includes(img)) result.push(img)
    })
  })
  return result
}

function formatCheckinDate(t?: string): string {
  if (!t) return ''
  return t.substring(0, 10).replace(/-/g, '.')
}

// 地图标记数据
const checkedCities = computed(() => {
  return cityGroups.value.map(g => ({ city: g.city, count: g.footprintCount }))
})

function onMapCityTap(city: string) {
  const group = cityGroups.value.find(g => g.city === city)
  if (group) onCityTap(group)
}

function parseImages(img?: string): string[] {
  if (!img) return []
  try { return JSON.parse(img) } catch { return [] }
}

function formatTime(t?: string) {
  if (!t) return ''
  return t.substring(0, 16).replace('T', ' ').replace(/-/g, '/')
}

function formatDay(d: string) {
  return d.replace(/-/g, '/')
}
</script>

<template>
  <view class="footprint-page">
    <NavBar fixed back title="我的足迹" textColor="#ffffff"
      background="linear-gradient(135deg, #0c4a6e, #0ea5e9)" :placeholder="true" />

    <!-- ====== 世界 Tab：中国地图 ====== -->
    <view v-if="activeTab === 'world'" class="map-section">
      <ChinaMap :checkedCities="checkedCities" @cityTap="onMapCityTap" />
    </view>

    <!-- ====== 角落 Tab：当前位置地图 ====== -->
    <view v-if="activeTab === 'spot'" class="map-section">
      <map id="spotMap" class="map-view"
        :latitude="currentLat" :longitude="currentLng" :scale="13"
        :markers="spotMarkers" show-location />
    </view>

    <!-- ====== Tab 栏（固定在地图下方） ====== -->
    <view class="tab-bar">
      <view v-for="t in tabs" :key="t.value"
        :class="['tab-item', { active: activeTab === t.value }]"
        @click="onTabChange(t.value)">
        <text class="tab-text">{{ t.label }}</text>
        <view v-if="activeTab === t.value" class="tab-line" />
      </view>
    </view>

    <!-- ====== 滚动内容区 ====== -->
    <scroll-view scroll-y class="main-scroll">

      <!-- 加载中 -->
      <view v-if="loading" class="loading-state">
        <text class="loading-text">加载中...</text>
      </view>

      <!-- 未登录 -->
      <view v-else-if="!userStore.isLogin" class="empty-state">
        <text class="empty-icon"> </text>
        <text class="empty-title">请先登录</text>
        <text class="empty-desc">登录后查看你的足迹</text>
        <button class="empty-btn" @click="uni.navigateTo({ url: '/pages/login/index' })">去登录</button>
      </view>

      <!-- 空状态 -->
      <view v-else-if="footprintList.length === 0" class="empty-state">
        <text class="empty-icon">  </text>
        <text class="empty-title">还没有足迹</text>
        <text class="empty-desc">去旅行打卡，点亮你的地图吧</text>
      </view>

      <template v-else>

        <!-- ====== 世界：国家分组 ====== -->
        <template v-if="activeTab === 'world'">
          <view class="section-header">
            <text class="section-title">最近点亮</text>
          </view>
          <view class="group-list">
            <view v-for="g in countryGroups" :key="g.country" class="group-card card">
              <view class="group-left">
                <text class="group-flag"> </text>
                <view class="group-info">
                  <text class="group-name">{{ g.country }}</text>
                  <text class="group-sub">已点亮 {{ g.cityCount }} 个城市</text>
                </view>
              </view>
              <view class="group-right">
                <text class="group-num">{{ g.cityCount }}</text>
                <text class="group-arrow">已点亮 ›</text>
              </view>
            </view>
          </view>
        </template>

        <!-- ====== 城市：图片网格 ====== -->
        <template v-if="activeTab === 'city'">
          <view class="section-header">
            <text class="section-title">已点亮城市</text>
          </view>
          <view class="city-grid">
            <view v-for="(group, idx) in cityGroups" :key="group.city"
              :class="['city-card', { 'city-card-wide': idx % 3 === 0 }]"
              @click="onCityTap(group)">
              <view class="city-bg-wrap">
                <image v-if="parseImages(group.coverImages)[0]"
                  :src="parseImages(group.coverImages)[0]"
                  class="city-bg" mode="aspectFill" />
                <view v-else class="city-bg-placeholder" />
                <view class="city-overlay" />
                <!-- 右上角小图 -->
                <view v-if="parseImages(group.coverImages).length > 1" class="city-thumbs">
                  <image v-for="(img, i) in parseImages(group.coverImages).slice(1, 3)" :key="i"
                    :src="img" class="city-thumb" mode="aspectFill" />
                </view>
              </view>
              <!-- 底部信息 -->
              <view class="city-bottom">
                <text class="city-name">{{ group.city }}</text>
                <text class="city-stat">{{ group.days }}天点亮</text>
                <text class="city-desc">{{ userStore.userInfo?.nickname || '你' }}已陪你在这里度过{{ group.days }}天</text>
              </view>
            </view>
          </view>
        </template>

        <!-- ====== 角落：足迹卡片列表 ====== -->
        <template v-if="activeTab === 'spot'">
          <view class="section-header">
            <text class="section-title">附近足迹</text>
          </view>
          <view class="spot-list">
            <view v-for="item in footprintList" :key="item.id" class="spot-card card">
              <image v-if="parseImages(item.images)[0]" :src="parseImages(item.images)[0]"
                class="spot-img" mode="aspectFill" />
              <view v-else class="spot-img-placeholder"><text> </text></view>
              <view class="spot-info">
                <text class="spot-name">{{ item.locationName }}</text>
                <text v-if="item.address" class="spot-addr">{{ item.address }}</text>
                <text class="spot-time">{{ formatTime(item.createTime) }}</text>
              </view>
            </view>
          </view>
        </template>

        <!-- ====== 打卡：日期时间线 ====== -->
        <template v-if="activeTab === 'checkin'">
          <view class="section-header">
            <text class="section-title">打卡记录</text>
          </view>
          <view class="checkin-list">
            <view v-for="group in checkinList" :key="group.date" class="checkin-group">
              <view class="checkin-date-row">
                <text class="checkin-date">{{ formatDay(group.date) }}</text>
                <text class="checkin-badge">打卡 {{ group.items.length }} 次</text>
              </view>
              <view v-for="item in group.items" :key="item.id" class="checkin-card">
                <view class="checkin-line">
                  <view class="checkin-dot" />
                  <view class="checkin-bar" />
                </view>
                <view class="checkin-body card">
                  <text class="checkin-loc">{{ item.locationName }}</text>
                  <text v-if="item.content" class="checkin-note">{{ item.content }}</text>
                  <view v-if="parseImages(item.images).length" class="checkin-imgs">
                    <image v-for="(img, i) in parseImages(item.images).slice(0, 3)" :key="i"
                      :src="img" class="checkin-img" mode="aspectFill" />
                  </view>
                  <text class="checkin-time">{{ formatTime(item.createTime) }}</text>
                </view>
              </view>
            </view>
          </view>
        </template>

      </template>

      <view style="height: 180rpx" />
    </scroll-view>

    <!-- FAB -->
    <view class="fab" @click="goAdd">
      <text class="fab-icon">+</text>
      <text class="fab-text">点亮足迹</text>
    </view>

    <!-- 城市详情弹窗 -->
    <view v-if="showCityPopup" class="popup-mask" @click="closeCityPopup">
      <view class="popup-panel" @click.stop>
        <view class="popup-handle" />
        <template v-if="selectedCity">
          <!-- 标题行 -->
          <view class="popup-header">
            <view class="popup-title-row">
              <text class="popup-city-name">{{ selectedCity.city }}</text>
              <view class="popup-badge">
                <text class="popup-badge-text">已打卡</text>
              </view>
            </view>
            <text class="popup-visit-count">去过 {{ selectedCity.footprintCount }} 次</text>
          </view>

          <!-- 城市图片 -->
          <image v-if="parseImages(selectedCity.coverImages)[0]"
            :src="parseImages(selectedCity.coverImages)[0]"
            class="popup-cover" mode="aspectFill" />

          <!-- 打卡时间 -->
          <view class="popup-section popup-time-section">
            <text class="popup-section-label">打卡时间</text>
            <text class="popup-section-value">{{ formatCheckinDate(selectedCity.firstTime) }}</text>
          </view>

          <!-- 旅行足迹 -->
          <view v-if="getCityFirstLocation()" class="popup-section">
            <text class="popup-section-label">旅行足迹</text>
            <text class="popup-section-value popup-location">{{ getCityFirstLocation() }}</text>
          </view>

          <!-- 照片网格 -->
          <view v-if="getCityAllImages().length > 0" class="popup-photos">
            <view v-for="(img, i) in getCityAllImages().slice(0, 4)" :key="i" class="popup-photo-item">
              <image :src="img" class="popup-photo" mode="aspectFill" />
              <view v-if="i === 3 && getCityAllImages().length > 4" class="popup-photo-more">
                <text class="popup-photo-more-text">+{{ getCityAllImages().length - 4 }}</text>
              </view>
            </view>
          </view>
        </template>
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

/* 地图 */
.map-section {
  width: 100%;
  height: 360rpx;
  flex-shrink: 0;
}
.map-view {
  width: 100%;
  height: 100%;
}

/* Tab 栏 —— 紧贴地图下方 */
.tab-bar {
  display: flex;
  background: #fff;
  padding: 0 20rpx;
  box-shadow: var(--shadow-sm);
  flex-shrink: 0;
  z-index: 20;
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

/* 滚动内容 */
.main-scroll {
  flex: 1;
  height: 0;
}

/* 标题 */
.section-header {
  padding: 28rpx 24rpx 16rpx;
}
.section-title {
  font-size: 32rpx;
  font-weight: 700;
  color: var(--text-primary);
}

/* ========== 世界：国家分组 ========== */
.group-list {
  padding: 0 24rpx;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}
.group-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 24rpx;
}
.group-left {
  display: flex;
  align-items: center;
  gap: 20rpx;
  flex: 1;
  min-width: 0;
}
.group-flag { font-size: 44rpx; flex-shrink: 0; }
.group-info { display: flex; flex-direction: column; }
.group-name { font-size: 30rpx; font-weight: 700; color: var(--text-primary); }
.group-sub { font-size: 22rpx; color: var(--text-tertiary); margin-top: 4rpx; }
.group-right { display: flex; align-items: center; gap: 8rpx; flex-shrink: 0; }
.group-num { font-size: 36rpx; font-weight: 800; color: var(--primary); }
.group-arrow { font-size: 22rpx; color: var(--text-tertiary); }

/* ========== 城市：图片网格 ========== */
.city-grid {
  padding: 0 24rpx;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
}
.city-card {
  position: relative;
  border-radius: 20rpx;
  overflow: hidden;
  height: 340rpx;
  display: flex;
  flex-direction: column;
}
.city-card-wide {
  grid-column: span 2;
  height: 380rpx;
}
.city-bg-wrap {
  position: relative;
  flex: 1;
  min-height: 0;
}
.city-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.city-bg-placeholder {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #0ea5e9, #06b6d4);
}
.city-overlay {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.55) 100%);
  pointer-events: none;
}
.city-thumbs {
  position: absolute;
  top: 16rpx;
  right: 16rpx;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  pointer-events: none;
}
.city-thumb {
  width: 100rpx;
  height: 70rpx;
  border-radius: 10rpx;
  border: 2rpx solid rgba(255,255,255,0.5);
}
.city-bottom {
  padding: 20rpx 24rpx;
  background: linear-gradient(180deg, transparent, rgba(0,0,0,0.4));
  position: relative;
  z-index: 2;
  margin-top: -80rpx;
}
.city-name {
  font-size: 34rpx;
  font-weight: 800;
  color: #fff;
  display: block;
}
.city-stat {
  font-size: 22rpx;
  color: rgba(255,255,255,0.8);
  display: block;
  margin-top: 4rpx;
}
.city-desc {
  font-size: 20rpx;
  color: rgba(255,255,255,0.7);
  display: block;
  margin-top: 2rpx;
}

/* ========== 角落：卡片列表 ========== */
.spot-list {
  padding: 0 24rpx;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}
.spot-card {
  display: flex;
  padding: 20rpx;
  gap: 20rpx;
}
.spot-img {
  width: 140rpx;
  height: 140rpx;
  border-radius: 16rpx;
  flex-shrink: 0;
}
.spot-img-placeholder {
  width: 140rpx;
  height: 140rpx;
  border-radius: 16rpx;
  background: linear-gradient(135deg, #bae6fd, #7dd3fc);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 50rpx;
  flex-shrink: 0;
}
.spot-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}
.spot-name {
  font-size: 30rpx;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4rpx;
}
.spot-addr {
  font-size: 22rpx;
  color: var(--text-tertiary);
  margin-bottom: 4rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.spot-time {
  font-size: 22rpx;
  color: var(--text-tertiary);
}

/* ========== 打卡：时间线 ========== */
.checkin-list {
  padding: 0 24rpx;
}
.checkin-group {
  margin-bottom: 20rpx;
}
.checkin-date-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12rpx 8rpx;
}
.checkin-date {
  font-size: 26rpx;
  font-weight: 700;
  color: var(--text-primary);
}
.checkin-badge {
  font-size: 22rpx;
  color: var(--primary);
  background: var(--primary-light);
  padding: 4rpx 16rpx;
  border-radius: 100rpx;
}
.checkin-card {
  display: flex;
  gap: 16rpx;
}
.checkin-line {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 32rpx;
  flex-shrink: 0;
  padding-top: 32rpx;
}
.checkin-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: var(--primary);
  flex-shrink: 0;
}
.checkin-bar {
  width: 2rpx;
  flex: 1;
  background: var(--border);
  margin-top: 4rpx;
}
.checkin-body {
  flex: 1;
  padding: 20rpx 24rpx;
  margin-bottom: 12rpx;
}
.checkin-loc {
  font-size: 28rpx;
  font-weight: 600;
  color: var(--text-primary);
  display: block;
  margin-bottom: 6rpx;
}
.checkin-note {
  font-size: 24rpx;
  color: var(--text-secondary);
  display: block;
  margin-bottom: 8rpx;
}
.checkin-imgs {
  display: flex;
  gap: 12rpx;
  margin-bottom: 8rpx;
}
.checkin-img {
  width: 140rpx;
  height: 140rpx;
  border-radius: 12rpx;
}
.checkin-time {
  font-size: 22rpx;
  color: var(--text-tertiary);
  display: block;
}

/* 加载 / 空状态 */
.loading-state {
  display: flex;
  justify-content: center;
  padding: 100rpx 0;
}
.loading-text {
  font-size: 28rpx;
  color: var(--text-tertiary);
}
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 100rpx 0;
}
.empty-icon { font-size: 100rpx; margin-bottom: 20rpx; }
.empty-title { font-size: 30rpx; font-weight: 700; color: var(--text-primary); margin-bottom: 8rpx; }
.empty-desc { font-size: 24rpx; color: var(--text-tertiary); margin-bottom: 32rpx; }
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

/* FAB */
.fab {
  position: fixed;
  right: 32rpx;
  bottom: calc(60rpx + env(safe-area-inset-bottom));
  background: linear-gradient(135deg, #ec4899, #f472b6);
  border-radius: 50rpx;
  padding: 20rpx 36rpx;
  display: flex;
  align-items: center;
  gap: 8rpx;
  box-shadow: 0 8rpx 24rpx rgba(236,72,153,0.4);
  z-index: 100;
}
.fab-icon { font-size: 36rpx; color: #fff; font-weight: 700; }
.fab-text { font-size: 26rpx; color: #fff; font-weight: 600; }

/* ========== 城市详情弹窗 ========== */
.popup-mask {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  z-index: 500;
  display: flex;
  align-items: flex-end;
}
.popup-panel {
  width: 100%;
  background: #fff;
  border-radius: 32rpx 32rpx 0 0;
  padding: 16rpx 40rpx calc(40rpx + env(safe-area-inset-bottom));
  max-height: 80vh;
  overflow-y: auto;
}
.popup-handle {
  width: 64rpx;
  height: 8rpx;
  border-radius: 4rpx;
  background: #e5e7eb;
  margin: 0 auto 28rpx;
}
.popup-header {
  margin-bottom: 28rpx;
}
.popup-title-row {
  display: flex;
  align-items: center;
  gap: 14rpx;
  margin-bottom: 10rpx;
}
.popup-city-name {
  font-size: 40rpx;
  font-weight: 800;
  color: #111827;
}
.popup-badge {
  background: #fce7f3;
  border-radius: 8rpx;
  padding: 4rpx 14rpx;
}
.popup-badge-text {
  font-size: 20rpx;
  color: #ec4899;
  font-weight: 600;
}
.popup-visit-count {
  font-size: 26rpx;
  color: #6b7280;
}
.popup-cover {
  width: 100%;
  height: 340rpx;
  border-radius: 20rpx;
  margin-bottom: 28rpx;
}
.popup-section {
  margin-bottom: 24rpx;
}
.popup-section-label {
  font-size: 24rpx;
  color: #9ca3af;
  display: block;
  margin-bottom: 8rpx;
}
.popup-section-value {
  font-size: 30rpx;
  color: #111827;
  font-weight: 600;
  display: block;
}
.popup-time-section {
  background: #f3f4f6;
  border-radius: 16rpx;
  padding: 20rpx 24rpx;
  margin-bottom: 24rpx;
}
.popup-time-section .popup-section-label {
  margin-bottom: 6rpx;
}
.popup-location {
  font-weight: 500;
}
.popup-photos {
  display: flex;
  gap: 16rpx;
  margin-top: 8rpx;
  padding-bottom: 16rpx;
}
.popup-photo-item {
  position: relative;
  flex: 1;
  border-radius: 16rpx;
  overflow: hidden;
  height: 180rpx;
}
.popup-photo {
  width: 100%;
  height: 100%;
}
.popup-photo-more {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex;
  align-items: center;
  justify-content: center;
}
.popup-photo-more-text {
  font-size: 34rpx;
  color: #fff;
  font-weight: 700;
}
</style>
