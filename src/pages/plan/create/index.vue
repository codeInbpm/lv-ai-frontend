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


onMounted(() => {
  // 设置默认日期为明天
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  form.startDate = tomorrow.toISOString().split('T')[0]
  
  // 检查是否有预填数据（新逻辑，支持天数和偏好）
  const prefillPlanData = uni.getStorageSync('prefillPlanData')
  if (prefillPlanData) {
    form.destination = prefillPlanData.destination || form.destination
    if (prefillPlanData.days) form.days = prefillPlanData.days
    if (prefillPlanData.preferences) form.preferences = prefillPlanData.preferences
    uni.removeStorageSync('prefillPlanData')
  } else {
    // 兼容旧的单一目的地预填
    const prefill = uni.getStorageSync('prefillDestination')
    if (prefill) {
      form.destination = prefill
      uni.removeStorageSync('prefillDestination')
    }
  }

  // 立即询问地理位置授权
  uni.getLocation({
    type: 'gcj02',
    success: (res) => {
      form.departureLat = res.latitude
      form.departureLng = res.longitude
      
      // 调用腾讯地图反解析 (带重试机制)
      const fetchLocation = (retryCount = 0) => {
        uni.request({
          url: `https://apis.map.qq.com/ws/geocoder/v1/?location=${res.latitude},${res.longitude}&key=66ABZ-QFMRI-BQWGG-UTPBO-NEZA3-SLFGI`,
          method: 'GET',
          success: (response: any) => {
            if (response.data && response.data.status === 0) {
              const adInfo = response.data.result.ad_info || response.data.result.address_component
              form.departure = adInfo.city || adInfo.province || '当前位置'
            } else if (response.data && response.data.status === 120 && retryCount < 2) {
              // 触发并发限制，延迟 500ms 重试
              setTimeout(() => fetchLocation(retryCount + 1), 500)
            } else {
              form.departure = response.data?.message ? `解析失败:${response.data.message}` : '定位成功(解析失败)'
              console.error('腾讯地图解析失败:', response.data)
            }
          },
          fail: () => {
            form.departure = '定位成功(请求失败)'
          }
        })
      }
      
      fetchLocation()
    },
    fail: () => {
      console.log('获取地理位置失败或用户拒绝')
    }
  })
})

function chooseLocation(type: 'departure' | 'destination') {
  uni.chooseLocation({
    success: (res) => {
      if (type === 'departure') {
        form.departure = res.name || res.address
        form.departureLat = res.latitude
        form.departureLng = res.longitude
      } else {
        form.destination = res.name || res.address
        form.destinationLat = res.latitude
        form.destinationLng = res.longitude
      }
    },
    fail: (err) => {
      console.log('chooseLocation fail', err)
    }
  })
}

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
    
    // 给用户提示
    uni.showModal({
      title: '正在后台生成行程',
      content: 'AI可能需要几秒到几十秒进行专属规划。您可以留在此页等待，或选择去列表稍后查看。',
      confirmText: '在此等待',
      cancelText: '去列表看',
      success: (res) => {
        if (res.confirm) {
          // 在此等待：跳转到结果页进行轮询
          uni.navigateTo({
            url: `/pages/plan/result/index?planId=${result.plan.id}&polling=true`
          })
        } else {
          // 后台生成：去列表查看
          uni.switchTab({
            url: '/pages/plan/list/index'
          })
        }
      }
    })
  } catch (err) {
    uni.hideLoading()
    uni.showToast({ title: '提交失败，请重试', icon: 'none' })
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
          <view class="input location-input" @click="chooseLocation('departure')">
            <text :class="{'placeholder-text': !form.departure}">{{ form.departure || '你在哪里？' }}</text>
            <text class="location-icon">📍</text>
          </view>
        </view>
        
        <view class="form-item">
          <text class="label">目的地</text>
          <view class="input location-input" @click="chooseLocation('destination')">
            <text :class="{'placeholder-text': !form.destination}">{{ form.destination || '想去哪里？' }}</text>
            <text class="location-icon">📍</text>
          </view>
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
                :class="{ active: form.preferences.includes(opt.value) }"
                v-for="opt in preferenceOptions"
                :key="opt.value"
                @click="togglePreference(opt.value)"
            >
              {{ opt.label }}
            </view>          </view>
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
.location-input {
  justify-content: space-between;
}
.placeholder-text {
  color: #94a3b8;
}
.location-icon {
  font-size: 32rpx;
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
  gap: 20rpx;
}
.tag {
  background: #f8fafc;
  color: var(--text-secondary);
  font-size: 26rpx;
  padding: 16rpx 28rpx;
  border-radius: 16rpx;
  border: 1rpx solid #f1f5f9;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.tag.active {
  background: #e0f2fe;
  color: #0369a1;
  border-color: #0ea5e9;
  font-weight: 600;
  transform: translateY(-2rpx);
  box-shadow: 0 4rpx 12rpx rgba(14, 165, 233, 0.15);
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
