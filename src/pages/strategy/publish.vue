<script setup lang="ts">
import { reactive } from 'vue'
import NavBar from '../../components/common/NavBar.vue'
import { http } from '../../utils/request'
import { commonApi } from '../../api/common'

const form = reactive({
  title: '',
  destination: '',
  days: 3,
  content: '',
  coverUrl: ''
})

function chooseCover() {
  uni.chooseImage({
    count: 1,
    success: async (res) => {
      const tempFilePath = res.tempFilePaths[0]
      uni.showLoading({ title: '上传中...' })
      try {
        const url = await commonApi.upload(tempFilePath)
        form.coverUrl = url
        uni.hideLoading()
      } catch (e) {
        uni.hideLoading()
      }
    }
  })
}

async function handleSubmit() {
  if (!form.title || !form.content) {
    return uni.showToast({ title: '请填写标题和内容', icon: 'none' })
  }
  
  uni.showLoading({ title: '发布中...' })
  try {
    await http.post('/strategy/publish', form)
    uni.hideLoading()
    uni.showToast({ title: '发布成功', icon: 'success' })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (e) {
    uni.hideLoading()
    uni.showToast({ title: '发布失败', icon: 'none' })
  }
}
</script>

<template>
  <view class="publish-page">
    <NavBar fixed back title="发布攻略" />
    
    <view class="form-container">
      <view class="cover-uploader" @click="chooseCover">
        <image v-if="form.coverUrl" :src="form.coverUrl" mode="aspectFill" class="cover-img" />
        <view v-else class="upload-placeholder">
          <text class="icon">📷</text>
          <text class="text">添加漂亮封面图，让更多人看到</text>
        </view>
      </view>

      <view class="form-group">
        <input class="title-input" v-model="form.title" placeholder="给攻略起一个吸引人的标题吧..." placeholder-class="ph-bold" />
      </view>
      
      <view class="form-group row">
        <view class="input-item flex-1">
          <text class="label">目的地</text>
          <input class="input" v-model="form.destination" placeholder="如: 丽江" />
        </view>
        <view class="input-item flex-1">
          <text class="label">游玩天数</text>
          <input class="input" type="number" v-model="form.days" placeholder="如: 3" />
        </view>
      </view>

      <view class="form-group">
        <textarea 
          class="content-input" 
          v-model="form.content" 
          placeholder="分享你的行程亮点、避坑指南、美食推荐吧..."
          maxlength="2000"
        />
      </view>
    </view>

    <view class="bottom-bar">
      <view class="submit-btn" @click="handleSubmit">发布攻略</view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.publish-page {
  min-height: 100vh;
  background: #fff;
  display: flex;
  flex-direction: column;
}
.form-container {
  flex: 1;
  padding: 32rpx;
  padding-bottom: 120rpx;
}
.cover-uploader {
  width: 100%;
  height: 360rpx;
  background: #f8fafc;
  border-radius: 24rpx;
  margin-bottom: 32rpx;
  overflow: hidden;
  position: relative;
}
.cover-img {
  width: 100%;
  height: 100%;
}
.upload-placeholder {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
}
.upload-placeholder .icon { font-size: 64rpx; }
.upload-placeholder .text { font-size: 26rpx; color: var(--text-tertiary); }

.form-group {
  margin-bottom: 32rpx;
}
.form-group.row {
  display: flex;
  gap: 24rpx;
}
.flex-1 { flex: 1; }

.title-input {
  font-size: 36rpx;
  font-weight: bold;
  height: 80rpx;
  border-bottom: 2rpx solid #f1f5f9;
}
.ph-bold { font-weight: normal; color: var(--text-tertiary); }

.input-item {
  display: flex;
  align-items: center;
  background: #f8fafc;
  height: 88rpx;
  border-radius: 16rpx;
  padding: 0 24rpx;
}
.label {
  font-size: 28rpx;
  color: var(--text-secondary);
  margin-right: 16rpx;
}
.input {
  flex: 1;
  font-size: 28rpx;
  color: var(--text-primary);
}

.content-input {
  width: 100%;
  height: 500rpx;
  background: #f8fafc;
  border-radius: 20rpx;
  padding: 24rpx;
  font-size: 30rpx;
  line-height: 1.6;
  box-sizing: border-box;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 24rpx 32rpx calc(24rpx + env(safe-area-inset-bottom));
  background: #fff;
  border-top: 1rpx solid #f1f5f9;
  z-index: 10;
}
.submit-btn {
  background: linear-gradient(135deg, #0ea5e9, #0369a1);
  color: #fff;
  height: 90rpx;
  border-radius: 45rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: bold;
}
</style>
