<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { http } from '../../utils/request'

const categories = ref<any[]>([])
const activeCategoryId = ref(0)
const topics = ref<any[]>([])
const keyword = ref('')

async function loadCategories() {
  const res = await http.get('/topic/categories')
  categories.value = [{ id: 0, name: '我的关注' }, ...res]
  if (res.length > 0) {
    activeCategoryId.value = 0
    loadTopics()
  }
}

async function loadTopics() {
  const params: any = {}
  if (activeCategoryId.value > 0) params.categoryId = activeCategoryId.value
  if (keyword.value) params.keyword = keyword.value
  
  const res = await http.get('/topic/list', params)
  topics.value = res
}

function handleCategoryClick(id: number) {
  activeCategoryId.value = id
  loadTopics()
}

function handleSearch() {
  loadTopics()
}

function selectTopic(topic: any) {
  // 返回话题给上一页
  const pages = getCurrentPages()
  const prevPage = pages[pages.length - 2]
  // @ts-ignore
  prevPage.$vm.addTopic(topic.title)
  uni.navigateBack()
}

onMounted(() => {
  loadCategories()
})
</script>

<template>
  <view class="topic-select">
    <view class="search-bar">
      <view class="search-input-box">
        <text class="search-icon">🔍</text>
        <input 
          v-model="keyword" 
          placeholder="搜话题..." 
          confirm-type="search"
          @confirm="handleSearch"
        />
      </view>
    </view>

    <view class="main">
      <scroll-view class="aside" scroll-y>
        <view 
          v-for="cat in categories" 
          :key="cat.id"
          class="cat-item"
          :class="{ active: activeCategoryId === cat.id }"
          @click="handleCategoryClick(cat.id)"
        >
          {{ cat.name }}
        </view>
      </scroll-view>

      <scroll-view class="content" scroll-y>
        <view class="topic-header" v-if="activeCategoryId > 0">
          <text class="title">{{ categories.find(c => c.id === activeCategoryId)?.name }}</text>
        </view>
        
        <view class="topic-list">
          <view 
            class="topic-card" 
            v-for="topic in topics" 
            :key="topic.id"
            @click="selectTopic(topic)"
          >
            <image :src="topic.coverUrl" mode="aspectFill" class="t-img" />
            <view class="t-info">
              <text class="t-title"># {{ topic.title }}</text>
              <text class="t-count">关注 {{ topic.followerCount > 10000 ? (topic.followerCount / 10000).toFixed(1) + '万+' : topic.followerCount }}</text>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.topic-select {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #fff;
}
.search-bar {
  padding: 20rpx 32rpx;
  background: #fff;
}
.search-input-box {
  background: #f1f5f9;
  height: 72rpx;
  border-radius: 36rpx;
  display: flex;
  align-items: center;
  padding: 0 30rpx;
  .search-icon { font-size: 28rpx; margin-right: 16rpx; }
  input { flex: 1; font-size: 28rpx; }
}

.main {
  flex: 1;
  display: flex;
  overflow: hidden;
}
.aside {
  width: 180rpx;
  background: #f8fafc;
  height: 100%;
}
.cat-item {
  height: 100rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  color: #64748b;
  position: relative;
  &.active {
    background: #fff;
    color: #0ea5e9;
    font-weight: 600;
    &::before {
      content: '';
      position: absolute;
      left: 0; top: 30rpx; bottom: 30rpx;
      width: 8rpx;
      background: #0ea5e9;
      border-radius: 0 4rpx 4rpx 0;
    }
  }
}

.content {
  flex: 1;
  height: 100%;
  padding: 0 32rpx;
}
.topic-header {
  padding: 30rpx 0;
  .title { font-size: 30rpx; font-weight: 600; color: #0ea5e9; }
}

.topic-list {
  padding-bottom: 40rpx;
}
.topic-card {
  display: flex;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f1f5f9;
  .t-img {
    width: 88rpx; height: 88rpx;
    border-radius: 12rpx;
    margin-right: 20rpx;
  }
  .t-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    .t-title { font-size: 28rpx; font-weight: 500; color: #1e293b; margin-bottom: 6rpx; }
    .t-count { font-size: 22rpx; color: #94a3b8; }
  }
}
</style>
