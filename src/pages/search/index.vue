<script setup lang="ts">
import { ref, onMounted } from 'vue'
import NavBar from '../../components/common/NavBar.vue'
import { http } from '../../utils/request'

const userId = 1 // FIXME: 使用实际登录的 userId

const keyword = ref('')
const isSearching = ref(false)
const activeTab = ref('all') // 'all', 'dest'

const historyList = ref<string[]>([])
const hotList = ref<any[]>([])

onMounted(() => {
  fetchHotList()
  fetchHistory()
})

const fetchHotList = async () => {
  try {
    const res = await http.get<any[]>('/search/hot')
    hotList.value = res || []
  } catch (e) {}
}

const fetchHistory = async () => {
  try {
    const res = await http.get<string[]>('/search/history', { userId })
    historyList.value = res || []
  } catch (e) {}
}

const resultRankings = ref<any[]>([])
const resultNotes = ref<any[]>([])
const resultPlans = ref<any[]>([])

const handleSearch = async () => {
  if (!keyword.value.trim()) return
  isSearching.value = true
  
  // Add to history if not exists locally for immediate UI update
  if (!historyList.value.includes(keyword.value)) {
    historyList.value.unshift(keyword.value)
  }
  try {
    http.post(`/search/history/add?userId=${userId}&keyword=${encodeURIComponent(keyword.value)}`)
    
    const [notesRes, plansRes] = await Promise.all([
      http.get<any[]>(`/search/notes?keyword=${encodeURIComponent(keyword.value)}`),
      http.get<any[]>(`/search/plans?keyword=${encodeURIComponent(keyword.value)}`)
    ])
    resultNotes.value = notesRes || []
    resultPlans.value = plansRes || []
  } catch (e) {
    console.error(e)
  }
}

const handleTagClick = (tag: string) => {
  keyword.value = tag
  handleSearch()
}

const clearHistory = async () => {
  historyList.value = []
  try {
    await http.post(`/search/history/clear?userId=${userId}`)
  } catch (e) {}
}

const cancelSearch = () => {
  keyword.value = ''
  isSearching.value = false
}

const goDetail = (type: string, id: number) => {
  const urlMap: Record<string, string> = {
    ranking: `/pages/ranking/detail?id=${id}`,
    note: `/pages/note/detail?id=${id}`,
    plan: `/pages/plan/route/index?planId=${id}`
  }
  if (urlMap[type]) {
    uni.navigateTo({ url: urlMap[type] })
  }
}
</script>

<template>
  <view class="search-page">
    <NavBar title="搜索" back />
    
    <!-- 搜索框 -->
    <view class="search-header">
      <view class="search-input-box">
        <text class="search-icon">🔍</text>
        <input 
          class="search-input" 
          v-model="keyword" 
          placeholder="春山行旅·我的徒步帖" 
          confirm-type="search"
          @confirm="handleSearch"
        />
        <text class="clear-icon" v-if="keyword" @click="keyword = ''">✖</text>
      </view>
      <text class="cancel-btn" @click="cancelSearch">取消</text>
    </view>

    <!-- 搜索结果态 -->
    <view v-if="isSearching" class="search-results">
      <!-- Tabs -->
      <view class="tabs">
        <view class="tab-item" :class="{ active: activeTab === 'all' }" @click="activeTab = 'all'">全部</view>
        <view class="tab-item" :class="{ active: activeTab === 'dest' }" @click="activeTab = 'dest'">搜{{ keyword }}</view>
      </view>

      <scroll-view scroll-y class="result-scroll">
        <!-- 榜单 -->
        <view class="result-section" v-if="resultRankings.length > 0">
          <view class="section-title">榜单</view>
          <view 
            class="ranking-item" 
            v-for="item in resultRankings" 
            :key="item.id"
            @click="goDetail('ranking', item.id)"
          >
            <view class="r-icon">👍</view>
            <view class="r-info">
              <view class="r-title" v-html="item.title.replace(keyword, `<span style='color:#00bac7'>${keyword}</span>`)"></view>
              <view class="r-cat">{{ item.category }}</view>
            </view>
            <view class="r-view">👁 {{ item.viewCount }}</view>
          </view>
        </view>

        <!-- 游记 -->
        <view class="result-section" v-if="resultNotes.length > 0">
          <view class="section-title">游记</view>
          <view 
            class="note-item" 
            v-for="item in resultNotes" 
            :key="item.id"
            @click="goDetail('note', item.id)"
          >
            <view class="n-icon">📖</view>
            <view class="n-info">
              <view class="n-title" v-html="item.title ? item.title.replace(keyword, `<span style='color:#00bac7'>${keyword}</span>`) : ''"></view>
              <view class="n-desc">{{ item.createTime ? item.createTime.substring(0, 10) : '' }}<br>用户 ID: {{ item.userId }}</view>
            </view>
            <view class="n-view">👍 {{ item.likeCount || 0 }}</view>
          </view>
          <view class="more-link">··· 更多相关结果</view>
        </view>

        <!-- 路线 -->
        <view class="result-section" v-if="resultPlans.length > 0">
          <view class="section-title">路线</view>
          <view 
            class="plan-item" 
            v-for="item in resultPlans" 
            :key="item.id"
            @click="goDetail('plan', item.id)"
          >
            <view class="p-icon">🗺️</view>
            <view class="p-info">
              <view class="p-title" v-html="item.title ? item.title.replace(keyword, `<span style='color:#00bac7'>${keyword}</span>`) : ''"></view>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 初始搜索态 -->
    <scroll-view scroll-y class="search-initial" v-else>
      <!-- 历史记录 -->
      <view class="history-section" v-if="historyList.length > 0">
        <view class="section-header">
          <text class="title">🕒 历史记录</text>
          <text class="clear-btn" @click="clearHistory">清空</text>
        </view>
        <view class="tag-list">
          <view class="tag-item" v-for="(item, index) in historyList" :key="index" @click="handleTagClick(item)">
            {{ item }}
          </view>
        </view>
      </view>

      <!-- 热门搜索 -->
      <view class="hot-section">
        <view class="section-header">
          <text class="title">🔥 热门搜索</text>
        </view>
        <view class="tag-list">
          <view class="tag-item" v-for="(item, index) in hotList" :key="index" @click="handleTagClick(item.keyword)">
            {{ item.keyword }}
            <text v-if="item.isHot" class="hot-badge">HOT</text>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<style scoped>
.search-page {
  min-height: 100vh;
  background-color: #fff;
  display: flex;
  flex-direction: column;
}

.search-header {
  display: flex;
  align-items: center;
  padding: 20rpx 30rpx;
  background: #fff;
}

.search-input-box {
  flex: 1;
  display: flex;
  align-items: center;
  background: #f1f5f9;
  border-radius: 100rpx;
  padding: 10rpx 24rpx;
  height: 72rpx;
}

.search-icon {
  font-size: 28rpx;
  color: #94a3b8;
  margin-right: 12rpx;
}

.search-input {
  flex: 1;
  font-size: 28rpx;
}

.clear-icon {
  padding: 10rpx;
  color: #94a3b8;
  font-size: 24rpx;
}

.cancel-btn {
  margin-left: 20rpx;
  font-size: 30rpx;
  color: #334155;
}

/* Initial State */
.search-initial {
  flex: 1;
  padding: 30rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.section-header .title {
  font-size: 30rpx;
  font-weight: bold;
  color: #0f172a;
}

.clear-btn {
  font-size: 24rpx;
  color: #94a3b8;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
  margin-bottom: 40rpx;
}

.tag-item {
  background: #f8fafc;
  padding: 12rpx 24rpx;
  border-radius: 100rpx;
  font-size: 26rpx;
  color: #334155;
  position: relative;
}

.hot-badge {
  position: absolute;
  top: -10rpx;
  right: -10rpx;
  background: #ef4444;
  color: #fff;
  font-size: 16rpx;
  padding: 2rpx 8rpx;
  border-radius: 8rpx;
  font-weight: bold;
}

/* Results State */
.search-results {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
}

.tabs {
  display: flex;
  background: #fff;
  padding: 0 30rpx;
}

.tab-item {
  padding: 20rpx 40rpx;
  font-size: 30rpx;
  color: #64748b;
  position: relative;
}

.tab-item.active {
  color: #00bac7;
  font-weight: bold;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 40rpx;
  height: 6rpx;
  background: #00bac7;
  border-radius: 6rpx;
}

.result-scroll {
  flex: 1;
  padding-bottom: 40rpx;
}

.result-section {
  background: #fff;
  margin-top: 20rpx;
  padding: 0 30rpx;
}

.section-title {
  font-size: 28rpx;
  color: #94a3b8;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f1f5f9;
}

.ranking-item, .note-item, .plan-item {
  display: flex;
  align-items: flex-start;
  padding: 30rpx 0;
  border-bottom: 1rpx solid #f1f5f9;
}

.r-icon, .n-icon, .p-icon {
  width: 60rpx;
  font-size: 40rpx;
  text-align: center;
  margin-right: 20rpx;
}

.r-info, .n-info, .p-info {
  flex: 1;
}

.r-title, .n-title, .p-title {
  font-size: 30rpx;
  color: #0f172a;
  margin-bottom: 8rpx;
  font-weight: 500;
}

.r-cat, .n-desc {
  font-size: 24rpx;
  color: #94a3b8;
  line-height: 1.5;
}

.r-view, .n-view {
  font-size: 24rpx;
  color: #94a3b8;
  margin-left: 20rpx;
}

.more-link {
  font-size: 26rpx;
  color: #00bac7;
  padding: 30rpx 0;
}
</style>
