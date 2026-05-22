<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import NavBar from '../../components/common/NavBar.vue'
import { strategyApi, type CommentVO } from '../../api/strategy'
import { historyApi } from '../../api/history'
import { useUserStore } from '../../stores/user'
import CommentTree from '../../components/comment/CommentTree.vue'

const userStore = useUserStore()
const detail = ref<any>(null)
const loading = ref(true)
const comments = ref<CommentVO[]>([])
const interactionStatus = ref({ hasLiked: false, hasCollected: false })

const isTyping = ref(false)
const isInputFocused = ref(false)
const commentContent = ref('')
const replyingTo = ref<CommentVO | null>(null)
const sortType = ref<'latest' | 'hot'>('latest')

onLoad((options: any) => {
  if (options.id) {
    fetchDetail(options.id)
    fetchInteractionStatus(options.id)
    fetchComments(options.id)
  }
})

async function fetchDetail(id: string) {
  try {
    loading.value = true
    const res = await strategyApi.getDetail(id)
    detail.value = res
    
    // 记录浏览历史
    if (userStore.userInfo?.id && detail.value) {
      historyApi.add({
        userId: userStore.userInfo.id,
        targetType: 3,
        targetId: detail.value.id,
        title: detail.value.title,
        coverUrl: detail.value.coverUrl || ''
      }).catch(e => console.error(e))
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function fetchInteractionStatus(id: string) {
  try {
    const res = await strategyApi.getInteractionStatus(id)
    interactionStatus.value = res
  } catch (e) {
    console.error(e)
  }
}

async function fetchComments(id: string) {
  try {
    const res = await strategyApi.getComments(id, sortType.value)
    comments.value = res || []
  } catch (e) {
    console.error(e)
  }
}

async function handleLike() {
  if (!userStore.requireLogin()) return
  if (!detail.value) return
  try {
    const isLiked = await strategyApi.toggleLike(detail.value.id)
    interactionStatus.value.hasLiked = isLiked
    detail.value.likeCount += isLiked ? 1 : -1
    uni.showToast({ title: isLiked ? '已点赞' : '已取消点赞', icon: 'none' })
  } catch (e) {}
}

async function handleCollect() {
  if (!userStore.requireLogin()) return
  if (!detail.value) return
  try {
    const isCollected = await strategyApi.toggleCollect(detail.value.id)
    interactionStatus.value.hasCollected = isCollected
    uni.showToast({ title: isCollected ? '已收藏' : '已取消收藏', icon: 'none' })
  } catch (e) {}
}

function handleCommentReply(replyTarget: CommentVO, rootParentId: number) {
  if (!userStore.requireLogin()) return
  
  replyingTo.value = replyTarget
  // The API uses `parentId` to build the tree, so parentId should be rootParentId
  // The API uses `replyToId` to know exactly who is being replied to
  // We temporarily store rootParentId on replyingTo, or we can use another ref
  replyRootId.value = rootParentId === 0 ? replyTarget.id : rootParentId
  
  isTyping.value = true
  setTimeout(() => {
    isInputFocused.value = true
  }, 100)
}

const replyRootId = ref<number | null>(null)

function handleCommentClick(replyTarget?: CommentVO) {
  if (!userStore.requireLogin()) return
  replyingTo.value = replyTarget || null
  replyRootId.value = replyTarget ? replyTarget.id : 0
  isTyping.value = true
  setTimeout(() => {
    isInputFocused.value = true
  }, 100)
}

function onBlurInput() {
  // Delay removing typing state so the click on "发送" can fire
  setTimeout(() => {
    isTyping.value = false
    isInputFocused.value = false
  }, 200)
}

async function submitComment() {
  if (!commentContent.value.trim()) {
    return uni.showToast({ title: '请输入评论内容', icon: 'none' })
  }
  try {
    uni.showLoading({ title: '发送中' })
    const res = await strategyApi.addComment(detail.value.id, {
      content: commentContent.value,
      parentId: replyRootId.value || 0,
      replyToId: replyingTo.value?.id
    })
    
    // Instead of unshift, we can just re-fetch the comments to get the correct tree structure
    fetchComments(detail.value.id)
    
    detail.value.commentCount++
    commentContent.value = ''
    isTyping.value = false
    replyingTo.value = null
    replyRootId.value = null
    uni.hideLoading()
    uni.showToast({ title: '评论成功', icon: 'none' })
  } catch (e) {
    uni.hideLoading()
  }
}

function changeSort(type: 'latest' | 'hot') {
  if (sortType.value === type) return
  sortType.value = type
  if (detail.value) {
    fetchComments(detail.value.id)
  }
}

async function handleCommentLike(comment: CommentVO) {
  if (!userStore.requireLogin()) return
  try {
    const isLiked = await strategyApi.toggleCommentLike(comment.id)
    comment.hasLiked = isLiked
    if (comment.likeCount === undefined) comment.likeCount = 0
    comment.likeCount += isLiked ? 1 : -1
  } catch (e) {
    console.error(e)
  }
}

function handleCommentDelete(comment: CommentVO) {
  if (!userStore.requireLogin()) return
  // Only allow deleting own comments
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
          if (detail.value) {
            detail.value.commentCount = Math.max(0, detail.value.commentCount - 1)
            fetchComments(detail.value.id)
          }
        } catch (e) {
          uni.hideLoading()
        }
      }
    }
  })
}
</script>

<template>
  <view class="detail-page">
    <NavBar fixed back title="攻略详情" />
    
    <view v-if="loading" class="loading-state">加载中...</view>
    
    <scroll-view v-else-if="detail" scroll-y class="content-scroll">
      <!-- 封面图 -->
      <image class="cover-img" :src="detail.coverUrl || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1000'" mode="aspectFill" />
      
      <view class="content-body">
        <text class="title">{{ detail.title }}</text>
        
        <view class="author-row">
          <view class="author-info">
            <image v-if="detail.authorAvatar" :src="detail.authorAvatar" class="avatar-ph" mode="aspectFill" />
            <view v-else class="avatar-ph">👤</view>
            <text class="author-name">{{ detail.authorName || (detail.source === 'internal' ? '旅行达人' : '网络热门') }}</text>
          </view>
          <view class="source-badge" :class="detail.source">{{ detail.source === 'internal' ? '站内推荐' : '外部精选' }}</view>
        </view>

        <view class="meta-row">
          <text class="meta-text">目的地: {{ detail.destination || '全国' }}</text>
          <text class="meta-text">天数: {{ detail.days }}天</text>
          <text class="meta-text">浏览: {{ detail.viewCount }}</text>
        </view>

        <!-- 正文 -->
        <view class="article-content">
          <!-- TODO: 如果是富文本可以考虑用 rich-text，这里保留换行 -->
          <text class="text">{{ detail.content }}</text>
        </view>

        <!-- 评论列表区 -->
        <view class="comments-section" id="comments">
          <view class="section-header">
            <text class="section-title">全部评论 ({{ detail.commentCount }})</text>
            <view class="sort-tabs" v-if="comments.length > 0">
              <text class="sort-tab" :class="{ active: sortType === 'latest' }" @click="changeSort('latest')">最新</text>
              <text class="sort-divider">|</text>
              <text class="sort-tab" :class="{ active: sortType === 'hot' }" @click="changeSort('hot')">最热</text>
            </view>
          </view>
          <view v-if="comments.length === 0" class="empty-comment">
            暂无评论，快来抢沙发吧~
          </view>
          <view v-else class="comment-list">
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
        </view>
      </view>
      
      <view style="height: 140rpx;"></view>
    </scroll-view>

    <!-- 底部操作栏 -->
    <view class="bottom-action" v-if="!loading && detail">
      <view class="input-box" @click="handleCommentClick()">
        <input 
          class="comment-input"
          v-model="commentContent"
          :placeholder="replyingTo ? `回复 @${replyingTo.nickname || '神秘旅人'}...` : '说点什么...'"
          :focus="isInputFocused"
          @focus="isTyping = true"
          @blur="onBlurInput"
          cursor-spacing="20"
        />
      </view>
      
      <!-- 未输入内容且未激活键盘时显示图标 -->
      <view class="action-icons" v-if="!isTyping && !commentContent">
        <view class="icon-item" @click="handleLike">
          <text :class="interactionStatus.hasLiked ? 'active-icon' : ''">{{ interactionStatus.hasLiked ? '❤️' : '🤍' }}</text>
          <text class="num" :class="{ active: interactionStatus.hasLiked }">{{ detail.likeCount || 0 }}</text>
        </view>
        <view class="icon-item" @click="handleCommentClick()">
          <text>💬</text>
          <text class="num">{{ detail.commentCount || 0 }}</text>
        </view>
        <view class="icon-item" @click="handleCollect">
          <text :class="interactionStatus.hasCollected ? 'active-icon' : ''">{{ interactionStatus.hasCollected ? '⭐' : '☆' }}</text>
          <text class="num" :class="{ active: interactionStatus.hasCollected }">{{ interactionStatus.hasCollected ? '已收藏' : '收藏' }}</text>
        </view>
      </view>

      <!-- 输入中时显示发送按钮 -->
      <view class="send-action" v-else>
        <button class="send-btn" :class="{ active: commentContent.trim() }" @click.stop="submitComment">发送</button>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.detail-page {
  min-height: 100vh;
  background: #fff;
  display: flex;
  flex-direction: column;
}
.content-scroll {
  flex: 1;
  height: 0;
}
.cover-img {
  width: 100%;
  height: 480rpx;
  background: #f1f5f9;
}
.content-body {
  padding: 32rpx;
}
.title {
  font-size: 38rpx;
  font-weight: 800;
  color: #1e293b;
  line-height: 1.5;
  margin-bottom: 32rpx;
  display: block;
}
.author-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32rpx;
}
.author-info {
  display: flex;
  align-items: center;
  gap: 16rpx;
}
.avatar-ph {
  width: 64rpx; height: 64rpx;
  background: #e2e8f0; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 32rpx;
}
.author-name {
  font-size: 28rpx; font-weight: 600; color: #334155;
}
.source-badge {
  font-size: 22rpx;
  padding: 6rpx 16rpx;
  border-radius: 100rpx;
  &.internal { background: #e0f2fe; color: #0284c7; }
  &.xiaohongshu { background: #fee2e2; color: #ef4444; }
  &.weibo { background: #fef08a; color: #ca8a04; }
}
.meta-row {
  display: flex;
  gap: 24rpx;
  margin-bottom: 40rpx;
  padding: 24rpx;
  background: #f8fafc;
  border-radius: 16rpx;
}
.meta-text {
  font-size: 26rpx;
  color: #64748b;
}
.article-content {
  font-size: 32rpx;
  color: #334155;
  line-height: 1.8;
  white-space: pre-wrap;
  margin-bottom: 60rpx;
}

.comments-section {
  border-top: 1rpx solid #f1f5f9;
  padding-top: 40rpx;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32rpx;
}
.section-title {
  font-size: 34rpx;
  font-weight: 700;
  color: #1e293b;
}
.sort-tabs {
  display: flex;
  align-items: center;
  gap: 16rpx;
}
.sort-tab {
  font-size: 26rpx;
  color: #94a3b8;
  &.active {
    color: #0f172a;
    font-weight: 500;
  }
}
.sort-divider {
  font-size: 20rpx;
  color: #cbd5e1;
}
.empty-comment {
  padding: 60rpx 0; text-align: center; color: #94a3b8; font-size: 26rpx;
}
.comment-list {
  display: flex; flex-direction: column;
}

.bottom-action {
  position: fixed;
  bottom: 0; left: 0; width: 100%;
  background: #fff;
  border-top: 1rpx solid #f8fafc;
  padding: 16rpx 32rpx calc(16rpx + env(safe-area-inset-bottom));
  display: flex;
  align-items: center;
  gap: 32rpx;
  box-shadow: 0 -4rpx 20rpx rgba(0,0,0,0.03);
  z-index: 100;
}
.input-box {
  flex: 1;
  background: #f1f5f9;
  height: 72rpx;
  border-radius: 36rpx;
  display: flex; align-items: center;
  padding: 0 32rpx;
}
.comment-input {
  width: 100%;
  font-size: 26rpx;
  color: #1e293b;
}

.action-icons {
  display: flex; gap: 40rpx;
}
.icon-item {
  display: flex; flex-direction: column; align-items: center; gap: 4rpx;
  font-size: 40rpx; color: #94a3b8;
}
.active-icon { transform: scale(1.1); transition: all 0.2s; }
.num { font-size: 20rpx; color: #64748b; }
.num.active { color: #ef4444; }

.send-action {
  display: flex; align-items: center;
}
.send-btn {
  margin: 0; padding: 0 32rpx; height: 60rpx; line-height: 60rpx;
  font-size: 26rpx; border-radius: 30rpx; background: #e2e8f0; color: #94a3b8;
  &::after { border: none; }
  &.active { background: var(--primary); color: #fff; }
}

.loading-state {
  text-align: center; padding: 100rpx; color: #94a3b8;
}
</style>
