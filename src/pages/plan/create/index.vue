<script setup lang="ts">
import { ref, reactive } from 'vue'
import { usePlanStore } from '../../../stores/plan'
import { useUserStore } from '../../../stores/user'

const planStore = usePlanStore()
const userStore = useUserStore()

const loading = ref(false)

const form = reactive({
  departure: '',
  destination: '',
  startDate: '',
  days: 3,
  budget: undefined as number | undefined,
  peopleCount: 2,
  preferences: [] as string[],
  extraNote: ''
})

const preferenceOptions = [
  { label: '🍜 美食', value: '美食' },
  { label: '📷 摄影', value: '摄影' },
  { label: '👨‍👩‍👧 亲子', value: '亲子' },
  { label: '💑 情侣', value: '情侣' },
  { label: '🚗 自驾', value: '自驾' },
  { label: '🏕️ 户外', value: '户外' },
  { label: '🎨 文艺', value: '文艺' },
  { label: '🛍️ 购物', value: '购物' },
  { label: '🏛️ 历史', value: '历史' },
  { label: '🌊 海岛', value: '海岛' }
]

const dayOptions = Array.from({ length: 14 }, (_, i) => ({
  label: `${i + 1}天`,
  value: i + 1
}))

const peopleOptions = [
  { label: '1人', value: 1 },
  { label: '2人', value: 2 },
  { label: '3-5人', value: 4 },
  { label: '6人以上', value: 8 }
]

function togglePreference(val: string) {
  const idx = form.preferences.indexOf(val)
  if (idx > -1) {
    form.preferences.splice(idx, 1)
  } else {
    if (form.preferences.length >= 5) {
      uni.showToast({ title: '最多选5个偏好', icon: 'none' })
      return
    }
    form.preferences.push(val)
  }
}

function chooseDate() {
  const today = new Date()
  uni.showDatePickerView?.({})
  // 使用 picker 组件
}

function selectLocation(field: 'departure' | 'destination') {
  uni.chooseLocation({
    success(res) {
      if (field === 'departure') {
        form.departure = res.name || res.address
      } else {
        form.destination = res.name || res.address
      }
    }
  })
}

async function handleSubmit() {
  if (!form.departure.trim()) {
    return uni.showToast({ title: '请输入出发地', icon: 'none' })
  }
  if (!form.destination.trim()) {
    return uni.showToast({ title: '请输入目的地', icon: 'none' })
  }
  if (!form.startDate) {
    return uni.showToast({ title: '请选择出发日期', icon: 'none' })
  }

  loading.value = true
  uni.showLoading({ title: 'AI规划中...', mask: true })

  try {
    const result = await planStore.createPlan({
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
    // 跳转到结果页
    uni.navigateTo({
      url: `/pages/plan/result/index?planId=${result.plan.id}`
    })
  } catch (err) {
    uni.hideLoading()
    uni.showToast({ title: 'AI生成失败，请重试', icon: 'none' })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <view class="create-page">
    <scroll-view scroll-y class="scroll-content">

      <!-- 出发地/目的地 -->
      <view class="section card">
        <view class="section-title">
          <text class="title-icon">📍</text>
          <text>出行信息</text>
        </view>

        <view class="field">
          <text class="field-label">出发地</text>
          <view class="field-input-wrap" @click="selectLocation('departure')">
            <input
              v-model="form.departure"
              class="field-input"
              placeholder="请输入出发城市"
              placeholder-class="placeholder"
            />
            <text class="field-icon">📍</text>
          </view>
        </view>

        <view class="route-arrow">↕</view>

        <view class="field">
          <text class="field-label">目的地</text>
          <view class="field-input-wrap" @click="selectLocation('destination')">
            <input
              v-model="form.destination"
              class="field-input"
              placeholder="请输入目的城市/景区"
              placeholder-class="placeholder"
            />
            <text class="field-icon">🎯</text>
          </view>
        </view>
      </view>

      <!-- 日期和天数 -->
      <view class="section card">
        <view class="section-title">
          <text class="title-icon">📅</text>
          <text>行程时间</text>
        </view>

        <view class="field">
          <text class="field-label">出发日期</text>
          <picker mode="date" :value="form.startDate" @change="(e: any) => form.startDate = e.detail.value">
            <view class="field-input-wrap">
              <text class="field-input" :class="{ placeholder: !form.startDate }">
                {{ form.startDate || '请选择出发日期' }}
              </text>
              <text class="field-icon">📅</text>
            </view>
          </picker>
        </view>

        <view class="field">
          <text class="field-label">旅行天数</text>
          <picker :range="dayOptions" range-key="label" :value="form.days - 1" @change="(e: any) => form.days = dayOptions[e.detail.value].value">
            <view class="field-input-wrap">
              <text class="field-input">{{ form.days }}天</text>
              <text class="field-icon">⏱</text>
            </view>
          </picker>
        </view>

        <view class="field">
          <text class="field-label">出行人数</text>
          <picker :range="peopleOptions" range-key="label" :value="0" @change="(e: any) => form.peopleCount = peopleOptions[e.detail.value].value">
            <view class="field-input-wrap">
              <text class="field-input">{{ form.peopleCount }}人</text>
              <text class="field-icon">👥</text>
            </view>
          </picker>
        </view>
      </view>

      <!-- 预算 -->
      <view class="section card">
        <view class="section-title">
          <text class="title-icon">💰</text>
          <text>预算规划</text>
        </view>
        <view class="field">
          <text class="field-label">总预算（元，可选）</text>
          <view class="field-input-wrap">
            <input
              v-model="form.budget"
              class="field-input"
              type="number"
              placeholder="例如：3000（不填则不限）"
              placeholder-class="placeholder"
            />
            <text class="field-unit">元</text>
          </view>
        </view>
      </view>

      <!-- 偏好 -->
      <view class="section card">
        <view class="section-title">
          <text class="title-icon">✨</text>
          <text>旅行偏好（最多5个）</text>
        </view>
        <view class="pref-grid">
          <view
            class="pref-item"
            :class="{ active: form.preferences.includes(opt.value) }"
            v-for="opt in preferenceOptions"
            :key="opt.value"
            @click="togglePreference(opt.value)"
          >
            <text>{{ opt.label }}</text>
          </view>
        </view>
      </view>

      <!-- 补充说明 -->
      <view class="section card">
        <view class="section-title">
          <text class="title-icon">📝</text>
          <text>补充说明（可选）</text>
        </view>
        <textarea
          v-model="form.extraNote"
          class="extra-textarea"
          placeholder="例如：有老人小孩，喜欢不走回头路，避开热门景区..."
          placeholder-class="placeholder"
          maxlength="200"
        />
        <text class="char-count">{{ form.extraNote.length }}/200</text>
      </view>

      <view style="height: 200rpx" />
    </scroll-view>

    <!-- 底部提交按钮 -->
    <view class="submit-bar">
      <view class="submit-info">
        <text class="submit-dest">{{ form.destination || '目的地' }}</text>
        <text class="submit-sub">{{ form.days }}天 · {{ form.peopleCount }}人 · AI智能规划</text>
      </view>
      <view class="submit-btn" :class="{ disabled: loading }" @click="handleSubmit">
        <text>{{ loading ? '生成中...' : '🤖 AI生成行程' }}</text>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.create-page {
  min-height: 100vh;
  background: var(--bg-page);
  display: flex;
  flex-direction: column;
}

.scroll-content {
  flex: 1;
  padding: 24rpx;
}

.section {
  margin-bottom: 24rpx;
}

.card {
  background: #fff;
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: var(--shadow-sm);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 12rpx;
  font-size: 30rpx;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 28rpx;
}
.title-icon { font-size: 32rpx; }

.field { margin-bottom: 24rpx; }
.field:last-child { margin-bottom: 0; }

.field-label {
  font-size: 26rpx;
  color: var(--text-secondary);
  margin-bottom: 12rpx;
  display: block;
}

.field-input-wrap {
  display: flex;
  align-items: center;
  background: #f8fafc;
  border-radius: 16rpx;
  padding: 24rpx;
  border: 2rpx solid var(--border);
}

.field-input {
  flex: 1;
  font-size: 30rpx;
  color: var(--text-primary);
  background: transparent;
  border: none;
  &.placeholder { color: var(--text-tertiary); }
}

.field-icon { font-size: 32rpx; flex-shrink: 0; }
.field-unit { font-size: 28rpx; color: var(--text-secondary); }

.placeholder { color: var(--text-tertiary); }

.route-arrow {
  text-align: center;
  font-size: 36rpx;
  color: var(--primary);
  margin: -8rpx 0;
  font-weight: 700;
}

.pref-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.pref-item {
  padding: 14rpx 24rpx;
  border-radius: 100rpx;
  background: #f1f5f9;
  font-size: 26rpx;
  color: var(--text-secondary);
  border: 2rpx solid transparent;
  transition: all 0.2s;

  &.active {
    background: var(--primary-light);
    color: var(--primary-dark);
    border-color: var(--primary);
    font-weight: 600;
  }
}

.extra-textarea {
  width: 100%;
  min-height: 120rpx;
  background: #f8fafc;
  border-radius: 16rpx;
  padding: 20rpx;
  font-size: 28rpx;
  color: var(--text-primary);
  border: 2rpx solid var(--border);
  box-sizing: border-box;
}

.char-count {
  text-align: right;
  font-size: 22rpx;
  color: var(--text-tertiary);
  margin-top: 8rpx;
  display: block;
}

.submit-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  padding: 24rpx 32rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  display: flex;
  align-items: center;
  gap: 24rpx;
  box-shadow: 0 -4rpx 20rpx rgba(0,0,0,0.06);
}

.submit-info {
  flex: 1;
}

.submit-dest {
  font-size: 30rpx;
  font-weight: 700;
  color: var(--text-primary);
  display: block;
}

.submit-sub {
  font-size: 24rpx;
  color: var(--text-tertiary);
  margin-top: 4rpx;
  display: block;
}

.submit-btn {
  background: linear-gradient(135deg, #0ea5e9, #0369a1);
  color: #fff;
  font-size: 30rpx;
  font-weight: 700;
  padding: 24rpx 40rpx;
  border-radius: 100rpx;
  flex-shrink: 0;
  box-shadow: 0 4rpx 16rpx rgba(14,165,233,0.35);
  &.disabled { opacity: 0.6; }
}
</style>
