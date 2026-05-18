<script setup lang="ts">
import type { Inspiration } from '../../stores/world'

defineProps<{
  item: Inspiration
  isBig?: boolean
}>()
</script>

<template>
  <view class="inspiration-card" :class="{ 'is-big': isBig }" @click="$emit('click')">
    <image :src="item.coverUrl" mode="aspectFill" class="cover" />
    <view class="overlay">
      <view class="text-content">
        <text class="title">{{ item.title }}</text>
        <text class="subtitle">{{ item.subtitle }}</text>
        <view class="bottom" v-if="isBig">
          <view class="badge">{{ item.month }}月去哪儿玩</view>
          <text class="count">{{ item.recommendCount }} 人推荐</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.inspiration-card {
  position: relative;
  border-radius: 20rpx;
  overflow: hidden;
  background: #f1f5f9;
  
  .cover {
    width: 100%;
    height: 100%;
  }
  
  .overlay {
    position: absolute;
    left: 0;
    bottom: 0;
    width: 100%;
    height: 60%;
    background: linear-gradient(to top, rgba(0,0,0,0.6), transparent);
    display: flex;
    align-items: flex-end;
    padding: 20rpx;
  }
  
  .text-content {
    color: #fff;
    .title { font-size: 32rpx; font-weight: 700; display: block; margin-bottom: 4rpx; }
    .subtitle { font-size: 24rpx; opacity: 0.9; display: block; }
  }
  
  &.is-big {
    width: 320rpx;
    height: 440rpx;
    margin-right: 20rpx;
    .text-content {
      .title { font-size: 36rpx; }
    }
  }
  
  &:not(.is-big) {
    width: 320rpx;
    height: 210rpx;
    margin-bottom: 20rpx;
    .text-content {
      .title { font-size: 28rpx; }
      .subtitle { font-size: 22rpx; }
    }
  }

  .bottom {
    margin-top: 16rpx;
    .badge {
      display: inline-block;
      padding: 4rpx 16rpx;
      background: #0ea5e9;
      border-radius: 8rpx;
      font-size: 20rpx;
      font-weight: 700;
      margin-bottom: 8rpx;
    }
    .count {
      font-size: 22rpx;
      display: block;
    }
  }
}
</style>
