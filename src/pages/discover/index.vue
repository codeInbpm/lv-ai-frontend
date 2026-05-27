<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { discoverApi, type HotDestination } from '../../api/discover'
import type { TravelPlan } from '../../api/plan'
import NavBar from '../../components/common/NavBar.vue'
import { useNavBar } from '../../composables/useNavBar'

const { totalHeight: navTotalHeight } = useNavBar()

const hotList = ref<HotDestination[]>([])
const loading = ref(false)

onMounted(async () => {
  await loadData()
})

async function loadData() {
  loading.value = true
  try {
    const hot = await discoverApi.getHotDestinations(20)
    hotList.value = hot || []
  } finally {
    loading.value = false
  }
}

function goCreate(destination?: string) {
  if (destination) {
    uni.setStorageSync('prefillDestination', destination)
  }
  uni.navigateTo({ url: '/pages/plan/create/index' })
}

// 替换失效的外链图片为本地图片
function getLocalImageFallback(url: string) {
  if (!url || url.includes('unsplash.com')) {
    if (url && url.includes('1543883391')) return '/static/images/sanya_beach.png'
    if (url && url.includes('1506744626753')) return '/static/images/yunnan_scenery.png'
    if (url && url.includes('1506744900247')) return '/static/images/chengdu_food.png'
    return '/static/images/sanya_beach.png'
  }
  return url
}
</script>

<template>
  <view class="discover-page">
    <NavBar
      transparent
      fixed
      :back="true"
      title="发现好去处"
      textColor="#ffffff"
      background="linear-gradient(135deg, #0369a1, #0ea5e9)"
      :placeholder="false"
    />

    <!-- 占位区：防止内容被 fixed 导航栏遮挡 -->
    <view :style="{ height: navTotalHeight + 'px', background: 'linear-gradient(135deg, #0369a1, #0ea5e9)' }" />

    <scroll-view class="scroll" scroll-y @scrolltolower="loadMore">

      <!-- 热门目的地 -->
      <view class="section">
        <view class="section-header">
          <text class="section-title">🔥 热门目的地</text>
        </view>
        <view class="hot-grid">
          <view
            class="hot-card"
            v-for="dest in hotList"
            :key="dest.name"
            @click="goCreate(dest.name)"
          >
            <view class="hot-img">
              <image v-if="dest.imageUrl" :src="getLocalImageFallback(dest.imageUrl)" mode="aspectFill" style="width:100%;height:100%;border-radius:16rpx;" />
              <text v-else class="hot-emoji">🏔</text>
            </view>
            <view class="hot-info">
              <text class="hot-name">{{ dest.name }}</text>
              <text class="hot-desc">{{ dest.description }}</text>
            </view>
            <text class="hot-btn">规划 ›</text>
          </view>
        </view>
      </view>



      <view style="height: 100rpx" />
    </scroll-view>
  </view>
</template>

<style lang="scss" scoped>
.discover-page { min-height: 100vh; background: var(--bg-page); display: flex; flex-direction: column; }

.header {
  background: linear-gradient(135deg, #0369a1, #0ea5e9);
  padding: 0 32rpx 28rpx;
}

.search-box {
  display: flex;
  align-items: center;
  background: rgba(255,255,255,0.18);
  border-radius: 24rpx;
  padding: 16rpx 20rpx;
  gap: 12rpx;
}
.search-icon { font-size: 28rpx; color: #fff; }
.search-input { flex: 1; font-size: 28rpx; color: #fff; }
.search-btn { font-size: 26rpx; color: rgba(255,255,255,0.85); padding-left: 16rpx; border-left: 1rpx solid rgba(255,255,255,0.3); }

.scroll { flex: 1; }
.section { padding: 32rpx 32rpx 0; }
.section-header { margin-bottom: 20rpx; }
.section-title { font-size: 32rpx; font-weight: 700; color: var(--text-primary); }

.hot-grid { display: flex; flex-direction: column; gap: 16rpx; }
.hot-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 20rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
  box-shadow: var(--shadow-sm);
}
.hot-img {
  width: 80rpx; height: 80rpx;
  background: var(--primary-light);
  border-radius: 16rpx;
  display: flex; align-items: center; justify-content: center;
}
.hot-emoji { font-size: 40rpx; }
.hot-info { flex: 1; }
.hot-name { font-size: 30rpx; font-weight: 600; color: var(--text-primary); display: block; }
.hot-desc { 
  font-size: 24rpx; 
  color: var(--text-tertiary); 
  margin-top: 6rpx; 
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.hot-btn { font-size: 26rpx; color: var(--primary); font-weight: 600; }

.empty {
  display: flex; flex-direction: column; align-items: center;
  padding: 80rpx 0; gap: 16rpx;
  font-size: 28rpx; color: var(--text-tertiary);
}
.empty-icon { font-size: 80rpx; }

.plan-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16rpx; }
.plan-card { background: #fff; border-radius: 20rpx; overflow: hidden; box-shadow: var(--shadow-sm); }
.plan-cover {
  height: 160rpx;
  background: linear-gradient(135deg, #bae6fd, #7dd3fc);
  display: flex; align-items: center; justify-content: center;
  position: relative;
}
.plan-emoji { font-size: 64rpx; }
.plan-days-badge {
  position: absolute; bottom: 10rpx; right: 10rpx;
  background: rgba(0,0,0,0.35); color: #fff;
  font-size: 20rpx; padding: 4rpx 10rpx; border-radius: 100rpx;
}
.plan-body { padding: 16rpx; }
.plan-title {
  font-size: 26rpx; font-weight: 600; color: var(--text-primary); display: block;
  overflow: hidden; white-space: nowrap; text-overflow: ellipsis; margin-bottom: 6rpx;
}
.plan-route { font-size: 22rpx; color: var(--text-tertiary); display: block; margin-bottom: 10rpx; }
.plan-footer { display: flex; justify-content: space-between; align-items: center; }
.plan-date { font-size: 20rpx; color: var(--text-tertiary); }
.plan-stats { display: flex; gap: 8rpx; font-size: 20rpx; color: var(--text-tertiary); }

.loading-more, .no-more {
  text-align: center; padding: 32rpx;
  font-size: 26rpx; color: var(--text-tertiary);
}
</style>
