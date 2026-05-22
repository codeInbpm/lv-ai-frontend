<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useWorldStore } from '../../stores/world'
import { useNavBar } from '../../composables/useNavBar'
import NavBar from '../../components/common/NavBar.vue'

const worldStore = useWorldStore()
const { totalHeight: navTotalHeight } = useNavBar()

const currentMonth = ref(5) // 默认当前月份为 5 月
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

function goInspirationDetail() {
  uni.navigateTo({ url: `/pages/world/inspiration-detail?month=${currentMonth.value}` })
}

// 出行灵感卡片点击：优先使用后端返回的 destinationId，无则 fallback 到 title 字符串映射
function handleInspirationClick(item: any) {
  // 优先使用后端字段（数据库执行补丁脚本后生效）
  if (item.destinationId) {
    console.log('=== 首页点击灵感卡片（用destinationId）===', item.title, '->', item.destinationId)
    uni.navigateTo({ url: `/pages/world/destination?id=${item.destinationId}` })
    return
  }
  // Fallback：title 字符串精确匹配（注意 trim 去除空格）
  const cityMapping: Record<string, number> = {
    '张掖': 101,
    '古龙峡': 102,
    '桂林': 103,
    '西安': 104,
    '重庆': 105,
    '丽江': 106,
    '昆明': 107,
    '三亚': 108,
    '成都': 105,
    '武汉': 104,
    '杭州': 106,
    '广州': 102,
    '呼伦贝尔': 109,
    '阿勒泰': 110,
    '香格里拉': 111,
    '青海湖': 112,
    '长白山': 113,
    '九寨沟': 114,
    '额济纳旗': 115
  }
  const titleKey = (item.title || '').trim()
  const destId = cityMapping[titleKey]
  console.log('=== 首页点击灵感卡片（用title映射）===', '标题:', titleKey, '->ID:', destId)
  if (!destId) {
    console.warn('=== 未找到对应目的地，请检查 title 或 destinationId 字段 ===', item)
    return
  }
  uni.navigateTo({ url: `/pages/world/destination?id=${destId}` })
}

// 热门目的地点击跳转（模板中调用此方法，需在此定义）
function goDestinationDetail(id: number) {
  console.log('=== 热门目的地跳转 ===', 'id:', id)
  uni.navigateTo({ url: `/pages/world/destination?id=${id}` })
}

// 一键生成攻略
function generatePlan(item: any) {
  uni.showLoading({ title: '加载偏好中...', mask: true })
  
  const tags = item.tags ? item.tags.split(',') : []
  if (!tags.includes('自驾')) tags.push('自驾')

  uni.setStorageSync('prefillPlanData', {
    destination: item.name,
    days: 5,
    preferences: tags
  })
  
  setTimeout(() => {
    uni.hideLoading()
    uni.navigateTo({ url: '/pages/plan/create/index' })
  }, 400)
}

// 高自适应 Swiper 分页逻辑：每页 1大 (featured) + 4小 (2x2 grid)
const swiperPages = computed(() => {
  const list = worldStore.inspirations || []
  if (list.length === 0) return []
  
  const pages = []
  
  // 第一页
  const page1Featured = list.find(item => item.isFeatured === 1) || list[0]
  const page1Items = list.filter(item => item.id !== page1Featured.id).slice(0, 4)
  pages.push({
    featured: page1Featured,
    items: page1Items
  })
  
  // 第二页（如果有更多数据）
  if (list.length > 5) {
    const remaining = list.filter(item => item.id !== page1Featured.id && !page1Items.some(pi => pi.id === item.id))
    if (remaining.length > 0) {
      const page2Featured = remaining.find(item => item.isFeatured === 1) || remaining[0]
      const page2Items = remaining.filter(item => item.id !== page2Featured.id).slice(0, 4)
      pages.push({
        featured: page2Featured,
        items: page2Items
      })
    }
  }
  
  return pages
})
</script>

<template>
  <view class="world-page">
    <!-- 极美日落天空渐变背景 -->
    <view class="sky-bg">
      <view class="sun-glow"></view>
      <view class="mountain-silhouette"></view>
    </view>

    <!-- 顶部导航，标题改为“出行灵感” -->
    <NavBar
      transparent
      fixed
      title="出行灵感"
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
            placeholder="搜索目的地、景点或美食" 
            placeholder-class="ph-style"
          />
          <view class="search-btn">搜索</view>
        </view>
      </view>

      <!-- 月份滑动 Tab 栏 -->
      <view class="tabs-container">
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
      </view>

      <!-- 城市推荐大卡片网格 - 仿图1、图2：左侧一大图，右侧2行2列网格，支持横向滑动 -->
      <view class="section grid-section">
        <view class="section-header">
          <text class="section-title">✨ 出行灵感</text>
          <text class="section-desc">左右滑动发现更多</text>
        </view>
        
        <swiper 
          class="inspiration-swiper" 
          v-if="swiperPages && swiperPages.length > 0"
          circular
          :indicator-dots="swiperPages.length > 1"
          indicator-color="rgba(2, 132, 199, 0.15)"
          indicator-active-color="#00bac7"
        >
          <swiper-item v-for="(page, pageIdx) in swiperPages" :key="pageIdx">
            <view class="swiper-page-content">
              <!-- 左侧一大图卡片 - 点击跳转该月份排行榜 -->
              <view class="left-big-card" v-if="page.featured" @click="goInspirationDetail">
                <image :src="page.featured.coverUrl" mode="aspectFill" class="big-cover" />
                <view class="big-gradient"></view>
                
                <view class="big-badge-panel">
                  <text class="badge-title">{{ currentMonth }}月去哪儿玩</text>
                  <text class="badge-stats">{{ page.featured.recommendCount }}人推荐</text>
                </view>
              </view>
              
              <!-- 右侧2行2列小图布局 -->
              <view class="right-small-grid">
                <view 
                  v-for="subItem in page.items" 
                  :key="subItem.id" 
                  class="small-grid-item"
                  @click="handleInspirationClick(subItem)"
                >
                  <image :src="subItem.coverUrl" mode="aspectFill" class="small-img" />
                  <view class="small-info">
                    <text class="small-name">{{ subItem.title }}</text>
                    <text class="small-desc">{{ subItem.subtitle }}</text>
                  </view>
                </view>
              </view>
            </view>
          </swiper-item>
        </swiper>
        
        <view class="empty-state" v-else>
          <text class="empty-icon">🍃</text>
          <text class="empty-text">正在探索更多宝藏城市中...</text>
        </view>
      </view>

      <!-- 系统广播 -->
      <view class="section broadcast-section">
        <view class="broadcast-card">
          <text class="speaker">📢</text>
          <text class="label">动态</text>
          <text class="notice">最新资讯</text>
          <swiper class="broadcast-swiper" autoplay interval="4000" circular>
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
          <text class="section-title">🔥 热门自驾与自由行</text>
        </view>
        <view class="dest-list">
          <view 
            v-for="item in worldStore.hotDestinations" 
            :key="item.id" 
            class="dest-card"
            @click="goDestinationDetail(item.id)"
          >
            <image :src="item.imageUrl" class="dest-icon" mode="aspectFill" />
            <view class="dest-info">
              <text class="dest-name">{{ item.name }}</text>
              <text class="dest-sub">{{ item.description }}</text>
            </view>
            <view class="plan-btn" @click.stop="generatePlan(item)">一键生成攻略 ›</view>
          </view>
        </view>
      </view>

      <!-- 正在热议 -->
      <view class="section hot-topic-section">
        <view class="section-header">
          <text class="section-title">💬 驴友们正在热议</text>
          <text class="more">查看全部 ›</text>
        </view>
        <scroll-view class="topic-list" scroll-x show-scrollbar="false">
          <view 
            v-for="item in worldStore.hotTopics" 
            :key="item.id" 
            class="topic-card"
          >
            <image :src="item.coverUrl" class="topic-img" mode="aspectFill" />
            <view class="topic-info">
              <text class="topic-title"># {{ item.title }}</text>
              <text class="topic-stats">{{ (item.followerCount / 10000).toFixed(1) }}w 参与</text>
            </view>
          </view>
        </scroll-view>
      </view>

      <view style="height: 60rpx;" />
    </scroll-view>
  </view>
</template>

<style lang="scss" scoped>
.world-page {
  min-height: 100vh;
  background: #f0f9ff;
  position: relative;
}

/* 渐变日落天空背景 */
.sky-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 580rpx;
  background: linear-gradient(180deg, #0f172a 0%, #1e3a8a 35%, #0369a1 65%, #f59e0b 100%);
  z-index: 0;
  overflow: hidden;
  
  .sun-glow {
    position: absolute;
    bottom: -100rpx;
    left: 50%;
    transform: translateX(-50%);
    width: 600rpx;
    height: 300rpx;
    background: radial-gradient(circle, rgba(245, 158, 11, 0.4) 0%, transparent 70%);
    filter: blur(40px);
  }
  
  .mountain-silhouette {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 100rpx;
    background: linear-gradient(to top, rgba(0,0,0,0.15) 0%, transparent 100%);
  }
}

.content {
  position: relative;
  z-index: 1;
  height: 100vh;
}

.search-section {
  padding: 10rpx 32rpx 20rpx 32rpx;
  .search-bar {
    background: rgba(255, 255, 255, 0.95);
    height: 88rpx;
    border-radius: 44rpx;
    display: flex;
    align-items: center;
    padding: 0 32rpx;
    box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.05);
    backdrop-filter: blur(10px);
    
    .search-icon { font-size: 32rpx; margin-right: 16rpx; color: #94a3b8; }
    input { flex: 1; font-size: 28rpx; color: #1e293b; }
    .search-btn {
      color: #0284c7;
      font-weight: 700;
      padding-left: 20rpx;
      border-left: 1rpx solid #e2e8f0;
      font-size: 28rpx;
    }
  }
}

.tabs-container {
  padding: 0 32rpx 10rpx 32rpx;
}

.month-tabs {
  white-space: nowrap;
  margin-bottom: 10rpx;
  .month-tab {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 130rpx;
    height: 110rpx;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 24rpx;
    margin-right: 18rpx;
    backdrop-filter: blur(12px);
    border: 1rpx solid rgba(255, 255, 255, 0.1);
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    
    .m-val { font-size: 32rpx; font-weight: 800; color: rgba(255, 255, 255, 0.9); }
    .m-label { font-size: 18rpx; color: rgba(255, 255, 255, 0.6); margin-top: 4rpx; }
    
    &.active {
      background: linear-gradient(135deg, #f59e0b, #fbbf24);
      border: 1rpx solid rgba(255, 255, 255, 0.25);
      box-shadow: 0 8rpx 20rpx rgba(245, 158, 11, 0.3);
      transform: scale(1.06);
      
      .m-val { color: #ffffff; }
      .m-label { color: #ffffff; font-weight: 700; }
    }
  }
}

.section {
  margin-top: 36rpx;
  padding: 0 32rpx;
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 20rpx;
    .section-title { font-size: 38rpx; font-weight: 800; color: #0f172a; }
    .section-desc { font-size: 24rpx; color: #64748b; font-weight: 500; }
  }
}

/* 置顶官方大图大横幅 */
.banner-section {
  margin-top: 24rpx;
  .featured-banner {
    width: 100%;
    height: 380rpx;
    border-radius: 32rpx;
    position: relative;
    overflow: hidden;
    box-shadow: 0 16rpx 40rpx rgba(0, 0, 0, 0.08);
    background: #e2e8f0;
    
    .banner-img {
      width: 100%;
      height: 100%;
      transition: all 0.5s;
    }
    
    .banner-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.4) 60%, transparent 100%);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 30rpx;
      box-sizing: border-box;
      
      .banner-badge {
        align-self: flex-start;
        background: linear-gradient(90deg, #ef4444, #f97316);
        color: #fff;
        font-size: 20rpx;
        font-weight: 700;
        padding: 6rpx 20rpx;
        border-radius: 100rpx;
        box-shadow: 0 4rpx 10rpx rgba(239, 68, 68, 0.3);
      }
      
      .banner-title-wrap {
        margin-top: auto;
        .banner-main-title {
          font-size: 48rpx;
          font-weight: 900;
          color: #fff;
          display: block;
          text-shadow: 0 2rpx 8rpx rgba(0,0,0,0.5);
          margin-bottom: 8rpx;
        }
        .banner-sub-title {
          font-size: 24rpx;
          color: rgba(255, 255, 255, 0.85);
          display: block;
          line-height: 1.4;
        }
      }
      
      .banner-stats {
        display: flex;
        gap: 24rpx;
        margin-top: 14rpx;
        .stat-item {
          font-size: 22rpx;
          color: rgba(255, 255, 255, 0.7);
        }
      }
      
      .banner-go-btn {
        position: absolute;
        right: 30rpx;
        bottom: 30rpx;
        background: linear-gradient(135deg, #f59e0b, #fbbf24);
        color: #78350f;
        font-size: 24rpx;
        font-weight: 700;
        padding: 12rpx 28rpx;
        border-radius: 100rpx;
        box-shadow: 0 4rpx 12rpx rgba(245, 158, 11, 0.3);
      }
    }
  }
}

/* 城市 Swiper 卡片网格：左侧一大图，右侧2行2列 */
.grid-section {
  margin-top: 36rpx;
}

.inspiration-swiper {
  width: 100%;
  height: 420rpx;
}

.swiper-page-content {
  display: flex;
  justify-content: space-between;
  gap: 16rpx;
  height: 380rpx;
  box-sizing: border-box;
}

/* 左侧一大图卡片 */
.left-big-card {
  width: 320rpx;
  height: 380rpx;
  border-radius: 24rpx;
  position: relative;
  overflow: hidden;
  box-shadow: 0 12rpx 28rpx rgba(3, 105, 161, 0.06);
  background: #ffffff;
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:active {
    transform: scale(0.97);
  }
  
  .big-cover {
    width: 100%;
    height: 100%;
  }
  
  .big-gradient {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.1) 60%, transparent 100%);
  }
  
  .big-badge-panel {
    position: absolute;
    left: 16rpx;
    bottom: 20rpx;
    right: 16rpx;
    z-index: 2;
    
    .badge-title {
      background: #00bac7;
      color: #ffffff;
      font-size: 22rpx;
      font-weight: 800;
      padding: 4rpx 14rpx;
      border-radius: 8rpx;
      display: inline-block;
      margin-bottom: 8rpx;
      box-shadow: 0 4rpx 8rpx rgba(0, 186, 199, 0.3);
    }
    
    .badge-stats {
      font-size: 18rpx;
      color: rgba(255, 255, 255, 0.95);
      display: block;
      font-weight: 700;
      text-shadow: 0 2rpx 4rpx rgba(0,0,0,0.5);
    }
  }
}

/* 右侧2行2列小图布局 */
.right-small-grid {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 16rpx;
  height: 380rpx;
}

.small-grid-item {
  background: #ffffff;
  border-radius: 20rpx;
  overflow: hidden;
  box-shadow: 0 8rpx 20rpx rgba(3, 105, 161, 0.04);
  display: flex;
  flex-direction: column;
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  height: 182rpx;
  
  &:active {
    transform: scale(0.96);
  }
  
  .small-img {
    width: 100%;
    height: 100rpx;
    background: #f1f5f9;
  }
  
  .small-info {
    flex: 1;
    padding: 8rpx 12rpx;
    display: flex;
    flex-direction: column;
    justify-content: center;
    box-sizing: border-box;
    overflow: hidden;
    
    .small-name {
      font-size: 22rpx;
      font-weight: 800;
      color: #0f172a;
      display: block;
      margin-bottom: 2rpx;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .small-desc {
      font-size: 16rpx;
      color: #64748b;
      display: block;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.2;
    }
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60rpx 0;
  
  .empty-icon { font-size: 64rpx; margin-bottom: 12rpx; }
  .empty-text { font-size: 26rpx; color: #94a3b8; }
}

/* 系统广播 */
.broadcast-section {
  .broadcast-card {
    background: #fff;
    border-radius: 24rpx;
    padding: 24rpx;
    display: flex;
    align-items: center;
    box-shadow: 0 8rpx 20rpx rgba(3, 105, 161, 0.02);
    
    .speaker { font-size: 32rpx; margin-right: 12rpx; }
    .label { font-size: 28rpx; font-weight: 800; color: #0284c7; margin-right: 12rpx; }
    .notice { font-size: 24rpx; color: #f97316; font-weight: 700; margin-right: 12rpx; }
    
    .broadcast-swiper {
      flex: 1;
      height: 40rpx;
      .b-text {
        font-size: 25rpx;
        color: #475569;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        line-height: 40rpx;
      }
    }
    .arrow { color: #cbd5e1; font-size: 36rpx; }
  }
}

/* 热门目的地 */
.hot-dest-section {
  .dest-list {
    background: #fff;
    border-radius: 28rpx;
    padding: 10rpx 0;
    box-shadow: 0 8rpx 24rpx rgba(3, 105, 161, 0.02);
  }
  
  .dest-card {
    display: flex;
    align-items: center;
    padding: 24rpx 32rpx;
    border-bottom: 1rpx solid #f1f5f9;
    transition: background 0.2s;
    
    &:active { background: #f8fafc; }
    &:last-child { border-bottom: none; }
    
    .dest-icon {
      width: 88rpx;
      height: 88rpx;
      border-radius: 20rpx;
      margin-right: 24rpx;
    }
    
    .dest-info {
      flex: 1;
      .dest-name { font-size: 30rpx; font-weight: 700; color: #0f172a; display: block; margin-bottom: 4rpx; }
      .dest-sub { font-size: 22rpx; color: #64748b; }
    }
    
    .plan-btn {
      font-size: 24rpx;
      color: #0284c7;
      font-weight: 700;
      background: #f0fdf4;
      padding: 10rpx 20rpx;
      border-radius: 100rpx;
      border: 1rpx solid #dcfce7;
    }
  }
}

/* 正在热议 */
.hot-topic-section {
  .topic-list {
    white-space: nowrap;
    width: 100%;
    .topic-card {
      display: inline-block;
      width: 280rpx;
      margin-right: 20rpx;
      background: #fff;
      border-radius: 24rpx;
      overflow: hidden;
      box-shadow: 0 8rpx 20rpx rgba(3, 105, 161, 0.02);
      
      .topic-img { width: 100%; height: 180rpx; }
      .topic-info {
        padding: 16rpx;
        .topic-title { 
          font-size: 24rpx; 
          font-weight: 700; 
          color: #0f172a; 
          display: block; 
          white-space: normal; 
          height: 68rpx; 
          overflow: hidden;
          line-height: 1.4;
        }
        .topic-stats { font-size: 20rpx; color: #94a3b8; margin-top: 8rpx; display: block; }
      }
    }
  }
}

.ph-style { color: #cbd5e1; }
</style>

