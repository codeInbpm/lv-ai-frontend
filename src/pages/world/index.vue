<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useWorldStore } from '../../stores/world'
import { useNavBar } from '../../composables/useNavBar'
import InspirationCard from '../../components/world/InspirationCard.vue'
import NavBar from '../../components/common/NavBar.vue'

const worldStore = useWorldStore()
const { totalHeight: navTotalHeight } = useNavBar()

const currentMonth = ref(new Date().getMonth() + 1)
const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

const searchQuery = ref('')

onMounted(() => {
  fetchData()
})

async function fetchData() {
  await Promise.all([
    worldStore.fetchInspirations(currentMonth.value),
    worldStore.fetchBroadcasts(),
    worldStore.fetchHotDestinations(),
    worldStore.fetchHotTopics()
  ])
}

function selectMonth(m: number) {
  currentMonth.value = m
  worldStore.fetchInspirations(m)
}

function goInspirationDetail(item: any) {
  uni.navigateTo({ url: `/pages/world/inspiration-detail?id=${item.id}` })
}

function goDestinationDetail(item: any) {
  uni.navigateTo({ url: `/pages/world/destination?id=${item.id}` })
}
</script>

<template>
  <view class="world-page">
    <!-- 渐变天空背景 -->
    <view class="sky-bg"></view>

    <NavBar
      transparent
      fixed
      title="看世界"
      textColor="#ffffff"
      :placeholder="false"
    />

    <scroll-view class="content" scroll-y @refresherrefresh="fetchData" refresher-enabled>
      <view :style="{ height: navTotalHeight + 'px' }" />

      <!-- 搜索栏 -->
      <view class="search-section">
        <view class="search-bar">
          <text class="search-icon">🔍</text>
          <input 
            v-model="searchQuery" 
            placeholder="搜索目的地或行程" 
            placeholder-class="ph-style"
          />
          <view class="search-btn">搜索</view>
        </view>
      </view>

      <!-- 出行灵感 -->
      <view class="section inspiration-section">
        <view class="section-header">
          <text class="section-title">出行灵感</text>
        </view>
        
        <scroll-view class="month-tabs" scroll-x show-scrollbar="false">
          <view 
            v-for="m in months" 
            :key="m" 
            class="month-tab" 
            :class="{ active: currentMonth === m }"
            @click="selectMonth(m)"
          >
            <text class="m-val">{{ m }}月</text>
            <text class="m-label">{{ m === 5 ? '劳动节' : m === 6 ? '毕业季' : m === 10 ? '国庆节' : '出游季' }}</text>
          </view>
        </scroll-view>

        <scroll-view class="inspiration-list" scroll-x show-scrollbar="false">
          <view class="inspiration-group">
            <!-- 这里的布局模拟截图中的瀑布流或左右分布 -->
            <InspirationCard 
              v-if="worldStore.inspirations[0]" 
              :item="worldStore.inspirations[0]" 
              is-big 
              @click="goInspirationDetail(worldStore.inspirations[0])"
            />
            <view class="right-cols">
              <InspirationCard 
                v-for="(item, idx) in worldStore.inspirations.slice(1, 3)" 
                :key="item.id" 
                :item="item"
                @click="goInspirationDetail(item)"
              />
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- 系统广播 -->
      <view class="section broadcast-section">
        <view class="broadcast-card">
          <text class="speaker">📢</text>
          <text class="label">广播</text>
          <text class="notice">【重要通知】</text>
          <swiper class="broadcast-swiper" vertical autoplay interval="3000" circular>
            <swiper-item v-for="b in worldStore.broadcasts" :key="b.id">
              <view class="b-text">{{ b.content }}</view>
            </swiper-item>
          </swiper>
          <text class="arrow">›</text>
        </view>
      </view>

      <!-- 热门目的地 -->
      <view class="section hot-dest-section">
        <view class="section-header">
          <text class="section-title">🔥 热门目的地</text>
        </view>
        <view class="dest-list">
          <view 
            v-for="item in worldStore.hotDestinations" 
            :key="item.id" 
            class="dest-card"
            @click="goDestinationDetail(item)"
          >
            <image :src="item.imageUrl" class="dest-icon" mode="aspectFill" />
            <view class="dest-info">
              <text class="dest-name">{{ item.name }}</text>
              <text class="dest-sub">{{ item.description }}</text>
            </view>
            <view class="plan-btn">规划 ›</view>
          </view>
        </view>
      </view>

      <!-- 热门话题 -->
      <view class="section hot-topic-section">
        <view class="section-header">
          <text class="section-title">正在热议</text>
          <text class="more">查看全部 ›</text>
        </view>
        <scroll-view class="topic-list" scroll-x show-scrollbar="false">
          <view 
            v-for="item in worldStore.hotTopics" 
            :key="item.id" 
            class="topic-card"
            @click="uni.navigateTo({ url: `/pages/note/topic-detail?id=${item.id}` })"
          >
            <image :src="item.coverUrl" class="topic-img" mode="aspectFill" />
            <view class="topic-info">
              <text class="topic-title"># {{ item.title }}</text>
              <text class="topic-stats">{{ (item.followerCount / 10000).toFixed(1) }}w 参与</text>
            </view>
          </view>
        </scroll-view>
      </view>

      <view style="height: 40rpx;" />
    </scroll-view>
  </view>
</template>

<style lang="scss" scoped>
.world-page {
  min-height: 100vh;
  background: #f8fafc;
  position: relative;
}

.sky-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 500rpx;
  background: linear-gradient(135deg, #0c4a6e, #0369a1, #f59e0b);
  opacity: 0.8;
  z-index: 0;
}

.content {
  position: relative;
  z-index: 1;
  height: 100vh;
}

.search-section {
  padding: 20rpx 32rpx;
  .search-bar {
    background: rgba(255, 255, 255, 0.95);
    height: 88rpx;
    border-radius: 44rpx;
    display: flex;
    align-items: center;
    padding: 0 32rpx;
    box-shadow: 0 10rpx 30rpx rgba(0,0,0,0.05);
    
    .search-icon { font-size: 32rpx; margin-right: 16rpx; color: #94a3b8; }
    input { flex: 1; font-size: 28rpx; color: #1e293b; }
    .search-btn {
      color: #0ea5e9;
      font-weight: 700;
      padding-left: 20rpx;
      border-left: 1rpx solid #e2e8f0;
    }
  }
}

.section {
  margin-top: 40rpx;
  padding: 0 32rpx;
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24rpx;
    .section-title { font-size: 40rpx; font-weight: 800; color: #1e293b; }
  }
}

.month-tabs {
  white-space: nowrap;
  margin-bottom: 30rpx;
  .month-tab {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 140rpx;
    height: 100rpx;
    background: #fff;
    border-radius: 16rpx;
    margin-right: 20rpx;
    transition: all 0.3s;
    
    .m-val { font-size: 30rpx; font-weight: 700; color: #334155; }
    .m-label { font-size: 20rpx; color: #94a3b8; margin-top: 4rpx; }
    
    &.active {
      background: linear-gradient(135deg, #0369a1, #0ea5e9);
      .m-val, .m-label { color: #fff; }
      transform: scale(1.05);
    }
  }
}

.inspiration-list {
  white-space: nowrap;
  .inspiration-group {
    display: inline-flex;
    .right-cols {
      display: flex;
      flex-direction: column;
    }
  }
}

.broadcast-section {
  .broadcast-card {
    background: #fff;
    border-radius: 20rpx;
    padding: 24rpx;
    display: flex;
    align-items: center;
    box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.02);
    
    .speaker { font-size: 32rpx; margin-right: 12rpx; }
    .label { font-size: 30rpx; font-weight: 800; color: #1e293b; margin-right: 12rpx; }
    .notice { font-size: 26rpx; color: #f97316; font-weight: 700; margin-right: 12rpx; }
    
    .broadcast-swiper {
      flex: 1;
      height: 40rpx;
      .b-text {
        font-size: 26rpx;
        color: #64748b;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
    .arrow { color: #cbd5e1; font-size: 36rpx; }
  }
}

.hot-topic-section {
  .topic-list {
    white-space: nowrap;
    .topic-card {
      display: inline-block;
      width: 280rpx;
      margin-right: 20rpx;
      background: #fff;
      border-radius: 20rpx;
      overflow: hidden;
      box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.02);
      
      .topic-img { width: 100%; height: 200rpx; }
      .topic-info {
        padding: 16rpx;
        .topic-title { font-size: 26rpx; font-weight: 700; color: #1e293b; display: block; white-space: normal; height: 72rpx; overflow: hidden; }
        .topic-stats { font-size: 20rpx; color: #94a3b8; margin-top: 8rpx; display: block; }
      }
    }
  }
}

.hot-dest-section {
  .dest-list {
    background: #fff;
    border-radius: 24rpx;
    padding: 10rpx 0;
    box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.02);
  }
  .dest-card {
    display: flex;
    align-items: center;
    padding: 24rpx 32rpx;
    border-bottom: 1rpx solid #f1f5f9;
    &:last-child { border-bottom: none; }
    
    .dest-icon {
      width: 80rpx;
      height: 80rpx;
      border-radius: 16rpx;
      margin-right: 24rpx;
    }
    
    .dest-info {
      flex: 1;
      .dest-name { font-size: 32rpx; font-weight: 700; color: #1e293b; display: block; }
      .dest-sub { font-size: 24rpx; color: #94a3b8; }
    }
    
    .plan-btn {
      font-size: 26rpx;
      color: #0ea5e9;
      font-weight: 600;
    }
  }
}

.ph-style { color: #cbd5e1; }
</style>
