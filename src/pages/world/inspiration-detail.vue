<script setup lang="ts">
import { ref, onMounted } from 'vue'
import NavBar from '../../components/common/NavBar.vue'

import { http } from '../../utils/request'

const inspirationId = ref('')
const detail = ref<any>({})
const loading = ref(true)

onMounted(() => {
  const pages = getCurrentPages()
  const options = pages[pages.length - 1].options
  if (options && options.id) {
    inspirationId.value = options.id
    fetchDetail()
  }
})

const fetchDetail = async () => {
  loading.value = true
  try {
    const res = await http.get<any>(`/world/inspiration/${inspirationId.value}`)
    detail.value = res || {}
  } catch (error) {
    uni.showToast({ title: '获取失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const generatePlan = () => {
  uni.showLoading({ title: '准备生成...', mask: true })
  
  // 使用灵感关联的目的地
  const destName = detail.value.destination ? detail.value.destination.name : detail.value.title
  
  uni.setStorageSync('prefillPlanData', {
    destination: destName,
    days: 5,
    preferences: ['自由行']
  })
  
  setTimeout(() => {
    uni.hideLoading()
    uni.navigateTo({ url: '/pages/plan/create/index' })
  }, 400)
}
</script>

<template>
  <view class="detail-page">
    <NavBar title="灵感详情" />
    
    <view v-if="loading" class="loading">加载中...</view>
    
    <scroll-view v-else scroll-y class="content">
      <image class="cover-image" :src="detail.coverUrl" mode="widthFix"></image>
      <view class="info-section">
        <text class="title">{{ detail.title }}</text>
        <text class="subtitle">{{ detail.subtitle }}</text>
        <view class="stats">
          <text class="stat-item">👁️ {{ detail.viewCount || 0 }} 浏览</text>
          <text class="stat-item">👍 {{ detail.likeCount || 0 }} 推荐</text>
        </view>
        <view class="content-text" v-if="detail.content">{{ detail.content }}</view>
      </view>
      
      <view class="destination-section" v-if="detail.destination">
        <text class="section-title">关联目的地</text>
        <view class="dest-card">
          <image :src="detail.destination.imageUrl" mode="aspectFill" class="dest-img"></image>
          <view class="dest-info">
            <text class="dest-name">{{ detail.destination.name }}</text>
            <text class="dest-desc">{{ detail.destination.description }}</text>
          </view>
        </view>
      </view>
      
      <view class="bottom-bar">
        <view class="action-btn" @click="generatePlan">一键生成攻略</view>
      </view>
    </scroll-view>
  </view>
</template>

<style scoped>
.detail-page {
  min-height: 100vh;
  background-color: #f8fafc;
  display: flex;
  flex-direction: column;
}
.loading {
  text-align: center;
  padding: 40rpx;
  color: #94a3b8;
}
.content {
  flex: 1;
  padding-bottom: 120rpx;
}
.cover-image {
  width: 100%;
}
.info-section {
  padding: 30rpx;
  background: #fff;
  margin-bottom: 20rpx;
}
.title {
  font-size: 40rpx;
  font-weight: bold;
  color: #0f172a;
  display: block;
  margin-bottom: 10rpx;
}
.subtitle {
  font-size: 28rpx;
  color: #64748b;
  display: block;
  margin-bottom: 20rpx;
}
.stats {
  display: flex;
  gap: 30rpx;
  margin-bottom: 20rpx;
}
.stat-item {
  font-size: 24rpx;
  color: #94a3b8;
}
.content-text {
  font-size: 28rpx;
  color: #334155;
  line-height: 1.6;
  margin-top: 20rpx;
}
.destination-section {
  padding: 30rpx;
  background: #fff;
}
.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #0f172a;
  margin-bottom: 20rpx;
  display: block;
}
.dest-card {
  display: flex;
  background: #f1f5f9;
  border-radius: 16rpx;
  padding: 20rpx;
  align-items: center;
}
.dest-img {
  width: 120rpx;
  height: 120rpx;
  border-radius: 12rpx;
  margin-right: 20rpx;
}
.dest-info {
  flex: 1;
}
.dest-name {
  font-size: 30rpx;
  font-weight: bold;
  display: block;
  margin-bottom: 8rpx;
}
.dest-desc {
  font-size: 24rpx;
  color: #64748b;
  display: block;
}
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  background: #fff;
  padding: 20rpx 30rpx;
  box-sizing: border-box;
  box-shadow: 0 -4rpx 20rpx rgba(0,0,0,0.05);
}
.action-btn {
  background: #00bac7;
  color: #fff;
  text-align: center;
  padding: 24rpx 0;
  border-radius: 100rpx;
  font-weight: bold;
  font-size: 30rpx;
}
</style>
