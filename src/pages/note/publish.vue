<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { noteApi } from '../../api/note'
import { commonApi } from '../../api/common'
import { useUserStore } from '../../stores/user'
import { useNavBar } from '../../composables/useNavBar'
import { http } from '../../utils/request'

const userStore = useUserStore()
const { statusBarHeight, navBarHeight, totalHeight } = useNavBar()

const title = ref('')
const content = ref('')
const images = ref<string[]>([])
const coverIndex = ref(0) // 默认第一张为封面
const location = ref<any>(null)
const selectedTopics = ref<string[]>([])
const currentDraftId = ref<string | null>(null)

onLoad((options: any) => {
  console.log('Publish page onLoad options:', options)
  if (options && options.draftId) {
    currentDraftId.value = options.draftId
    loadDraft(options.draftId)
  }
})

async function loadDraft(id: string) {
  uni.showLoading({ title: '正在恢复草稿...' })
  try {
    const res = await http.get(`/community/drafts/${id}`)
    console.log('Loaded draft data:', res)
    if (res && res.content) {
      let draftData = res.content
      // 如果后端没有自动转对象，则手动解析
      if (typeof draftData === 'string') {
        try {
          draftData = JSON.parse(draftData)
        } catch (e) {
          console.error('JSON parse error:', e)
        }
      }
      
      title.value = draftData.title || ''
      content.value = draftData.content || ''
      images.value = Array.isArray(draftData.images) ? draftData.images : []
      coverIndex.value = draftData.coverIndex || 0
      location.value = draftData.location || null
      selectedTopics.value = Array.isArray(draftData.topics) ? draftData.topics : []
      
      uni.showToast({ title: '草稿已恢复', icon: 'none' })
    }
  } catch (e) {
    console.error('Failed to load draft:', e)
    uni.showToast({ title: '草稿加载失败', icon: 'none' })
  } finally {
    uni.hideLoading()
  }
}

const contentLimit = 1500
const remainingChars = computed(() => contentLimit - content.value.length)

// 话题联想相关
const showTopicSuggest = ref(false)
const topicKeyword = ref('')
const suggestedTopics = ref<any[]>([])

// 监听正文内容，检测 # 字符
watch(content, (newVal) => {
  const lastChar = newVal.slice(-1)
  if (lastChar === '#') {
    showTopicSuggest.value = true
    topicKeyword.value = ''
    searchTopics('')
  } else if (showTopicSuggest.value) {
    // 提取最后一个 # 之后的文字进行搜索
    const parts = newVal.split('#')
    const currentKeyword = parts[parts.length - 1]
    if (currentKeyword.includes(' ') || currentKeyword.includes('\n')) {
      showTopicSuggest.value = false
    } else {
      topicKeyword.value = currentKeyword
      searchTopics(currentKeyword)
    }
  }
})

async function searchTopics(kw: string) {
  const res = await http.get('/topic/list', { keyword: kw })
  suggestedTopics.value = res
}

async function selectSuggestTopic(topicTitle: string) {
  // 替换正文中的关键词
  const parts = content.value.split('#')
  parts[parts.length - 1] = topicTitle + ' '
  content.value = parts.join('#')
  
  if (!selectedTopics.value.includes(topicTitle)) {
    selectedTopics.value.push(topicTitle)
  }
  showTopicSuggest.value = false
}

async function createCustomTopic() {
  if (!topicKeyword.value.trim()) return
  const res = await http.post('/topic/save-or-get', { title: topicKeyword.value })
  selectSuggestTopic(res.title)
}

// 供话题选择页调用
function addTopic(topicName: string) {
  if (!selectedTopics.value.includes(topicName)) {
    selectedTopics.value.push(topicName)
  }
}

defineExpose({ addTopic })

async function submit() {
  if (!title.value.trim()) return uni.showToast({ title: '请输入标题', icon: 'none' })
  if (!content.value.trim()) return uni.showToast({ title: '请输入正文', icon: 'none' })
  if (images.value.length === 0) return uni.showToast({ title: '请至少上传一张图片', icon: 'none' })

  uni.showLoading({ title: '发布中...', mask: true })
  try {
    await noteApi.publishNote({
      title: title.value,
      content: content.value,
      coverUrl: images.value[coverIndex.value] || images.value[0],
      images: JSON.stringify(images.value),
      locationName: location.value?.name,
      locationAddress: location.value?.address,
      longitude: location.value?.longitude,
      latitude: location.value?.latitude,
      topicTags: selectedTopics.value.join(','),
      type: 'note',
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
  uni.showLoading({ title: '保存中...', mask: true })
  try {
    const draftData = {
      title: title.value,
      content: content.value,
      images: images.value,
      coverIndex: coverIndex.value,
      location: location.value,
      topics: selectedTopics.value
    }
    await uni.request({
      url: 'http://localhost:8080/api/community/drafts/save',
      method: 'POST',
      header: { Authorization: userStore.token },
      data: {
        id: currentDraftId.value, // 如果是编辑已有草稿，传入 ID
        draftType: 1,
        title: title.value || '无标题草稿',
        content: JSON.stringify(draftData)
      }
    })
    uni.hideLoading()
    uni.showToast({ title: '已存入草稿箱', icon: 'success' })
  } catch (e) {
    uni.hideLoading()
  }
}

function handleCancel() {
  uni.navigateBack()
}

function uploadImages() {
  uni.chooseImage({
    count: 9 - images.value.length,
    success: async (res) => {
      uni.showLoading({ title: '上传中...' })
      for (const path of res.tempFilePaths) {
        try {
          const url = await commonApi.upload(path, 'notes')
          images.value.push(url)
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
      location.value = {
        name: res.name,
        address: res.address,
        longitude: res.longitude,
        latitude: res.latitude
      }
    }
  })
}

function goTopicSelect() {
  uni.navigateTo({ url: '/pages/note/topic-select' })
}

function removeTopic(index: number) {
  selectedTopics.value.splice(index, 1)
}
</script>

<template>
  <view class="publish-page">
    <!-- 自定义导航栏 -->
    <view class="custom-nav" :style="{ paddingTop: statusBarHeight + 'px', height: totalHeight + 'px' }">
      <view class="nav-content" :style="{ height: navBarHeight + 'px' }">
        <text class="cancel-btn" @click="handleCancel">取消</text>
        <text class="nav-title">发布笔记</text>
        <view class="nav-right-placeholder"></view>
      </view>
    </view>
    <view :style="{ height: totalHeight + 'px' }" />

    <scroll-view class="form-body" scroll-y>
      <!-- 标题 -->
      <view class="input-group">
        <input 
          class="title-input" 
          v-model="title" 
          placeholder="填写标题会有更多赞哦~" 
          placeholder-class="ph-style"
          maxlength="50"
        />
      </view>

      <!-- 正文 -->
      <view class="content-group">
        <textarea 
          class="content-input" 
          v-model="content" 
          placeholder="美好的的一天，写点什么吧..." 
          placeholder-class="ph-style"
          :maxlength="contentLimit"
        />
        
        <!-- 话题联想浮层 -->
        <view class="topic-suggest" v-if="showTopicSuggest">
          <view class="suggest-item" v-for="t in suggestedTopics" :key="t.id" @click="selectSuggestTopic(t.title)">
            <text class="s-icon">#</text>
            <text class="s-name">{{ t.title }}</text>
            <text class="s-count">{{ t.followerCount }} 关注</text>
          </view>
          <view class="suggest-item create" v-if="topicKeyword" @click="createCustomTopic">
            <text class="s-icon">+</text>
            <text class="s-name">创建新话题: {{ topicKeyword }}</text>
          </view>
        </view>

        <view class="limit-info">
          <text class="limit-text">还可写 {{ remainingChars }} 字</text>
          <text class="tag-name">金骆驼笔记 <text class="info-icon">ⓘ</text></text>
        </view>
      </view>

      <!-- 多图上传 & 封面设定 -->
      <view class="image-grid">
        <view 
          class="img-item" 
          v-for="(img, idx) in images" 
          :key="idx"
          @click="setCover(idx)"
        >
          <image :src="img" mode="aspectFill" />
          <view class="cover-badge" v-if="coverIndex === idx">封面</view>
          <view class="del-icon" @click.stop="images.splice(idx, 1); if(coverIndex===idx)coverIndex=0">×</view>
        </view>
        <view class="img-item add-btn" @click="uploadImages" v-if="images.length < 9">
          <text class="plus">+</text>
        </view>
      </view>

      <!-- 功能列表 -->
      <view class="action-list">
        <view class="action-item" @click="chooseLocation">
          <view class="left">
            <text class="icon">📍</text>
            <text class="label" :class="{ 'has-val': location }">{{ location ? location.name : '添加地点' }}</text>
            <text class="sub-label" v-if="!location">(选择对应地点吧)</text>
          </view>
          <text class="arrow">›</text>
        </view>

        <view class="action-item" @click="goTopicSelect">
          <view class="left">
            <text class="icon">#</text>
            <text class="label">参与话题</text>
            <text class="sub-label" v-if="selectedTopics.length === 0">(带话题会获得更多的赞哦～)</text>
          </view>
          <text class="arrow">›</text>
        </view>

        <!-- 已选话题标签 -->
        <view class="topic-tags" v-if="selectedTopics.length > 0">
          <view class="t-tag" v-for="(t, i) in selectedTopics" :key="i">
            <text># {{ t }}</text>
            <text class="t-del" @click.stop="removeTopic(i)">×</text>
          </view>
        </view>

        <view class="action-item">
          <view class="left">
            <text class="icon">ⓘ</text>
            <text class="label">内容类型声明</text>
          </view>
          <text class="arrow">›</text>
        </view>
      </view>
    </scroll-view>

    <!-- 底部固定的按钮 -->
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

/* 导航栏 */
.custom-nav {
  position: fixed; top: 0; left: 0; width: 100%; background: #fff; z-index: 100;
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

/* 输入区 */
.input-group {
  padding: 32rpx;
  .title-input { font-size: 36rpx; font-weight: 600; height: 100rpx; border-bottom: 1rpx solid #f1f5f9; }
}
.content-group {
  padding: 0 32rpx; position: relative;
  .content-input { width: 100%; height: 360rpx; font-size: 30rpx; line-height: 1.6; }
  
  .topic-suggest {
    position: absolute; left: 32rpx; right: 32rpx; top: 100rpx; background: #fff;
    box-shadow: 0 10rpx 30rpx rgba(0,0,0,0.1); border-radius: 12rpx; z-index: 10;
    max-height: 400rpx; overflow-y: auto;
    .suggest-item {
      display: flex; align-items: center; padding: 24rpx; border-bottom: 1rpx solid #f1f5f9;
      .s-icon { color: #0ea5e9; font-weight: bold; margin-right: 16rpx; }
      .s-name { flex: 1; font-size: 28rpx; color: #334155; }
      .s-count { font-size: 22rpx; color: #94a3b8; }
      &.create { color: #0ea5e9; .s-name { font-weight: 600; } }
    }
  }

  .limit-info {
    display: flex; justify-content: flex-end; align-items: center; gap: 20rpx; margin-top: 20rpx;
    font-size: 24rpx; color: #cbd5e1;
    .tag-name { color: #94a3b8; display: flex; align-items: center; gap: 6rpx; }
    .info-icon { font-size: 26rpx; }
  }
}

/* 图片网格 */
.image-grid {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 16rpx; padding: 32rpx;
  .img-item {
    width: 100%; padding-top: 100%; position: relative; border-radius: 8rpx; overflow: hidden;
    image { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
    .cover-badge {
      position: absolute; left: 0; bottom: 0; width: 100%; background: rgba(14, 165, 233, 0.9);
      color: #fff; font-size: 20rpx; text-align: center; padding: 4rpx 0;
    }
    .del-icon {
      position: absolute; top: 0; right: 0; background: rgba(0,0,0,0.5); color: #fff;
      width: 36rpx; height: 36rpx; text-align: center; line-height: 32rpx; font-size: 30rpx;
    }
  }
  .add-btn {
    background: #f8fafc; border: 2rpx dashed #e2e8f0;
    display: flex; align-items: center; justify-content: center;
    .plus { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 50rpx; color: #cbd5e1; }
  }
}

/* 功能列表 */
.action-list {
  padding: 0 32rpx; border-top: 1rpx solid #f8fafc;
  .action-item {
    display: flex; align-items: center; justify-content: space-between; height: 100rpx;
    border-bottom: 1rpx solid #f8fafc;
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

.topic-tags {
  display: flex; flex-wrap: wrap; gap: 16rpx; padding: 20rpx 0;
  .t-tag {
    background: #0ea5e9; color: #fff; padding: 8rpx 20rpx; border-radius: 8rpx;
    font-size: 24rpx; display: flex; align-items: center; gap: 10rpx;
    .t-del { font-size: 30rpx; margin-left: 6rpx; }
  }
}

/* 底部按钮 */
.bottom-bar {
  position: fixed; bottom: 0; left: 0; width: 100%; background: #fff;
  padding: 24rpx 32rpx calc(24rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid #f1f5f9; display: flex; gap: 24rpx; z-index: 100;
  .draft-btn {
    flex: 1; height: 90rpx; line-height: 90rpx; background: #f1f5f9; color: #64748b;
    border-radius: 45rpx; font-weight: 600; font-size: 30rpx; &::after { border: none; }
  }
  .publish-btn {
    flex: 2; height: 90rpx; line-height: 90rpx; background: #0ea5e9; color: #fff;
    border-radius: 45rpx; font-weight: 600; font-size: 30rpx; &::after { border: none; }
  }
}

.ph-style { color: #cbd5e1; font-weight: 400; }
</style>
