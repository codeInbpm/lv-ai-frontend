<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import NavBar from '../../../components/common/NavBar.vue'
import { http } from '../../../utils/request'
import { planApi } from '../../../api/plan'

const item = ref<any>(null)
const loading = ref(true)

// 打卡相关
const showCheckin = ref(false)
const checkinForm = ref({
  content: '',
  cost: '',
  images: [] as string[]
})

onLoad((options: any) => {
  if (options.id) {
    const data = uni.getStorageSync('currentPlanItem')
    // 仅在 Storage 存在且与当前 itemId 完美匹配时才使用缓存
    if (data && data.id === Number(options.id)) {
      item.value = data
      loading.value = false
    } else {
      // 优雅防呆兜底：如果用户是通过分享、扫码进来的（Storage缺失），直接调用后端原子接口拉取！
      loadItemDetail(Number(options.id))
    }
  }
})

async function loadItemDetail(itemId: number) {
  loading.value = true
  try {
    const res = await planApi.getPlanItemDetail(itemId)
    if (res.checkinRecord) {
      if (typeof res.checkinRecord.images === 'string') {
        try { res.checkinRecord.images = JSON.parse(res.checkinRecord.images) } catch {}
      }
      if (typeof res.checkinRecord.expenses === 'string') {
        try { res.checkinRecord.expenses = JSON.parse(res.checkinRecord.expenses) } catch {}
      }
    }
    item.value = res
  } catch (err) {
    uni.showToast({ title: '加载行程明细失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function goCheckin() {
  showCheckin.value = true
}

function formatCurrentTime() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day} ${h}:${min}`
}

function formatRecordTime(timeStr?: string) {
  if (!timeStr) return ''
  return timeStr.replace('T', ' ').slice(0, 16)
}

async function submitCheckin() {
  if (!checkinForm.value.content && !checkinForm.value.cost) {
    return uni.showToast({ title: '写点什么或记录下花销吧', icon: 'none' })
  }
  
  uni.showLoading({ title: '打卡中...' })
  try {
    await http.post('/plan/checkin', {
      planId: item.value.planId,
      dayId: item.value.dayId,
      itemId: item.value.id,
      content: checkinForm.value.content,
      cost: checkinForm.value.cost ? Number(checkinForm.value.cost) : 0,
      images: checkinForm.value.images
    })
    uni.hideLoading()
    uni.showToast({ title: '打卡成功！', icon: 'success' })
    showCheckin.value = false
    
    // 更新本地状态
    item.value.checkedIn = 1
    item.value.checkinRecord = {
      content: checkinForm.value.content,
      cost: checkinForm.value.cost ? Number(checkinForm.value.cost) : 0,
      images: [...checkinForm.value.images],
      createTime: formatCurrentTime()
    }
    // 可触发上一个页面刷新
    uni.$emit('refreshPlanDetail')
  } catch (e) {
    uni.hideLoading()
    uni.showToast({ title: '打卡失败', icon: 'none' })
  }
}

function uploadImage() {
  uni.chooseImage({
    count: 3,
    success: (res) => {
      // 模拟上传
      uni.showLoading({ title: '上传中...' })
      setTimeout(() => {
        uni.hideLoading()
        checkinForm.value.images.push(...(res.tempFilePaths as string[]))
      }, 1000)
    }
  })
}

function previewImage(urls: string[], index: number) {
  uni.previewImage({ urls, current: index })
}
</script>

<template>
  <view class="item-page">
    <NavBar fixed back title="行程明细" />
    
    <view v-if="!loading && item" class="content">
      <view class="header-card">
        <view class="title-row">
          <text class="type-icon">{{ item.type === 1 ? '🎯' : item.type === 2 ? '🍜' : item.type === 3 ? '🏨' : item.type === 4 ? '✈️' : '✨' }}</text>
          <text class="title">{{ item.name }}</text>
        </view>
        <view class="info-row">
          <text class="info-text">📍 {{ item.address || '暂无地址' }}</text>
        </view>
        <view class="info-row">
          <text class="info-text">⏰ 建议时间：{{ item.startTime }} - {{ item.endTime }} ({{ item.duration }}分钟)</text>
        </view>
        <view class="info-row" v-if="item.estimatedCost">
          <text class="info-text">💰 预估费用：¥{{ item.estimatedCost }}</text>
        </view>
      </view>

      <view class="section">
        <text class="section-title">亮点 & 介绍</text>
        <text class="desc">{{ item.description || 'AI觉得这里很不错，值得一去！' }}</text>
      </view>

      <view class="section ai-tips">
        <view class="ai-header">
          <text>💡</text>
          <text>AI 贴士</text>
        </view>
        <text class="desc">{{ item.tips || '注意安全，玩得开心！' }}</text>
      </view>

      <!-- 打卡状态区 -->
      <view class="checkin-status" v-if="item.checkedIn">
        <text class="status-title">🎉 已完成打卡！</text>
        
        <view class="record-detail" v-if="item.checkinRecord && (item.checkinRecord.content || item.checkinRecord.cost > 0 || (item.checkinRecord.images && item.checkinRecord.images.length > 0))">
          <view class="record-header">
            <text class="record-time" v-if="item.checkinRecord.createTime">🕒 {{ formatRecordTime(item.checkinRecord.createTime) }}</text>
            <view class="record-cost" v-if="item.checkinRecord.cost > 0">
              <text class="total-cost">💰 总计 ¥{{ item.checkinRecord.cost }}</text>
              <view class="expense-breakdown" v-if="item.checkinRecord.expenses && item.checkinRecord.expenses.length > 0">
                <text class="exp-tag" v-for="(exp, idx) in item.checkinRecord.expenses" :key="idx">
                   {{ ['餐饮', '住宿', '交通', '门票', '购物', '其他'][exp.costType - 1] || '其他' }}: ¥{{ exp.amount }}
                </text>
              </view>
            </view>
          </view>
          <text class="record-content" v-if="item.checkinRecord.content">{{ item.checkinRecord.content }}</text>
          <view class="record-images" v-if="item.checkinRecord.images && item.checkinRecord.images.length > 0">
            <image 
              v-for="(img, idx) in item.checkinRecord.images" 
              :key="idx" 
              :src="img" 
              mode="aspectFill" 
              class="record-img"
              @click="previewImage(item.checkinRecord.images, idx)"
            />
          </view>
        </view>
        <text class="status-desc" v-else>你已经记录了这里的足迹，可以在行程中查看历史回顾。</text>
      </view>
    </view>

    <!-- 底部操作栏 -->
    <view class="bottom-bar" v-if="!loading && item && !item.checkedIn">
      <button class="checkin-btn" @click="goCheckin">📍 立即打卡</button>
    </view>

    <!-- 打卡弹窗 -->
    <view class="popup-mask" v-if="showCheckin" @click="showCheckin = false">
      <view class="popup-content" @click.stop>
        <view class="popup-header">
          <text class="popup-title">记录这一刻</text>
          <text class="close-icon" @click="showCheckin = false">✕</text>
        </view>
        
        <textarea 
          class="popup-textarea" 
          v-model="checkinForm.content" 
          placeholder="分享你的感受、见闻或者小红薯文案吧~" 
        />
        
        <view class="form-row">
          <text class="label">实际花费 (元)</text>
          <input type="digit" class="cost-input" v-model="checkinForm.cost" placeholder="0.00" />
        </view>

        <view class="img-upload">
          <view class="img-list">
            <image 
              v-for="(img, idx) in checkinForm.images" 
              :key="idx" 
              :src="img" 
              mode="aspectFill" 
              class="uploaded-img"
            />
            <view class="upload-btn" @click="uploadImage" v-if="checkinForm.images.length < 3">
              <text>+ 图片</text>
            </view>
          </view>
        </view>

        <button class="submit-btn" @click="submitCheckin">保存记录</button>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.item-page {
  min-height: 100vh;
  background: var(--bg-page);
  padding-bottom: 140rpx;
}
.content {
  padding: 32rpx;
}
.header-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 32rpx;
  box-shadow: var(--shadow-sm);
}
.title-row {
  display: flex;
  align-items: center;
  margin-bottom: 24rpx;
  gap: 16rpx;
}
.type-icon { font-size: 40rpx; }
.title { font-size: 36rpx; font-weight: bold; color: var(--text-primary); }

.info-row {
  margin-bottom: 12rpx;
}
.info-text { font-size: 28rpx; color: var(--text-secondary); }

.section {
  background: #fff;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 32rpx;
}
.section-title {
  font-size: 32rpx; font-weight: bold; margin-bottom: 20rpx; display: block; color: var(--text-primary);
}
.desc {
  font-size: 28rpx; color: var(--text-secondary); line-height: 1.6;
}

.ai-tips {
  background: linear-gradient(135deg, #f0fdfa, #ccfbf1);
  border: 1rpx solid #99f6e4;
}
.ai-header {
  display: flex; gap: 12rpx; align-items: center; margin-bottom: 16rpx; font-weight: bold; color: #0f766e;
}

.checkin-status {
  background: #fdf4ff;
  border: 1rpx dashed #f0abfc;
  border-radius: 24rpx;
  padding: 32rpx;
  text-align: center;
}
.status-title { display: block; font-size: 32rpx; color: #a21caf; font-weight: bold; margin-bottom: 12rpx; }
.status-desc { font-size: 26rpx; color: #c026d3; }

.record-detail {
  margin-top: 24rpx;
  text-align: left;
  background: rgba(255, 255, 255, 0.6);
  padding: 24rpx;
  border-radius: 16rpx;
}
.record-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16rpx; }
.record-time { font-size: 24rpx; color: #64748b; }
.record-cost { 
  display: flex; flex-direction: column; align-items: flex-end; gap: 8rpx;
}
.total-cost { font-size: 28rpx; color: #ef4444; font-weight: bold; }
.expense-breakdown { display: flex; flex-wrap: wrap; gap: 8rpx; justify-content: flex-end; }
.exp-tag { font-size: 22rpx; background: #fee2e2; color: #dc2626; padding: 4rpx 12rpx; border-radius: 8rpx; }
.record-content { font-size: 28rpx; color: #475569; display: block; margin-bottom: 16rpx; line-height: 1.5; }
.record-images { display: flex; gap: 16rpx; flex-wrap: wrap; }
.record-img { width: 160rpx; height: 160rpx; border-radius: 12rpx; }

.bottom-bar {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  background: #fff;
  padding: 24rpx 32rpx calc(24rpx + env(safe-area-inset-bottom));
  box-shadow: 0 -4rpx 16rpx rgba(0,0,0,0.05);
  z-index: 10;
}
.checkin-btn {
  background: linear-gradient(135deg, #0ea5e9, #0369a1);
  color: #fff;
  border-radius: 50rpx;
  font-size: 32rpx;
  font-weight: bold;
}

/* 弹窗样式 */
.popup-mask {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5); z-index: 100;
  display: flex; align-items: flex-end;
}
.popup-content {
  background: #fff; width: 100%; border-radius: 32rpx 32rpx 0 0;
  padding: 40rpx 32rpx calc(40rpx + env(safe-area-inset-bottom));
}
.popup-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32rpx; }
.popup-title { font-size: 32rpx; font-weight: bold; }
.close-icon { font-size: 40rpx; color: #94a3b8; }
.popup-textarea {
  width: 100%; height: 200rpx; background: #f8fafc; border-radius: 16rpx; padding: 24rpx; font-size: 28rpx; box-sizing: border-box; margin-bottom: 24rpx;
}
.form-row {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 24rpx; padding: 24rpx; background: #f8fafc; border-radius: 16rpx;
}
.cost-input { text-align: right; font-size: 32rpx; font-weight: bold; color: #ef4444; }
.img-list { display: flex; gap: 16rpx; margin-bottom: 32rpx; }
.uploaded-img, .upload-btn { width: 160rpx; height: 160rpx; border-radius: 16rpx; }
.upload-btn { background: #f1f5f9; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 28rpx; }
.submit-btn { background: #0ea5e9; color: #fff; border-radius: 50rpx; font-weight: bold; }
</style>
