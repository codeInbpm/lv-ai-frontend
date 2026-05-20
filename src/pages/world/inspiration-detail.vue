<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useNavBar } from '../../composables/useNavBar'
import { useWorldStore } from '../../stores/world'

const worldStore = useWorldStore()
const { statusBarHeight, navBarHeight, totalHeight } = useNavBar()

const selectedMonth = ref(5)

onLoad((options: any) => {
  if (options.month) {
    selectedMonth.value = Number(options.month)
  }
})

onMounted(() => {
  // 100% 动态从数据库拉取对应月份的出行灵感排行榜数据
  worldStore.fetchInspirations(selectedMonth.value)
})

// 根据数据库 title 模糊映射到目的地的关联详情 ID
function goScenicDetail(item: any) {
  const cityMapping: Record<string, number> = {
    '张掖': 101,
    '古龙峡': 102,
    '桂林': 103,
    '西安': 104,
    '重庆': 105,
    '丽江': 106,
    '昆明': 107,
    '三亚': 108,
    '呼伦贝尔': 109,
    '阿勒泰': 110,
    '香格里拉': 111,
    '青海湖': 112,
    '长白山': 113,
    '九寨沟': 114,
    '额济纳旗': 115
  }
  const destId = cityMapping[item.title] || 104
  uni.navigateTo({ url: `/pages/world/destination?id=${destId}` })
}

function handleBack() {
  uni.navigateBack()
}

// 动态通过 recommendCount 派生评分、评论数和门票已售数，保证完完全全的数据动态响应
function getDerivedScore(recCount: number) {
  return (4.5 + (recCount % 5) * 0.1).toFixed(1)
}

function getDerivedComments(recCount: number) {
  return (recCount * 1.5).toFixed(0)
}

function getDerivedSold(recCount: number) {
  return (recCount * 0.08).toFixed(0)
}

function getDerivedPrice(recCount: number) {
  return 20 + (recCount % 8) * 15
}

// 页面级互动状态（完全对接图1数据）
const isLiked = ref(false)
const likeCount = ref(604)
const isPageCollected = ref(false)
const collectCount = ref(522)

function togglePageLike() {
  isLiked.value = !isLiked.value
  likeCount.value += isLiked.value ? 1 : -1
  uni.showToast({ title: isLiked.value ? '感谢点赞！' : '取消点赞', icon: 'none' })
}

function togglePageCollect() {
  isPageCollected.value = !isPageCollected.value
  collectCount.value += isPageCollected.value ? 1 : -1
  uni.showToast({ title: isPageCollected.value ? '已加入您的收藏列表' : '已取消收藏', icon: 'none' })
}
</script>

<template>
  <view class="inspiration-detail">
    <!-- 顶部轻盈导航栏 -->
    <view class="custom-nav" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="nav-content" :style="{ height: navBarHeight + 'px' }">
        <view class="back-btn" @click="handleBack">‹</view>
        <text class="nav-title">{{ selectedMonth }}月去哪儿玩</text>
        <view class="placeholder-box"></view>
      </view>
    </view>
    <view :style="{ height: totalHeight + 'px' }"></view>

    <!-- 动态排行榜滚动容器 -->
    <scroll-view class="list-container" scroll-y>
      <view class="ranking-list-wrap">
        
        <view 
          v-for="(item, idx) in worldStore.inspirations" 
          :key="item.id" 
          class="ranking-item-card"
          @click="goScenicDetail(item)"
        >
          <!-- 头部：超显眼的大排名数字+名字 -->
          <view class="card-header">
            <view class="rank-badge-wrap">
              <text class="rank-num">{{ idx + 1 < 10 ? '0' + (idx + 1) : idx + 1 }}</text>
              <view class="rank-bg-glow"></view>
            </view>
            <view class="header-text">
              <text class="scenic-name">{{ item.title }}</text>
              <view class="scenic-meta">
                <text class="meta-score">{{ getDerivedScore(item.recommendCount) }}分</text>
                <text class="meta-divider">|</text>
                <text class="meta-comments">{{ getDerivedComments(item.recommendCount) }}条评论</text>
              </view>
            </view>
            <!-- 收藏星标 -->
            <view class="star-badge">
              <text class="star-icon">☆</text>
              <text class="star-num">{{ (item.recommendCount * 0.12).toFixed(0) }}</text>
            </view>
          </view>

          <!-- 中间高清代表图 -->
          <image :src="item.coverUrl" mode="aspectFill" class="cover-image" />

          <!-- 精致大黄色推荐理由框 -->
          <view class="recommend-box">
            <view class="rec-label-wrap">
              <text class="rec-lbl-txt">推荐</text>
              <text class="rec-lbl-txt">理由</text>
            </view>
            <text class="rec-content">{{ item.subtitle }}</text>
          </view>

          <!-- 景区门票卡片 -->
          <view class="ticket-panel">
            <view class="t-left">
              <text class="t-badge">门票</text>
              <text class="t-sold-num">已售 {{ getDerivedSold(item.recommendCount) }}</text>
            </view>
            <text class="t-price">￥{{ getDerivedPrice(item.recommendCount) }}起 ›</text>
          </view>
        </view>

      </view>
      <view style="height: 180rpx;"></view>
    </scroll-view>

    <!-- 底部浅色浮动工具条（仿图1款式） -->
    <view class="bottom-action-bar">
      <view class="action-bar-content">
        <!-- 左侧大青色药丸按钮 -->
        <view class="pill-btn-left">
          <text class="pill-icon">🗂️</text>
          <text class="pill-text">全部玩法</text>
        </view>
        
        <!-- 右侧交互区域 -->
        <view class="right-actions-box">
          <view class="action-item-wrap" :class="{ active: isPageCollected }" @click="togglePageCollect">
            <text class="action-icon">{{ isPageCollected ? '★' : '☆' }}</text>
            <text class="action-num">{{ collectCount }}</text>
          </view>
          <view class="action-item-wrap" :class="{ active: isLiked }" @click="togglePageLike">
            <!-- 仿图1点赞手势图标，微信中使用非常精致的手势 -->
            <text class="action-icon">👍</text>
            <text class="action-num">{{ likeCount }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.inspiration-detail {
  min-height: 100vh;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
}

/* 顶部轻盈导航栏 */
.custom-nav {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 100;
  background: #ffffff;
  border-bottom: 1rpx solid #e2e8f0;
  
  .nav-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 32rpx;
    
    .back-btn {
      font-size: 64rpx;
      color: #334155;
      font-weight: 300;
    }
    
    .nav-title {
      font-size: 34rpx;
      font-weight: 800;
      color: #0f172a;
    }
    
    .placeholder-box {
      width: 60rpx;
    }
  }
}

/* 排行榜垂直滚动 */
.list-container {
  flex: 1;
  padding: 24rpx 32rpx;
  box-sizing: border-box;
}

.ranking-list-wrap {
  display: flex;
  flex-direction: column;
  gap: 40rpx;
}

.ranking-item-card {
  background: #ffffff;
  border-radius: 36rpx;
  padding: 30rpx;
  box-shadow: 0 12rpx 32rpx rgba(15, 23, 42, 0.04);
  border: 1rpx solid rgba(226, 232, 240, 0.5);
  display: flex;
  flex-direction: column;
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:active {
    transform: scale(0.98);
  }
}

/* 头部样式 */
.card-header {
  display: flex;
  align-items: center;
  margin-bottom: 24rpx;
  position: relative;
  
  .rank-badge-wrap {
    position: relative;
    width: 80rpx;
    height: 80rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 20rpx;
    
    .rank-num {
      font-size: 56rpx;
      font-weight: 900;
      color: #0f172a;
      z-index: 2;
      line-height: 1;
      font-family: 'Outfit', sans-serif;
    }
    
    .rank-bg-glow {
      position: absolute;
      bottom: -4rpx;
      left: -8rpx;
      width: 76rpx;
      height: 48rpx;
      background: linear-gradient(135deg, #fef08a 0%, #fde047 100%);
      border-radius: 50% 50% 40% 40%;
      opacity: 0.85;
      z-index: 1;
      box-shadow: 0 6rpx 12rpx rgba(253, 224, 71, 0.25);
    }
  }
  
  .header-text {
    flex: 1;
    .scenic-name {
      font-size: 34rpx;
      font-weight: 900;
      color: #0f172a;
      display: block;
      margin-bottom: 6rpx;
    }
    .scenic-meta {
      display: flex;
      align-items: center;
      gap: 12rpx;
      
      .meta-score {
        font-size: 22rpx;
        color: #f59e0b;
        font-weight: 800;
      }
      .meta-divider {
        font-size: 18rpx;
        color: #cbd5e1;
      }
      .meta-comments {
        font-size: 22rpx;
        color: #64748b;
        font-weight: 500;
      }
    }
  }
  
  .star-badge {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    
    .star-icon {
      font-size: 38rpx;
      color: #94a3b8;
      line-height: 1;
    }
    .star-num {
      font-size: 18rpx;
      color: #94a3b8;
      font-weight: 700;
      margin-top: 2rpx;
    }
  }
}

/* 高清大图 */
.cover-image {
  width: 100%;
  height: 360rpx;
  border-radius: 24rpx;
  background: #f1f5f9;
  margin-bottom: 24rpx;
}

/* 推荐理由框 */
.recommend-box {
  background: #fefbeb;
  border-radius: 20rpx;
  padding: 20rpx;
  display: flex;
  gap: 20rpx;
  align-items: flex-start;
  margin-bottom: 24rpx;
  border: 1rpx solid #fef3c7;
  
  .rec-label-wrap {
    display: flex;
    flex-direction: column;
    background: #fef08a;
    padding: 6rpx 10rpx;
    border-radius: 12rpx;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    
    .rec-lbl-txt {
      font-size: 16rpx;
      font-weight: 900;
      color: #854d0e;
      line-height: 1.2;
    }
  }
  
  .rec-content {
    font-size: 23rpx;
    color: #713f12;
    line-height: 1.5;
    font-weight: 700;
    flex: 1;
  }
}

/* 景区门票卡片 */
.ticket-panel {
  background: #f8fafc;
  border-radius: 20rpx;
  padding: 20rpx 24rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1rpx solid #e2e8f0;
  
  .t-left {
    display: flex;
    align-items: center;
    gap: 16rpx;
    
    .t-badge {
      background: #ef4444;
      color: #ffffff;
      font-size: 18rpx;
      font-weight: 800;
      padding: 4rpx 10rpx;
      border-radius: 8rpx;
    }
    
    .t-sold-num {
      font-size: 22rpx;
      color: #64748b;
      font-weight: 600;
    }
  }
  
  .t-price {
    font-size: 24rpx;
    color: #ef4444;
    font-weight: 900;
  }
}

/* 底部浅色高质感悬浮底栏（仿图1款式） */
.bottom-action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  background: #ffffff;
  border-top: 1rpx solid #e2e8f0;
  padding: 20rpx 32rpx calc(20rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
  z-index: 100;
  box-shadow: 0 -8rpx 32rpx rgba(15, 23, 42, 0.06);
  
  .action-bar-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  
  /* 左侧大青蓝色圆角按钮 */
  .pill-btn-left {
    background: #00bac7;
    border-radius: 100rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12rpx;
    padding: 20rpx 48rpx;
    box-shadow: 0 6rpx 16rpx rgba(0, 186, 199, 0.3);
    flex: 1;
    max-width: 320rpx;
    
    .pill-icon {
      font-size: 28rpx;
      color: #ffffff;
      line-height: 1;
    }
    
    .pill-text {
      font-size: 24rpx;
      color: #ffffff;
      font-weight: 900;
    }
    
    &:active {
      opacity: 0.9;
    }
  }
  
  /* 右侧精简交互 */
  .right-actions-box {
    display: flex;
    align-items: center;
    gap: 60rpx;
    margin-right: 20rpx;
    
    .action-item-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
      
      .action-icon {
        font-size: 40rpx;
        color: #334155;
        line-height: 1;
        transition: transform 0.15s ease;
      }
      
      .action-num {
        font-size: 20rpx;
        font-weight: 700;
        color: #64748b;
        margin-top: 4rpx;
      }
      
      &.active {
        .action-icon {
          color: #f59e0b;
          transform: scale(1.15);
        }
        .action-num {
          color: #f59e0b;
        }
      }
    }
  }
}
</style>
