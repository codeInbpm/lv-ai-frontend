<script setup lang="ts">
import { ref } from 'vue'
import NavBar from '../../components/common/NavBar.vue'
import { noteApi } from '../../api/note'

const title = ref('')
const content = ref('')
const coverUrl = ref('')

async function submit() {
  if (!title.value.trim()) return uni.showToast({ title: '请输入标题', icon: 'none' })
  if (!content.value.trim()) return uni.showToast({ title: '请输入内容', icon: 'none' })

  uni.showLoading({ title: '发布中...' })
  try {
    await noteApi.publishNote({
      title: title.value,
      content: content.value,
      coverUrl: coverUrl.value || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=500' // Default if none
    })
    uni.hideLoading()
    uni.showToast({ title: '发布成功', icon: 'success' })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (e) {
    uni.hideLoading()
  }
}

// In a real app, this would use uni.chooseImage and upload to MinIO
function chooseCover() {
  uni.showToast({ title: '这里接入图片上传逻辑', icon: 'none' })
}
</script>

<template>
  <view class="publish-page">
    <NavBar fixed back title="发布笔记" />

    <view class="form">
      <view class="cover-uploader" @click="chooseCover">
        <image v-if="coverUrl" :src="coverUrl" class="cover-img" mode="aspectFill" />
        <view v-else class="upload-ph">
          <text class="plus">+</text>
          <text class="text">添加封面图</text>
        </view>
      </view>

      <input 
        class="title-input" 
        v-model="title" 
        placeholder="填写标题会有更多赞哦~" 
        placeholder-class="ph-style"
      />
      <view class="divider"></view>
      
      <textarea 
        class="content-input" 
        v-model="content" 
        placeholder="添加正文，分享你的旅行故事..." 
        placeholder-class="ph-style"
        :maxlength="-1"
      />
    </view>

    <view class="bottom-bar">
      <button class="publish-btn" @click="submit">发布</button>
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
.form {
  padding: 32rpx;
  flex: 1;
}
.cover-uploader {
  width: 100%;
  height: 360rpx;
  background: #f8fafc;
  border-radius: 20rpx;
  margin-bottom: 32rpx;
  overflow: hidden;
  display: flex; align-items: center; justify-content: center;
}
.cover-img { width: 100%; height: 100%; }
.upload-ph {
  display: flex; flex-direction: column; align-items: center; color: #94a3b8;
}
.plus { font-size: 60rpx; font-weight: 300; margin-bottom: 10rpx; }
.text { font-size: 28rpx; }

.title-input {
  font-size: 36rpx; font-weight: 600; padding: 20rpx 0; height: 80rpx; color: #1e293b;
}
.divider { height: 1rpx; background: #f1f5f9; margin: 20rpx 0; }
.content-input {
  width: 100%; min-height: 400rpx; font-size: 30rpx; color: #334155; line-height: 1.6;
}
.ph-style { color: #94a3b8; font-weight: 400; }

.bottom-bar {
  padding: 24rpx 32rpx calc(24rpx + env(safe-area-inset-bottom));
  background: #fff;
  border-top: 1rpx solid #f1f5f9;
}
.publish-btn {
  background: var(--primary); color: #fff; border-radius: 44rpx; font-weight: 600; font-size: 32rpx;
  &::after { border: none; }
}
</style>
