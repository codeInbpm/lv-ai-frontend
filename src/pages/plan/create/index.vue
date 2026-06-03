<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { usePlanStore } from '../../../stores/plan'
import { planApi } from '../../../api/plan'
import NavBar from '../../../components/common/NavBar.vue'

const planStore = usePlanStore()
const loading = ref(false)
const submitLoading = ref(false)

const showDrivingModal = ref(false)
const drivingForm = reactive({
  policy: 'REAL_TRAFFIC',
  plateNumber: ''
})
const drivingPolicies = [
  { label: '智能推荐(路况)', value: 'REAL_TRAFFIC' },
  { label: '时间优先', value: 'LEAST_TIME' },
  { label: '少收费', value: 'LEAST_FEE' },
  { label: '不走高速', value: 'AVOID_HIGHWAY' },
  { label: '高速优先', value: 'PRIORITY_HIGHWAY' }
]

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
  { id: 'food', label: '🍜 美食', value: '美食' },
  { id: 'photo', label: '📷 摄影', value: '摄影' },
  { id: 'family', label: '👨‍👩‍👧 亲子', value: '亲子' },
  { id: 'couple', label: '💑 情侣', value: '情侣' },
  { id: 'driving', label: '🚗 自驾', value: '自驾' },
  { id: 'outdoor', label: '🏕️ 户外', value: '户外' },
  { id: 'art', label: '🎨 文艺', value: '文艺' },
  { id: 'shopping', label: '🛍️ 购物', value: '购物' },
  { id: 'history', label: '🏛️ 历史', value: '历史' },
  { id: 'island', label: '🌊 海岛', value: '海岛' }
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
    success: async (res) => {
      form.departureLat = res.latitude
      form.departureLng = res.longitude
      
      try {
        // 从后端安全拉取动态地图 Key
        const mapKey = await planApi.getMapKey()
        
        // 调用腾讯地图反解析 (带重试机制)
        const fetchLocation = (retryCount = 0) => {
          uni.request({
            url: `https://apis.map.qq.com/ws/geocoder/v1/?location=${res.latitude},${res.longitude}&key=${mapKey}`,
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
      } catch (err) {
        console.error('拉取地图Key失败:', err)
        form.departure = '当前位置'
      }
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

function togglePreference(id: string, value: string) {
  console.log('togglePreference id:', id, 'value:', value)
  if (id === 'driving') {
    showDrivingModal.value = true
    return
  }
  const index = form.preferences.indexOf(value)
  if (index > -1) {
    form.preferences.splice(index, 1)
  } else {
    form.preferences.push(value)
  }
}

function confirmDrivingPref() {
  const drivingVal = preferenceOptions.find(o => o.id === 'driving')?.value || '自驾'
  if (!form.preferences.includes(drivingVal)) {
    form.preferences.push(drivingVal)
  }
  showDrivingModal.value = false
}

function removeDrivingPref() {
  const drivingVal = preferenceOptions.find(o => o.id === 'driving')?.value || '自驾'
  const index = form.preferences.indexOf(drivingVal)
  if (index > -1) {
    form.preferences.splice(index, 1)
  }
  showDrivingModal.value = false
}

async function handleSubmit() {
  if (submitLoading.value) return
  if (!form.departure || !form.destination || !form.startDate) {
    return uni.showToast({ title: '请填写必要信息', icon: 'none' })
  }

  submitLoading.value = true
  uni.showLoading({ title: 'AI规划中...', mask: true })

  try {
    const result = await planStore.createPlan({
      departure: form.departure,
      departureLng: form.departureLng,
      departureLat: form.departureLat,
      destination: form.destination,
      destinationLng: form.destinationLng,
      destinationLat: form.destinationLat,
      startDate: form.startDate,
      days: form.days,
      budget: form.budget,
      peopleCount: form.peopleCount,
      preferences: form.preferences,
      extraNote: form.extraNote,
      drivingPolicy: form.preferences.includes('自驾') ? drivingForm.policy : undefined,
      plateNumber: form.preferences.includes('自驾') ? drivingForm.plateNumber : undefined
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
  } catch (err: any) {
    uni.hideLoading()
    // 优雅读取并展示后端返回的高情商阻断文案，如“您已有正在规划中的行程”
    const errorMsg = err?.data?.message || '提交规划请求失败，请稍后重试'
    uni.showModal({
      title: '规划提交未成功',
      content: errorMsg,
      showCancel: false
    })
  } finally {
    submitLoading.value = false
    uni.hideLoading()
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
                :key="opt.id"
                @click="togglePreference(opt.id, opt.value)"
            >
              {{ opt.label }}
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

    <!-- 自驾偏好弹窗 -->
    <view class="modal-mask" v-if="showDrivingModal" @click="removeDrivingPref">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">🚗 自驾路线偏好设置</text>
        </view>
        <view class="modal-body">
          <view class="pref-item">
            <text class="pref-label">路线策略</text>
            <view class="policy-list">
              <view 
                class="policy-tag"
                :class="{ active: drivingForm.policy === p.value }"
                v-for="p in drivingPolicies"
                :key="p.value"
                @click="drivingForm.policy = p.value"
              >{{ p.label }}</view>
            </view>
          </view>
          <view class="pref-item">
            <text class="pref-label">车牌号 (选填，用于规避限行)</text>
            <input class="plate-input" v-model="drivingForm.plateNumber" placeholder="例如：粤B12345" />
          </view>
        </view>
        <view class="modal-footer">
          <view class="btn cancel" @click="removeDrivingPref">取消选择</view>
          <view class="btn confirm" @click="confirmDrivingPref">确定加入自驾</view>
        </view>
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
  border: 2rpx solid #f1f5f9;
  box-sizing: border-box;
  transition: background-color 0.2s, color 0.2s, border-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.tag.active {
  background: #e0f2fe;
  color: #0369a1;
  border-color: #0ea5e9;
  font-weight: normal !important;
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

/* 弹窗样式 */
.modal-mask {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  width: 100vw; height: 100vh;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(20rpx);
  z-index: 99999;
}
.modal-content {
  position: absolute; bottom: 0; left: 0; width: 100%;
  background: #ffffff;
  border-radius: 40rpx 40rpx 0 0;
  overflow: hidden;
  box-shadow: 0 -16rpx 48rpx rgba(15, 23, 42, 0.15);
  padding-bottom: env(safe-area-inset-bottom);
  animation: slideUp 0.3s cubic-bezier(0.25, 1, 0.5, 1) forwards;
  border-top: 1rpx solid rgba(255, 255, 255, 0.8);
}
@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
.modal-header {
  padding: 36rpx 30rpx; text-align: center; border-bottom: 1rpx solid #f1f5f9;
}
.modal-title {
  font-size: 34rpx; font-weight: 700; color: #0f172a;
}
.modal-body { padding: 40rpx 32rpx; }
.pref-item { margin-bottom: 40rpx; }
.pref-label {
  font-size: 28rpx; font-weight: 600; color: #334155; margin-bottom: 20rpx; display: block;
}
.policy-list {
  display: flex; flex-wrap: wrap; gap: 16rpx;
}
.policy-tag {
  padding: 16rpx 28rpx; background: #f8fafc; color: #64748b;
  font-size: 26rpx; border-radius: 16rpx; border: 2rpx solid #f1f5f9;
  transition: all 0.2s ease;
}
.policy-tag.active {
  background: #e0f2fe; color: #0369a1; border-color: #0ea5e9;
  font-weight: 600;
  box-shadow: 0 4rpx 12rpx rgba(14, 165, 233, 0.1);
}
.plate-input {
  background: #f8fafc; padding: 24rpx; border-radius: 16rpx;
  font-size: 28rpx; border: 2rpx solid #e2e8f0; width: 100%;
  box-sizing: border-box;
  transition: all 0.2s ease;
}
.plate-input:focus {
  border-color: #0ea5e9;
  background: #ffffff;
  box-shadow: 0 0 0 4rpx rgba(14, 165, 233, 0.1);
}
.modal-footer {
  display: flex; border-top: 1rpx solid #f1f5f9;
  background: #f8fafc;
}
.btn { 
  flex: 1; text-align: center; padding: 32rpx 0; font-size: 30rpx; 
  transition: background-color 0.2s;
}
.btn.cancel { 
  color: #64748b; border-right: 1rpx solid #f1f5f9; 
}
.btn.cancel:active {
  background-color: #f1f5f9;
}
.btn.confirm { 
  color: #0ea5e9; font-weight: 700; 
}
.btn.confirm:active {
  background-color: #e0f2fe;
}
</style>
