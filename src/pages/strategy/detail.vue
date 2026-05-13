<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import NavBar from '../../components/common/NavBar.vue'
import { http } from '../../utils/request'

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
    const res = await http.get(`/strategy/${id}/detail`)
    detail.value = res
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <view class="detail-page">
    <NavBar fixed back title="攻略详情" />
    
    <view v-if="loading" class="loading-state">加载中...</view>
    
    <scroll-view v-else-if="detail" scroll-y class="content-scroll">
      <!-- 封面图 -->
      <image class="cover-img" :src="detail.coverUrl || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1000'" mode="aspectFill" />
      
      <view class="content-body">
        <text class="title">{{ detail.title }}</text>
        
        <view class="author-row">
          <view class="author-info">
            <view class="avatar-ph">👤</view>
            <text class="author-name">{{ detail.source === 'internal' ? '旅行达人' : '网络热门' }}</text>
          </view>
          <view class="source-badge" :class="detail.source">{{ detail.source === 'internal' ? '站内推荐' : '外部精选' }}</view>
        </view>

        <view class="meta-row">
          <text class="meta-text">目的地: {{ detail.destination || '全国' }}</text>
          <text class="meta-text">天数: {{ detail.days }}天</text>
          <text class="meta-text">浏览: {{ detail.viewCount }}</text>
        </view>

        <!-- 正文 -->
        <view class="article-content">
          <text class="text">{{ detail.content }}</text>
        </view>
      </view>
      
      <view style="height: 100rpx;"></view>
    </scroll-view>

    <!-- 底部操作栏 -->
    <view class="bottom-action" v-if="!loading && detail">
      <view class="input-box">
        <text class="ph">说点什么...</text>
      </view>
      <view class="action-icons">
        <view class="icon-item">
          <text>❤️</text>
          <text class="num">{{ detail.likeCount }}</text>
        </view>
        <view class="icon-item">
          <text>💬</text>
          <text class="num">{{ detail.commentCount }}</text>
        </view>
        <view class="icon-item">
          <text>⭐</text>
          <text class="num">收藏</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.detail-page {
  min-height: 100vh;
  background: #fff;
  display: flex;
  flex-direction: column;
}
.content-scroll {
  flex: 1;
  height: 0;
}
.cover-img {
  width: 100%;
  height: 500rpx;
  background: #f1f5f9;
}
.content-body {
  padding: 32rpx;
}
.title {
  font-size: 40rpx;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.4;
  margin-bottom: 24rpx;
  display: block;
}
.author-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32rpx;
}
.author-info {
  display: flex;
  align-items: center;
  gap: 16rpx;
}
.avatar-ph {
  width: 64rpx; height: 64rpx;
  background: #f1f5f9; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 32rpx;
}
.author-name {
  font-size: 28rpx; font-weight: bold; color: var(--text-primary);
}
.source-badge {
  font-size: 22rpx;
  padding: 6rpx 16rpx;
  border-radius: 100rpx;
  &.internal { background: #e0f2fe; color: #0284c7; }
  &.xiaohongshu { background: #fee2e2; color: #ef4444; }
  &.weibo { background: #fef08a; color: #ca8a04; }
}
.meta-row {
  display: flex;
  gap: 24rpx;
  margin-bottom: 40rpx;
  padding: 20rpx;
  background: #f8fafc;
  border-radius: 16rpx;
}
.meta-text {
  font-size: 26rpx;
  color: var(--text-secondary);
}
.article-content {
  font-size: 32rpx;
  color: var(--text-primary);
  line-height: 1.8;
  white-space: pre-wrap;
}

.bottom-action {
  position: fixed;
  bottom: 0; left: 0; width: 100%;
  background: #fff;
  border-top: 1rpx solid #f1f5f9;
  padding: 16rpx 32rpx calc(16rpx + env(safe-area-inset-bottom));
  display: flex;
  align-items: center;
  gap: 32rpx;
}
.input-box {
  flex: 1;
  background: #f1f5f9;
  height: 72rpx;
  border-radius: 36rpx;
  display: flex; align-items: center;
  padding: 0 32rpx;
}
.ph { font-size: 26rpx; color: var(--text-tertiary); }

.action-icons {
  display: flex; gap: 32rpx;
}
.icon-item {
  display: flex; flex-direction: column; align-items: center; gap: 4rpx;
  font-size: 40rpx;
}
.num { font-size: 20rpx; color: var(--text-secondary); }

.loading-state {
  text-align: center; padding: 100rpx; color: var(--text-tertiary);
}
</style>
