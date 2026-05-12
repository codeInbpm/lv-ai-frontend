<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { planApi, type TravelPlan } from '../../../api/plan'
import NavBar from '../../../components/common/NavBar.vue'
import { useNavBar } from '../../../composables/useNavBar'

const planId = ref<number>(0)
const plan = ref<TravelPlan | null>(null)
const loading = ref(true)
const { totalHeight: navTotalHeight } = useNavBar()

onLoad((options: any) => {
  if (options.planId) {
    planId.value = Number(options.planId)
  }
})

onMounted(async () => {
  if (planId.value) {
    try {
      plan.value = await planApi.getPlanDetail(planId.value)
    } catch (err) {
      uni.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      loading.value = false
    }
  }
})

function formatBudget(budget?: number) {
  if (!budget) return '未设置'
  return `¥${budget.toLocaleString()}`
}
</script>

<template>
  <view class="detail-page">
    <NavBar
      transparent
      fixed
      back
      title="行程详情"
      textColor="#ffffff"
      background="linear-gradient(135deg, #0c4a6e, #0369a1)"
      :placeholder="false"
    />

    <template v-if="plan">
      <view class="plan-hero">
        <!-- 精确占位 -->
        <view :style="{ height: navTotalHeight + 'px' }" />
        <view class="status-badge">{{ plan.status === 'COMPLETED' ? '已完成' : '规划中' }}</view>
        <text class="plan-title">{{ plan.title }}</text>
        <view class="meta-row">
          <text class="meta-item">{{ plan.departure }} ✈️ {{ plan.destination }}</text>
        </view>
        <view class="info-grid">
          <view class="info-item">
            <text class="info-icon">📅</text>
            <text class="info-text">{{ plan.startDate }} · {{ plan.days }}天</text>
          </view>
          <view class="info-item">
            <text class="info-icon">👥</text>
            <text class="info-text">{{ plan.peopleCount }}人</text>
          </view>
        </view>
      </view>

      <view class="content-card">
        <view class="section">
          <view class="section-title">📊 规划详情</view>
          <view class="detail-grid">
            <view class="detail-item">
              <text class="detail-label">人均预算</text>
              <text class="detail-val">{{ formatBudget(plan.budget) }}</text>
            </view>
            <view class="detail-item">
              <text class="detail-label">旅行偏好</text>
              <view class="tag-list">
                <text class="tag" v-for="tag in plan.preferences" :key="tag">{{ tag }}</text>
                <text v-if="!plan.preferences?.length" class="empty-tag">无</text>
              </view>
            </view>
          </view>
          <view class="note-box" v-if="plan.extraNote">
            <text class="note-label">备注要求：</text>
            <text class="note-content">{{ plan.extraNote }}</text>
          </view>
        </view>

        <view class="section">
          <view class="section-title">🗺️ 日程路线</view>
          <view class="itinerary-content">
            <text class="itinerary-text">{{ plan.itinerary || '暂无详细行程内容' }}</text>
          </view>
        </view>
      </view>
    </template>

    <view v-else-if="loading" class="loading-state">
      <view class="loading-spinner" />
      <text>加载行程中...</text>
    </view>

    <view class="footer-btns" v-if="plan">
      <button class="btn-share">分享行程</button>
      <button class="btn-edit">私信修改</button>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.detail-page { min-height: 100vh; background: #f8fafc; padding-bottom: 120rpx; }

.plan-hero {
  background: linear-gradient(135deg, #0c4a6e, #0369a1, #0ea5e9);
  padding: 0 32rpx 60rpx;
}

.status-badge {
  display: inline-block;
  background: rgba(255,255,255,0.2);
  color: #fff;
  font-size: 20rpx; padding: 4rpx 16rpx; border-radius: 100rpx;
  margin-bottom: 16rpx;
  margin-top: 12rpx;
}

.plan-title {
  font-size: 40rpx; font-weight: 800; color: #fff;
  line-height: 1.4; display: block;
}

.meta-row { margin-top: 12rpx; display: flex; align-items: center; }
.meta-item { font-size: 26rpx; color: rgba(255,255,255,0.8); }

.info-grid { display: flex; margin-top: 32rpx; gap: 20rpx; flex-wrap: wrap; }
.info-item {
  display: flex; align-items: center; gap: 12rpx;
  background: rgba(255,255,255,0.1); padding: 12rpx 24rpx; border-radius: 16rpx;
}
.info-icon { font-size: 32rpx; }
.info-text { font-size: 24rpx; color: #fff; }

.content-card {
  margin-top: -30rpx;
  background: #fff; border-radius: 40rpx 40rpx 0 0;
  padding: 40rpx 32rpx; min-height: 600rpx;
}

.section { margin-bottom: 48rpx; }
.section-title { font-size: 32rpx; font-weight: 700; color: #1e293b; margin-bottom: 24rpx; display: block; }

.detail-grid { display: flex; flex-direction: column; gap: 24rpx; }
.detail-item { display: flex; align-items: flex-start; }
.detail-label { width: 140rpx; font-size: 26rpx; color: #64748b; }
.detail-val { flex: 1; font-size: 26rpx; color: #1e293b; font-weight: 500; }

.tag-list { display: flex; flex-wrap: wrap; gap: 12rpx; }
.tag { background: #f1f5f9; color: #475569; font-size: 22rpx; padding: 6rpx 16rpx; border-radius: 8rpx; }
.empty-tag { font-size: 24rpx; color: #cbd5e1; }

.note-box { margin-top: 24rpx; background: #f8fafc; border-radius: 16rpx; padding: 20rpx; border-left: 6rpx solid #0ea5e9; }
.note-label { font-size: 24rpx; color: #64748b; }
.note-content { font-size: 24rpx; color: #334155; }

.itinerary-content { border-radius: 16rpx; line-height: 1.6; }
.itinerary-text { font-size: 28rpx; color: #334155; white-space: pre-wrap; }

.loading-state { padding: 100rpx 0; text-align: center; color: #94a3b8; font-size: 26rpx; }
.loading-spinner {
  width: 40rpx; height: 40rpx; border: 4rpx solid #e2e8f0; border-top-color: #0ea5e9;
  border-radius: 50%; margin: 0 auto 20rpx; animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.footer-btns {
  position: fixed; bottom: 0; left: 0; right: 0;
  background: #fff; padding: 20rpx 32rpx calc(20rpx + env(safe-area-inset-bottom));
  display: flex; gap: 20rpx; border-top: 1rpx solid #f1f5f9;
}
.btn-share {
  flex: 1; height: 88rpx; border-radius: 44rpx;
  background: #f1f5f9; color: #475569; font-size: 28rpx; font-weight: 600; border: none;
  display: flex; align-items: center; justify-content: center;
}
.btn-edit {
  flex: 1; height: 88rpx; border-radius: 44rpx;
  background: #0ea5e9; color: #fff; font-size: 28rpx; font-weight: 600; border: none;
  display: flex; align-items: center; justify-content: center;
}
</style>
