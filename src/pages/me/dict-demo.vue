<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDictStore } from '../../stores/dict'

const dictStore = useDictStore()

// 1. 兴趣偏好多选 (基于 interest_preference 字典)
const selectedInterests = ref<string[]>([])
const interestOptions = computed(() => dictStore.getDict('interest_preference'))

function toggleInterest(value: string) {
  const index = selectedInterests.value.indexOf(value)
  if (index > -1) {
    selectedInterests.value.splice(index, 1)
  } else {
    selectedInterests.value.push(value)
  }
}

// 2. 自驾车辆单选 (基于 car_type 字典)
const selectedCar = ref('suv') // 默认选中 SUV
const carOptions = computed(() => dictStore.getDict('car_type'))

// 3. 底部弹窗 Bottom Sheet 状态 (自驾偏好)
const showBottomSheet = ref(false)
const selectedDrivePreference = ref('')
const drivePrefOptions = computed(() => dictStore.getDict('self_drive_preference'))

function selectDrivePreference(value: string) {
  selectedDrivePreference.value = value
  showBottomSheet.value = false
}

// 4. 天气/心情单选联动 (基于 weather 和 mood 字典)
const selectedWeather = ref('')
const selectedMood = ref('')
const weatherOptions = computed(() => dictStore.getDict('weather'))
const moodOptions = computed(() => dictStore.getDict('mood'))

function onWeatherChange(e: any) {
  const val = e.detail.value
  selectedWeather.value = weatherOptions.value[val]?.dictValue || ''
}

function onMoodChange(e: any) {
  const val = e.detail.value
  selectedMood.value = moodOptions.value[val]?.dictValue || ''
}
</script>

<template>
  <view class="dict-demo-page">
    <view class="title-section">
      <text class="page-title">旅行字典系统演示</text>
      <text class="page-subtitle">基于 Pinia 缓存与 SpringBoot 动态数据联动</text>
    </view>

    <!-- 演示一：兴趣偏好 (多选标签) -->
    <view class="demo-card">
      <view class="card-header">
        <text class="header-title">1. 兴趣偏好 (多选标签)</text>
        <text class="header-desc">dict_type: interest_preference</text>
      </view>
      <view class="tag-grid">
        <view 
          v-for="opt in interestOptions" 
          :key="opt.id"
          class="tag-item"
          :class="{ active: selectedInterests.includes(opt.dictValue) }"
          @click="toggleInterest(opt.dictValue)"
        >
          {{ opt.dictLabel }}
        </view>
      </view>
      <view class="result-box">
        <text class="result-label">选中编码：</text>
        <text class="result-val">{{ selectedInterests.join(', ') || '暂无' }}</text>
      </view>
    </view>

    <!-- 演示二：车型选择 (单选 Picker) -->
    <view class="demo-card">
      <view class="card-header">
        <text class="header-title">2. 出行车型 (单选列表)</text>
        <text class="header-desc">dict_type: car_type</text>
      </view>
      <radio-group class="radio-list" @change="(e) => selectedCar = e.detail.value">
        <label class="radio-item" v-for="opt in carOptions" :key="opt.id">
          <radio :value="opt.dictValue" :checked="selectedCar === opt.dictValue" color="#0ea5e9" />
          <text class="label-text">{{ opt.dictLabel }}</text>
          <text class="remark-text" v-if="opt.remark">({{ opt.remark }})</text>
        </label>
      </radio-group>
      <view class="result-box">
        <text class="result-label">数据回显 (getLabel)：</text>
        <text class="result-val highlight">{{ dictStore.getLabel('car_type', selectedCar) }}</text>
      </view>
    </view>

    <!-- 演示三：自驾偏好 (底部弹窗 Bottom Sheet) -->
    <view class="demo-card">
      <view class="card-header">
        <text class="header-title">3. 自驾偏好 (自定义弹窗)</text>
        <text class="header-desc">dict_type: self_drive_preference</text>
      </view>
      <button class="action-trigger-btn" @click="showBottomSheet = true">
        {{ selectedDrivePreference ? dictStore.getLabel('self_drive_preference', selectedDrivePreference) : '点击选择自驾偏好' }}
      </button>

      <!-- 自定义底部弹窗 -->
      <view class="bottom-sheet-mask" v-if="showBottomSheet" @click="showBottomSheet = false"></view>
      <view class="bottom-sheet-content" :class="{ show: showBottomSheet }">
        <view class="sheet-header">
          <text class="sheet-title">选择自驾偏好</text>
          <text class="sheet-close" @click="showBottomSheet = false">×</text>
        </view>
        <scroll-view scroll-y class="sheet-scroll">
          <view 
            v-for="opt in drivePrefOptions" 
            :key="opt.id"
            class="sheet-item"
            :class="{ active: selectedDrivePreference === opt.dictValue }"
            @click="selectDrivePreference(opt.dictValue)"
          >
            <text class="item-label">{{ opt.dictLabel }}</text>
            <text class="item-desc" v-if="opt.remark">{{ opt.remark }}</text>
          </view>
        </scroll-view>
      </view>
    </view>

    <!-- 演示四：天气与心情选择器 -->
    <view class="demo-card">
      <view class="card-header">
        <text class="header-title">4. 今日天气与旅行心情</text>
        <text class="header-desc">dict_type: weather / mood</text>
      </view>
      <view class="picker-row">
        <!-- 天气 Picker -->
        <picker class="picker-box" :range="weatherOptions" range-key="dictLabel" @change="onWeatherChange">
          <view class="picker-inner">
            <text class="p-title">天气状况</text>
            <text class="p-value">{{ selectedWeather ? dictStore.getLabel('weather', selectedWeather) : '选择天气' }}</text>
          </view>
        </picker>

        <!-- 心情 Picker -->
        <picker class="picker-box" :range="moodOptions" range-key="dictLabel" @change="onMoodChange">
          <view class="picker-inner">
            <text class="p-title">旅行心情</text>
            <text class="p-value">{{ selectedMood ? dictStore.getLabel('mood', selectedMood) : '选择心情' }}</text>
          </view>
        </picker>
      </view>
      
      <view class="result-box" v-if="selectedWeather || selectedMood">
        <text class="result-label">拼装状态：</text>
        <text class="result-val highlight">
          {{ selectedWeather ? dictStore.getLabel('weather', selectedWeather) : '?' }}
          / 
          {{ selectedMood ? dictStore.getLabel('mood', selectedMood) : '?' }}
        </text>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.dict-demo-page {
  padding: 30rpx;
  background: #f5f7fa;
  min-height: 100vh;
}

.title-section {
  margin-bottom: 40rpx;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  .page-title { font-size: 40rpx; font-weight: 800; color: #1e293b; }
  .page-subtitle { font-size: 24rpx; color: #64748b; }
}

.demo-card {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.02);
  
  .card-header {
    border-bottom: 1rpx solid #f1f5f9;
    padding-bottom: 20rpx;
    margin-bottom: 24rpx;
    display: flex;
    flex-direction: column;
    gap: 4rpx;
    .header-title { font-size: 30rpx; font-weight: 700; color: #1e293b; }
    .header-desc { font-size: 20rpx; color: #94a3b8; font-family: monospace; }
  }
}

.tag-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  .tag-item {
    background: #f1f5f9;
    color: #64748b;
    font-size: 26rpx;
    padding: 12rpx 28rpx;
    border-radius: 100rpx;
    transition: all 0.2s ease;
    &.active {
      background: #e0f2fe;
      color: #0ea5e9;
      font-weight: 600;
    }
  }
}

.radio-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  .radio-item {
    display: flex;
    align-items: center;
    gap: 16rpx;
    .label-text { font-size: 28rpx; color: #334155; }
    .remark-text { font-size: 22rpx; color: #94a3b8; margin-left: 8rpx; }
  }
}

.action-trigger-btn {
  background: #f1f5f9;
  color: #334155;
  font-size: 28rpx;
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 16rpx;
  font-weight: 600;
  &::after { border: none; }
}

.result-box {
  margin-top: 30rpx;
  background: #f8fafc;
  padding: 20rpx 24rpx;
  border-radius: 12rpx;
  font-size: 26rpx;
  display: flex;
  align-items: center;
  .result-label { color: #64748b; }
  .result-val { color: #334155; font-family: monospace; font-weight: 600; }
  .highlight { color: #0ea5e9; }
}

/* 底部弹窗组件 */
.bottom-sheet-mask {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5); z-index: 1000;
}
.bottom-sheet-content {
  position: fixed; left: 0; right: 0; bottom: 0;
  background: #ffffff; border-radius: 32rpx 32rpx 0 0;
  z-index: 1001; transform: translateY(100%);
  transition: transform 0.3s ease;
  padding: 30rpx;
  &.show { transform: translateY(0); }
  .sheet-header {
    display: flex; justify-content: space-between; align-items: center;
    border-bottom: 1rpx solid #f1f5f9; padding-bottom: 24rpx;
    .sheet-title { font-size: 32rpx; font-weight: 700; color: #1e293b; }
    .sheet-close { font-size: 48rpx; color: #cbd5e1; padding: 0 10rpx; }
  }
  .sheet-scroll {
    max-height: 500rpx;
    padding-top: 20rpx;
  }
  .sheet-item {
    padding: 30rpx 0; border-bottom: 1rpx solid #f8fafc;
    display: flex; flex-direction: column; gap: 6rpx;
    .item-label { font-size: 28rpx; color: #334155; }
    .item-desc { font-size: 22rpx; color: #94a3b8; }
    &.active {
      .item-label { color: #0ea5e9; font-weight: 600; }
    }
  }
}

/* 联动的 Picker 样式 */
.picker-row {
  display: flex; gap: 20rpx;
}
.picker-box {
  flex: 1; background: #f8fafc; border: 1rpx solid #e2e8f0;
  border-radius: 16rpx; padding: 24rpx;
  .picker-inner {
    display: flex; flex-direction: column; gap: 8rpx;
    .p-title { font-size: 24rpx; color: #64748b; }
    .p-value { font-size: 28rpx; color: #1e293b; font-weight: 600; }
  }
}
</style>
