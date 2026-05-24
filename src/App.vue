<script setup lang="ts">
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'
import { useUserStore } from './stores/user'

onLaunch(() => {
  // 注册微信隐私授权回调
  if (wx.onNeedPrivacyAuthorization) {
    wx.onNeedPrivacyAuthorization((resolve: any) => {
      resolve({ event: 'agree' })
    })
  }

  const userStore = useUserStore()
  userStore.initUser()
})

onShow(() => {})
onHide(() => {})
</script>

<style lang="scss">
@import './uni.scss';

/* ============ 全局主题变量 ============ */
page {
  --primary: #0ea5e9;
  --primary-light: #bae6fd;
  --primary-dark: #0369a1;
  --secondary: #f97316;
  --success: #10b981;
  --warning: #f59e0b;
  --danger: #ef4444;
  --bg-page: #f0f9ff;
  --bg-card: #ffffff;
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-tertiary: #94a3b8;
  --border: #e2e8f0;
  --radius-sm: 8rpx;
  --radius: 16rpx;
  --radius-lg: 24rpx;
  --radius-xl: 32rpx;
  --shadow-sm: 0 2rpx 8rpx rgba(0,0,0,0.06);
  --shadow: 0 4rpx 16rpx rgba(0,0,0,0.08);
  --shadow-lg: 0 8rpx 32rpx rgba(0,0,0,0.12);
  background-color: var(--bg-page);
  color: var(--text-primary);
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', sans-serif;
}

/* ============ 工具类 ============ */
.flex { display: flex; }
.flex-col { display: flex; flex-direction: column; }
.flex-1 { flex: 1; }
.items-center { align-items: center; }
.items-start { align-items: flex-start; }
.justify-center { justify-content: center; }
.justify-between { justify-content: space-between; }
.justify-end { justify-content: flex-end; }
.text-center { text-align: center; }
.w-full { width: 100%; }
.overflow-hidden { overflow: hidden; }

/* 安全区 */
.safe-area-bottom { padding-bottom: env(safe-area-inset-bottom); }
.safe-area-top { padding-top: env(safe-area-inset-top); }

/* 卡片 */
.card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: 32rpx;
}

/* 按钮 */
.btn-primary {
  background: linear-gradient(135deg, #0ea5e9, #0369a1);
  color: #fff;
  border-radius: var(--radius-xl);
  padding: 24rpx 48rpx;
  font-size: 30rpx;
  font-weight: 600;
  text-align: center;
  letter-spacing: 2rpx;
  border: none;
}

.btn-secondary {
  background: var(--primary-light);
  color: var(--primary-dark);
  border-radius: var(--radius-xl);
  padding: 24rpx 48rpx;
  font-size: 30rpx;
  font-weight: 500;
  text-align: center;
  border: none;
}

/* 文字截断 */
.text-ellipsis {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.text-ellipsis-2 {
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* 标签 */
.tag {
  display: inline-flex;
  align-items: center;
  padding: 6rpx 16rpx;
  border-radius: 100rpx;
  font-size: 22rpx;
  background: var(--primary-light);
  color: var(--primary-dark);
}
</style>
