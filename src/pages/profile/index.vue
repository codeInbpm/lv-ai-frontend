<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '../../stores/user'
import { profileApi } from '../../api/profile'
import NavBar from '../../components/common/NavBar.vue'
import { useNavBar } from '../../composables/useNavBar'

const userStore = useUserStore()
const { totalHeight: navTotalHeight } = useNavBar()
const stats = ref({ totalPlans: 0, completedPlans: 0, ongoingPlans: 0, notesCount: 0 })
const inviteCode = ref('')

onMounted(async () => {
  if (userStore.isLogin) {
    try {
      const [s, code] = await Promise.all([
        profileApi.getStats(),
        userStore.userInfo?.inviteCode
          ? Promise.resolve(userStore.userInfo.inviteCode)
          : import('../../api/user').then(m => m.userApi.getInviteCode())
      ])
      stats.value = s
      inviteCode.value = typeof code === 'string' ? code : ''
    } catch {}
  }
})

function copyInviteCode() {
  uni.setClipboardData({
    data: inviteCode.value,
    success() { uni.showToast({ title: '邀请码已复制', icon: 'success' }) }
  })
}

function chooseAvatar() {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    success(res) {
      userStore.updateProfile({ avatar: res.tempFilePaths[0] })
    }
  })
}

async function updateNickname() {
  uni.showModal({
    title: '修改昵称',
    editable: true,
    placeholderText: userStore.userInfo?.nickname || '',
    async success(res) {
      if (res.confirm && res.content?.trim()) {
        await userStore.updateProfile({ nickname: res.content.trim() })
        uni.showToast({ title: '修改成功', icon: 'success' })
      }
    }
  })
}

async function handleLogout() {
  uni.showModal({
    title: '确认退出',
    content: '确定要退出登录吗？',
    success(res) {
      if (res.confirm) {
        userStore.logout()
        uni.reLaunch({ url: '/pages/login/index' })
      }
    }
  })
}
</script>

<template>
  <view class="profile-page">
    <NavBar
      transparent
      fixed
      title="个人中心"
      textColor="#ffffff"
      background="linear-gradient(135deg, #0c4a6e, #0369a1)"
      :placeholder="false"
    />

    <!-- 顶部用户信息区 -->
    <view class="user-header">
      <!-- 精确占位 -->
      <view :style="{ height: navTotalHeight + 'px' }" />

      <view v-if="!userStore.isLogin" class="login-prompt" @click="uni.navigateTo({ url: '/pages/login/index' })">
        <view class="avatar-placeholder-lg"><text>👤</text></view>
        <view>
          <text class="login-hint-text">点击登录</text>
          <text class="login-sub">登录后查看旅行记录</text>
        </view>
      </view>

      <template v-else>
        <view class="user-info">
          <view class="avatar-wrap" @click="chooseAvatar">
            <image v-if="userStore.userInfo?.avatar" :src="userStore.userInfo.avatar" class="user-avatar" mode="aspectFill" />
            <view v-else class="avatar-placeholder-lg"><text>👤</text></view>
            <view class="avatar-edit">📷</view>
          </view>
          <view class="user-detail">
            <view class="nickname-row" @click="updateNickname">
              <text class="user-nickname">{{ userStore.userInfo?.nickname || '旅行者' }}</text>
              <text class="edit-icon">✏️</text>
            </view>
            <text class="user-id">ID: {{ userStore.userInfo?.id }}</text>
          </view>
        </view>

        <view class="stats-row">
          <view class="stat-item" @click="uni.navigateTo({ url: '/pages/plan/list/index' })">
            <text class="stat-num">{{ stats.totalPlans }}</text>
            <text class="stat-label">全部行程</text>
          </view>
          <view class="stat-divider" />
          <view class="stat-item" @click="uni.navigateTo({ url: '/pages/me/community' })">
            <text class="stat-num">{{ stats.notesCount || 0 }}</text>
            <text class="stat-label">我的社区</text>
          </view>
          <view class="stat-divider" />
          <view class="stat-item">
            <text class="stat-num">{{ stats.ongoingPlans }}</text>
            <text class="stat-label">进行中</text>
          </view>
          <view class="stat-divider" />
          <view class="stat-item">
            <text class="stat-num">{{ stats.completedPlans }}</text>
            <text class="stat-label">已完成</text>
          </view>
        </view>
      </template>
    </view>

    <scroll-view class="scroll" scroll-y>

      <view class="menu-section card">
        <view class="menu-item" @click="uni.navigateTo({ url: '/pages/plan/list/index' })">
          <text class="menu-icon">✈️</text>
          <text class="menu-label">我的行程</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @click="uni.navigateTo({ url: '/pages/me/community' })">
          <text class="menu-icon">🏘️</text>
          <text class="menu-label">我的社区</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @click="uni.navigateTo({ url: '/pages/footprint/index' })">
          <text class="menu-icon">🗺️</text>
          <text class="menu-label">我的足迹</text>
          <text class="menu-arrow">›</text>
        </view>
      </view>

      <view class="invite-card card" v-if="userStore.isLogin && inviteCode">
        <view class="invite-header">
          <text class="invite-title">🎁 邀请好友</text>
          <text class="invite-sub">邀请好友一起规划旅行</text>
        </view>
        <view class="invite-code-box" @click="copyInviteCode">
          <text class="invite-code">{{ inviteCode }}</text>
          <text class="copy-btn">复制</text>
        </view>
      </view>

      <view class="menu-section card">
        <view class="menu-item" @click="uni.showToast({ title: '功能开发中', icon: 'none' })">
          <text class="menu-icon">⚙️</text>
          <text class="menu-label">设置</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item">
          <text class="menu-icon">📋</text>
          <text class="menu-label">关于旅途AI</text>
          <text class="menu-arrow">›</text>
        </view>
      </view>

      <view class="logout-btn" v-if="userStore.isLogin" @click="handleLogout">
        <text>退出登录</text>
      </view>

      <view style="height: 120rpx" />
    </scroll-view>
  </view>
</template>

<style lang="scss" scoped>
.profile-page { min-height: 100vh; background: var(--bg-page); display: flex; flex-direction: column; }

.user-header {
  background: linear-gradient(135deg, #0c4a6e, #0369a1, #0ea5e9);
  padding: 0 32rpx 40rpx;
}

.login-prompt { display: flex; align-items: center; gap: 24rpx; padding: 24rpx 0; }
.login-hint-text { font-size: 34rpx; font-weight: 700; color: #fff; display: block; }
.login-sub { font-size: 24rpx; color: rgba(255,255,255,0.7); margin-top: 6rpx; display: block; }

.user-info { display: flex; align-items: center; gap: 24rpx; padding: 24rpx 0; }

.avatar-wrap { position: relative; }
.user-avatar { width: 120rpx; height: 120rpx; border-radius: 50%; border: 4rpx solid rgba(255,255,255,0.4); }
.avatar-placeholder-lg {
  width: 120rpx; height: 120rpx; border-radius: 50%;
  background: rgba(255,255,255,0.2);
  display: flex; align-items: center; justify-content: center;
  font-size: 60rpx; border: 4rpx solid rgba(255,255,255,0.3);
}
.avatar-edit {
  position: absolute; bottom: 0; right: 0;
  width: 40rpx; height: 40rpx; background: #fff; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; font-size: 22rpx;
}

.user-detail { flex: 1; }
.nickname-row { display: flex; align-items: center; gap: 10rpx; margin-bottom: 8rpx; }
.user-nickname { font-size: 36rpx; font-weight: 800; color: #fff; }
.edit-icon { font-size: 28rpx; }
.user-id { font-size: 24rpx; color: rgba(255,255,255,0.6); }

.stats-row {
  display: flex;
  background: rgba(255,255,255,0.12);
  border-radius: 24rpx; padding: 24rpx;
  backdrop-filter: blur(10px);
}
.stat-item { flex: 1; display: flex; flex-direction: column; align-items: center; }
.stat-num { font-size: 40rpx; font-weight: 800; color: #fff; }
.stat-label { font-size: 22rpx; color: rgba(255,255,255,0.7); margin-top: 4rpx; }
.stat-divider { width: 1rpx; background: rgba(255,255,255,0.2); margin: 8rpx 0; }

.scroll { flex: 1; padding: 24rpx; display: flex; flex-direction: column; gap: 20rpx; }

.card { background: #fff; border-radius: 24rpx; padding: 8rpx 0; box-shadow: var(--shadow-sm); }
.menu-section { margin-bottom: 0; }

.menu-item {
  display: flex; align-items: center; padding: 28rpx 32rpx;
  border-bottom: 1rpx solid var(--border);
  &:last-child { border-bottom: none; }
}
.menu-icon { font-size: 36rpx; margin-right: 20rpx; }
.menu-label { flex: 1; font-size: 30rpx; color: var(--text-primary); font-weight: 500; }
.menu-arrow { font-size: 32rpx; color: var(--text-tertiary); }

.invite-card { padding: 32rpx; }
.invite-header { margin-bottom: 20rpx; }
.invite-title { font-size: 30rpx; font-weight: 700; color: var(--text-primary); display: block; margin-bottom: 6rpx; }
.invite-sub { font-size: 24rpx; color: var(--text-tertiary); }
.invite-code-box {
  display: flex; align-items: center; justify-content: space-between;
  background: var(--primary-light); border-radius: 16rpx; padding: 20rpx 24rpx;
}
.invite-code { font-size: 36rpx; font-weight: 800; color: var(--primary-dark); letter-spacing: 4rpx; }
.copy-btn {
  background: var(--primary); color: #fff;
  font-size: 24rpx; padding: 10rpx 24rpx; border-radius: 100rpx;
}

.logout-btn {
  background: #fff; border-radius: 24rpx; padding: 32rpx;
  text-align: center; font-size: 30rpx; color: #ef4444;
  font-weight: 600; box-shadow: var(--shadow-sm);
}
</style>
