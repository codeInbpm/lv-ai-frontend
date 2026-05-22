<script setup lang="ts">
import { ref, onMounted } from 'vue'
import NavBar from '../../components/common/NavBar.vue'
import { useUserStore } from '../../stores/user'
import { historyApi } from '../../api/history'

const userStore = useUserStore()
const historyList = ref<any[]>([])
const page = ref(1)
const size = ref(10)
const loading = ref(false)
const hasMore = ref(true)

onMounted(() => {
  fetchHistory()
})

async function fetchHistory(isRefresh = false) {
  if (loading.value || (!hasMore.value && !isRefresh)) return
  loading.value = true
  if (isRefresh) {
    page.value = 1
    hasMore.value = true
  }
  try {
    if (userStore.userInfo?.id) {
      const data = await historyApi.getList(userStore.userInfo.id, page.value, size.value)
      const list = data?.records || []
      if (isRefresh) {
        historyList.value = list
      } else {
        historyList.value.push(...list)
      }
      if (list.length < size.value) {
        hasMore.value = false
      }
      page.value++
    }
  } catch (e) {
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
    uni.stopPullDownRefresh()
  }
}

function onPullDownRefresh() {
  fetchHistory(true)
}

function onReachBottom() {
  fetchHistory()
}

function goDetail(item: any) {
  if (item.targetType === 3) {
    uni.navigateTo({ url: `/pages/strategy/detail?id=${item.targetId}` })
  } else if (item.targetType === 2) {
    uni.navigateTo({ url: `/pages/world/destination?id=${item.targetId}` })
  } else if (item.targetType === 4) {
    uni.navigateTo({ url: `/pages/note/detail?id=${item.targetId}` })
  }
}

function clearAll() {
  uni.showModal({
    title: '提示',
    content: '确定要清空所有浏览历史吗？',
    confirmColor: '#ef4444',
    success: async (res) => {
      if (res.confirm) {
        try {
          if (userStore.userInfo?.id) {
            await historyApi.clearAll(userStore.userInfo.id)
            uni.showToast({ title: '已清空' })
            fetchHistory(true)
          }
        } catch (e) {}
      }
    }
  })
}

function clearItem(item: any) {
  uni.showModal({
    title: '提示',
    content: '确定要删除这条记录吗？',
    confirmColor: '#ef4444',
    success: async (res) => {
      if (res.confirm) {
        try {
          if (userStore.userInfo?.id) {
            await historyApi.clearTarget(userStore.userInfo.id, item.targetType, item.targetId)
            uni.showToast({ title: '已删除' })
            fetchHistory(true)
          }
        } catch (e) {}
      }
    }
  })
}
</script>

<template>
  <view class="history-page">
    <NavBar fixed back title="浏览历史" textColor="#333" background="#fff">
      <template #right>
        <text class="clear-btn" @click="clearAll" v-if="historyList.length > 0">清空全部</text>
      </template>
    </NavBar>

    <view style="height: 120rpx;"></view>

    <scroll-view class="scroll-list" scroll-y @scrolltolower="onReachBottom" refresher-enabled @refresherrefresh="onPullDownRefresh" :refresher-triggered="loading && page === 1">
      <view class="list" v-if="historyList.length > 0">
        <view class="history-card" v-for="(item, index) in historyList" :key="index" @click="goDetail(item)">
          <image class="cover" :src="item.coverUrl || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=500'" mode="aspectFill" />
          <view class="info">
            <view class="title-row">
              <text class="tag">{{ item.targetType === 3 ? '攻略' : item.targetType === 2 ? '目的地' : item.targetType === 4 ? '笔记' : '景点' }}</text>
              <text class="title">{{ item.title }}</text>
            </view>
            <view class="bottom-row">
              <text class="time">浏览于 {{ item.viewTime }}</text>
              <text class="del-btn" @click.stop="clearItem(item)">删除记录</text>
            </view>
          </view>
        </view>
      </view>

      <view class="empty-state camel-state" v-else>
        <view class="empty-illustration">
          <text class="emoji-img">🐪</text>
        </view>
        <text class="empty-text">还没有留下浏览足迹</text>
      </view>
      
      <view class="loading-more" v-if="historyList.length > 0">
        <text>{{ hasMore ? '加载中...' : '到底啦~' }}</text>
      </view>
    </scroll-view>
  </view>
</template>

<style lang="scss" scoped>
.history-page {
  min-height: 100vh;
  background: #f5f7fa;
  display: flex;
  flex-direction: column;
}
.clear-btn {
  font-size: 26rpx;
  color: #ef4444;
  padding: 10rpx 20rpx;
  font-weight: 500;
}
.scroll-list {
  flex: 1;
  height: calc(100vh - 120rpx);
}
.list {
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}
.history-card {
  display: flex;
  background: #fff;
  border-radius: 16rpx;
  padding: 20rpx;
  gap: 24rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.03);
  border: 1rpx solid #f1f5f9;
}
.cover {
  width: 180rpx;
  height: 160rpx;
  border-radius: 12rpx;
  background: #f1f5f9;
}
.info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 4rpx 0;
}
.title-row {
  display: flex;
  align-items: flex-start;
  gap: 12rpx;
}
.tag {
  font-size: 20rpx;
  padding: 4rpx 10rpx;
  border-radius: 6rpx;
  background: #e0f2fe;
  color: #0ea5e9;
  flex-shrink: 0;
  margin-top: 4rpx;
}
.title {
  font-size: 28rpx;
  font-weight: 600;
  color: #334155;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  line-height: 1.4;
}
.bottom-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.time {
  font-size: 22rpx;
  color: #94a3b8;
}
.del-btn {
  font-size: 24rpx;
  color: #ef4444;
  padding: 10rpx 0 10rpx 20rpx;
}

.camel-state {
  padding-top: 100rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  .empty-illustration {
    width: 260rpx;
    height: 260rpx;
    background: #f1f5f9;
    border-radius: 40rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 40rpx;
  }
  .emoji-img {
    font-size: 120rpx;
  }
  .empty-text {
    font-size: 26rpx;
    color: #94a3b8;
  }
}
.loading-more {
  text-align: center;
  padding: 30rpx 0 60rpx;
  font-size: 24rpx;
  color: #94a3b8;
}
</style>
