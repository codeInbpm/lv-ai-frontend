<script setup lang="ts">
import NavBar from '../../components/common/NavBar.vue'

function goPrivacy() { uni.showToast({ title: '用户协议', icon: 'none' }) }
function goAgreement() { uni.showToast({ title: '隐私政策', icon: 'none' }) }
</script>

<template>
  <view class="about-page">
    <NavBar fixed back title="关于旅途AI" textColor="#ffffff"
      background="linear-gradient(135deg, #0c4a6e, #0ea5e9)" :placeholder="true" />

    <view class="hero-section">
      <view class="hero-bg">
        <view class="heart heart-1">❤</view>
        <view class="heart heart-2"> </view>
        <view class="heart heart-3"> </view>
        <view class="heart heart-4"> ️</view>
      </view>
      <view class="logo-wrap">
        <view class="logo-circle">
          <text class="logo-text">✈</text>
        </view>
      </view>
      <text class="app-name">旅途AI</text>
      <text class="app-version">v1.0.0</text>
    </view>

    <view class="content-section">
      <view class="intro-card card">
        <text class="intro-text">
          每一段旅程，都是一次与世界的对话。
        </text>
        <text class="intro-text">
          旅途AI，用智能为你规划每一程。
          从灵感萌芽到行程落定，我们用心陪伴你走过每一步。
        </text>
        <text class="intro-text">
          愿你所到之处，皆是风景。
        </text>
      </view>

      <view class="menu-card card">
        <view class="menu-item" @click="goAgreement">
          <text class="menu-label">用户协议</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @click="goPrivacy">
          <text class="menu-label">隐私政策</text>
          <text class="menu-arrow">›</text>
        </view>
      </view>

      <view class="contact-card card">
        <text class="contact-title">联系我们</text>
        <view class="contact-row">
          <text class="contact-label">微信公众号</text>
          <text class="contact-value">旅途AI</text>
        </view>
        <view class="contact-row">
          <text class="contact-label">邮箱</text>
          <text class="contact-value">support@lvai.com</text>
        </view>
      </view>

      <view class="team-card card">
        <text class="team-title">开发团队</text>
        <text class="team-desc">旅途AI团队 · 用技术让旅行更美好</text>
      </view>

      <text class="copyright">© 2026 旅途AI All Rights Reserved</text>
      <view style="height: 60rpx" />
    </view>
  </view>
</template>

<style lang="scss" scoped>
.about-page {
  min-height: 100vh;
  background: var(--bg-page);
  display: flex;
  flex-direction: column;
}
.hero-section {
  background: linear-gradient(160deg, #0c4a6e 0%, #0369a1 40%, #0ea5e9 100%);
  padding: 60rpx 0 80rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  overflow: hidden;
}
.hero-bg {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  pointer-events: none;
}
.heart {
  position: absolute;
  opacity: 0.12;
  font-size: 80rpx;
}
.heart-1 { top: 40rpx; left: 60rpx; font-size: 60rpx; animation: float 3s ease-in-out infinite; }
.heart-2 { top: 120rpx; right: 80rpx; animation: float 4s ease-in-out infinite 0.5s; }
.heart-3 { bottom: 60rpx; left: 120rpx; font-size: 50rpx; animation: float 3.5s ease-in-out infinite 1s; }
.heart-4 { bottom: 100rpx; right: 50rpx; font-size: 44rpx; animation: float 3s ease-in-out infinite 1.5s; }
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-16rpx); }
}
.logo-wrap { margin-bottom: 24rpx; position: relative; z-index: 1; }
.logo-circle {
  width: 140rpx;
  height: 140rpx;
  background: rgba(255,255,255,0.2);
  border-radius: 36rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
  border: 2rpx solid rgba(255,255,255,0.3);
}
.logo-text { font-size: 72rpx; }
.app-name {
  font-size: 48rpx;
  font-weight: 800;
  color: #fff;
  letter-spacing: 4rpx;
  position: relative;
  z-index: 1;
}
.app-version {
  font-size: 24rpx;
  color: rgba(255,255,255,0.6);
  margin-top: 8rpx;
  position: relative;
  z-index: 1;
}
.content-section {
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}
.intro-card {
  padding: 36rpx;
}
.intro-text {
  font-size: 28rpx;
  color: var(--text-secondary);
  line-height: 2;
  display: block;
  text-align: center;
}
.menu-card { padding: 0; }
.menu-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 28rpx 32rpx;
  border-bottom: 1rpx solid var(--border);
  &:last-child { border-bottom: none; }
}
.menu-label { font-size: 30rpx; color: var(--text-primary); font-weight: 500; }
.menu-arrow { font-size: 32rpx; color: var(--text-tertiary); }
.contact-card { padding: 32rpx; }
.contact-title {
  font-size: 30rpx;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 20rpx;
  display: block;
}
.contact-row {
  display: flex;
  justify-content: space-between;
  padding: 16rpx 0;
}
.contact-label { font-size: 28rpx; color: var(--text-secondary); }
.contact-value { font-size: 28rpx; color: var(--text-primary); font-weight: 500; }
.team-card { padding: 32rpx; text-align: center; }
.team-title {
  font-size: 30rpx;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8rpx;
  display: block;
}
.team-desc { font-size: 26rpx; color: var(--text-tertiary); }
.copyright {
  text-align: center;
  font-size: 22rpx;
  color: var(--text-tertiary);
  padding: 20rpx 0;
}
</style>
