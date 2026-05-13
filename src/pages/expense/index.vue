<script setup lang="ts">
import { ref, onMounted } from 'vue'
import NavBar from '../../components/common/NavBar.vue'

const totalExpense = ref(0)
const expenses = ref<any[]>([])

const typeMap: Record<number, { name: string, icon: string, color: string }> = {
  1: { name: '餐饮', icon: '🍽️', color: '#f97316' },
  2: { name: '住宿', icon: '🏨', color: '#8b5cf6' },
  3: { name: '交通', icon: '🚌', color: '#0ea5e9' },
  4: { name: '门票', icon: '🎫', color: '#10b981' },
  5: { name: '购物', icon: '🛍️', color: '#ec4899' },
  6: { name: '其他', icon: '📦', color: '#64748b' }
}

onMounted(() => {
  fetchExpenses()
})

async function fetchExpenses() {
  try {
    // 模拟从后端获取用户的记账记录
    const list = [
      { id: 1, type: 3, amount: 2500, remark: '往返机票', expenseDate: '2023-10-01' },
      { id: 2, type: 2, amount: 1200, remark: '三晚酒店', expenseDate: '2023-10-01' },
      { id: 3, type: 1, amount: 150, remark: '特色火锅', expenseDate: '2023-10-02' },
      { id: 4, type: 4, amount: 180, remark: '景区门票', expenseDate: '2023-10-03' }
    ]
    expenses.value = list
    totalExpense.value = list.reduce((sum, item) => sum + item.amount, 0)
  } catch (e) {
    console.error(e)
  }
}
</script>

<template>
  <view class="expense-page">
    <NavBar fixed back title="记账统计" />
    
    <view class="header-card">
      <view class="total-label">总支出 (元)</view>
      <view class="total-amount">{{ totalExpense.toFixed(2) }}</view>
    </view>

    <view class="content-section">
      <view class="section-title">支出明细</view>
      
      <view class="expense-list" v-if="expenses.length">
        <view class="expense-item" v-for="item in expenses" :key="item.id">
          <view class="icon-wrap" :style="{ background: typeMap[item.type].color + '20' }">
            <text class="icon">{{ typeMap[item.type].icon }}</text>
          </view>
          <view class="info">
            <view class="name-row">
              <text class="name">{{ typeMap[item.type].name }}</text>
              <text class="amount" :style="{ color: typeMap[item.type].color }">- ¥{{ item.amount }}</text>
            </view>
            <view class="desc-row">
              <text class="remark">{{ item.remark || '无备注' }}</text>
              <text class="date">{{ item.expenseDate }}</text>
            </view>
          </view>
        </view>
      </view>
      <view class="empty-state" v-else>
        <text>暂无记账记录</text>
      </view>
    </view>

    <view class="fab" @click="uni.showToast({title: '开发中', icon: 'none'})">
      <text class="fab-icon">+</text>
      <text class="fab-text">记一笔</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.expense-page {
  min-height: 100vh;
  background: var(--bg-page);
  padding-bottom: 120rpx;
}
.header-card {
  margin: 32rpx;
  background: linear-gradient(135deg, #0ea5e9, #0369a1);
  border-radius: 32rpx;
  padding: 60rpx 40rpx;
  color: #fff;
  box-shadow: 0 8rpx 24rpx rgba(14,165,233,0.3);
}
.total-label {
  font-size: 28rpx;
  color: rgba(255,255,255,0.8);
  margin-bottom: 16rpx;
}
.total-amount {
  font-size: 72rpx;
  font-weight: bold;
}
.content-section {
  padding: 0 32rpx;
}
.section-title {
  font-size: 34rpx;
  font-weight: bold;
  color: var(--text-primary);
  margin-bottom: 24rpx;
}
.expense-list {
  background: #fff;
  border-radius: 24rpx;
  padding: 0 32rpx;
  box-shadow: var(--shadow-sm);
}
.expense-item {
  display: flex;
  align-items: center;
  padding: 32rpx 0;
  border-bottom: 1rpx solid var(--border);
  &:last-child {
    border-bottom: none;
  }
}
.icon-wrap {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 24rpx;
}
.icon {
  font-size: 40rpx;
}
.info {
  flex: 1;
}
.name-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8rpx;
}
.name {
  font-size: 30rpx;
  font-weight: bold;
  color: var(--text-primary);
}
.amount {
  font-size: 32rpx;
  font-weight: bold;
}
.desc-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.remark {
  font-size: 24rpx;
  color: var(--text-secondary);
}
.date {
  font-size: 22rpx;
  color: var(--text-tertiary);
}
.empty-state {
  text-align: center;
  color: var(--text-tertiary);
  padding: 100rpx 0;
}
.fab {
  position: fixed;
  right: 40rpx;
  bottom: calc(60rpx + env(safe-area-inset-bottom));
  width: 120rpx;
  height: 120rpx;
  background: linear-gradient(135deg, #0ea5e9, #0369a1);
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(14,165,233,0.4);
}
.fab-icon { font-size: 48rpx; color: #fff; font-weight: 300; line-height: 1; margin-top: -8rpx;}
.fab-text { font-size: 20rpx; color: rgba(255,255,255,0.9); font-weight: 600; }
</style>
