<script setup lang="ts">
import { ref } from 'vue'
import NavBar from '../../components/common/NavBar.vue'
import { meApi } from '../../api/me'
import { commonApi } from '../../api/common'

const saving = ref(false)
const locationName = ref('')
const address = ref('')
const province = ref('')
const city = ref('')
const country = ref('中国')
const content = ref('')
const lat = ref<number | undefined>()
const lng = ref<number | undefined>()
const images = ref<string[]>([])

function chooseLocation() {
  uni.chooseLocation({
    success: (res) => {
      locationName.value = res.name || ''
      address.value = res.address || ''
      lat.value = res.latitude
      lng.value = res.longitude
      // 逆解析省市区（简单处理：用地址字段）
      parseAddress(res.address || '')
    }
  })
}

function parseAddress(addr: string) {
  if (!addr) return
  // 匹配 "XX省YY市" 或 "XX市YY区"（直辖市）
  const provinceMatch = addr.match(/^(.+?省)/)
  if (provinceMatch) {
    province.value = provinceMatch[1]
    const rest = addr.substring(provinceMatch[1].length)
    const cityMatch = rest.match(/^(.+?市)/)
    if (cityMatch) city.value = cityMatch[1]
  } else {
    // 直辖市：北京市、上海市、天津市、重庆市
    const directMatch = addr.match(/^(.+?市)/)
    if (directMatch) {
      province.value = directMatch[1]
      city.value = directMatch[1]
    }
  }
}

function chooseImage() {
  uni.chooseImage({
    count: 9 - images.value.length,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: async (res) => {
      for (const path of res.tempFilePaths) {
        try {
          const url = await commonApi.upload(path, 'footprints')
          images.value.push(url)
        } catch { }
      }
    }
  })
}

function removeImage(idx: number) {
  images.value.splice(idx, 1)
}

async function handleSave() {
  if (!locationName.value.trim()) {
    uni.showToast({ title: '请选择打卡地点', icon: 'none' })
    return
  }
  saving.value = true
  try {
    await meApi.addFootprint({
      locationName: locationName.value,
      address: address.value,
      province: province.value,
      city: city.value,
      country: country.value,
      lat: lat.value,
      lng: lng.value,
      content: content.value,
      images: images.value.length ? JSON.stringify(images.value) : undefined
    })
    uni.showToast({ title: '打卡成功', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 1000)
  } catch {
    uni.showToast({ title: '保存失败', icon: 'none' })
  }
  saving.value = false
}
</script>

<template>
  <view class="add-page">
    <NavBar fixed back title="点亮新足迹" textColor="#ffffff"
      background="linear-gradient(135deg, #0c4a6e, #0ea5e9)" :placeholder="true" />

    <scroll-view scroll-y class="form-scroll">
      <!-- 选择地点 -->
      <view class="form-section card">
        <view class="form-item" @click="chooseLocation">
          <text class="form-label">  打卡地点</text>
          <view class="form-value-wrap">
            <text :class="['form-value', { placeholder: !locationName }]">
              {{ locationName || '点击选择地点' }}
            </text>
            <text class="arrow">›</text>
          </view>
        </view>
        <view v-if="address" class="form-item">
          <text class="form-label">  地址</text>
          <text class="form-value">{{ address }}</text>
        </view>
      </view>

      <!-- 上传图片 -->
      <view class="form-section card">
        <text class="section-title">打卡照片</text>
        <view class="image-grid">
          <view v-for="(img, idx) in images" :key="idx" class="img-item">
            <image :src="img" class="preview-img" mode="aspectFill" />
            <view class="img-remove" @click="removeImage(idx)">×</view>
          </view>
          <view v-if="images.length < 9" class="img-add" @click="chooseImage">
            <text class="add-icon">+</text>
            <text class="add-text">添加照片</text>
          </view>
        </view>
      </view>

      <!-- 打卡感想 -->
      <view class="form-section card">
        <text class="section-title">打卡感想</text>
        <textarea class="content-input" v-model="content"
          placeholder="记录这一刻的心情..." maxlength="500" :auto-height="true" />
      </view>

      <view style="height: 200rpx" />
    </scroll-view>

    <!-- 保存按钮 -->
    <view class="bottom-bar">
      <button class="save-btn" :loading="saving" :disabled="saving" @click="handleSave">
        保存打卡
      </button>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.add-page {
  min-height: 100vh;
  background: var(--bg-page);
  display: flex;
  flex-direction: column;
}
.form-scroll {
  flex: 1;
  height: 0;
  padding: 24rpx;
}
.form-section {
  margin-bottom: 20rpx;
  padding: 24rpx;
}
.form-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 0;
  &:not(:last-child) { border-bottom: 1rpx solid var(--border); }
}
.form-label {
  font-size: 28rpx;
  color: var(--text-primary);
  font-weight: 500;
  flex-shrink: 0;
}
.form-value-wrap {
  display: flex;
  align-items: center;
  gap: 8rpx;
  flex: 1;
  justify-content: flex-end;
}
.form-value {
  font-size: 28rpx;
  color: var(--text-primary);
  text-align: right;
  max-width: 460rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.form-value.placeholder { color: var(--text-tertiary); }
.arrow { font-size: 32rpx; color: var(--text-tertiary); }
.section-title {
  font-size: 28rpx;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 20rpx;
  display: block;
}
.image-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}
.img-item {
  position: relative;
  width: 160rpx;
  height: 160rpx;
}
.preview-img {
  width: 100%;
  height: 100%;
  border-radius: 12rpx;
}
.img-remove {
  position: absolute;
  top: -10rpx;
  right: -10rpx;
  width: 36rpx;
  height: 36rpx;
  background: rgba(0,0,0,0.5);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
}
.img-add {
  width: 160rpx;
  height: 160rpx;
  border: 2rpx dashed var(--border);
  border-radius: 12rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
}
.add-icon { font-size: 48rpx; color: var(--text-tertiary); }
.add-text { font-size: 22rpx; color: var(--text-tertiary); }
.content-input {
  width: 100%;
  min-height: 160rpx;
  font-size: 28rpx;
  color: var(--text-primary);
  line-height: 1.6;
}
.bottom-bar {
  padding: 20rpx 32rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -2rpx 12rpx rgba(0,0,0,0.05);
  flex-shrink: 0;
}
.save-btn {
  width: 100%;
  height: 88rpx;
  background: linear-gradient(135deg, #ec4899, #f472b6);
  color: #fff;
  border-radius: 44rpx;
  font-size: 30rpx;
  font-weight: 700;
  border: none;
  &::after { border: none; }
}
</style>
