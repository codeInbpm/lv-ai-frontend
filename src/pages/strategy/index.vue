<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import NavBar from '../../components/common/NavBar.vue'
import { discoverApi } from '../../api/discover'

const currentTab = ref('all')
const keyword = ref('')
const list = ref<any[]>([])
const loading = ref(false)

const tabs = [
  { key: 'all', name: '全部' },
  { key: 'internal', name: '站内精选' },
  { key: 'external', name: '全网高分' }
]

onMounted(() => {
  fetchStrategies()
})

async function fetchStrategies() {
  loading.value = true
  try {
    const res = await discoverApi.getStrategies({ 
      source: currentTab.value, 
      keyword: keyword.value 
    })
    list.value = res?.records || []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function handleTabChange(key: string) {
  currentTab.value = key
  fetchStrategies()
}

function onSearch() {
  fetchStrategies()
}

function goDetail(item: any) {
  if (item.source !== 'internal' && item.externalUrl) {
    uni.showModal({
      title: '即将前往外部平台',
      content: '外部链接不支持直接打开，是否复制链接后在浏览器访问？',
      confirmText: '复制链接',
      success: (res) => {
        if (res.confirm) {
          uni.setClipboardData({ data: item.externalUrl })
        }
      }
    })
  } else {
    uni.navigateTo({ url: `/pages/strategy/detail?id=${item.id}` })
  }
}

function goPublish() {
  uni.navigateTo({ url: '/pages/strategy/publish' })
}
</script>

<template>
  <view class="strategy-page">
    <NavBar fixed back title="精选攻略" />
    
    <!-- 搜索和Tabs -->
    <view class="header-section">
      <view class="search-bar">
        <input v-model="keyword" class="search-input" placeholder="搜索目的地或攻略" @confirm="onSearch" />
        <view class="search-icon" @click="onSearch">🔍</view>
      </view>
      
      <view class="tabs">
        <view 
          class="tab-item" 
          v-for="tab in tabs" 
          :key="tab.key"
          :class="{ active: currentTab === tab.key }"
          @click="handleTabChange(tab.key)"
        >
          <text class="tab-text">{{ tab.name }}</text>
          <view class="tab-line" v-if="currentTab === tab.key"></view>
        </view>
      </view>
    </view>

    <!-- 瀑布流列表 -->
    <scroll-view scroll-y class="scroll-content" @scrolltolower="fetchStrategies">
      <view class="waterfall">
        <view 
          class="strategy-card" 
          v-for="item in list" 
          :key="item.id"
          @click="goDetail(item)"
        >
          <image class="cover" :src="item.coverUrl || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=500'" mode="aspectFill" />
          <view class="card-info">
            <text class="title">{{ item.title }}</text>
            <view class="tags">
              <text class="tag source-tag" :class="item.source">{{ item.source === 'internal' ? '站内' : (item.source === 'xiaohongshu' ? '小红书' : '外部') }}</text>
              <text class="tag dest-tag" v-if="item.destination">{{ item.destination }}</text>
            </view>
            <view class="meta">
              <text class="meta-item">❤️ {{ item.likeCount || 0 }}</text>
              <text class="meta-item">👁️ {{ item.viewCount || 0 }}</text>
            </view>
          </view>
        </view>
      </view>
      
      <view v-if="list.length === 0 && !loading" class="empty-state">
        <text>暂无相关攻略，去发一篇吧~</text>
      </view>
      
      <view style="height: 140rpx;"></view>
    </scroll-view>

    <!-- 悬浮发布按钮 -->
    <view class="fab" @click="goPublish">
      <text class="fab-icon">✏️</text>
      <text class="fab-text">发攻略</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.strategy-page {
  min-height: 100vh;
  background: var(--bg-page);
  display: flex;
  flex-direction: column;
}

.header-section {
  background: #fff;
  padding: 20rpx 32rpx 0;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.03);
  z-index: 10;
}

.search-bar {
  display: flex;
  align-items: center;
  background: #f1f5f9;
  height: 72rpx;
  border-radius: 36rpx;
  padding: 0 32rpx;
  margin-bottom: 24rpx;
}
.search-input {
  flex: 1;
  font-size: 28rpx;
}
.search-icon {
  font-size: 32rpx;
  margin-left: 16rpx;
}

.tabs {
  display: flex;
  justify-content: space-around;
}
.tab-item {
  padding: 20rpx 0;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.tab-text {
  font-size: 30rpx;
  color: var(--text-secondary);
  font-weight: 500;
  transition: all 0.2s;
}
.tab-item.active .tab-text {
  color: var(--primary-dark);
  font-weight: 700;
  font-size: 32rpx;
}
.tab-line {
  position: absolute;
  bottom: 0;
  width: 40rpx;
  height: 6rpx;
  background: var(--primary);
  border-radius: 6rpx;
}

.scroll-content {
  flex: 1;
  height: 0;
  padding: 24rpx;
}

.waterfall {
  column-count: 2;
  column-gap: 20rpx;
}

.strategy-card {
  break-inside: avoid;
  background: #fff;
  border-radius: 20rpx;
  margin-bottom: 20rpx;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}
.cover {
  width: 100%;
  max-height: 400rpx;
  background: #e2e8f0;
}
.card-info {
  padding: 20rpx;
}
.title {
  font-size: 28rpx;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.4;
  margin-bottom: 16rpx;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-bottom: 16rpx;
}
.tag {
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
}
.source-tag {
  background: #e0f2fe;
  color: #0284c7;
  &.xiaohongshu { background: #fee2e2; color: #ef4444; }
  &.weibo { background: #fef08a; color: #ca8a04; }
}
.dest-tag {
  background: #f1f5f9;
  color: var(--text-secondary);
}
.meta {
  display: flex;
  justify-content: space-between;
  font-size: 24rpx;
  color: var(--text-tertiary);
}

.empty-state {
  text-align: center;
  padding: 100rpx 0;
  color: var(--text-tertiary);
  font-size: 28rpx;
}

.fab {
  position: fixed;
  right: 40rpx;
  bottom: calc(60rpx + env(safe-area-inset-bottom));
  width: 110rpx;
  height: 110rpx;
  background: linear-gradient(135deg, #0ea5e9, #0369a1);
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(14,165,233,0.4);
  z-index: 100;
}
.fab-icon { font-size: 40rpx; line-height: 1; }
.fab-text { font-size: 20rpx; color: rgba(255,255,255,0.9); font-weight: 600; margin-top: 4rpx; }
</style>
