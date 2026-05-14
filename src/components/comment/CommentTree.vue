<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  comment: any
  isRoot?: boolean
}>()

const emit = defineEmits<{
  (e: 'reply', comment: any, rootParentId: number): void
  (e: 'like', comment: any): void
}>()

const isExpanded = ref(false)

// 默认显示前几条
const displayCount = 2

const dfsList = computed(() => {
  if (!props.isRoot || !props.comment.children || props.comment.children.length === 0) return []
  
  const childrenMap = new Map<number, any[]>()
  props.comment.children.forEach((child: any) => {
    // 找到它直接回复的那个评论。如果是回复根评论，或者为空，则挂载到根节点下面
    const parentId = (child.replyToId && child.replyToId !== props.comment.id) ? child.replyToId : props.comment.id
    if (!childrenMap.has(parentId)) childrenMap.set(parentId, [])
    childrenMap.get(parentId)!.push(child)
  })

  const result: any[] = []
  
  function dfs(nodeId: number, depth: number) {
    const directChildren = childrenMap.get(nodeId) || []
    directChildren.forEach(child => {
      result.push({ ...child, depth })
      dfs(child.id, depth + 1)
    })
  }

  dfs(props.comment.id, 1)
  return result
})

function handleReply(targetComment: any) {
  // 如果是根节点，那么 rootParentId 就是它的 id
  // 如果是子节点，我们希望它的回复仍然挂在它所在的根节点下
  // 但为了简化，通过事件层层向上传递，并在顶层拦截
  emit('reply', targetComment, props.isRoot ? props.comment.id : props.comment.parentId)
}

function handleLike(targetComment: any) {
  emit('like', targetComment)
}
</script>

<template>
  <view class="comment-node" :class="{ 'is-child': !isRoot }" @click.stop="handleReply(comment)">
    <image class="avatar" :src="comment.avatar || 'https://api.dicebear.com/7.x/adventurer/svg?seed=' + comment.id" mode="aspectFill" />
    
    <view class="content-area">
      <view class="header">
        <text class="nickname">{{ comment.nickname || '神秘旅人' }}</text>
        <!-- B站风格点赞 -->
        <view class="like-btn" @click.stop="handleLike(comment)">
          <text class="like-icon">🤍</text>
          <text class="like-num" v-if="comment.likeCount">{{ comment.likeCount }}</text>
        </view>
      </view>
      
      <view class="text-content">
        <!-- 如果是子评论且回复了某人，展示 回复 @xxx -->
        <text v-if="!isRoot && comment.replyToUserId && comment.replyToId !== comment.parentId" class="reply-to">
          回复 <text class="highlight">@{{ comment.replyToNickname || '神秘旅人' }}</text> : 
        </text>
        {{ comment.content }}
      </view>
      
      <view class="footer">
        <text class="time">{{ comment.createTime?.split(' ')[0] || '刚刚' }}</text>
        <text class="reply-action" @click.stop="handleReply(comment)">回复</text>
      </view>

      <!-- 子评论区域 -->
      <view class="children-box" v-if="isRoot && dfsList.length > 0">
        <block v-for="(child, index) in dfsList" :key="child.id">
          <view v-if="index < displayCount || isExpanded" class="comment-node is-child" :style="{ marginLeft: ((child.depth - 1) * 40) + 'rpx' }" @click.stop="handleReply(child)">
            <image class="avatar" :src="child.avatar || 'https://api.dicebear.com/7.x/adventurer/svg?seed=' + child.id" mode="aspectFill" />
            <view class="content-area">
              <view class="header">
                <text class="nickname">{{ child.nickname || '神秘旅人' }}</text>
                <view class="like-btn" @click.stop="handleLike(child)">
                  <text class="like-icon">🤍</text>
                  <text class="like-num" v-if="child.likeCount">{{ child.likeCount }}</text>
                </view>
              </view>
              <view class="text-content">
                <text v-if="child.replyToUserId && child.replyToId !== child.parentId" class="reply-to">
                  回复 <text class="highlight">@{{ child.replyToNickname || '神秘旅人' }}</text> : 
                </text>
                {{ child.content }}
              </view>
              <view class="footer">
                <text class="time">{{ child.createTime?.split(' ')[0] || '刚刚' }}</text>
                <text class="reply-action" @click.stop="handleReply(child)">回复</text>
              </view>
            </view>
          </view>
        </block>
        
        <!-- 展开按钮 -->
        <view class="expand-btn" v-if="!isExpanded && dfsList.length > displayCount" @click.stop="isExpanded = true">
          <text>展开 {{ dfsList.length - displayCount }} 条回复 ∨</text>
        </view>
        <view class="expand-btn" v-if="isExpanded && dfsList.length > displayCount" @click.stop="isExpanded = false">
          <text>收起 ∧</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.comment-node {
  display: flex;
  margin-bottom: 32rpx;
  &.is-child {
    margin-bottom: 24rpx;
    .avatar { width: 48rpx; height: 48rpx; margin-right: 16rpx; }
    .nickname { font-size: 26rpx; }
    .text-content { font-size: 28rpx; }
  }
}

.avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  margin-right: 24rpx;
  background: #f1f5f9;
  flex-shrink: 0;
}

.content-area {
  flex: 1;
  min-width: 0;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8rpx;
}

.nickname {
  font-size: 28rpx;
  font-weight: 600;
  color: #475569;
}

.like-btn {
  display: flex;
  align-items: center;
  gap: 6rpx;
  color: #94a3b8;
  font-size: 24rpx;
}
.like-icon { font-size: 28rpx; }

.text-content {
  font-size: 30rpx;
  color: #1e293b;
  line-height: 1.5;
  margin-bottom: 16rpx;
  word-break: break-all;
}

.reply-to {
  color: #64748b;
  .highlight { color: var(--primary); }
}

.footer {
  display: flex;
  align-items: center;
  gap: 24rpx;
  font-size: 24rpx;
  color: #94a3b8;
}

.reply-action {
  font-weight: 500;
  &:active { color: var(--primary); }
}

.children-box {
  margin-top: 24rpx;
  background: #f8fafc;
  border-radius: 12rpx;
  padding: 24rpx;
}

.expand-btn {
  font-size: 24rpx;
  color: var(--primary);
  font-weight: 500;
  padding-top: 8rpx;
  display: inline-block;
  &:active { opacity: 0.7; }
}
</style>
