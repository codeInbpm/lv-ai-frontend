<script setup lang="ts">
import { computed } from 'vue'
import { useNavBar } from '../../composables/useNavBar'

const props = withDefaults(defineProps<{
  title?: string
  back?: boolean
  transparent?: boolean
  fixed?: boolean
  /** 是否在导航栏下方插入占位块（默认：fixed+非透明时自动插入） */
  placeholder?: boolean
  backgroundColor?: string
  /** 支持渐变背景，例如 'linear-gradient(...)' */
  background?: string
  textColor?: string
  border?: boolean
}>(), {
  back: false,
  transparent: false,
  fixed: false,
  placeholder: undefined,
  backgroundColor: '#ffffff',
  textColor: '#000000',
  border: false
})

const emit = defineEmits<{
  (e: 'height', px: number): void
}>()

const { statusBarHeight, navBarHeight, totalHeight } = useNavBar()

// 通知父组件实际导航栏高度（px）
emit('height', totalHeight)

const showPlaceholder = computed(() => {
  if (props.placeholder !== undefined) return props.placeholder
  // fixed 且非透明时自动插入占位
  return props.fixed && !props.transparent
})

function goBack() {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack()
  } else {
    uni.switchTab({ url: '/pages/index/index' })
  }
}
</script>

<template>
  <view
    class="nav-bar-container"
    :class="{ 'is-fixed': fixed, 'has-border': border && !transparent }"
    :style="{
      paddingTop: statusBarHeight + 'px',
      backgroundColor: background ? 'transparent' : (transparent ? 'transparent' : (backgroundColor || '#ffffff')),
      background: background || 'none',
      height: totalHeight + 'px'
    }"
  >
    <view class="nav-bar-content" :style="{ height: navBarHeight + 'px' }">
      <!-- 返回按钮 -->
      <view v-if="back" class="back-btn" @click="goBack">
        <text class="back-icon" :style="{ color: textColor || '#000000' }">‹</text>
      </view>

      <!-- 标题 -->
      <view class="title-wrap">
        <text class="title-text" :style="{ color: textColor || '#000000' }">{{ title }}</text>
      </view>

      <!-- 右侧占位（使标题居中） -->
      <view class="right-placeholder" v-if="back" />
    </view>
  </view>

  <!-- 占位块：防止 fixed 导航栏遮挡内容 -->
  <view v-if="showPlaceholder" :style="{ height: totalHeight + 'px', flexShrink: 0 }" />
</template>

<style lang="scss" scoped>
.nav-bar-container {
  width: 100%;
  z-index: 1000;
  box-sizing: border-box;

  &.is-fixed {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
  }

  &.has-border {
    border-bottom: 1rpx solid #e2e8f0;
  }
}

.nav-bar-content {
  display: flex;
  align-items: center;
  position: relative;
  width: 100%;
}

.back-btn {
  width: 88rpx;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  left: 0;
  z-index: 10;

  &:active { opacity: 0.7; }
}

.back-icon {
  font-size: 60rpx;
  font-weight: 300;
  line-height: 1;
}

.title-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 100rpx;
}

.title-text {
  font-size: 32rpx;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.right-placeholder {
  width: 88rpx;
  flex-shrink: 0;
}
</style>
