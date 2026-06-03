<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { commonApi } from '../../api/common'
import { useNavBar } from '../../composables/useNavBar'
import { http } from '../../utils/request'
import { useNotePublishStore } from '../../composables/useNotePublish'

const store = useNotePublishStore()
const { statusBarHeight, navBarHeight, totalHeight } = useNavBar()

const currentDraftId = ref<number | null>(null)
const companionsColumns = ref(['独自一人', '情侣夫妻', '家庭亲子', '朋友聚会', '商务差旅', '其他'])

onLoad(async (options: any) => {
  store.resetForm('travel')
  
  if (options && options.draftId) {
    currentDraftId.value = Number(options.draftId)
    await loadDraft(currentDraftId.value)
  }
})

async function loadDraft(id: number) {
  uni.showLoading({ title: '正在恢复草稿...' })
  try {
    const res: any = await http.get(`/community/drafts/${id}`)
    if (res && res.content) {
      let draftData = res.content
      if (typeof draftData === 'string') {
        try { draftData = JSON.parse(draftData) } catch (e) {}
      }
      store.restoreFromDraft(draftData, id)
    }
  } catch (e) {
    uni.showToast({ title: '草稿恢复失败', icon: 'none' })
  } finally {
    uni.hideLoading()
  }
}

function goTopicSelect() {
  uni.navigateTo({ url: '/pages/note/topic-select' })
}

function removeTopic(index: number) {
  store.selectedTopics.splice(index, 1)
}

async function submit() {
  try {
    await store.submit(false)
    uni.$emit('refreshCommunityData')
    setTimeout(() => { uni.navigateBack() }, 1500)
  } catch (e) {}
}

async function saveDraft() {
  try {
    await store.submit(true)
    uni.$emit('refreshCommunityData')
    setTimeout(() => { uni.navigateBack() }, 1500)
  } catch (e) {}
}

function handleCancel() {
  uni.navigateBack()
}

function uploadDayImages(dayIdx: number) {
  const currentDay = store.travelData.daysList[dayIdx]
  if (!currentDay.images) {
    currentDay.images = []
  }
  
  uni.chooseImage({
    count: 9 - currentDay.images.length,
    success: async (res) => {
      uni.showLoading({ title: '上传中...' })
      for (const path of res.tempFilePaths) {
        try {
          const url = await commonApi.upload(path, 'notes')
          currentDay.images.push(url)
        } catch (e) {}
      }
      uni.hideLoading()
    }
  })
}

function addDayItem() {
  const newDayIndex = store.travelData.daysList.length + 1
  store.travelData.daysList.push({
    dayIndex: newDayIndex,
    date: '',
    title: '',
    moodWeather: '',
    content: '',
    images: [],
    location: ''
  })
}

function removeDayItem(index: number) {
  if (store.travelData.daysList.length <= 1) {
    uni.showToast({ title: '请至少保留一天的记录', icon: 'none' })
    return
  }
  uni.showModal({
    title: '提示',
    content: `确定要删除第 ${store.travelData.daysList[index].dayIndex} 天的足迹吗？`,
    success: (res) => {
      if (res.confirm) {
        store.travelData.daysList.splice(index, 1)
        store.travelData.daysList.forEach((day, idx) => {
          day.dayIndex = idx + 1
        })
      }
    }
  })
}

function chooseLocation() {
  uni.chooseLocation({
    success: (res) => {
      store.location = {
        name: res.name,
        address: res.address,
        longitude: res.longitude,
        latitude: res.latitude
      }
    }
  })
}
</script>

<template>
  <view class="publish-page">
    <view class="custom-nav" :style="{ paddingTop: statusBarHeight + 'px', height: totalHeight + 'px' }">
      <view class="nav-content" :style="{ height: navBarHeight + 'px' }">
        <text class="cancel-btn" @click="handleCancel">取消</text>
        <text class="nav-title">发布游记</text>
        <view class="nav-right-placeholder"></view>
      </view>
    </view>
    <view :style="{ height: totalHeight + 'px' }" />

    <scroll-view class="form-body" scroll-y>
      <view class="adv-template">
        <view class="input-group">
          <input class="title-input" v-model="store.title" placeholder="给游记起一个文艺的标题" placeholder-class="ph-style" maxlength="50" />
        </view>

        <!-- 游记基本信息 -->
        <view class="section-card">
          <view class="section-header">
            <text class="s-title">出行信息</text>
          </view>
          <view class="n-item is-row">
            <view class="n-label">目的地</view>
            <input class="n-input" v-model="store.travelData.destination" placeholder="打卡前往的城市/景点" />
          </view>

          <picker mode="date" @change="(e) => store.tripDate = e.detail.value">
            <view class="n-item is-row is-link">
              <view class="n-label">出发日期</view>
              <view class="n-content" :class="{'ph-color': !store.tripDate}">{{ store.tripDate || '请选择日期' }}</view>
              <text class="arrow">›</text>
            </view>
          </picker>

          <view class="n-item is-row">
            <view class="n-label">游玩总天数</view>
            <view class="n-content row-end">
              <input class="n-input num-input" v-model="store.travelData.totalDays" type="number" placeholder="如: 5" />
              <text class="n-unit">天</text>
            </view>
          </view>

          <picker :range="companionsColumns" @change="(e) => store.companions = companionsColumns[e.detail.value]">
            <view class="n-item is-row is-link">
              <view class="n-label">旅行同伴</view>
              <view class="n-content" :class="{'ph-color': !store.companions}">{{ store.companions || '本次与谁一同出发' }}</view>
              <text class="arrow">›</text>
            </view>
          </picker>
        </view>

        <!-- 游记足迹记录 -->
        <view class="section-card" v-for="(day, idx) in store.travelData.daysList" :key="idx">
          <view class="section-header">
            <text class="s-title highlight">Day {{ day.dayIndex }}</text>
            <text class="delete-btn" v-if="store.travelData.daysList.length > 1" @click="removeDayItem(idx)">删除此天记录</text>
          </view>

          <view class="n-item is-row">
            <view class="n-label">本日主题</view>
            <input class="n-input" v-model="day.title" placeholder="一句话概括今天" />
          </view>

          <view class="n-item is-row">
            <view class="n-label">心情/天气</view>
            <input class="n-input" v-model="day.moodWeather" placeholder="如: 晴天 / 激动" />
          </view>

          <view class="n-item no-border">
            <view class="n-label">日记正文</view>
            <textarea class="n-textarea" v-model="day.content" placeholder="记录今天发生的趣事、美景..." auto-height maxlength="-1" />
          </view>

          <view class="n-item no-border">
            <view class="n-label">本日精彩美照</view>
            <view class="image-grid inner-grid">
              <view class="img-item" v-for="(img, imgIdx) in (day.images || [])" :key="imgIdx">
                <image :src="img" mode="aspectFill" />
                <view class="del-icon" @click.stop="day.images.splice(imgIdx, 1)">×</view>
              </view>
              <view class="img-item add-btn" @click="uploadDayImages(idx)" v-if="!(day.images) || day.images.length < 9">
                <text class="plus">+</text>
              </view>
            </view>
          </view>
        </view>

        <view class="add-day-wrapper">
          <button class="add-day-btn" @click="addDayItem">+ 追加一天记录</button>
        </view>

        <!-- 总结心得 -->
        <view class="section-card">
          <view class="section-header">
            <text class="s-title">总结与心得</text>
          </view>
          <view class="n-item">
            <view class="n-label">整体开销细账</view>
            <textarea class="n-textarea" v-model="store.travelData.costSummary" placeholder="记一笔开销细账，以便未来参考..." auto-height />
          </view>
          <view class="n-item">
            <view class="n-label">避坑Tips</view>
            <textarea class="n-textarea" v-model="store.travelData.tips" placeholder="给后来者的避坑建议..." auto-height />
          </view>
          <view class="n-item no-border">
            <view class="n-label">出行感悟</view>
            <textarea class="n-textarea" v-model="store.travelData.summary" placeholder="本次旅行的整体感受..." auto-height />
          </view>
        </view>
      </view>

      <view class="adv-actions">
        <view class="action-list">
          <view class="action-item" @click="chooseLocation">
            <view class="left">
              <text class="icon">📍</text>
              <text class="label" :class="{ 'has-val': store.location }">{{ store.location ? store.location.name : '添加地点' }}</text>
              <text class="sub-label" v-if="!store.location">(选择对应地点吧)</text>
            </view>
            <text class="arrow">›</text>
          </view>
          <view class="action-item" @click="goTopicSelect">
            <view class="left">
              <text class="icon">#</text>
              <text class="label">参与话题</text>
              <text class="sub-label" v-if="store.selectedTopics.length === 0">(带话题会获得更多的赞哦～)</text>
            </view>
            <text class="arrow">›</text>
          </view>
          <view class="topic-tags-row" v-if="store.selectedTopics.length > 0">
            <view class="t-tag" v-for="(t, i) in store.selectedTopics" :key="i">
              <text># {{ t }}</text>
              <text class="t-del" @click.stop="removeTopic(i)">×</text>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <view class="bottom-bar">
      <button class="draft-btn" @click="saveDraft">保存草稿</button>
      <button class="publish-btn" @click="submit">发布</button>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.publish-page {
  min-height: 100vh;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
}
.custom-nav {
  position: fixed; top: 0; left: 0; width: 100%; background: #fff; z-index: 100;
  border-bottom: 1rpx solid #f1f5f9;
  .nav-content {
    display: flex; align-items: center; justify-content: space-between; padding: 0 32rpx;
    .cancel-btn { font-size: 30rpx; color: #334155; }
    .nav-title { font-size: 32rpx; font-weight: 600; color: #1e293b; }
    .nav-right-placeholder { width: 60rpx; }
  }
}
.form-body {
  flex: 1;
  padding-bottom: 160rpx;
}
.bottom-bar {
  position: fixed; bottom: 0; left: 0; width: 100%; background: #fff;
  padding: 24rpx 32rpx calc(24rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid #f1f5f9; display: flex; gap: 24rpx; z-index: 100;
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.02);
  .draft-btn {
    flex: 1; height: 90rpx; line-height: 90rpx; background: #f1f5f9; color: #64748b;
    border-radius: 45rpx; font-weight: 600; font-size: 30rpx; border: none; &::after { border: none; }
  }
  .publish-btn {
    flex: 2; height: 90rpx; line-height: 90rpx; background: #0ea5e9; color: #fff;
    border-radius: 45rpx; font-weight: 600; font-size: 30rpx; border: none; box-shadow: 0 8rpx 16rpx rgba(14, 165, 233, 0.25); &::after { border: none; }
  }
}
.ph-style { color: #cbd5e1; font-weight: 400; }
.ph-color { color: #cbd5e1 !important; }

.adv-template {
  .input-group { background: #fff; margin-bottom: 20rpx; padding: 32rpx; .title-input { font-size: 36rpx; font-weight: 600; height: 100rpx; border-bottom: 1rpx solid #f1f5f9; color: #1e293b; } }
}
.section-card {
  background: #fff; margin: 0 24rpx 24rpx; border-radius: 16rpx; padding: 24rpx 32rpx;
  box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.02);
  .section-header {
    margin-bottom: 24rpx; display: flex; justify-content: space-between; align-items: center;
    .s-title { font-size: 32rpx; font-weight: 600; color: #1e293b; }
    .s-title.highlight { color: #0ea5e9; }
    .delete-btn { font-size: 26rpx; color: #ef4444; }
  }
  .n-item {
    border-bottom: 1rpx solid #f1f5f9; padding: 20rpx 0;
    &.no-border { border-bottom: none; }
    .n-label { font-size: 28rpx; color: #475569; margin-bottom: 12rpx; font-weight: 500; }
    .n-textarea { width: 100%; font-size: 30rpx; color: #1e293b; line-height: 1.5; min-height: 100rpx; }
    &.is-row {
      display: flex; align-items: center; justify-content: space-between; margin-bottom: 0;
      .n-label { margin-bottom: 0; width: 200rpx; }
      .n-content { flex: 1; display: flex; justify-content: flex-end; align-items: center; font-size: 30rpx; color: #1e293b; }
      .n-input { flex: 1; text-align: right; font-size: 30rpx; color: #1e293b; }
      .arrow { font-size: 36rpx; color: #cbd5e1; margin-left: 12rpx; }
      .num-input { max-width: 200rpx; margin-right: 8rpx; }
      .n-unit { font-size: 28rpx; color: #64748b; }
      .row-end { justify-content: flex-end; }
    }
  }
}
.image-grid {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 16rpx;
  &.inner-grid { padding: 16rpx 0 0 0; }
  .img-item {
    width: 100%; padding-top: 100%; position: relative; border-radius: 8rpx; overflow: hidden;
    image { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
    .del-icon {
      position: absolute; top: 0; right: 0; background: rgba(0,0,0,0.5); color: #fff;
      width: 36rpx; height: 36rpx; text-align: center; line-height: 32rpx; font-size: 30rpx; border-bottom-left-radius: 8rpx;
    }
  }
  .add-btn {
    background: #f8fafc; border: 2rpx dashed #e2e8f0; display: flex; align-items: center; justify-content: center;
    .plus { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 50rpx; color: #cbd5e1; }
  }
}
.add-day-wrapper {
  margin: 0 24rpx 32rpx;
  .add-day-btn {
    background: rgba(14, 165, 233, 0.1); color: #0ea5e9; font-size: 30rpx; font-weight: 600;
    border-radius: 12rpx; height: 88rpx; line-height: 88rpx; &::after { border: none; }
  }
}
.adv-actions {
  margin: 0 24rpx 24rpx; background: #fff; border-radius: 16rpx; overflow: hidden; box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.02);
  .action-list { border-top: none; }
  .topic-tags-row { padding: 10rpx 32rpx 24rpx; display: flex; flex-wrap: wrap; gap: 16rpx;
    .t-tag { background: #0ea5e9; color: #fff; padding: 8rpx 20rpx; border-radius: 8rpx; font-size: 24rpx; display: flex; align-items: center; gap: 10rpx; .t-del { font-size: 30rpx; margin-left: 6rpx; } }
  }
}
.action-list {
  .action-item {
    display: flex; align-items: center; justify-content: space-between; height: 100rpx; padding: 0 32rpx; border-bottom: 1rpx solid #f8fafc;
    .left {
      display: flex; align-items: center;
      .icon { font-size: 34rpx; margin-right: 16rpx; color: #1e293b; font-weight: bold; }
      .label { font-size: 30rpx; font-weight: 500; color: #1e293b; }
      .label.has-val { color: #0ea5e9; font-weight: 600; }
      .sub-label { font-size: 26rpx; color: #cbd5e1; margin-left: 10rpx; }
    }
    .arrow { font-size: 40rpx; color: #cbd5e1; }
  }
}
</style>
