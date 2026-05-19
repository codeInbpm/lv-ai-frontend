<script setup lang="ts">
import { ref } from 'vue'
import { onLoad, onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app'
import { noteApi } from '../../api/note'
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
    <NavBar back fixed title="笔记详情" textColor="#333" background="#fff" />
    
    <scroll-view class="detail-scroll" scroll-y>
      <!-- 顶部大图轮播 -->
      <swiper class="banner-swiper" indicator-dots circular autoplay indicator-active-color="#0ea5e9">
        <swiper-item v-for="(img, idx) in images" :key="idx">
          <image :src="img" mode="aspectFill" class="banner-img" />
        </swiper-item>
      </swiper>

      <view class="content-card">
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

        <!-- 评论区 -->
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
  margin-top: 60rpx;
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
</style>
