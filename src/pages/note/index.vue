<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { noteApi, type UserNote } from '../../api/note'
import { useUserStore } from '../../stores/user'
import NavBar from '../../components/common/NavBar.vue'

const userStore = useUserStore()
const activeTab = ref(0) // 0: 笔记, 1: 赞过, 2: 收藏
const notes = ref<UserNote[]>([])
const liked = ref<any[]>([])
const collected = ref<any[]>([])
const loading = ref(false)

onMounted(() => {
  fetchData()
})

function onTabChange(index: number) {
  activeTab.value = index
  fetchData()
}

async function fetchData() {
  loading.value = true
  try {
    if (activeTab.value === 0) {
      const res = await noteApi.getMyNotes({ page: 1, size: 20 })
      notes.value = res.records || []
    } else if (activeTab.value === 1) {
      const res = await noteApi.getMyLiked({ page: 1, size: 20 })
      liked.value = res.records || []
    } else {
      const res = await noteApi.getMyCollected({ page: 1, size: 20 })
      collected.value = res.records || []
    }
  } catch (e) {
  } finally {
    loading.value = false
  }
}

function goPublish() {
  uni.navigateTo({ url: '/pages/note/publish' })
}
</script>

<template>
  <view class="note-page">
    <NavBar fixed back title="我的笔记" />

    <!-- 顶部用户信息区 -->
    <view class="user-header">
      <image class="avatar" :src="userStore.userInfo?.avatar || 'https://api.dicebear.com/7.x/adventurer/svg?seed=camel'" mode="aspectFill" />
      <view class="user-info">
        <text class="nickname">{{ userStore.userInfo?.nickname || '旅行者' }}</text>
        <text class="likes-count">暂无点赞</text>
      </view>
    </view>

    <!-- Tab栏 -->
    <view class="tabs">
      <view class="tab-item" :class="{ active: activeTab === 0 }" @click="onTabChange(0)">
        <text>笔记</text>
        <view class="line" v-if="activeTab === 0"></view>
      </view>
      <view class="tab-item" :class="{ active: activeTab === 1 }" @click="onTabChange(1)">
        <text>赞过</text>
        <view class="line" v-if="activeTab === 1"></view>
      </view>
      <view class="tab-item" :class="{ active: activeTab === 2 }" @click="onTabChange(2)">
        <text>收藏</text>
        <view class="line" v-if="activeTab === 2"></view>
      </view>
    </view>

    <!-- 列表内容区 -->
    <scroll-view scroll-y class="list-scroll">
      <view v-if="loading" class="loading">加载中...</view>

      <block v-else>
        <!-- 笔记空状态 -->
        <view class="empty-state" v-if="activeTab === 0 && notes.length === 0">
          <view class="empty-illustration">
            <text class="emoji-img">🐪</text>
          </view>
          <text class="empty-text">还没有笔记，快来发布笔记参与话题讨论吧~</text>
          <button class="publish-btn" @click="goPublish">发布笔记</button>
        </view>

        <!-- 赞过空状态 -->
        <view class="empty-state" v-if="activeTab === 1 && liked.length === 0">
          <view class="empty-illustration">
            <text class="emoji-img">🐪</text>
          </view>
          <text class="empty-text">还没有赞过的记录哦~</text>
        </view>

        <!-- 收藏空状态 -->
        <view class="empty-state" v-if="activeTab === 2 && collected.length === 0">
          <view class="empty-illustration">
            <text class="emoji-img">🐪</text>
          </view>
          <text class="empty-text">还没有收藏的记录哦~</text>
        </view>

        <!-- 有数据时的列表 (简单占位，后续可拓展瀑布流) -->
        <view class="note-list" v-if="activeTab === 0 && notes.length > 0">
          <view class="note-card" v-for="item in notes" :key="item.id">
            <image class="cover" :src="item.coverUrl || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=500'" mode="aspectFill" />
            <text class="title">{{ item.title }}</text>
            <view class="meta">
              <text class="time">{{ item.createTime?.split(' ')[0] }}</text>
              <text class="likes">❤️ {{ item.likeCount }}</text>
            </view>
          </view>
        </view>

        <view class="note-list" v-if="activeTab === 1 && liked.length > 0">
          <view class="note-card" v-for="item in liked" :key="item.id">
            <image class="cover" :src="item.coverUrl || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=500'" mode="aspectFill" />
            <text class="title">{{ item.title }}</text>
            <view class="meta">
              <text class="time">{{ item.createTime?.split(' ')[0] }}</text>
              <text class="likes">❤️ {{ item.likeCount }}</text>
            </view>
          </view>
        </view>

        <view class="note-list" v-if="activeTab === 2 && collected.length > 0">
          <view class="note-card" v-for="item in collected" :key="item.id">
            <image class="cover" :src="item.coverUrl || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=500'" mode="aspectFill" />
            <text class="title">{{ item.title }}</text>
            <view class="meta">
              <text class="time">{{ item.createTime?.split(' ')[0] }}</text>
              <text class="likes">❤️ {{ item.likeCount }}</text>
            </view>
          </view>
        </view>
      </block>
    </scroll-view>

    <!-- 底部悬浮发布按钮 -->
    <view class="fab-btn" v-if="notes.length > 0 && activeTab === 0" @click="goPublish">
      <text>+</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.note-page {
  min-height: 100vh;
  background: #fff;
  display: flex;
  flex-direction: column;
}
.user-header {
  padding: 40rpx 32rpx;
  display: flex;
  align-items: center;
  gap: 24rpx;
}
.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background: #f1f5f9;
}
.user-info {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}
.nickname {
  font-size: 36rpx;
  font-weight: 700;
  color: #1e293b;
}
.likes-count {
  font-size: 24rpx;
  color: #94a3b8;
}

.tabs {
  display: flex;
  padding: 0 32rpx;
  border-bottom: 1rpx solid #f1f5f9;
}
.tab-item {
  position: relative;
  padding: 24rpx 32rpx;
  font-size: 30rpx;
  color: #64748b;
  font-weight: 500;
  &.active {
    color: #1e293b;
    font-weight: 700;
  }
}
.line {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 40rpx;
  height: 6rpx;
  background: var(--primary);
  border-radius: 4rpx;
}

.list-scroll {
  flex: 1;
  height: 0;
  background: #f8fafc;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 120rpx;
}
.empty-illustration {
  width: 300rpx;
  height: 300rpx;
  background: #e2e8f0;
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
  margin-bottom: 60rpx;
}
.publish-btn {
  background: var(--primary);
  color: #fff;
  font-size: 30rpx;
  font-weight: 600;
  width: 320rpx;
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 44rpx;
  margin: 0;
  &::after { border: none; }
}

.loading {
  text-align: center;
  padding: 100rpx;
  color: #94a3b8;
  font-size: 26rpx;
}

.note-list {
  padding: 24rpx;
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}
.note-card {
  width: calc(50% - 10rpx);
  background: #fff;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.02);
  display: flex;
  flex-direction: column;
}
.cover {
  width: 100%;
  height: 300rpx;
  background: #f1f5f9;
}
.title {
  font-size: 28rpx;
  color: #334155;
  font-weight: 600;
  padding: 16rpx 16rpx 8rpx;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}
.meta {
  padding: 0 16rpx 16rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.time { font-size: 22rpx; color: #94a3b8; }
.likes { font-size: 22rpx; color: #64748b; }

.fab-btn {
  position: fixed;
  right: 40rpx;
  bottom: 100rpx;
  width: 100rpx;
  height: 100rpx;
  background: var(--primary);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 60rpx;
  box-shadow: 0 8rpx 20rpx rgba(14, 165, 233, 0.4);
}
</style>
