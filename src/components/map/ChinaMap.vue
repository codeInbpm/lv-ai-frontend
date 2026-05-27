<script setup lang="ts">
import { computed } from 'vue'

interface CityMarker {
  city: string
  count: number
}

const props = defineProps<{
  checkedCities: CityMarker[]
}>()

const emit = defineEmits<{
  cityTap: [city: string]
}>()

// 城市坐标 (百分比定位, viewBox 600x520 映射到百分比)
const cityPositions: Record<string, { left: string; top: string }> = {
  '北京': { left: '60.8%', top: '31.5%' },
  '上海': { left: '71.3%', top: '49.6%' },
  '天津': { left: '62.8%', top: '33.7%' },
  '重庆': { left: '48.8%', top: '54.2%' },
  '广州': { left: '58.0%', top: '71.5%' },
  '深圳': { left: '61.3%', top: '72.7%' },
  '杭州': { left: '69.0%', top: '53.1%' },
  '南京': { left: '66.7%', top: '46.2%' },
  '成都': { left: '41.3%', top: '52.9%' },
  '武汉': { left: '55.8%', top: '51.5%' },
  '西安': { left: '49.7%', top: '41.3%' },
  '长沙': { left: '53.7%', top: '61.9%' },
  '郑州': { left: '58.0%', top: '43.3%' },
  '济南': { left: '64.7%', top: '38.8%' },
  '哈尔滨': { left: '73.7%', top: '11.2%' },
  '沈阳': { left: '70.8%', top: '28.8%' },
  '大连': { left: '70.0%', top: '33.1%' },
  '昆明': { left: '37.0%', top: '68.8%' },
  '贵阳': { left: '45.8%', top: '63.8%' },
  '福州': { left: '67.0%', top: '61.2%' },
  '厦门': { left: '66.3%', top: '65.0%' },
  '合肥': { left: '63.0%', top: '49.6%' },
  '南昌': { left: '60.8%', top: '57.7%' },
  '太原': { left: '54.7%', top: '34.6%' },
  '石家庄': { left: '59.2%', top: '35.0%' },
  '兰州': { left: '41.3%', top: '39.4%' },
  '西宁': { left: '36.3%', top: '43.8%' },
  '呼和浩特': { left: '53.0%', top: '26.5%' },
  '乌鲁木齐': { left: '19.7%', top: '17.7%' },
  '拉萨': { left: '15.3%', top: '54.8%' },
  '南宁': { left: '46.3%', top: '72.1%' },
  '海口': { left: '55.3%', top: '80.4%' },
  '台北': { left: '70.3%', top: '67.7%' },
  '香港': { left: '62.7%', top: '72.3%' },
  '澳门': { left: '60.3%', top: '73.8%' },
  '苏州': { left: '68.7%', top: '47.7%' },
  '无锡': { left: '68.0%', top: '47.1%' },
  '宁波': { left: '70.0%', top: '54.2%' },
  '温州': { left: '68.3%', top: '58.7%' },
  '青岛': { left: '68.7%', top: '38.1%' },
  '烟台': { left: '68.0%', top: '36.9%' },
  '丽江': { left: '35.3%', top: '65.8%' },
  '大理': { left: '35.8%', top: '67.3%' },
  '桂林': { left: '50.0%', top: '68.3%' },
  '三亚': { left: '54.2%', top: '81.2%' },
  '张家界': { left: '52.0%', top: '58.1%' },
  '黄山': { left: '65.0%', top: '52.9%' },
  '九寨沟': { left: '39.7%', top: '50.4%' },
  '敦煌': { left: '31.3%', top: '33.7%' },
  '林芝': { left: '17.5%', top: '58.7%' },
  '呼伦贝尔': { left: '64.7%', top: '10.6%' },
  '阿勒泰': { left: '19.7%', top: '9.2%' },
  '西双版纳': { left: '37.5%', top: '74.6%' },
  '银川': { left: '46.7%', top: '31.3%' },
  '喀什': { left: '18.3%', top: '31.5%' },
  '日喀则': { left: '13.0%', top: '53.5%' },
  '漠河': { left: '68.3%', top: '5.8%' },
  '延吉': { left: '75.0%', top: '21.9%' },
  '赤峰': { left: '58.3%', top: '25.0%' },
  '唐山': { left: '62.3%', top: '32.3%' },
  '秦皇岛': { left: '64.0%', top: '30.8%' },
  '承德': { left: '61.0%', top: '29.2%' },
  '大同': { left: '53.7%', top: '30.0%' },
}

// 已打卡城市标记数据
const markerDots = computed(() => {
  return props.checkedCities.map(c => {
    const pos = cityPositions[c.city]
    if (!pos) return null
    return { city: c.city, count: c.count, ...pos }
  }).filter(Boolean) as Array<{ city: string; count: number; left: string; top: string }>
})

function onMarkerTap(city: string) {
  emit('cityTap', city)
}
</script>

<template>
  <view class="china-map-wrap">
    <!-- 中国地图背景 -->
    <view class="map-bg">
      <!-- 省份色块 (纯 CSS 定位, 模拟中国地图轮廓) -->
      <view class="province p-xinjiang" />
      <view class="province p-xizang" />
      <view class="province p-qinghai" />
      <view class="province p-gansu" />
      <view class="province p-neimenggu" />
      <view class="province p-heilongjiang" />
      <view class="province p-jilin" />
      <view class="province p-liaoning" />
      <view class="province p-hebei" />
      <view class="province p-shanxi" />
      <view class="province p-shandong" />
      <view class="province p-henan" />
      <view class="province p-jiangsu" />
      <view class="province p-anhui" />
      <view class="province p-zhejiang" />
      <view class="province p-jiangxi" />
      <view class="province p-fujian" />
      <view class="province p-hubei" />
      <view class="province p-hunan" />
      <view class="province p-guangdong" />
      <view class="province p-guangxi" />
      <view class="province p-hainan" />
      <view class="province p-sichuan" />
      <view class="province p-yunnan" />
      <view class="province p-guizhou" />
      <view class="province p-chongqing" />
      <view class="province p-shaanxi" />
      <view class="province p-ninxia" />
      <view class="province p-beijing" />
      <view class="province p-tianjin" />
      <view class="province p-shanghai" />
      <view class="province p-taiwan" />
      <view class="province p-hongkong" />
      <view class="province p-aomen" />
      <!-- 南海诸岛 -->
      <view class="nanhai-box">
        <text class="nanhai-title">南海诸岛</text>
      </view>
    </view>

    <!-- 未打卡城市名 (灰色小字) -->
    <view v-for="(pos, name) in cityPositions" :key="'label-' + name"
      class="city-label"
      :style="{ left: pos.left, top: pos.top }"
      v-if="!checkedCities.find(c => c.city === name)">
      <text class="city-label-text">{{ name }}</text>
    </view>

    <!-- 已打卡城市标记 -->
    <view v-for="dot in markerDots" :key="dot.city"
      class="marker-wrap"
      :style="{ left: dot.left, top: dot.top }"
      @click="onMarkerTap(dot.city)">
      <view class="marker-pulse" />
      <view class="marker-dot" />
      <view class="marker-inner" />
      <text class="marker-name">{{ dot.city }}</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.china-map-wrap {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  background: linear-gradient(180deg, #e8f4f8 0%, #d4eaf0 100%);
  border-radius: 16rpx;
}

.map-bg {
  position: absolute;
  inset: 0;
}

/* 省份色块 — 简笔画风格 */
.province {
  position: absolute;
  background: #d6eade;
  border: 1.5px solid #a8c8b8;
  border-radius: 4px;
}

/* 西北 */
.p-xinjiang   { left: 4%; top: 4%; width: 28%; height: 30%; border-radius: 8px 4px 12px 4px; }
.p-xizang     { left: 4%; top: 38%; width: 26%; height: 32%; border-radius: 4px 8px 8px 12px; }
.p-qinghai    { left: 20%; top: 32%; width: 14%; height: 18%; border-radius: 6px; }
.p-gansu      { left: 26%; top: 22%; width: 16%; height: 24%; border-radius: 12px 4px 6px 4px; }
.p-ninxia     { left: 40%; top: 24%; width: 5%; height: 8%; border-radius: 4px; }
.p-shaanxi    { left: 42%; top: 32%; width: 7%; height: 16%; border-radius: 4px 4px 8px 4px; }

/* 东北 */
.p-neimenggu  { left: 34%; top: 4%; width: 28%; height: 24%; border-radius: 6px 12px 4px 8px; }
.p-heilongjiang { left: 64%; top: 2%; width: 14%; height: 18%; border-radius: 8px 4px 4px 6px; }
.p-jilin      { left: 66%; top: 18%; width: 10%; height: 10%; border-radius: 4px; }
.p-liaoning   { left: 64%; top: 26%; width: 10%; height: 10%; border-radius: 4px 4px 8px 4px; }

/* 华北 */
.p-beijing    { left: 58%; top: 25%; width: 3%; height: 4%; border-radius: 3px; background: #cee4d8; }
.p-tianjin    { left: 61%; top: 27%; width: 2.5%; height: 3.5%; border-radius: 3px; background: #cee4d8; }
.p-hebei      { left: 55%; top: 24%; width: 10%; height: 15%; border-radius: 6px; }
.p-shanxi     { left: 48%; top: 24%; width: 8%; height: 15%; border-radius: 4px; }

/* 华东 */
.p-shandong   { left: 58%; top: 33%; width: 12%; height: 9%; border-radius: 4px 8px 4px 4px; }
.p-henan      { left: 50%; top: 37%; width: 10%; height: 9%; border-radius: 4px; }
.p-jiangsu    { left: 62%; top: 40%; width: 8%; height: 10%; border-radius: 4px; }
.p-anhui      { left: 58%; top: 42%; width: 7%; height: 10%; border-radius: 4px; }
.p-shanghai   { left: 70%; top: 47%; width: 2.5%; height: 3%; border-radius: 3px; background: #cee4d8; }
.p-zhejiang   { left: 65%; top: 48%; width: 7%; height: 10%; border-radius: 4px 4px 4px 8px; }
.p-jiangxi    { left: 57%; top: 50%; width: 7%; height: 13%; border-radius: 4px; }
.p-fujian     { left: 64%; top: 55%; width: 7%; height: 12%; border-radius: 4px 4px 8px 4px; }
.p-taiwan     { left: 72%; top: 62%; width: 3%; height: 9%; border-radius: 4px; }

/* 华中 */
.p-hubei      { left: 48%; top: 43%; width: 10%; height: 9%; border-radius: 4px; }
.p-hunan      { left: 48%; top: 52%; width: 9%; height: 11%; border-radius: 4px; }

/* 华南 */
.p-guangdong  { left: 52%; top: 63%; width: 13%; height: 10%; border-radius: 4px 4px 8px 4px; }
.p-guangxi    { left: 42%; top: 65%; width: 12%; height: 10%; border-radius: 4px 4px 8px 8px; }
.p-hainan     { left: 51%; top: 77%; width: 5%; height: 6%; border-radius: 50%; }
.p-hongkong   { left: 63%; top: 72%; width: 1.5%; height: 1.5%; border-radius: 2px; background: #c4dccf; }
.p-aomen      { left: 61%; top: 73%; width: 1.2%; height: 1.2%; border-radius: 2px; background: #c4dccf; }

/* 西南 */
.p-sichuan    { left: 30%; top: 38%; width: 16%; height: 18%; border-radius: 8px; }
.p-chongqing  { left: 44%; top: 48%; width: 5%; height: 6%; border-radius: 4px; background: #cde4d8; }
.p-guizhou    { left: 41%; top: 58%; width: 9%; height: 8%; border-radius: 4px; }
.p-yunnan     { left: 30%; top: 58%; width: 13%; height: 18%; border-radius: 4px 4px 8px 8px; }

/* 南海诸岛示意 */
.nanhai-box {
  position: absolute;
  right: 8rpx;
  bottom: 8rpx;
  width: 120rpx;
  height: 100rpx;
  border: 1.5px dashed #b8d8e8;
  border-radius: 8rpx;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 8rpx;
}
.nanhai-title {
  font-size: 16rpx;
  color: #8bb8cc;
}

/* 城市名标签 */
.city-label {
  position: absolute;
  transform: translate(12rpx, -50%);
  pointer-events: none;
}
.city-label-text {
  font-size: 16rpx;
  color: #8ca8b8;
}

/* 已打卡标记 */
.marker-wrap {
  position: absolute;
  transform: translate(-50%, -50%);
  z-index: 10;
}
.marker-pulse {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background: rgba(236,72,153,0.15);
}
.marker-dot {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 24rpx;
  height: 24rpx;
  border-radius: 50%;
  background: #ec4899;
}
.marker-inner {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: #fff;
}
.marker-name {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(16rpx, -50%);
  font-size: 22rpx;
  color: #ec4899;
  font-weight: 600;
  white-space: nowrap;
}
</style>
