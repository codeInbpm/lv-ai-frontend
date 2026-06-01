<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { planApi, type PlanDetailVO, type TravelItem } from '../../../api/plan'
import { useUserStore } from '../../../stores/user'
import NavBar from '../../../components/common/NavBar.vue'

const userStore = useUserStore()
const props = defineProps<{ planId?: string }>()
const detail = ref<PlanDetailVO | null>(null)
const loading = ref(true)
const isStreaming = ref(false)
const streamingText = ref('')
const activeDayIndex = ref(0)

const typeMap: Record<number, { icon: string; label: string; color: string }> = {
  1: { icon: '🏛️', label: '景点', color: '#0ea5e9' },
  2: { icon: '🍜', label: '美食', color: '#f97316' },
  3: { icon: '🏨', label: '住宿', color: '#8b5cf6' },
  4: { icon: '🚌', label: '交通', color: '#10b981' },
  5: { icon: '🛍️', label: '购物', color: '#ec4899' },
  6: { icon: '🎭', label: '活动', color: '#f59e0b' }
}

onMounted(async () => {
  // 获取路由参数
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  const query = currentPage.options || {}
  
  const planId = props.planId || query.planId || (uni.getStorageSync('lastPlanId'))
  if (!planId) return

  if (query.polling === 'true' || query.streaming === 'true') {
    isStreaming.value = true
    startPolling(Number(planId))
  } else {
    fetchDetail(Number(planId))
  }
})

async function fetchDetail(planId: number) {
  loading.value = true
  try {
    detail.value = await planApi.getPlanDetail(planId)
  } catch (err) {
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

let pollTimer: any = null

function startPolling(planId: number) {
  // 轮询检查行程状态，适度增加轮询间隔到 2.5 秒，减缓后端并发开销
  pollTimer = setInterval(async () => {
    try {
      const res = await planApi.getPlanDetail(planId)
      // 如果状态为已生成 (1: 正常/已生成)
      if (res && res.plan && res.plan.status === 1) {
        clearInterval(pollTimer)
        isStreaming.value = false
        loading.value = false
        detail.value = res
        uni.showToast({ title: '生成成功！', icon: 'success' })
      } else if (res && res.plan && (res.plan.status === 3 || res.plan.status === 4)) {
        // 核心阻断：一旦检测到 status = 4 (生成失败) 或状态 3，立即抛出错误终止轮询
        throw new Error(res.plan.description || 'AI规划未成功完成，行程数据异常')
      }
    } catch (err: any) {
      clearInterval(pollTimer)
      isStreaming.value = false
      const errorMsg = err?.message || 'AI 生成发生错误，行程可能已失效，请重新生成'
      
      uni.showModal({
        title: '规划未成功',
        content: errorMsg,
        showCancel: false,
        success: () => {
          // 优雅闭环：直接跳转到详情页以展现我们在详情页精调的、极其 Premium 且自带“重新生成预填”大按钮的 status=4 失败卡片！
          uni.redirectTo({
            url: `/pages/plan/detail/index?planId=${planId}`
          })
        }
      })
    }
  }, 2500)

  // 简单的模拟流式动画文字
  const msgs = ['分析您的偏好中...', '挑选最佳路线...', '智能安排住宿与美食...', '正在生成最终报告...']
  let msgIdx = 0
  setInterval(() => {
    if (isStreaming.value && msgIdx < msgs.length) {
      streamingText.value += msgs[msgIdx] + '\n'
      msgIdx++
    }
  }, 2500)
}

// 组件卸载时清理定时器
import { onUnmounted } from 'vue'
onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})

function goDetail() {
  if (!detail.value) return
  uni.navigateTo({
    url: `/pages/plan/detail/index?planId=${detail.value.plan.id}`
  })
}

const totalCost = computed(() => {
  if (!detail.value) return 0
  return detail.value.days.reduce((acc, d) => {
    return acc + d.items.reduce((sum, item) => sum + (item.estimatedCost || 0), 0)
  }, 0)
})
</script>

<template>
  <view class="result-page">
    <NavBar fixed back title="AI生成行程" />

    <!-- 加载状态 -->
    <view v-if="loading || isStreaming" class="loading-state">
      <view class="ai-loading">
        <text class="ai-icon">🤖</text>
        <text class="loading-title">{{ isStreaming ? 'AI 正在思考并规划...' : 'AI正在为你生成行程' }}</text>
        
        <!-- 流式文本内容 -->
        <scroll-view v-if="isStreaming" scroll-y class="streaming-content" :scroll-top="99999">
          <text class="streaming-text">{{ streamingText }}</text>
        </scroll-view>

        <text v-else class="loading-sub">综合分析偏好 · 优化行程路线 · 精选推荐景点</text>
        
        <view class="loading-dots">
          <view class="dot" v-for="i in 3" :key="i" />
        </view>
      </view>
    </view>

    <template v-else-if="detail">
      <!-- 结果卡片 -->
      <view class="result-card">
        <view class="success-header">
          <view class="success-icon">✨</view>
          <view>
            <text class="success-title">规划完成！</text>
            <text class="success-sub">已根据你的偏好生成最优行程</text>
          </view>
        </view>

        <view class="plan-summary">
          <text class="plan-name">{{ detail.plan.title }}</text>
          <view class="summary-grid">
            <view class="summary-item">
              <text class="summary-label">目的地</text>
              <text class="summary-val">{{ detail.plan.destination }}</text>
            </view>
            <view class="summary-item">
              <text class="summary-label">时间</text>
              <text class="summary-val">{{ detail.plan.days }}天</text>
            </view>
            <view class="summary-item">
              <text class="summary-label">预估费用</text>
              <text class="summary-val">¥{{ totalCost }}</text>
            </view>
          </view>
        </view>

        <view class="highlights">
          <text class="highlight-title">行程亮点</text>
          <text class="highlight-desc">{{ detail.plan.description }}</text>
        </view>

        <view class="action-buttons">
          <button class="btn-secondary" @click="uni.navigateBack()">重新规划</button>
          <button class="btn-primary" @click="goDetail">查看详细行程</button>
        </view>
      </view>
    </template>
  </view>
</template>

<style lang="scss" scoped>
.result-page {
  min-height: 100vh;
  background: var(--bg-page);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 80vh;
  padding: 60rpx;
}
.ai-icon { font-size: 120rpx; margin-bottom: 32rpx; }
.loading-title { font-size: 36rpx; font-weight: 700; color: var(--text-primary); margin-bottom: 24rpx; }

.streaming-content {
  width: 90%;
  max-height: 40vh;
  background: #f8fafc;
  border-radius: 20rpx;
  padding: 24rpx;
  margin-bottom: 40rpx;
  border: 1rpx solid var(--border);
}
.streaming-text {
  font-size: 26rpx;
  color: var(--text-secondary);
  line-height: 1.6;
  white-space: pre-wrap;
}

.loading-sub { font-size: 26rpx; color: var(--text-tertiary); text-align: center; margin-bottom: 40rpx; }
.loading-dots { display: flex; gap: 12rpx; }
.dot {
  width: 16rpx; height: 16rpx;
  border-radius: 50%;
  background: var(--primary);
  animation: dot-pulse 1.5s infinite ease-in-out;
  &:nth-child(2) { animation-delay: 0.2s; }
  &:nth-child(3) { animation-delay: 0.4s; }
}

@keyframes dot-pulse {
  0%, 100% { transform: scale(0.6); opacity: 0.3; }
  50% { transform: scale(1.1); opacity: 1; }
}

.result-card {
  margin: 32rpx;
  background: #fff;
  border-radius: 32rpx;
  padding: 48rpx 40rpx;
  box-shadow: 0 10rpx 40rpx rgba(0,0,0,0.06);
}

.success-header {
  display: flex;
  align-items: center;
  gap: 24rpx;
  margin-bottom: 48rpx;
}
.success-icon {
  width: 96rpx; height: 96rpx;
  background: linear-gradient(135deg, #10b981, #059669);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 48rpx; color: #fff;
}
.success-title { font-size: 38rpx; font-weight: 800; color: #059669; display: block; }
.success-sub { font-size: 26rpx; color: var(--text-tertiary); }

.plan-summary {
  background: #f8fafc;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 40rpx;
}
.plan-name { font-size: 34rpx; font-weight: 700; color: var(--text-primary); display: block; margin-bottom: 24rpx; }
.summary-grid { display: flex; justify-content: space-between; }
.summary-item { display: flex; flex-direction: column; gap: 4rpx; }
.summary-label { font-size: 24rpx; color: var(--text-tertiary); }
.summary-val { font-size: 28rpx; font-weight: 600; color: var(--text-primary); }

.highlights { margin-bottom: 56rpx; }
.highlight-title { font-size: 30rpx; font-weight: 700; color: var(--text-primary); display: block; margin-bottom: 12rpx; }
.highlight-desc { font-size: 28rpx; color: var(--text-secondary); line-height: 1.6; }

.action-buttons {
  display: flex; gap: 24rpx;
}
.btn-primary, .btn-secondary {
  flex: 1; height: 96rpx; border-radius: 48rpx;
  display: flex; align-items: center; justify-content: center;
  font-size: 30rpx; font-weight: 700;
  border: none;
}
.btn-primary { background: linear-gradient(135deg, #0ea5e9, #0369a1); color: #fff; }
.btn-secondary { background: #f1f5f9; color: var(--text-secondary); }
</style>
