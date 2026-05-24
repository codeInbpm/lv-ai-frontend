<script setup lang="ts">
import { ref } from 'vue'
import { useUserStore } from '../../stores/user'
import { commonApi } from '../../api/common'

const userStore = useUserStore()
const saving = ref(false)

// 头像相关
const avatarUrl = ref('')
const avatarTempPath = ref('')

// 昵称相关
const nickname = ref('')

// 微信头像授权回调
function onChooseAvatar(e: any) {
  avatarTempPath.value = e.detail.avatarUrl
}

// 昵称输入回调
function onNicknameInput(e: any) {
  nickname.value = e.detail.value
}

async function handleSave() {
  if (saving.value) return
  const nick = nickname.value.trim()
  if (!nick) {
    uni.showToast({ title: '请输入昵称', icon: 'none' })
    return
  }

  saving.value = true
  try {
    // 1. 如果选择了头像，先上传到 MinIO
    let finalAvatar = avatarUrl.value
    if (avatarTempPath.value) {
      finalAvatar = await commonApi.upload(avatarTempPath.value, 'avatars')
      avatarUrl.value = finalAvatar
    }

    // 2. 更新用户信息
    await userStore.updateProfile({
      nickname: nick,
      avatar: finalAvatar || undefined
    })

    // 3. 拉取最新用户信息
    const { userApi } = await import('../../api/user')
    const info = await userApi.getUserInfo()
    userStore.$patch({ userInfo: info })

    uni.reLaunch({ url: '/pages/index/index' })
  } catch (err) {
    uni.showToast({ title: '保存失败，请重试', icon: 'none' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <view class="profile-setup-page">
    <!-- 背景装饰 -->
    <view class="bg-decor">
      <view class="circle circle-1" />
      <view class="circle circle-2" />
    </view>

    <view class="content">
      <text class="page-title">完善个人信息</text>
      <text class="page-desc">设置你的头像和昵称，开始旅途之旅</text>

      <!-- 头像选择 -->
      <view class="avatar-section">
        <button class="avatar-btn" open-type="chooseAvatar" @chooseavatar="onChooseAvatar">
          <image
            v-if="avatarTempPath"
            :src="avatarTempPath"
            class="avatar-img"
            mode="aspectFill"
          />
          <view v-else class="avatar-placeholder">
            <text class="avatar-icon">👤</text>
            <text class="avatar-hint">点击选择头像</text>
          </view>
        </button>
      </view>

      <!-- 昵称输入 -->
      <view class="form-section">
        <view class="form-item">
          <text class="form-label">昵称</text>
          <input
            class="form-input"
            type="nickname"
            placeholder="请输入昵称"
            :value="nickname"
            @input="onNicknameInput"
            maxlength="20"
          />
        </view>
      </view>

      <!-- 保存按钮 -->
      <button
        class="save-btn"
        :loading="saving"
        :disabled="saving"
        @click="handleSave"
      >
        <text class="save-text">保存并开始</text>
      </button>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.profile-setup-page {
  min-height: 100vh;
  background: linear-gradient(160deg, #0c4a6e 0%, #0369a1 40%, #0ea5e9 100%);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: calc(120rpx + env(safe-area-inset-top));
}

.bg-decor {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  pointer-events: none;
}
.circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255,255,255,0.06);
}
.circle-1 { width: 400rpx; height: 400rpx; top: -80rpx; right: -80rpx; }
.circle-2 { width: 250rpx; height: 250rpx; bottom: 300rpx; left: -60rpx; }

.content {
  width: 100%;
  padding: 0 48rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 1;
}

.page-title {
  font-size: 48rpx;
  font-weight: 800;
  color: #fff;
  margin-bottom: 12rpx;
}

.page-desc {
  font-size: 26rpx;
  color: rgba(255,255,255,0.7);
  margin-bottom: 60rpx;
}

.avatar-section {
  margin-bottom: 48rpx;
}

.avatar-btn {
  width: 180rpx;
  height: 180rpx;
  border-radius: 50%;
  padding: 0;
  margin: 0;
  border: 4rpx solid rgba(255,255,255,0.4);
  background: rgba(255,255,255,0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  &::after { border: none; }
}

.avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
}

.avatar-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}
.avatar-icon { font-size: 60rpx; }
.avatar-hint { font-size: 20rpx; color: rgba(255,255,255,0.7); }

.form-section {
  width: 100%;
  background: rgba(255,255,255,0.1);
  border-radius: 24rpx;
  padding: 8rpx 32rpx;
  backdrop-filter: blur(10px);
  margin-bottom: 60rpx;
}

.form-item {
  display: flex;
  align-items: center;
  padding: 28rpx 0;
}

.form-label {
  font-size: 30rpx;
  color: #fff;
  font-weight: 600;
  width: 120rpx;
  flex-shrink: 0;
}

.form-input {
  flex: 1;
  font-size: 30rpx;
  color: #fff;
  text-align: right;
  &::placeholder { color: rgba(255,255,255,0.4); }
}

.save-btn {
  width: 100%;
  height: 100rpx;
  background: #fff;
  color: #0ea5e9;
  border-radius: 50rpx;
  font-size: 34rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  box-shadow: 0 8rpx 32rpx rgba(0,0,0,0.2);
  &::after { border: none; }
}

.save-text {
  font-size: 34rpx;
  font-weight: 700;
  color: #0ea5e9;
}
</style>
