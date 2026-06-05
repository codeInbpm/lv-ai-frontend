<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { usePlanStore } from '../../../stores/plan'
import { useUserStore } from '../../../stores/user'
import { planApi, type TravelPlan } from '../../../api/plan'
import NavBar from '../../../components/common/NavBar.vue'

const planStore = usePlanStore()
const userStore = useUserStore()

const plans = ref<TravelPlan[]>([])
// undefined = 全部，0=草稿，1=未开始，2=进行中，3=已完成
const activeTab = ref<number | undefined>(undefined)
const loading = ref(true)

const tabs: Array<{ label: string; value: number | undefined }> = [
  { label: '全部', value: undefined },
  { label: '草稿', value: 0 },
  { label: '未开始', value: 1 },
  { label: '进行中', value: 2 },
  { label: '已完成', value: 3 }
]

const statusMap: Record<number, { label: string; color: string; bg: string }> = {
  0: { label: '草稿', color: '#64748b', bg: '#f1f5f9' },
  1: { label: '未开始', color: '#d97706', bg: '#fef3c7' },
  2: { label: '进行中', color: '#059669', bg: '#d1fae5' },
  3: { label: '已完成', color: '#0369a1', bg: '#dbeafe' }
}

onMounted(async () => {
  try {
    if (!userStore.isLogin) {
      uni.navigateTo({ url: '/pages/login/index' })
      loading.value = false
      return
    }
    await loadPlans()
  } catch (err) {
    console.error("onMounted 挂载加载行程失败:", err)
    loading.value = false
  }
})

async function loadPlans() {
  loading.value = true
  try {
    const result = await planStore.fetchMyPlans(activeTab.value)
    plans.value = result?.records ?? []
  } catch (err: any) {
    console.error("loadPlans 加载行程列表异常:", err)
    uni.showToast({
      title: err?.message || '获取行程列表失败，请检查网络或后端服务',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

async function switchTab(val: number | undefined) {
  activeTab.value = val
  await loadPlans()
}

/** 判断 tab 是否激活，对 undefined（全部）做特殊处理 */
function isTabActive(tabVal: number | undefined) {
  return activeTab.value === tabVal
}

function goDetail(planId: number) {
  uni.navigateTo({ url: `/pages/plan/detail/index?planId=${planId}` })
}

function goCreate() {
  uni.navigateTo({ url: '/pages/plan/create/index' })
}

async function deletePlan(planId: number) {
  uni.showModal({
    title: '确认删除',
    content: '删除后不可恢复，确定删除此行程？',
    async success(res) {
      if (res.confirm) {
        uni.showLoading({ title: '正在删除...', mask: true })
        try {
          await planApi.deletePlan(planId)
          plans.value = plans.value.filter(p => p.id !== planId)
          uni.showToast({ title: '已删除', icon: 'success' })
        } catch (err: any) {
          uni.showToast({
            title: err?.data?.message || '删除失败，请重试',
            icon: 'none'
          })
        } finally {
          uni.hideLoading()
        }
      }
    }
  })
}
</script>

<template>
  <view class="list-page">
    <NavBar title="我的行程" fixed border />
    
    <!-- Tabs -->
    <scroll-view class="tabs-scroll" scroll-x>
      <view class="tabs">
        <view
          class="tab"
          :class="{ active: isTabActive(tab.value) }"
          v-for="tab in tabs"
          :key="String(tab.value)"
          @click="switchTab(tab.value)"
        >
          {{ tab.label }}
        </view>
      </view>
    </scroll-view>

    <!-- 内容 -->
    <scroll-view class="scroll" scroll-y>
      <view v-if="loading" class="loading">
        <text>加载中...</text>
      </view>

      <view v-else-if="!plans.length" class="empty">
        <text class="empty-icon">✈️</text>
        <text class="empty-text">还没有行程，快去规划吧</text>
        <view class="empty-btn" @click="goCreate">AI智能规划</view>
      </view>

      <view v-else class="plan-list">
        <view
          class="plan-card"
          v-for="plan in plans"
          :key="plan.id"
          @click="goDetail(plan.id)"
        >
          <view class="card-cover">
            <text class="cover-emoji">✈️</text>
            <view class="cover-status" :style="{ background: statusMap[plan.status]?.bg }">
              <text :style="{ color: statusMap[plan.status]?.color }">{{ statusMap[plan.status]?.label }}</text>
            </view>
          </view>
          <view class="card-body">
            <text class="card-title">{{ plan.title }}</text>
            <text class="card-route">{{ plan.departure }} → {{ plan.destination }}</text>
            <view class="card-meta">
              <text class="meta-item">📅 {{ plan.startDate }}</text>
              <text class="meta-item">{{ plan.days }}天</text>
              <text class="meta-item">👥 {{ plan.peopleCount || 2 }}人</text>
            </view>
            <!-- 行程打卡进度条 -->
            <view class="card-progress-bar-wrap">
              <view class="progress-info">
                <text class="progress-lbl">行程进度</text>
                <text class="progress-val">{{ plan.progress || 0 }}%</text>
              </view>
              <view class="progress-track">
                <view class="progress-fill" :style="{ width: (plan.progress || 0) + '%' }"></view>
              </view>
            </view>
            <view class="card-footer">
              <text class="budget-text" v-if="plan.budget">预算 ¥{{ plan.budget }}</text>
              <view class="card-actions">
                <text class="action-del" @click.stop="deletePlan(plan.id)">删除</text>
                <text class="action-go">查看详情 ›</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <view style="height: 120rpx" />
    </scroll-view>

    <!-- FAB -->
    <view class="fab" @click="goCreate">
      <text style="color: #fff; font-size: 32rpx;">+</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.list-page { min-height: 100vh; background: var(--bg-page); display: flex; flex-direction: column; }

.tabs-scroll {
  background: #fff;
  white-space: nowrap;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.05);
}
.tabs {
  display: inline-flex;
  min-width: 100%;
}
.tab {
  flex-shrink: 0;
  padding: 24rpx 40rpx;
  text-align: center;
  font-size: 28rpx;
  color: var(--text-tertiary);
  border-bottom: 4rpx solid transparent;
  white-space: nowrap;
  &.active { color: var(--primary); border-bottom-color: var(--primary); font-weight: 700; }
}

.scroll { flex: 1; }

.loading, .empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 40rpx;
}
.empty-icon { font-size: 100rpx; margin-bottom: 24rpx; }
.empty-text { font-size: 30rpx; color: var(--text-tertiary); margin-bottom: 40rpx; }
.empty-btn {
  background: linear-gradient(135deg, #0ea5e9, #0369a1);
  color: #fff;
  padding: 24rpx 48rpx;
  border-radius: 100rpx;
  font-size: 30rpx;
  font-weight: 600;
}

.plan-list { padding: 24rpx; display: flex; flex-direction: column; gap: 20rpx; }

.plan-card {
  background: #fff;
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.card-cover {
  height: 160rpx;
  background: linear-gradient(135deg, #bae6fd, #7dd3fc);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
.cover-emoji { font-size: 80rpx; }
.cover-status {
  position: absolute;
  top: 16rpx; right: 16rpx;
  padding: 8rpx 16rpx;
  border-radius: 100rpx;
  font-size: 22rpx;
  font-weight: 600;
}

.card-body { padding: 24rpx; }
.card-title {
  font-size: 30rpx;
  font-weight: 700;
  color: var(--text-primary);
  display: block;
  margin-bottom: 8rpx;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.card-route {
  font-size: 26rpx;
  color: var(--text-secondary);
  display: block;
  margin-bottom: 12rpx;
}
.card-meta { display: flex; gap: 16rpx; margin-bottom: 16rpx; flex-wrap: wrap; }
.meta-item {
  font-size: 24rpx;
  color: var(--text-tertiary);
  background: #f8fafc;
  padding: 6rpx 12rpx;
  border-radius: 100rpx;
}
.card-footer { display: flex; justify-content: space-between; align-items: center; }
.budget-text { font-size: 24rpx; color: var(--secondary); font-weight: 600; }
.card-actions { display: flex; gap: 16rpx; align-items: center; }
.action-del { font-size: 24rpx; color: var(--text-tertiary); padding: 6rpx 12rpx; }
.action-go { font-size: 26rpx; color: var(--primary); font-weight: 600; }

.fab {
  position: fixed;
  right: 40rpx;
  bottom: calc(100rpx + env(safe-area-inset-bottom));
  width: 100rpx; height: 100rpx;
  background: linear-gradient(135deg, #0ea5e9, #0369a1);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 6rpx 20rpx rgba(14,165,233,0.4);
  font-size: 48rpx;
  color: #fff;
}

.card-progress-bar-wrap {
  margin: 16rpx 0 24rpx 0;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  
  .progress-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .progress-lbl {
      font-size: 22rpx;
      color: var(--text-tertiary);
    }
    
    .progress-val {
      font-size: 22rpx;
      font-weight: 700;
      color: var(--primary);
    }
  }
  
  .progress-track {
    height: 10rpx;
    background: #f1f5f9;
    border-radius: 6rpx;
    overflow: hidden;
    
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #0ea5e9, #0284c7);
      border-radius: 6rpx;
      transition: width 0.3s ease;
    }
  }
}
</style>
