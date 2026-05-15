<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import NavBar from '../../components/common/NavBar.vue'
import { useUserStore } from '../../stores/user'
import { communityApi, type CommunityStats } from '../../api/community'

const userStore = useUserStore()
const activeTab = ref(0) // 0: 我的收藏, 1: 浏览历史, 2: 创作中心, 3: 草稿箱
const activeCreationTab = ref(0) // 创作中心内的子tab: 0: 笔记, 1: 攻略, 2: 游记
const stats = ref<CommunityStats>({ followingCount: 0, followersCount: 0, likesAndFavsCount: 0 })
const collectedStrategies = ref<any[]>([])
const browsingHistory = ref<any[]>([])
const myNotes = ref<any[]>([])
const drafts = ref<any[]>([])
const loading = ref(false)

onMounted(async () => {
  fetchStats()
  fetchTabData(0) // Load initial tab data
})

// 监听 Tab 切换
watch(activeTab, (newVal) => {
  fetchTabData(newVal)
})

async function fetchStats() {
  try {
    stats.value = await communityApi.getStats()
  } catch (e) {}
}

async function fetchTabData(tabIndex: number) {
  loading.value = true
  try {
    if (tabIndex === 0) {
      collectedStrategies.value = await communityApi.getCollections(3) || []
    } else if (tabIndex === 1) {
      browsingHistory.value = await communityApi.getHistory() || []
    } else if (tabIndex === 2) {
      // 创作中心 - 默认加载笔记
      fetchCreationData(activeCreationTab.value)
    } else if (tabIndex === 3) {
      drafts.value = await communityApi.getDrafts() || []
    }
  } catch (e) {
    console.error('Failed to load tab data:', e)
  } finally {
    loading.value = false
  }
}

// 监听创作中心子 Tab
watch(activeCreationTab, (newVal) => {
  fetchCreationData(newVal)
})

async function fetchCreationData(tabIndex: number) {
  if (tabIndex === 0) {
    try {
      const res = await uni.request({
        url: 'http://localhost:8080/api/note/list',
        header: { Authorization: userStore.token }
      })
      const data = res.data as any
      myNotes.value = data.data.records || []
    } catch (e) {}
  }
}

function goNoteDetail(id: number) {
  uni.navigateTo({ url: `/pages/note/detail?id=${id}` })
}

function goDraftDetail(item: any) {
  uni.navigateTo({ url: `/pages/note/publish?draftId=${item.id}` })
}

function goPublish() {
  uni.navigateTo({ url: '/pages/note/publish' })
}

function deleteNote(item: any) {
  uni.showModal({
    title: '提示',
    content: '确定要删除这篇笔记吗？删除后不可恢复',
    confirmColor: '#ef4444',
    success: async (res) => {
      if (res.confirm) {
        try {
          const delRes = await uni.request({
            url: `http://localhost:8080/api/note/${item.id}`,
            method: 'DELETE',
            header: { Authorization: userStore.token }
          })
          const data = delRes.data as any
          if (data.code === 200) {
            uni.showToast({ title: '删除成功' })
            fetchCreationData(activeCreationTab.value)
          } else {
            uni.showToast({ title: data.message || '删除失败', icon: 'none' })
          }
        } catch (e) {
          uni.showToast({ title: '网络错误', icon: 'none' })
        }
      }
    }
  })
}

function deleteDraft(item: any) {
  uni.showModal({
    title: '提示',
    content: '确定要删除这篇草稿吗？',
    confirmColor: '#ef4444',
    success: async (res) => {
      if (res.confirm) {
        try {
          const delRes = await uni.request({
            url: `http://localhost:8080/api/community/drafts/${item.id}`,
            method: 'DELETE',
            header: { Authorization: userStore.token }
          })
          const data = delRes.data as any
          if (data.code === 200) {
            uni.showToast({ title: '删除成功' })
            drafts.value = await communityApi.getDrafts() || []
          } else {
            uni.showToast({ title: data.message || '删除失败', icon: 'none' })
          }
        } catch (e) {
          uni.showToast({ title: '网络错误', icon: 'none' })
        }
      }
    }
  })
}

async function removeCollection(item: any) {
  // Use existing toggleCollect API to remove
  try {
    const url = item.targetType === 3 ? `/strategy/interaction/${item.targetId}/collect` : `/note/interaction/${item.targetId}/collect`
    const res = await uni.request({
      url: `http://localhost:8080/api${url}`,
      method: 'POST',
      header: { Authorization: userStore.token }
    })
    uni.showToast({ title: '已移除' })
    fetchTabData(0)
  } catch (e) {}
}
</script>

<template>
  <view class="community-page">
    <NavBar fixed back title="我的社区" textColor="#333" background="#fff" />
    
    <!-- 头部用户信息 -->
    <view class="header-section">
      <!-- 撑开 NavBar 高度占位 -->
      <view style="height: 120rpx;"></view>
      
      <view class="user-row">
        <image class="avatar" :src="userStore.userInfo?.avatar || 'https://api.dicebear.com/7.x/adventurer/svg?seed=camel'" mode="aspectFill" />
        <view class="info">
          <text class="name">{{ userStore.userInfo?.nickname || '旅行家' }}</text>
          <text class="sign">去哪儿都行，只要在路上 ✨</text>
        </view>
        <view class="verify-btn">申请认证</view>
      </view>
      <view class="stats-row">
        <view class="stat">
          <text class="num">{{ stats.followingCount }}</text>
          <text class="label">关注</text>
        </view>
        <view class="stat">
          <text class="num">{{ stats.followersCount }}</text>
          <text class="label">粉丝</text>
        </view>
        <view class="stat">
          <text class="num">{{ stats.likesAndFavsCount }}</text>
          <text class="label">获赞与收藏</text>
        </view>
      </view>
    </view>

    <!-- 核心功能区 Tab切换 -->
    <view class="content-card">
      <view class="tabs">
        <view class="tab" :class="{ active: activeTab === 0 }" @click="activeTab = 0">我的收藏</view>
        <view class="tab" :class="{ active: activeTab === 1 }" @click="activeTab = 1">浏览历史</view>
        <view class="tab" :class="{ active: activeTab === 2 }" @click="activeTab = 2">创作中心</view>
        <view class="tab" :class="{ active: activeTab === 3 }" @click="activeTab = 3">草稿箱</view>
      </view>

      <scroll-view scroll-y class="scroll-area">
        <!-- 我的收藏 -->
        <view class="tab-content" v-if="activeTab === 0">
          <view class="strategy-list" v-if="collectedStrategies.length > 0">
            <view class="strategy-card" v-for="item in collectedStrategies" :key="item.id">
              <template v-if="!item.isDeleted">
                <view class="s-card-inner" @click="uni.navigateTo({ url: '/pages/strategy/detail?id=' + item.targetId })">
                  <image class="s-cover" :src="item.data.coverUrl || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=500'" mode="aspectFill" />
                  <view class="s-info">
                    <text class="s-title">{{ item.data.title }}</text>
                    <view class="s-meta">
                      <text class="s-dest">{{ item.data.destination || '未知目的地' }} · {{ item.data.days || 1 }}天</text>
                      <text class="s-likes">❤️ {{ item.data.likeCount || 0 }}</text>
                    </view>
                  </view>
                </view>
              </template>
              <template v-else>
                <view class="deleted-placeholder">
                  <text class="del-msg">内容已被原作者删除</text>
                  <text class="del-btn" @click="removeCollection(item)">移除收藏</text>
                </view>
              </template>
            </view>
          </view>
          <view class="empty-state" v-else>
            <view class="emoji-box">⭐️</view>
            <text class="empty-text">暂无收藏的攻略或景点</text>
          </view>
        </view>

        <!-- 浏览历史 -->
        <view class="tab-content" v-if="activeTab === 1">
          <view class="history-list" v-if="browsingHistory.length > 0">
            <view class="history-item" v-for="item in browsingHistory" :key="item.id">
              <view class="h-dot"></view>
              <view class="h-content">
                <text class="h-title">浏览了攻略 ID: {{ item.targetId }}</text>
                <text class="h-time">{{ item.viewTime }}</text>
              </view>
            </view>
          </view>
          <view class="empty-state" v-else>
            <view class="emoji-box">🕒</view>
            <text class="empty-text">还没有留下浏览足迹</text>
          </view>
        </view>

        <!-- 创作中心 (包含原我的笔记) -->
        <view class="tab-content" v-if="activeTab === 2">
          <view class="creation-tabs">
            <text class="c-tab" :class="{ active: activeCreationTab === 0 }" @click="activeCreationTab = 0">笔记</text>
            <text class="c-tab" :class="{ active: activeCreationTab === 1 }" @click="activeCreationTab = 1">攻略</text>
            <text class="c-tab" :class="{ active: activeCreationTab === 2 }" @click="activeCreationTab = 2">游记</text>
          </view>

          <!-- 笔记列表 -->
          <view v-if="activeCreationTab === 0">
            <view class="note-grid" v-if="myNotes.length > 0">
              <view class="note-card" v-for="item in myNotes" :key="item.id">
                <view class="n-card-inner" @click="goNoteDetail(item.id)">
                  <image class="n-cover" :src="item.coverUrl" mode="aspectFill" />
                  <view class="n-info">
                    <text class="n-title">{{ item.title }}</text>
                    <view class="n-bottom">
                      <text class="n-status">{{ item.status === 1 ? '已发布' : '审核中' }}</text>
                      <text class="n-likes">❤️ {{ item.likeCount }}</text>
                    </view>
                  </view>
                </view>
                <view class="delete-icon" @click.stop="deleteNote(item)">
                  <text class="del-text">删除</text>
                </view>
              </view>
            </view>
            <view class="publish-btn-wrap">
              <button class="publish-btn" @click="goPublish">发布笔记</button>
            </view>
            <!-- 笔记空状态 (保留骆驼插图) -->
            <view class="empty-state camel-state" v-if="myNotes.length === 0">
              <view class="empty-illustration">
                <text class="emoji-img">🐪</text>
              </view>
              <text class="empty-text">还没有笔记，快来发布笔记参与话题讨论吧~</text>
            </view>
          </view>
          <view class="empty-state" v-else>
            <view class="emoji-box">✍️</view>
            <text class="empty-text">快来分享你的旅行故事吧</text>
          </view>
        </view>

        <!-- 草稿箱 -->
        <view class="tab-content" v-if="activeTab === 3">
          <view class="draft-list" v-if="drafts.length > 0">
            <view class="draft-card" v-for="item in drafts" :key="item.id">
              <view class="d-card-inner" @click="goDraftDetail(item)">
                <view class="d-header">
                  <text class="d-type">{{ item.draftType === 1 ? '笔记' : '攻略' }}</text>
                </view>
                <text class="d-title">{{ item.title || '无标题草稿' }}</text>
                <text class="d-time">更新于 {{ item.updateTime }}</text>
              </view>
              <view class="delete-btn-inline" @click.stop="deleteDraft(item)">
                <text class="del-icon">🗑️</text>
              </view>
            </view>
          </view>
          <view class="empty-state" v-else>
            <view class="emoji-box">📝</view>
            <text class="empty-text">草稿箱空空如也</text>
          </view>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.community-page {
  min-height: 100vh;
  background: #f5f7fa;
  display: flex;
  flex-direction: column;
}

.header-section {
  background: linear-gradient(to bottom, #e0f2fe, #f5f7fa);
  padding: 0 32rpx 30rpx;
}

.user-row {
  display: flex;
  align-items: center;
  gap: 24rpx;
  margin-bottom: 30rpx;
}
.avatar {
  width: 140rpx;
  height: 140rpx;
  border-radius: 50%;
  border: 4rpx solid #fff;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
}
.info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}
.name {
  font-size: 42rpx;
  font-weight: 800;
  color: #1e293b;
}
.sign {
  font-size: 24rpx;
  color: #64748b;
}
.verify-btn {
  background: #fff;
  color: #0ea5e9;
  font-size: 22rpx;
  font-weight: 600;
  padding: 10rpx 24rpx;
  border-radius: 100rpx;
  box-shadow: 0 2rpx 8rpx rgba(14,165,233,0.1);
}

.stats-row {
  display: flex;
  gap: 60rpx;
  padding-left: 10rpx;
}
.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
}
.num {
  font-size: 36rpx;
  font-weight: 800;
  color: #1e293b;
}
.label {
  font-size: 22rpx;
  color: #64748b;
}

.content-card {
  flex: 1;
  background: #fff;
  margin: 0 24rpx 24rpx;
  border-radius: 24rpx;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.02);
  overflow: hidden;
}

.tabs {
  display: flex;
  padding: 10rpx 10rpx 0;
  border-bottom: 1rpx solid #f1f5f9;
}
.tab {
  flex: 1;
  text-align: center;
  font-size: 28rpx;
  color: #64748b;
  font-weight: 500;
  padding: 20rpx 0;
  position: relative;
  &.active {
    color: #1e293b;
    font-weight: 700;
    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 40rpx;
      height: 6rpx;
      background: #0ea5e9;
      border-radius: 4rpx;
    }
  }
}

.scroll-area {
  flex: 1;
  height: 0;
}

.tab-content {
  padding: 30rpx;
  min-height: 100%;
}

.creation-tabs {
  display: flex;
  gap: 20rpx;
  margin-bottom: 40rpx;
}
.c-tab {
  font-size: 26rpx;
  color: #94a3b8;
  padding: 12rpx 32rpx;
  border-radius: 100rpx;
  background: #f8fafc;
  &.active {
    background: #e0f2fe;
    color: #0ea5e9;
    font-weight: 600;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 0;
}
.emoji-box {
  font-size: 100rpx;
  margin-bottom: 30rpx;
  opacity: 0.9;
}
.empty-text {
  font-size: 26rpx;
  color: #94a3b8;
}

.strategy-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}
.strategy-card {
  display: flex;
  background: #fff;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.03);
  border: 1rpx solid #f1f5f9;
}
.s-cover {
  width: 220rpx;
  height: 180rpx;
  background: #f1f5f9;
}
.s-info {
  flex: 1;
  padding: 20rpx;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.s-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #334155;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}
.s-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.s-dest {
  font-size: 24rpx;
  color: #64748b;
}
.s-likes {
  font-size: 24rpx;
  color: #ef4444;
}

.history-list {
  padding: 10rpx 0;
}
.history-item {
  display: flex;
  gap: 20rpx;
  margin-bottom: 30rpx;
  position: relative;
}
.h-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: #0ea5e9;
  margin-top: 10rpx;
  z-index: 2;
}
.h-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}
.h-title {
  font-size: 28rpx;
  color: #334155;
}
.h-time {
  font-size: 22rpx;
  color: #94a3b8;
}

.draft-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}
.draft-card {
  padding: 24rpx;
  background: #f8fafc;
  border-radius: 16rpx;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}
.d-type {
  font-size: 20rpx;
  color: #0ea5e9;
  background: #e0f2fe;
  padding: 4rpx 12rpx;
  border-radius: 4rpx;
  align-self: flex-start;
}
.d-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #1e293b;
}
.d-time {
  font-size: 22rpx;
  color: #94a3b8;
}

.d-time {
  font-size: 22rpx;
  color: #94a3b8;
}

.note-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
}
.note-card {
  background: #fff;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.03);
  border: 1rpx solid #f1f5f9;
}
.n-cover {
  width: 100%;
  height: 240rpx;
  background: #f1f5f9;
}
.n-info {
  padding: 16rpx;
}
.n-title {
  font-size: 26rpx;
  font-weight: 600;
  color: #334155;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  margin-bottom: 12rpx;
  line-height: 1.4;
}
.n-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.n-status {
  font-size: 20rpx;
  color: #0ea5e9;
  background: #e0f2fe;
  padding: 2rpx 10rpx;
  border-radius: 4rpx;
}
.n-likes {
  font-size: 22rpx;
  color: #ef4444;
}

.note-card {
  position: relative;
}
.delete-icon {
  position: absolute;
  top: 10rpx;
  right: 10rpx;
  background: rgba(0, 0, 0, 0.4);
  color: #fff;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  font-size: 20rpx;
  z-index: 10;
}

.draft-card {
  position: relative;
  display: flex !important;
  flex-direction: row !important;
  align-items: center;
  justify-content: space-between;
  .d-card-inner { flex: 1; }
  .delete-btn-inline {
    padding: 20rpx;
    font-size: 32rpx;
    opacity: 0.6;
  }
}

.n-likes {
  font-size: 22rpx;
  color: #ef4444;
}

.publish-btn-wrap {
  padding: 40rpx 0;
  display: flex;
  justify-content: center;
  .publish-btn {
    background: #0ea5e9;
    color: #fff;
    width: 320rpx;
    height: 88rpx;
    line-height: 88rpx;
    border-radius: 44rpx;
    font-size: 30rpx;
    font-weight: 600;
    box-shadow: 0 8rpx 20rpx rgba(14, 165, 233, 0.2);
    &::after { border: none; }
  }
}

.camel-state {
  padding-top: 40rpx;
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
    margin-bottom: 50rpx;
  }
  .publish-btn {
    background: #0ea5e9;
    color: #fff;
    font-size: 30rpx;
    font-weight: 600;
    width: 320rpx;
    height: 88rpx;
    line-height: 88rpx;
    border-radius: 44rpx;
    margin: 0;
    box-shadow: 0 8rpx 20rpx rgba(14, 165, 233, 0.3);
    &::after { border: none; }
  }
}
.deleted-placeholder {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx;
  background: #f1f5f9;
  border-radius: 12rpx;
  .del-msg { font-size: 26rpx; color: #94a3b8; }
  .del-btn { font-size: 24rpx; color: #0ea5e9; font-weight: 600; }
}

.s-card-inner {
  display: flex;
  flex: 1;
}
</style>
