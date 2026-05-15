<script setup lang="ts">
import { ref } from 'vue'
import NavBar from '../../components/common/NavBar.vue'
import { noteApi } from '../../api/note'
import { commonApi } from '../../api/common'

const title = ref('')
const content = ref('')
const coverUrl = ref('')
const images = ref<string[]>([])

async function submit() {
  if (!title.value.trim()) return uni.showToast({ title: '请输入标题', icon: 'none' })
  if (!content.value.trim()) return uni.showToast({ title: '请输入内容', icon: 'none' })

  uni.showLoading({ title: '发布中...' })
  try {
    await noteApi.publishNote({
      title: title.value,
      content: content.value,
      coverUrl: coverUrl.value || images.value[0] || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=500',
      images: JSON.stringify(images.value),
      status: 1
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

async function saveDraft() {
  uni.showLoading({ title: '保存中...' })
  try {
    const draftData = {
      title: title.value,
      content: content.value,
      coverUrl: coverUrl.value,
      images: images.value
    }
    await uni.request({
      url: 'http://localhost:8080/api/community/drafts/save', // We need this endpoint or just use a generic one
      method: 'POST',
      header: { Authorization: useUserStore().token },
      data: {
        draftType: 1, // 1: 笔记
        title: title.value || '无标题',
        content: JSON.stringify(draftData)
      }
    })
    uni.hideLoading()
    uni.showToast({ title: '已存入草稿箱', icon: 'success' })
  } catch (e) {
    uni.hideLoading()
  }
}

async function chooseCover() {
  uni.chooseImage({
    count: 1,
    success: async (res) => {
      const tempFilePath = res.tempFilePaths[0]
      uni.showLoading({ title: '上传中...' })
      try {
        const url = await commonApi.upload(tempFilePath)
        coverUrl.value = url
        uni.hideLoading()
      } catch (e) {
        uni.hideLoading()
      }
    }
  })
}

function uploadImages() {
  uni.chooseImage({
    count: 9,
    success: async (res) => {
      uni.showLoading({ title: '上传中...' })
      for (const path of res.tempFilePaths) {
        try {
          const url = await commonApi.upload(path)
          images.value.push(url)
        } catch (e) {}
      }
      uni.hideLoading()
    }
  })
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

      <!-- 多图上传展示 -->
      <view class="image-list">
        <view class="image-item" v-for="(img, index) in images" :key="index">
          <image :src="img" mode="aspectFill" class="img" />
          <view class="del-btn" @click="images.splice(index, 1)">×</view>
        </view>
        <view class="image-item add-box" @click="uploadImages" v-if="images.length < 9">
          <text>+</text>
        </view>
      </view>
    </view>

    <view class="bottom-bar">
      <button class="draft-btn" @click="saveDraft">保存草稿</button>
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
  display: flex;
  gap: 20rpx;
}
.draft-btn {
  flex: 1;
  background: #f1f5f9;
  color: #64748b;
  border-radius: 44rpx;
  font-weight: 600;
  font-size: 30rpx;
  &::after { border: none; }
}
.publish-btn {
  flex: 2;
  background: var(--primary);
  color: #fff;
  border-radius: 44rpx;
  font-weight: 600;
  font-size: 30rpx;
  &::after { border: none; }
}

.image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
  margin-top: 40rpx;
}
.image-item {
  width: 210rpx;
  height: 210rpx;
  border-radius: 12rpx;
  overflow: hidden;
  position: relative;
  .img { width: 100%; height: 100%; }
  .del-btn {
    position: absolute; top: 0; right: 0; background: rgba(0,0,0,0.5); color: #fff;
    width: 40rpx; height: 40rpx; text-align: center; line-height: 36rpx; border-radius: 0 0 0 12rpx;
  }
}
.add-box {
  background: #f8fafc;
  display: flex; align-items: center; justify-content: center;
  font-size: 60rpx; color: #94a3b8; border: 2rpx dashed #cbd5e1;
}
</style>
