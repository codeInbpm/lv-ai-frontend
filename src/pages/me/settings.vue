<script setup lang="ts">
import { ref, onMounted } from 'vue'
import NavBar from '../../components/common/NavBar.vue'
import { useUserStore } from '../../stores/user'
import { meApi, type SettingsInfo } from '../../api/me'
import { commonApi } from '../../api/common'

const userStore = useUserStore()
const info = ref<SettingsInfo | null>(null)

onMounted(async () => {
  try { info.value = await meApi.getSettings() } catch { }
})

function genderLabel(g?: number) {
  return ['未知', '男', '女'][g || 0]
}

function changeAvatar() {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    success: async (res) => {
      try {
        uni.showLoading({ title: '上传中...' })
        const url = await commonApi.upload(res.tempFilePaths[0], 'avatar')
        await userStore.updateProfile({ avatar: url })
        if (info.value) info.value.avatar = url
        uni.hideLoading()
        uni.showToast({ title: '修改成功', icon: 'success' })
      } catch {
        uni.hideLoading()
      }
    }
  })
}

function changeNickname() {
  uni.showModal({
    title: '修改昵称',
    editable: true,
    placeholderText: info.value?.nickname || '',
    async success(res) {
      if (res.confirm && res.content?.trim()) {
        await userStore.updateProfile({ nickname: res.content.trim() })
        if (info.value) info.value.nickname = res.content.trim()
        uni.showToast({ title: '修改成功', icon: 'success' })
      }
    }
  })
}

function bindPhone() {
  uni.showToast({ title: '功能开发中', icon: 'none' })
}

function goAbout() {
  uni.navigateTo({ url: '/pages/me/about' })
}

function goPrivacy() {
  uni.showToast({ title: '功能开发中', icon: 'none' })
}

function clearCache() {
  uni.showModal({
    title: '提示',
    content: '确定清除缓存吗？',
    success(res) {
      if (res.confirm) {
        uni.clearStorageSync()
        uni.showToast({ title: '已清除', icon: 'success' })
      }
    }
  })
}

function handleLogout() {
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
  <view class="settings-page">
    <NavBar fixed back title="设置" textColor="#ffffff"
      background="linear-gradient(135deg, #0c4a6e, #0ea5e9)" :placeholder="true" />

    <scroll-view scroll-y class="settings-scroll">
      <!-- 个人信息 -->
      <view class="section-title-text">个人信息</view>
      <view class="menu-card card">
        <view class="menu-item" @click="changeAvatar">
          <text class="menu-label">头像</text>
          <view class="menu-right">
            <image v-if="info?.avatar" :src="info.avatar" class="avatar-preview" mode="aspectFill" />
            <view v-else class="avatar-placeholder-sm"><text>👤</text></view>
            <text class="menu-arrow">›</text>
          </view>
        </view>
        <view class="menu-item" @click="changeNickname">
          <text class="menu-label">昵称</text>
          <view class="menu-right">
            <text class="menu-value">{{ info?.nickname || '-' }}</text>
            <text class="menu-arrow">›</text>
          </view>
        </view>
        <view class="menu-item">
          <text class="menu-label">ID</text>
          <text class="menu-value">{{ info?.userId || '-' }}</text>
        </view>
      </view>

      <!-- 账号安全 -->
      <view class="section-title-text">账号与安全</view>
      <view class="menu-card card">
        <view class="menu-item" @click="bindPhone">
          <text class="menu-label">手机号</text>
          <view class="menu-right">
            <text class="menu-value">{{ info?.phone || '未绑定' }}</text>
            <text class="menu-arrow">›</text>
          </view>
        </view>
        <view class="menu-item">
          <text class="menu-label">微信绑定</text>
          <view class="menu-right">
            <text class="menu-value bound">已绑定</text>
          </view>
        </view>
      </view>

      <!-- 其他设置 -->
      <view class="section-title-text">通用</view>
      <view class="menu-card card">
        <view class="menu-item" @click="goPrivacy">
          <text class="menu-label">隐私设置</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @click="clearCache">
          <text class="menu-label">清除缓存</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @click="goAbout">
          <text class="menu-label">关于旅途AI</text>
          <text class="menu-arrow">›</text>
        </view>
      </view>

      <!-- 退出登录 -->
      <view class="logout-btn" @click="handleLogout">
        <text>退出登录</text>
      </view>

      <view style="height: 60rpx" />
    </scroll-view>
  </view>
</template>

<style lang="scss" scoped>
.settings-page {
  min-height: 100vh;
  background: var(--bg-page);
  display: flex;
  flex-direction: column;
}
.settings-scroll {
  flex: 1;
  height: 0;
  padding: 24rpx;
}
.section-title-text {
  font-size: 24rpx;
  color: var(--text-tertiary);
  padding: 24rpx 8rpx 12rpx;
  font-weight: 500;
}
.menu-card {
  padding: 0;
}
.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 32rpx;
  border-bottom: 1rpx solid var(--border);
  &:last-child { border-bottom: none; }
}
.menu-label {
  font-size: 30rpx;
  color: var(--text-primary);
  font-weight: 500;
}
.menu-right {
  display: flex;
  align-items: center;
  gap: 12rpx;
}
.menu-value {
  font-size: 28rpx;
  color: var(--text-secondary);
}
.menu-value.bound { color: var(--success); }
.menu-arrow {
  font-size: 32rpx;
  color: var(--text-tertiary);
}
.avatar-preview {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
}
.avatar-placeholder-sm {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: var(--primary-light);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
}
.logout-btn {
  background: #fff;
  border-radius: 24rpx;
  padding: 32rpx;
  text-align: center;
  font-size: 30rpx;
  color: #ef4444;
  font-weight: 600;
  margin-top: 20rpx;
  box-shadow: var(--shadow-sm);
}
</style>
