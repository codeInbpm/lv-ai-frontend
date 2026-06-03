<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { commonApi } from '../../api/common'
import { useNavBar } from '../../composables/useNavBar'
import { http } from '../../utils/request'
import { useNotePublishStore } from '../../composables/useNotePublish'

const store = useNotePublishStore()
const { statusBarHeight, navBarHeight, totalHeight } = useNavBar()

const currentDraftId = ref<number | null>(null)
const coverIndex = ref(0)
const seasonColumns = ref(['春季', '夏季', '秋季', '冬季', '四季皆宜'])

onLoad(async (options: any) => {
  store.resetForm('guide')
  coverIndex.value = 0
  
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
      
      if (draftData.coverUrl && Array.isArray(draftData.images)) {
        const idx = draftData.images.indexOf(draftData.coverUrl)
        coverIndex.value = idx > -1 ? idx : 0
      }
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

function syncCoverAndForm() {
  store.coverUrl = store.images[coverIndex.value] || store.images[0] || ''
}

async function submit() {
  syncCoverAndForm()
  try {
    await store.submit(false)
    uni.$emit('refreshCommunityData')
    setTimeout(() => { uni.navigateBack() }, 1500)
  } catch (e) {}
}

async function saveDraft() {
  syncCoverAndForm()
  try {
    await store.submit(true)
    uni.$emit('refreshCommunityData')
    setTimeout(() => { uni.navigateBack() }, 1500)
  } catch (e) {}
}

function handleCancel() {
  uni.navigateBack()
}

function uploadImages() {
  uni.chooseImage({
    count: 9 - store.images.length,
    success: async (res) => {
      uni.showLoading({ title: '上传中...' })
      for (const path of res.tempFilePaths) {
        try {
          const url = await commonApi.upload(path, 'notes')
          store.images.push(url)
        } catch (e) {}
      }
      uni.hideLoading()
    }
  })
}

function setCover(idx: number) {
  coverIndex.value = idx
  uni.showToast({ title: '已设为封面', icon: 'none' })
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
        <text class="nav-title">发布攻略</text>
        <view class="nav-right-placeholder"></view>
      </view>
    </view>
    <view :style="{ height: totalHeight + 'px' }" />

    <scroll-view class="form-body" scroll-y>
      <view class="adv-template">
        <view class="input-group">
          <input class="title-input" v-model="store.title" placeholder="给攻略起一个醒目的标题吧" placeholder-class="ph-style" maxlength="50" />
        </view>

        <!-- 1. 基本信息 -->
        <view class="section-card">
          <view class="section-header">
            <text class="s-title">1. 概况与基本信息</text>
          </view>
          
          <view class="n-item">
            <view class="n-label">目的地概况</view>
            <textarea class="n-textarea" v-model="store.content" placeholder="请输入关于目的地的主要背景概况描述..." auto-height maxlength="-1" />
          </view>
          
          <view class="n-item is-row">
            <view class="n-label">建议游玩天数</view>
            <view class="n-content row-end">
              <input class="n-input num-input" v-model="store.days" type="number" placeholder="如: 3" />
              <text class="n-unit">天</text>
            </view>
          </view>

          <view class="n-item is-row">
            <view class="n-label">人均花费预算</view>
            <view class="n-content row-end">
              <input class="n-input num-input" v-model="store.cost" type="digit" placeholder="如: 2000" />
              <text class="n-unit">元</text>
            </view>
          </view>

          <picker :range="seasonColumns" @change="(e) => store.season = seasonColumns[e.detail.value]">
            <view class="n-item is-row is-link">
              <view class="n-label">最佳出游时间</view>
              <view class="n-content" :class="{'ph-color': !store.season}">{{ store.season || '请选择最佳季节' }}</view>
              <text class="arrow">›</text>
            </view>
          </picker>

          <view class="n-item no-border">
            <view class="n-label">攻略配图 (多图)</view>
            <view class="image-grid inner-grid">
              <view class="img-item" v-for="(img, idx) in store.images" :key="idx" @click="setCover(idx)">
                <image :src="img" mode="aspectFill" />
                <view class="cover-badge" v-if="coverIndex === idx">封面</view>
                <view class="del-icon" @click.stop="store.images.splice(idx, 1); if(coverIndex===idx)coverIndex=0">×</view>
              </view>
              <view class="img-item add-btn" @click="uploadImages" v-if="store.images.length < 9">
                <text class="plus">+</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 2. 实用信息 -->
        <view class="section-card">
          <view class="section-header">
            <text class="s-title">2. 交通与实用信息</text>
          </view>
          <view class="n-item">
            <view class="n-label">交通指南</view>
            <textarea class="n-textarea" v-model="store.guideData.traffic" placeholder="怎么去最方便？" auto-height />
          </view>
          <view class="n-item">
            <view class="n-label">注意事项</view>
            <textarea class="n-textarea" v-model="store.guideData.practicalInfo.attention" placeholder="当地天气变化、出游禁忌、安全避坑提示等..." auto-height />
          </view>
          <view class="n-item is-row">
            <view class="n-label">投诉电话</view>
            <input class="n-input" v-model="store.guideData.practicalInfo.complaintPhone" placeholder="旅游投诉专用电话 (选填)" />
          </view>
          <view class="n-item is-row">
            <view class="n-label">医疗服务</view>
            <input class="n-input" v-model="store.guideData.practicalInfo.medicalService" placeholder="医院/急救电话 (选填)" />
          </view>
          <view class="n-item is-row">
            <view class="n-label">官方网站</view>
            <input class="n-input" v-model="store.guideData.practicalInfo.localWebsite" placeholder="旅游局网、资讯网 (选填)" />
          </view>
        </view>

        <!-- 3. 路线与吃喝玩乐 -->
        <view class="section-card">
          <view class="section-header">
            <text class="s-title">3. 路线与打卡推荐</text>
          </view>
          <view class="n-item">
            <view class="n-label">推荐路线</view>
            <textarea class="n-textarea" v-model="store.guideData.routes" placeholder="写写每日路线的串联安排..." auto-height />
          </view>
          <view class="n-item">
            <view class="n-label">住宿指南</view>
            <textarea class="n-textarea" v-model="store.guideData.accommodation" placeholder="居住在什么区域、商圈出行会更方便..." auto-height />
          </view>
          <view class="n-item">
            <view class="n-label">特色美食</view>
            <textarea class="n-textarea" v-model="store.guideData.food" placeholder="目的地必吃小吃或招牌店铺..." auto-height />
          </view>
          <view class="n-item">
            <view class="n-label">特产选购</view>
            <textarea class="n-textarea" v-model="store.guideData.shopping" placeholder="伴手礼推荐与购买街区建议..." auto-height />
          </view>
        </view>

        <!-- 4. 补充说明 -->
        <view class="section-card">
          <view class="section-header">
            <text class="s-title">4. 其他建议</text>
          </view>
          <view class="n-item is-row">
            <view class="n-label">预算分配</view>
            <input class="n-input" v-model="store.guideData.others.budget" placeholder="对机票、住宿等占比描述" />
          </view>
          <view class="n-item no-border">
            <view class="n-label">穿衣出行</view>
            <textarea class="n-textarea" v-model="store.guideData.others.clothing" placeholder="气温穿衣、药品携带提示..." auto-height />
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
    .cover-badge {
      position: absolute; left: 0; bottom: 0; width: 100%; background: rgba(14, 165, 233, 0.9);
      color: #fff; font-size: 20rpx; text-align: center; padding: 4rpx 0;
    }
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
