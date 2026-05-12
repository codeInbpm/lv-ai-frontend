<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { usePlanStore } from '../../../stores/plan'
import { planApi } from '../../../api/plan'
import NavBar from '../../../components/common/NavBar.vue'

const planStore = usePlanStore()
const loading = ref(false)

const form = reactive({
  departure: '',
  departureLng: undefined as number | undefined,
  departureLat: undefined as number | undefined,
  destination: '',
  destinationLng: undefined as number | undefined,
  destinationLat: undefined as number | undefined,
  startDate: '',
  days: 3,
  budget: undefined as number | undefined,
  peopleCount: 2,
  preferences: [] as string[],
  extraNote: ''
})

const preferenceOptions = [
  '历史古迹', '自然风光', '美食探索', '购物娱乐', 
  '户外运动', '亲子友好', '摄影打卡', '慢节奏'
]

onMounted(() => {
  // 设置默认日期为明天
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  form.startDate = tomorrow.toISOString().split('T')[0]
  
  // 检查是否有预填目的地
  const prefill = uni.getStorageSync('prefillDestination')
  if (prefill) {
    form.destination = prefill
    uni.removeStorageSync('prefillDestination')
  }
})

function togglePreference(item: string) {
  const index = form.preferences.indexOf(item)
  if (index > -1) {
    form.preferences.splice(index, 1)
  } else {
    form.preferences.push(item)
  }
}

async function handleSubmit() {
  if (!form.departure || !form.destination || !form.startDate) {
    return uni.showToast({ title: '请填写必要信息', icon: 'none' })
  }

  uni.showLoading({ title: 'AI规划中...', mask: true })

  try {
    const planId = await planStore.startPlanGeneration({
      departure: form.departure,
      destination: form.destination,
      startDate: form.startDate,
      days: form.days,
      budget: form.budget,
      peopleCount: form.peopleCount,
      preferences: form.preferences,
      extraNote: form.extraNote
    })

    uni.hideLoading()
    // 跳转到结果页，开启流式显示
    uni.navigateTo({
      url: `/pages/plan/result/index?planId=${planId}&streaming=true`
    })
  } catch (err) {
    uni.hideLoading()
    uni.showToast({ title: '生成失败，请重试', icon: 'none' })
  }
}
</script>

<template>
  <view class="create-page">
    <NavBar fixed back title="创建行程" border />
    
    <view class="form-container">
      <view class="form-section">
        <text class="section-title">📍 基本信息</text>
        
        <view class="form-item">
          <text class="label">出发地</text>
          <input v-model="form.departure" class="input" placeholder="你在哪里？" />
        </view>
        
        <view class="form-item">
          <text class="label">目的地</text>
          <input v-model="form.destination" class="input" placeholder="想去哪里？" />
        </view>
        
        <view class="form-item">
          <text class="label">出发日期</text>
          <picker mode="date" :value="form.startDate" @change="(e:any) => form.startDate = e.detail.value">
            <view class="input">{{ form.startDate || '选择日期' }}</view>
          </picker>
        </view>
        
        <view class="form-item">
          <text class="label">旅行天数</text>
          <view class="counter">
            <view class="counter-btn" @click="form.days > 1 && form.days--">-</view>
            <text class="counter-val">{{ form.days }} 天</text>
            <view class="counter-btn" @click="form.days++">+</view>
          </view>
        </view>
      </view>

      <view class="form-section">
        <text class="section-title">✨ 个性偏好</text>
        
        <view class="form-item">
          <text class="label">同行人数</text>
          <view class="counter">
            <view class="counter-btn" @click="form.peopleCount > 1 && form.peopleCount--">-</view>
            <text class="counter-val">{{ form.peopleCount }} 人</text>
            <view class="counter-btn" @click="form.peopleCount++">+</view>
          </view>
        </view>

        <view class="form-item">
          <text class="label">旅行预算 (可选)</text>
          <view class="budget-input">
            <text class="unit">¥</text>
            <input v-model="form.budget" type="number" class="input" placeholder="输入预估金额" />
          </view>
        </view>

        <view class="form-item">
          <text class="label">兴趣点 (多选)</text>
          <view class="tag-list">
            <view 
              class="tag" 
              :class="{ active: form.preferences.includes(item) }"
              v-for="item in preferenceOptions"
              :key="item"
              @click="togglePreference(item)"
            >
              {{ item }}
            </view>
          </view>
        </view>
      </view>

      <view class="form-section">
        <text class="section-title">📝 备注要求</text>
        <textarea 
          v-model="form.extraNote" 
          class="textarea" 
          placeholder="还有什么特别的要求吗？（如：必吃美食、避开爬山等）"
        />
      </view>

      <view class="submit-btn" @click="handleSubmit">
        <text>✨ 开始 AI 智能规划</text>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.create-page {
  min-height: 100vh;
  background: var(--bg-page);
}

.form-container {
  padding: 32rpx;
  padding-bottom: 100rpx;
}

.form-section {
  background: #fff;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 32rpx;
  box-shadow: var(--shadow-sm);
}

.section-title {
  font-size: 32rpx;
  font-weight: 700;
  color: var(--text-primary);
  display: block;
  margin-bottom: 32rpx;
}

.form-item {
  margin-bottom: 32rpx;
  &:last-child { margin-bottom: 0; }
}

.label {
  font-size: 26rpx;
  color: var(--text-secondary);
  display: block;
  margin-bottom: 16rpx;
}

.input {
  background: #f8fafc;
  height: 88rpx;
  border-radius: 16rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  display: flex;
  align-items: center;
  border: 1rpx solid transparent;
  &:focus { border-color: var(--primary-light); background: #fff; }
}

.counter {
  display: flex;
  align-items: center;
  gap: 32rpx;
}
.counter-btn {
  width: 64rpx; height: 64rpx;
  background: #f1f5f9;
  border-radius: 12rpx;
  display: flex; align-items: center; justify-content: center;
  font-size: 36rpx; color: var(--text-primary);
}
.counter-val { font-size: 30rpx; font-weight: 600; color: var(--text-primary); min-width: 80rpx; text-align: center; }

.budget-input {
  position: relative;
  .unit { position: absolute; left: 24rpx; top: 50%; transform: translateY(-50%); font-size: 28rpx; color: var(--text-secondary); z-index: 1; }
  .input { padding-left: 56rpx; }
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}
.tag {
  background: #f1f5f9;
  color: var(--text-secondary);
  font-size: 24rpx;
  padding: 12rpx 24rpx;
  border-radius: 100rpx;
  transition: all 0.2s;
  &.active { background: var(--primary-light); color: var(--primary-dark); font-weight: 600; }
}

.textarea {
  width: 100%;
  height: 200rpx;
  background: #f8fafc;
  border-radius: 16rpx;
  padding: 24rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

.submit-btn {
  background: linear-gradient(135deg, #0ea5e9, #0369a1);
  color: #fff;
  height: 100rpx;
  border-radius: 50rpx;
  display: flex; align-items: center; justify-content: center;
  font-size: 32rpx; font-weight: 700;
  box-shadow: 0 8rpx 24rpx rgba(14,165,233,0.3);
  margin-top: 48rpx;
}
</style>
