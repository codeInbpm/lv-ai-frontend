<script setup lang="ts">
import { ref } from 'vue'
import { useUserStore } from '../../stores/user'
import NavBar from '../../components/common/NavBar.vue'

const userStore = useUserStore()
const loading = ref(false)

async function handleWxLogin() {
  if (loading.value) return
  loading.value = true
  try {
    const isNew = await userStore.wxLogin()
    if (isNew) {
      uni.redirectTo({ url: '/pages/login/profile' })
    } else {
      uni.reLaunch({ url: '/pages/index/index' })
    }
  } catch (err) {
    uni.showToast({ title: '登录失败，请重试', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const features = [
  { icon: '🤖', title: 'AI 智能规划', desc: '根据偏好一键生成个性化行程' },
  { icon: '🗺️', title: '精选攻略', desc: '发现海量真实旅行笔记与路线' },
  { icon: '📷', title: '旅行打卡', desc: '记录精彩瞬间，永存旅行记忆' }
]
</script>

<template>
  <view class="login-page">
    <NavBar transparent fixed back textColor="#ffffff" />
    
    <!-- 背景装饰 -->
    <view class="bg-decor">
      <view class="circle circle-1" />
      <view class="circle circle-2" />
      <view class="wave" />
    </view>

    <!-- Logo区域 -->
    <view class="logo-section">
      <view class="logo-icon">
        <text class="logo-text">✈</text>
      </view>
      <text class="app-name">旅途AI</text>
      <text class="app-slogan">让旅行规划更简单 · 更智能</text>
    </view>

    <!-- 特性介绍 -->
    <view class="features">
      <view class="feature-item" v-for="item in features" :key="item.title">
        <view class="feature-icon">{{ item.icon }}</view>
        <view class="feature-content">
          <text class="feature-title">{{ item.title }}</text>
          <text class="feature-desc">{{ item.desc }}</text>
        </view>
      </view>
    </view>

    <!-- 登录按钮区域 -->
    <view class="login-section">
      <button
        class="wx-login-btn"
        :loading="loading"
        :disabled="loading"
        @click="handleWxLogin"
      >
        <text class="btn-icon">🟢</text>
        <text class="btn-text">微信一键登录</text>
      </button>
      <text class="login-hint">登录即代表同意《用户协议》和《隐私政策》</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(160deg, #0c4a6e 0%, #0369a1 40%, #0ea5e9 100%);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 48rpx;
  padding-top: calc(180rpx + env(safe-area-inset-top));
  padding-bottom: calc(60rpx + env(safe-area-inset-bottom));
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
.circle-1 { width: 500rpx; height: 500rpx; top: -100rpx; right: -100rpx; }
.circle-2 { width: 300rpx; height: 300rpx; bottom: 200rpx; left: -80rpx; }

.logo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 80rpx;
}

.logo-icon {
  width: 160rpx;
  height: 160rpx;
  background: rgba(255,255,255,0.15);
  border-radius: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24rpx;
  backdrop-filter: blur(10px);
}
.logo-text { font-size: 80rpx; }

.app-name {
  font-size: 60rpx;
  font-weight: 800;
  color: #fff;
  letter-spacing: 4rpx;
  margin-bottom: 12rpx;
}

.app-slogan {
  font-size: 28rpx;
  color: rgba(255,255,255,0.7);
  letter-spacing: 2rpx;
}

.features {
  width: 100%;
  background: rgba(255,255,255,0.1);
  border-radius: 32rpx;
  padding: 32rpx;
  margin-bottom: 60rpx;
  backdrop-filter: blur(10px);
}

.feature-item {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
  &:not(:last-child) { border-bottom: 1rpx solid rgba(255,255,255,0.1); }
}

.feature-icon {
  font-size: 44rpx;
  margin-right: 24rpx;
}

.feature-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #fff;
  display: block;
  margin-bottom: 6rpx;
}

.feature-desc {
  font-size: 24rpx;
  color: rgba(255,255,255,0.65);
}

.login-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.wx-login-btn {
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
  gap: 12rpx;
  border: none;
  box-shadow: 0 8rpx 32rpx rgba(0,0,0,0.2);
  margin-bottom: 24rpx;
}

.btn-icon { font-size: 36rpx; }
.btn-text { font-size: 34rpx; font-weight: 700; color: #0ea5e9; }

.login-hint {
  font-size: 22rpx;
  color: rgba(255,255,255,0.5);
  text-align: center;
}
</style>
