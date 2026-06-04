<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad, onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app'
import { noteApi } from '../../api/note'
import { historyApi } from '../../api/history'
import { strategyApi } from '../../api/strategy'
import { useUserStore } from '../../stores/user'
import NavBar from '../../components/common/NavBar.vue'
import CommentTree from '../../components/comment/CommentTree.vue'
import type { CommentVO } from '../../api/strategy'

const userStore = useUserStore()
const note = ref<any>(null)
const images = ref<string[]>([])
const interactionStatus = ref({ hasLiked: false, hasCollected: false })
const comments = ref<CommentVO[]>([])
const sortType = ref<'latest' | 'hot'>('latest')

const isTyping = ref(false)
const isInputFocused = ref(false)
const commentContent = ref('')
const replyingTo = ref<CommentVO | null>(null)
const replyRootId = ref<number | null>(null)

const guideData = ref<any>(null)
const travelData = ref<any>(null)

const navTitle = computed(() => {
  if (!note.value) return '详情'
  if (note.value.type === 'guide') return '攻略详情'
  if (note.value.type === 'travel') return '游记详情'
  return '笔记详情'
})

function previewImage(urls: string[], current: string) {
  uni.previewImage({
    urls,
    current
  })
}

onLoad((options: any) => {
  if (options && options.id) {
    loadDetail(options.id)
    loadInteractionStatus(options.id)
    loadComments(options.id)
  }
})

async function loadDetail(id: string) {
  try {
    const res = await noteApi.getDetail(id)
    note.value = res
    if (res.images) {
      images.value = JSON.parse(res.images)
    } else if (res.coverUrl) {
      images.value = [res.coverUrl]
    }
    
    // 解析 extraData 结构化数据
    if (res.extraData) {
      try {
        const extra = typeof res.extraData === 'string' ? JSON.parse(res.extraData) : res.extraData
        if (res.type === 'guide') {
          guideData.value = extra
        } else if (res.type === 'travel') {
          travelData.value = extra
        }
      } catch (e) {
        console.error('Failed to parse extraData:', e)
      }
    }
    
    // 记录浏览历史
    if (userStore.userInfo?.id && note.value) {
      historyApi.add({
        userId: userStore.userInfo.id,
        targetType: 4,
        targetId: note.value.id,
        title: note.value.title,
        coverUrl: images.value.length > 0 ? images.value[0] : ''
      }).catch(e => console.error(e))
    }
  } catch (e) {
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
}

async function loadInteractionStatus(id: any) {
  try {
    interactionStatus.value = await noteApi.getInteractionStatus(id)
  } catch (e) {}
}

async function loadComments(id: any) {
  try {
    comments.value = await noteApi.getComments(id, sortType.value)
  } catch (e) {}
}

async function handleLike() {
  if (!userStore.requireLogin()) return
  try {
    const isLiked = await noteApi.toggleLike(note.value.id)
    interactionStatus.value.hasLiked = isLiked
    note.value.likeCount = (note.value.likeCount || 0) + (isLiked ? 1 : -1)
  } catch (e) {}
}

async function handleCollect() {
  if (!userStore.requireLogin()) return
  try {
    const isCollected = await noteApi.toggleCollect(note.value.id)
    interactionStatus.value.hasCollected = isCollected
    uni.showToast({ title: isCollected ? '已收藏' : '已取消收藏', icon: 'none' })
  } catch (e) {}
}

function handleCommentClick(replyTarget?: CommentVO) {
  if (!userStore.requireLogin()) return
  replyingTo.value = replyTarget || null
  replyRootId.value = replyTarget ? replyTarget.id : 0
  isTyping.value = true
  setTimeout(() => {
    isInputFocused.value = true
  }, 100)
}

function handleCommentReply(target: CommentVO, rootId: number) {
  replyingTo.value = target
  replyRootId.value = rootId || target.id
  isTyping.value = true
  setTimeout(() => {
    isInputFocused.value = true
  }, 100)
}

async function submitComment() {
  if (!commentContent.value.trim()) return
  try {
    uni.showLoading({ title: '发送中' })
    
    // 物理对接后端发表评论，带上 replyToId 与 parentId
    await noteApi.addComment(note.value.id, {
      content: commentContent.value,
      parentId: replyRootId.value || 0,
      replyToId: replyingTo.value?.id
    })
    
    // 刷新最新后台评论树
    loadComments(note.value.id)
    
    note.value.commentCount = (note.value.commentCount || 0) + 1
    commentContent.value = ''
    isTyping.value = false
    replyingTo.value = null
    replyRootId.value = null
    
    uni.hideLoading()
    uni.showToast({ title: '评论成功', icon: 'success' })
  } catch (e) {
    uni.hideLoading()
  }
}

async function handleDelete() {
  uni.showModal({
    title: '提示',
    content: '确定要删除这篇笔记吗？删除后不可恢复',
    confirmColor: '#ef4444',
    success: async (res) => {
      if (res.confirm) {
        try {
          uni.showLoading({ title: '删除中' })
          await noteApi.deleteNote(note.value.id)
          uni.hideLoading()
          uni.showToast({ title: '已删除' })
          setTimeout(() => {
            uni.navigateBack()
          }, 1500)
        } catch (e) {
          uni.hideLoading()
        }
      }
    }
  })
}

async function handleCommentLike(comment: CommentVO) {
  if (!userStore.requireLogin()) return
  try {
    const isLiked = await noteApi.toggleCommentLike(comment.id)
    comment.hasLiked = isLiked
    comment.likeCount = (comment.likeCount || 0) + (isLiked ? 1 : -1)
  } catch (e) {}
}

// 支持删除自己发表的评论，真实交互打通！
function handleCommentDelete(comment: CommentVO) {
  if (!userStore.requireLogin()) return
  if (comment.userId !== userStore.userInfo?.id) {
    uni.showToast({ title: '只能删除自己的评论', icon: 'none' })
    return
  }
  
  uni.showActionSheet({
    itemList: ['删除我的评论'],
    itemColor: '#ef4444',
    success: async (res) => {
      if (res.tapIndex === 0) {
        try {
          uni.showLoading({ title: '删除中' })
          await strategyApi.deleteComment(comment.id)
          uni.hideLoading()
          uni.showToast({ title: '已删除', icon: 'success' })
          loadComments(note.value.id)
          note.value.commentCount = Math.max(0, (note.value.commentCount || 0) - 1)
        } catch (e) {
          uni.hideLoading()
        }
      }
    }
  })
}

function onBlurInput() {
  setTimeout(() => {
    isTyping.value = false
    isInputFocused.value = false
  }, 200)
}

// 分享功能
onShareAppMessage(() => {
  return {
    title: note.value?.title || '分享一篇超棒的笔记',
    path: `/pages/note/detail?id=${note.value?.id}`,
    imageUrl: images.value[0] || ''
  }
})

onShareTimeline(() => {
  return {
    title: note.value?.title || '分享一篇超棒的笔记',
    query: `id=${note.value?.id}`,
    imageUrl: images.value[0] || ''
  }
})
</script>

<template>
  <view class="note-detail" v-if="note">
    <!-- 顶部导航栏：始终白色背景确保返回按钮可见 -->
    <NavBar back fixed :title="navTitle" textColor="#333" background="#fff" />
    
    <scroll-view class="detail-scroll" scroll-y>
      <!-- 顶部大图轮播 -->
      <swiper class="banner-swiper" indicator-dots circular autoplay indicator-active-color="#0ea5e9" v-if="images && images.length > 0">
        <swiper-item v-for="(img, idx) in images" :key="idx">
          <image :src="img" mode="aspectFill" class="banner-img" @click="previewImage(images, img)" />
        </swiper-item>
      </swiper>

      <!-- 1. 普通笔记视图 -->
      <view class="content-card" v-if="note.type === 'note' || !note.type">
        <view class="header">
          <text class="title">{{ note.title }}</text>
          <view class="meta">
            <text class="time">{{ note.createTime }}</text>
            <view class="location" v-if="note.locationName">
              <text class="icon">📍</text>
              <text>{{ note.locationName }}</text>
            </view>
          </view>
        </view>

        <view class="body">
          <text class="text-content">{{ note.content }}</text>
        </view>

        <view class="tags-row" v-if="note.topicTags">
          <view class="tag" v-for="tag in note.topicTags.split(',')" :key="tag">
            # {{ tag }}
          </view>
        </view>
      </view>

      <!-- 2. 攻略视图 -->
      <view class="guide-detail-card" v-else-if="note.type === 'guide' && guideData">
        <view class="header">
          <text class="title">{{ note.title }}</text>
          <view class="meta">
            <text class="time">{{ note.createTime }}</text>
            <view class="location" v-if="note.locationName">
              <text class="icon">📍</text>
              <text>{{ note.locationName }}</text>
            </view>
          </view>
        </view>

        <!-- 攻略核心指标小胶囊 -->
        <view class="quick-facts">
          <view class="fact-capsule blue" v-if="note.days">
            <text class="f-icon">⏱️</text>
            <text class="f-text">建议游玩: </text>
            <text class="f-val">{{ note.days }}天</text>
          </view>
          <view class="fact-capsule gold" v-if="note.cost">
            <text class="f-icon">💰</text>
            <text class="f-text">人均预算: </text>
            <text class="f-val">￥{{ note.cost }}</text>
          </view>
          <view class="fact-capsule green" v-if="note.season">
            <text class="f-icon">🌸</text>
            <text class="f-text">最佳出游: </text>
            <text class="f-val">{{ note.season }}</text>
          </view>
        </view>

        <!-- 概况与基本信息 -->
        <view class="detail-section">
          <view class="section-title">
            <text class="s-num">1</text>
            <text class="s-name">概况与基本信息</text>
          </view>
          <view class="section-body">
            <text class="rich-text">{{ note.content }}</text>
          </view>
        </view>

        <!-- 交通与实用信息 -->
        <view class="detail-section" v-if="guideData.traffic || (guideData.practicalInfo && (guideData.practicalInfo.attention || guideData.practicalInfo.complaintPhone || guideData.practicalInfo.medicalService || guideData.practicalInfo.localWebsite))">
          <view class="section-title">
            <text class="s-num">2</text>
            <text class="s-name">交通与实用信息</text>
          </view>
          <view class="section-body">
            <view class="sub-block" v-if="guideData.traffic">
              <view class="sub-title">📍 交通指南</view>
              <text class="sub-content">{{ guideData.traffic }}</text>
            </view>
            <view class="sub-block" v-if="guideData.practicalInfo && guideData.practicalInfo.attention">
              <view class="sub-title">⚠️ 注意事项</view>
              <text class="sub-content">{{ guideData.practicalInfo.attention }}</text>
            </view>
            
            <!-- 电话网址附加卡片 -->
            <view class="info-grid" v-if="guideData.practicalInfo && (guideData.practicalInfo.complaintPhone || guideData.practicalInfo.medicalService || guideData.practicalInfo.localWebsite)">
              <view class="info-item" v-if="guideData.practicalInfo.complaintPhone">
                <text class="i-label">📞 投诉电话</text>
                <text class="i-value">{{ guideData.practicalInfo.complaintPhone }}</text>
              </view>
              <view class="info-item" v-if="guideData.practicalInfo.medicalService">
                <text class="i-label">🏥 医疗服务</text>
                <text class="i-value">{{ guideData.practicalInfo.medicalService }}</text>
              </view>
              <view class="info-item" v-if="guideData.practicalInfo.localWebsite">
                <text class="i-label">🌐 官方网站</text>
                <text class="i-value">{{ guideData.practicalInfo.localWebsite }}</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 路线与打卡推荐 -->
        <view class="detail-section" v-if="guideData.routes || guideData.accommodation || guideData.food || guideData.shopping">
          <view class="section-title">
            <text class="s-num">3</text>
            <text class="s-name">路线与打卡推荐</text>
          </view>
          <view class="section-body">
            <view class="sub-block" v-if="guideData.routes">
              <view class="sub-title">🗺️ 推荐路线</view>
              <text class="sub-content">{{ guideData.routes }}</text>
            </view>
            <view class="sub-block" v-if="guideData.accommodation">
              <view class="sub-title">🏨 住宿指南</view>
              <text class="sub-content">{{ guideData.accommodation }}</text>
            </view>
            <view class="sub-block" v-if="guideData.food">
              <view class="sub-title">🍜 特色美食</view>
              <text class="sub-content">{{ guideData.food }}</text>
            </view>
            <view class="sub-block" v-if="guideData.shopping">
              <view class="sub-title">🎁 特产选购</view>
              <text class="sub-content">{{ guideData.shopping }}</text>
            </view>
          </view>
        </view>

        <!-- 其他建议 -->
        <view class="detail-section" v-if="guideData.others && (guideData.others.budget || guideData.others.clothing)">
          <view class="section-title">
            <text class="s-num">4</text>
            <text class="s-name">其他建议</text>
          </view>
          <view class="section-body">
            <view class="sub-block" v-if="guideData.others.budget">
              <view class="sub-title">💵 预算分配</view>
              <text class="sub-content">{{ guideData.others.budget }}</text>
            </view>
            <view class="sub-block" v-if="guideData.others.clothing">
              <view class="sub-title">🧥 穿衣出行</view>
              <text class="sub-content">{{ guideData.others.clothing }}</text>
            </view>
          </view>
        </view>

        <view class="tags-row" v-if="note.topicTags">
          <view class="tag" v-for="tag in note.topicTags.split(',')" :key="tag">
            # {{ tag }}
          </view>
        </view>
      </view>

      <!-- 3. 游记视图 -->
      <view class="travel-detail-card" v-else-if="note.type === 'travel' && travelData">
        <view class="header">
          <text class="title">{{ note.title }}</text>
          <view class="meta">
            <text class="time">{{ note.createTime }}</text>
            <view class="location" v-if="note.locationName">
              <text class="icon">📍</text>
              <text>{{ note.locationName }}</text>
            </view>
          </view>
        </view>

        <!-- 出行信息卡片 -->
        <view class="travel-info-card">
          <view class="info-col" v-if="travelData.destination">
            <text class="col-label">🗺️ 目的地</text>
            <text class="col-val">{{ travelData.destination }}</text>
          </view>
          <view class="info-col" v-if="note.tripDate">
            <text class="col-label">📅 出发日期</text>
            <text class="col-val">{{ note.tripDate }}</text>
          </view>
          <view class="info-col" v-if="note.days">
            <text class="col-label">⏱️ 游玩天数</text>
            <text class="col-val">{{ note.days }}天</text>
          </view>
          <view class="info-col" v-if="note.companions">
            <text class="col-label">👥 同行伙伴</text>
            <text class="col-val">{{ note.companions }}</text>
          </view>
        </view>

        <!-- 每日足迹时间轴 (Timeline) -->
        <view class="timeline-container" v-if="travelData.daysList && travelData.daysList.length > 0">
          <view class="timeline-item" v-for="(day, idx) in travelData.daysList" :key="idx">
            <!-- 左侧时间轴节点 -->
            <view class="timeline-node">
              <view class="node-badge">D{{ day.dayIndex }}</view>
              <view class="node-line" v-if="idx < travelData.daysList.length - 1"></view>
            </view>
            
            <!-- 右侧本日记录卡片 -->
            <view class="timeline-content">
              <view class="day-header">
                <text class="day-theme">{{ day.title }}</text>
                <view class="weather-mood-tag" v-if="day.moodWeather">
                  <text class="tag-text">{{ day.moodWeather }}</text>
                </view>
              </view>
              
              <text class="day-body">{{ day.content }}</text>
              
              <!-- 本日精彩美照 (3列Grid) -->
              <view class="day-photos" v-if="day.images && day.images.length > 0">
                <image 
                  v-for="(pImg, pIdx) in day.images" 
                  :key="pIdx" 
                  :src="pImg" 
                  mode="aspectFill" 
                  class="day-photo"
                  @click="previewImage(day.images, pImg)" 
                />
              </view>
            </view>
          </view>
        </view>

        <!-- 总结与心得 -->
        <view class="detail-section travel-summary-section" v-if="travelData.costSummary || travelData.tips || travelData.summary">
          <view class="section-title">
            <text class="s-icon">📝</text>
            <text class="s-name">总结与心得</text>
          </view>
          <view class="section-body">
            <view class="sub-block" v-if="travelData.costSummary">
              <view class="sub-title">💰 整体开销细账</view>
              <text class="sub-content">{{ travelData.costSummary }}</text>
            </view>
            <view class="sub-block" v-if="travelData.tips">
              <view class="sub-title">💡 避坑Tips</view>
              <text class="sub-content">{{ travelData.tips }}</text>
            </view>
            <view class="sub-block" v-if="travelData.summary">
              <view class="sub-title">✨ 出行感悟</view>
              <text class="sub-content">{{ travelData.summary }}</text>
            </view>
          </view>
        </view>

        <view class="tags-row" v-if="note.topicTags">
          <view class="tag" v-for="tag in note.topicTags.split(',')" :key="tag">
            # {{ tag }}
          </view>
        </view>
      </view>

      <!-- 评论区 (公共部分) -->
      <view class="content-card comment-section-card">
        <view class="comments-section">
          <view class="s-title">共 {{ note.commentCount || 0 }} 条评论</view>
          <view class="comment-list" v-if="comments.length > 0">
            <CommentTree 
              v-for="item in comments" 
              :key="item.id" 
              :comment="item" 
              :is-root="true"
              @reply="handleCommentReply"
              @like="handleCommentLike"
              @delete="handleCommentDelete"
            />
          </view>
          <view class="empty-comment" v-else>
            暂无评论，快来评论互动吧~
          </view>
        </view>
      </view>
      
      <view class="placeholder-footer"></view>
    </scroll-view>
    
    <!-- 底部操作栏 -->
    <view class="bottom-bar">
      <!-- 灰色说点什么静态触发框，显示智能回复人占位符 -->
      <view class="input-trigger" @click="handleCommentClick()">
        <text class="p-text">{{ replyingTo ? `回复 @${replyingTo.nickname}...` : '说点什么...' }}</text>
      </view>
      
      <view class="actions" v-if="!isTyping && !commentContent">
        <view class="action-item" @click="handleLike">
          <text class="icon" :class="{ active: interactionStatus.hasLiked }">{{ interactionStatus.hasLiked ? '❤️' : '🤍' }}</text>
          <text class="count">{{ note.likeCount || 0 }}</text>
        </view>
        <view class="action-item" @click="handleCollect">
          <text class="icon" :class="{ active: interactionStatus.hasCollected }">{{ interactionStatus.hasCollected ? '★' : '☆' }}</text>
          <text class="count">{{ interactionStatus.hasCollected ? '已收藏' : '收藏' }}</text>
        </view>
        <button class="share-btn" open-type="share">
          <text class="icon">🚀</text>
          <text class="count">分享</text>
        </button>
        <view class="action-item" v-if="note.userId === userStore.userInfo?.id" @click="handleDelete">
          <text class="icon" style="color: #ef4444;">🗑️</text>
          <text class="count" style="color: #ef4444;">删除</text>
        </view>
      </view>

      <view class="typing-bar" v-else>
        <input 
          class="t-input" 
          v-model="commentContent" 
          :focus="isInputFocused" 
          :placeholder="replyingTo ? `回复 @${replyingTo.nickname}...` : '发表评论...'"
          @blur="onBlurInput"
          cursor-spacing="20"
        />
        <button class="send-btn" @click.stop="submitComment">发送</button>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.note-detail {
  height: 100vh;
  background: #fff;
  display: flex;
  flex-direction: column;
}

.detail-scroll {
  flex: 1;
  height: 0;
}

.banner-swiper {
  width: 100%; height: 750rpx;
}
.banner-img {
  width: 100%; height: 100%;
}

.content-card {
  padding: 40rpx 32rpx;
  background: #fff;
}

.header {
  margin-bottom: 30rpx;
  .title { font-size: 40rpx; font-weight: bold; color: #1e293b; line-height: 1.4; display: block; margin-bottom: 20rpx; }
  .meta { display: flex; justify-content: space-between; align-items: center; font-size: 24rpx; color: #94a3b8; }
  .location { display: flex; align-items: center; color: #00bac7; font-weight: bold; .icon { margin-right: 6rpx; } }
}

.body {
  .text-content { font-size: 30rpx; color: #334155; line-height: 1.8; white-space: pre-wrap; }
}

.tags-row {
  display: flex; flex-wrap: wrap; gap: 16rpx; margin-top: 40rpx;
  .tag { background: #f1f5f9; color: #00bac7; padding: 10rpx 24rpx; border-radius: 30rpx; font-size: 24rpx; font-weight: bold; }
}

/* 评论区 */
.comments-section {
  margin-top: 20rpx;
  border-top: 1rpx solid #f1f5f9;
  padding-top: 40rpx;
  .s-title { font-size: 30rpx; font-weight: 700; color: #1e293b; margin-bottom: 30rpx; }
  .empty-comment { padding: 60rpx 0; text-align: center; font-size: 26rpx; color: #94a3b8; }
}

.placeholder-footer { height: 140rpx; }

/* 底部操作栏 */
.bottom-bar {
  position: fixed; bottom: 0; left: 0; width: 100%;
  background: #fff; border-top: 1rpx solid #f8fafc;
  padding: 20rpx 32rpx calc(20rpx + env(safe-area-inset-bottom));
  display: flex; align-items: center; gap: 24rpx;
  box-shadow: 0 -4rpx 20rpx rgba(0,0,0,0.05);
  z-index: 100;
}

.input-trigger {
  flex: 1; height: 72rpx; background: #f1f5f9; border-radius: 36rpx;
  display: flex; align-items: center; padding: 0 30rpx;
  .p-text { font-size: 26rpx; color: #94a3b8; font-weight: 600; }
}

.actions {
  display: flex; gap: 40rpx;
  .action-item, .share-btn {
    display: flex; flex-direction: column; align-items: center; gap: 4rpx;
    background: none; padding: 0; margin: 0; line-height: 1.2; &::after { border: none; }
    .icon { font-size: 36rpx; color: #94a3b8; &.active { color: #ef4444; } }
    .count { font-size: 20rpx; color: #64748b; font-weight: 700; }
  }
}

.typing-bar {
  flex: 1; display: flex; align-items: center; gap: 20rpx;
  .t-input { flex: 1; height: 72rpx; background: #f1f5f9; border-radius: 36rpx; padding: 0 30rpx; font-size: 28rpx; font-weight: 600; }
  .send-btn {
    width: 120rpx; height: 64rpx; line-height: 64rpx; background: #00bac7; color: #fff;
    font-size: 26rpx; border-radius: 32rpx; margin: 0; font-weight: bold; &::after { border: none; }
  }
}

/* 攻略详情卡片样式 */
.guide-detail-card {
  padding: 40rpx 32rpx;
  background: #fff;
  
  .header {
    margin-bottom: 30rpx;
    .title { font-size: 40rpx; font-weight: bold; color: #1e293b; line-height: 1.4; display: block; margin-bottom: 20rpx; }
    .meta { display: flex; justify-content: space-between; align-items: center; font-size: 24rpx; color: #94a3b8; }
    .location { display: flex; align-items: center; color: #00bac7; font-weight: bold; .icon { margin-right: 6rpx; } }
  }
}

.quick-facts {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-bottom: 40rpx;
  
  .fact-capsule {
    display: flex;
    align-items: center;
    padding: 12rpx 24rpx;
    border-radius: 40rpx;
    font-size: 24rpx;
    font-weight: bold;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.03);
    
    .f-icon {
      margin-right: 8rpx;
      font-size: 28rpx;
    }
    
    .f-text {
      color: #64748b;
      margin-right: 4rpx;
    }
    
    &.blue {
      background: #f0f9ff;
      color: #0ea5e9;
      border: 1rpx solid #e0f2fe;
      .f-val { color: #0284c7; }
    }
    
    &.gold {
      background: #fefbeb;
      color: #ca8a04;
      border: 1rpx solid #fef3c7;
      .f-val { color: #b45309; }
    }
    
    &.green {
      background: #f0fdf4;
      color: #16a34a;
      border: 1rpx solid #dcfce7;
      .f-val { color: #15803d; }
    }
  }
}

.detail-section {
  background: #fff;
  border: 1rpx solid #f1f5f9;
  border-radius: 20rpx;
  padding: 30rpx 28rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.015);
  
  .section-title {
    display: flex;
    align-items: center;
    margin-bottom: 24rpx;
    
    .s-num {
      width: 44rpx;
      height: 44rpx;
      background: linear-gradient(135deg, #38bdf8, #0ea5e9);
      color: #fff;
      font-size: 24rpx;
      font-weight: bold;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 16rpx;
    }
    
    .s-icon {
      font-size: 32rpx;
      margin-right: 16rpx;
    }
    
    .s-name {
      font-size: 30rpx;
      font-weight: bold;
      color: #1e293b;
    }
  }
  
  .section-body {
    .rich-text {
      font-size: 28rpx;
      color: #334155;
      line-height: 1.8;
      white-space: pre-wrap;
    }
    
    .sub-block {
      margin-bottom: 24rpx;
      
      &:last-child {
        margin-bottom: 0;
      }
      
      .sub-title {
        font-size: 26rpx;
        font-weight: bold;
        color: #475569;
        margin-bottom: 8rpx;
      }
      
      .sub-content {
        font-size: 28rpx;
        color: #334155;
        line-height: 1.6;
        white-space: pre-wrap;
      }
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16rpx;
      margin-top: 24rpx;
      border-top: 1rpx solid #f1f5f9;
      padding-top: 24rpx;
      
      .info-item {
        background: #f8fafc;
        padding: 16rpx 20rpx;
        border-radius: 12rpx;
        
        .i-label {
          display: block;
          font-size: 22rpx;
          color: #64748b;
          font-weight: 500;
          margin-bottom: 6rpx;
        }
        
        .i-value {
          font-size: 26rpx;
          color: #1e293b;
          font-weight: bold;
          word-break: break-all;
        }
      }
    }
  }
}

/* 游记详情卡片样式 */
.travel-detail-card {
  padding: 40rpx 32rpx;
  background: #fff;
  
  .header {
    margin-bottom: 30rpx;
    .title { font-size: 40rpx; font-weight: bold; color: #1e293b; line-height: 1.4; display: block; margin-bottom: 20rpx; }
    .meta { display: flex; justify-content: space-between; align-items: center; font-size: 24rpx; color: #94a3b8; }
    .location { display: flex; align-items: center; color: #00bac7; font-weight: bold; .icon { margin-right: 6rpx; } }
  }
}

.travel-info-card {
  background: #f8fafc;
  border-radius: 24rpx;
  padding: 30rpx;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24rpx;
  margin-bottom: 40rpx;
  border: 1rpx solid #f1f5f9;
  
  .info-col {
    display: flex;
    flex-direction: column;
    
    .col-label {
      font-size: 22rpx;
      color: #64748b;
      margin-bottom: 8rpx;
      font-weight: 500;
    }
    
    .col-val {
      font-size: 28rpx;
      color: #1e293b;
      font-weight: bold;
    }
  }
}

/* 每日足迹时间轴 (Timeline) */
.timeline-container {
  padding: 10rpx 0;
  margin-bottom: 40rpx;
}

.timeline-item {
  display: flex;
  position: relative;
  margin-bottom: 40rpx;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.timeline-node {
  width: 90rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  
  .node-badge {
    width: 64rpx;
    height: 64rpx;
    background: linear-gradient(135deg, #0ea5e9, #0284c7);
    color: #fff;
    font-size: 24rpx;
    font-weight: bold;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4rpx 10rpx rgba(14, 165, 233, 0.2);
    z-index: 5;
  }
  
  .node-line {
    flex: 1;
    width: 4rpx;
    background: #e2e8f0;
    margin-top: 10rpx;
    margin-bottom: -30rpx;
    z-index: 1;
  }
}

.timeline-content {
  flex: 1;
  background: #fff;
  border: 1rpx solid #f1f5f9;
  border-radius: 20rpx;
  padding: 24rpx;
  margin-left: 10rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.01);
  
  .day-header {
    display: flex;
    flex-direction: column;
    gap: 8rpx;
    margin-bottom: 16rpx;
    
    .day-theme {
      font-size: 32rpx;
      font-weight: bold;
      color: #1e293b;
      line-height: 1.3;
    }
    
    .weather-mood-tag {
      align-self: flex-start;
      background: #f1f5f9;
      padding: 4rpx 16rpx;
      border-radius: 20rpx;
      
      .tag-text {
        font-size: 20rpx;
        color: #475569;
        font-weight: 500;
      }
    }
  }
  
  .day-body {
    font-size: 28rpx;
    color: #334155;
    line-height: 1.7;
    white-space: pre-wrap;
    display: block;
    margin-bottom: 20rpx;
  }
  
  .day-photos {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12rpx;
    
    .day-photo {
      width: 100%;
      height: 160rpx;
      border-radius: 12rpx;
      background: #f8fafc;
    }
  }
}

.travel-summary-section {
  border-left: 8rpx solid #0ea5e9;
  background: #f8fafc;
}

.comment-section-card {
  margin-top: 20rpx;
  padding: 0 32rpx;
}
</style>
