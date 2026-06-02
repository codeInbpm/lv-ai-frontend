<script setup lang="ts">
import { ref, onMounted } from 'vue'
import NavBar from '../../components/common/NavBar.vue'

const rankingId = ref('')
const detail = ref<any>({
  title: '澳门8大必打卡美食',
  coverUrl: 'https://images.unsplash.com/photo-1526464684437-d40b4931f6e0?w=800',
  viewCount: '16.0w',
  likeCount: 500,
  author: {
    name: 'Qunar 攻略小骆驼',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
    followers: '6.7w',
    isFollowed: false
  },
  items: [
    {
      rank: 1,
      name: '安德鲁饼店 路环本店',
      score: 4.8,
      comments: 72,
      favCount: 484,
      image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500',
      reason: '葡式蛋挞；外皮酥脆有层次感，内馅奶香浓郁'
    },
    {
      rank: 2,
      name: '沙度娜',
      score: 4.8,
      comments: 71,
      favCount: 27,
      image: '',
      reason: '木糠布丁，非常正宗'
    }
  ]
})

onMounted(() => {
  const pages = getCurrentPages()
  const options = pages[pages.length - 1].options
  if (options && options.id) {
    rankingId.value = options.id
    // TODO: fetch detail by ID
  }
})
</script>

<template>
  <view class="ranking-detail">
    <NavBar title="" back transparent fixed />
    
    <!-- 顶部封面 -->
    <view class="cover-section">
      <image class="cover-img" :src="detail.coverUrl" mode="aspectFill"></image>
    </view>
    
    <view class="content-container">
      <!-- 标题和数据 -->
      <view class="header-info">
        <text class="title">{{ detail.title }}</text>
        <view class="stats">
          <text>{{ detail.viewCount }} 浏览</text>
          <text>{{ detail.likeCount }} 点赞</text>
        </view>
      </view>
      
      <!-- 作者卡片 -->
      <view class="author-card">
        <image class="avatar" :src="detail.author.avatar"></image>
        <view class="author-info">
          <text class="name">{{ detail.author.name }}</text>
          <text class="followers">{{ detail.author.followers }} 关注</text>
        </view>
        <view class="follow-btn" :class="{ followed: detail.author.isFollowed }" @click="detail.author.isFollowed = !detail.author.isFollowed">
          {{ detail.author.isFollowed ? '已关注' : '+ 关注' }}
        </view>
      </view>
      
      <!-- 排行列表 -->
      <view class="ranking-list">
        <view class="rank-item" v-for="(item, index) in detail.items" :key="index">
          <view class="item-header">
            <view class="rank-number">0{{ item.rank }}</view>
            <view class="item-title-box">
              <text class="item-name">{{ item.name }}</text>
              <text class="item-score">{{ item.score }}分 | {{ item.comments }}条评论</text>
            </view>
            <view class="fav-box">
              <text class="fav-icon">☆</text>
              <text class="fav-count">{{ item.favCount }}</text>
            </view>
          </view>
          
          <image v-if="item.image" class="item-image" :src="item.image" mode="aspectFill"></image>
          
          <view class="recommend-box" v-if="item.reason">
            <view class="rec-label">推荐<br>理由</view>
            <view class="rec-text">{{ item.reason }}</view>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 底部操作栏 -->
    <view class="bottom-bar">
      <view class="btn-all">全部玩法</view>
      <view class="actions">
        <view class="action-item">
          <text class="icon">☆</text>
          <text class="count">439</text>
        </view>
        <view class="action-item">
          <text class="icon">👍</text>
          <text class="count">500</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
.ranking-detail {
  min-height: 100vh;
  background-color: #f8fafc;
  padding-bottom: 120rpx;
}

.cover-section {
  width: 100%;
  height: 400rpx;
}

.cover-img {
  width: 100%;
  height: 100%;
}

.content-container {
  position: relative;
  top: -40rpx;
  background: #f8fafc;
  border-radius: 40rpx 40rpx 0 0;
  padding: 40rpx 30rpx;
}

.header-info {
  margin-bottom: 30rpx;
}

.title {
  font-size: 44rpx;
  font-weight: bold;
  color: #0f172a;
  display: block;
  margin-bottom: 16rpx;
}

.stats {
  font-size: 26rpx;
  color: #64748b;
  display: flex;
  gap: 20rpx;
}

.author-card {
  display: flex;
  align-items: center;
  background: #fff;
  padding: 24rpx;
  border-radius: 20rpx;
  margin-bottom: 40rpx;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.02);
}

.avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 40rpx;
  margin-right: 20rpx;
}

.author-info {
  flex: 1;
}

.name {
  font-size: 30rpx;
  font-weight: bold;
  color: #0f172a;
  display: block;
}

.followers {
  font-size: 24rpx;
  color: #94a3b8;
}

.follow-btn {
  background: #00bac7;
  color: #fff;
  padding: 12rpx 32rpx;
  border-radius: 100rpx;
  font-size: 26rpx;
  font-weight: bold;
}

.follow-btn.followed {
  background: #f1f5f9;
  color: #64748b;
}

.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 40rpx;
}

.rank-item {
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.02);
}

.item-header {
  display: flex;
  align-items: flex-start;
  margin-bottom: 20rpx;
}

.rank-number {
  font-size: 48rpx;
  font-weight: 900;
  color: #f59e0b;
  margin-right: 20rpx;
  text-shadow: 2px 2px 0px #fef3c7;
}

.item-title-box {
  flex: 1;
}

.item-name {
  font-size: 34rpx;
  font-weight: bold;
  color: #0f172a;
  display: block;
  margin-bottom: 8rpx;
}

.item-score {
  font-size: 24rpx;
  color: #64748b;
}

.fav-box {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.fav-icon {
  font-size: 40rpx;
  color: #94a3b8;
}

.fav-count {
  font-size: 22rpx;
  color: #94a3b8;
}

.item-image {
  width: 100%;
  height: 300rpx;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
}

.recommend-box {
  display: flex;
  background: #fdf8f6;
  border-radius: 12rpx;
  padding: 20rpx;
}

.rec-label {
  font-size: 24rpx;
  font-weight: bold;
  color: #d97706;
  margin-right: 20rpx;
  line-height: 1.2;
}

.rec-text {
  flex: 1;
  font-size: 26rpx;
  color: #475569;
  line-height: 1.5;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 40rpx;
  box-sizing: border-box;
  box-shadow: 0 -4rpx 20rpx rgba(0,0,0,0.05);
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
}

.btn-all {
  background: #00bac7;
  color: #fff;
  padding: 16rpx 40rpx;
  border-radius: 100rpx;
  font-size: 28rpx;
  font-weight: bold;
}

.actions {
  display: flex;
  gap: 40rpx;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.action-item .icon {
  font-size: 40rpx;
  color: #334155;
}

.action-item .count {
  font-size: 22rpx;
  color: #64748b;
}
</style>
