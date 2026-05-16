<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { marked } from 'marked'
import NavBar from '../../components/common/NavBar.vue'
import { http } from '../../utils/request'

marked.setOptions({ breaks: true, gfm: true })

function mdToHtml(text: string): string {
  if (!text) return ''
  try {
    return marked.parse(text) as string
  } catch {
    return text.replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }
}

function copyContent(content: string) {
  uni.setClipboardData({
    data: content,
    success: () => uni.showToast({ title: '已复制', icon: 'success', duration: 1500 })
  })
}

const planId = ref<string>('')
const sessionId = ref<string>('')
const messages = ref<any[]>([])
const inputText = ref('')
const loading = ref(false)
const scrollViewId = ref('')
const currentLocation = ref<string>('')

onLoad((options: any) => {
  if (options.planId) {
    planId.value = options.planId
    sessionId.value = options.planId // Use planId as sessionId
  } else {
    // Generate a random session id if not from plan
    sessionId.value = 'session_' + Date.now()
  }
})

onMounted(async () => {
  await fetchHistory()
  
  // Try to get location
  uni.getLocation({
    type: 'wgs84',
    success: (res) => {
      // Dummy location just to show AI context
      currentLocation.value = `纬度:${res.latitude}, 经度:${res.longitude}`
    }
  })
})

async function fetchHistory() {
  try {
    const res = await http.get('/ai/companion/history', { sessionId: sessionId.value })
    if (res && res.length > 0) {
      messages.value = res
    } else {
      // Default greeting
      messages.value = [{
        id: 'welcome',
        role: 'assistant',
        content: '你好呀！我是你的旅途智能管家 🤖️，有什么可以帮你的吗？不管是附近美食、避坑建议还是修改行程，都可以直接告诉我哦！',
        createTime: new Date().toISOString()
      }]
    }
    scrollToBottom()
  } catch (e) {
    console.error(e)
  }
}

async function sendMessage() {
  if (!inputText.value.trim() || loading.value) return
  
  const msg = inputText.value.trim()
  inputText.value = ''
  
  // Push user msg
  messages.value.push({
    id: 'temp_' + Date.now(),
    role: 'user',
    content: msg,
    createTime: new Date().toISOString()
  })
  scrollToBottom()
  
  loading.value = true
  
  // Push a loading assistant msg
  const loadingId = 'loading_' + Date.now()
  messages.value.push({
    id: loadingId,
    role: 'assistant',
    content: '正在思考中...',
    createTime: new Date().toISOString(),
    isLoading: true
  })
  scrollToBottom()
  
  try {
    const payload: any = {
      sessionId: sessionId.value,
      message: msg,
      planId: planId.value ? Number(planId.value) : undefined,
      location: currentLocation.value || undefined
    }
    
    const res = await http.post('/ai/companion/chat', payload)
    
    // Remove loading msg
    const index = messages.value.findIndex(m => m.id === loadingId)
    if (index > -1) {
      messages.value.splice(index, 1)
    }
    
    // Push real response
    messages.value.push({
      id: 'res_' + Date.now(),
      role: 'assistant',
      content: res,
      createTime: new Date().toISOString()
    })
  } catch (e) {
    const index = messages.value.findIndex(m => m.id === loadingId)
    if (index > -1) {
      messages.value[index].content = '抱歉，网络开小差了，请重试~'
      messages.value[index].isLoading = false
    }
  } finally {
    loading.value = false
    scrollToBottom()
  }
}

function scrollToBottom() {
  nextTick(() => {
    if (messages.value.length > 0) {
      scrollViewId.value = 'msg_' + (messages.value.length - 1)
    }
  })
}
</script>

<template>
  <view class="chat-page">
    <NavBar fixed back title="旅途智能管家" />
    
    <scroll-view 
      class="msg-list" 
      scroll-y 
      :scroll-into-view="scrollViewId"
      scroll-with-animation
    >
      <view class="msg-padding-top"></view>
      
      <view 
        v-for="(msg, index) in messages" 
        :key="msg.id || index"
        :id="'msg_' + index"
        class="msg-row"
        :class="msg.role === 'user' ? 'msg-right' : 'msg-left'"
      >
        <image v-if="msg.role === 'assistant'" class="avatar" src="/static/ai-avatar.png" />
        <view class="bubble-wrap">
          <view class="bubble" :class="{ 'loading-bubble': msg.isLoading }">
            <rich-text v-if="msg.role === 'assistant' && !msg.isLoading" class="msg-rich" :nodes="mdToHtml(msg.content)"></rich-text>
            <text v-else class="msg-text">{{ msg.content }}</text>
            <view v-if="msg.role === 'assistant' && !msg.isLoading" class="copy-btn" @click="copyContent(msg.content)">
              <text class="copy-icon">▦</text>
            </view>
          </view>
        </view>
        <image v-if="msg.role === 'user'" class="avatar" src="/static/user-avatar.png" />
      </view>
      
      <view class="msg-padding-bottom"></view>
    </scroll-view>

    <!-- 底部输入框 -->
    <view class="input-bar">
      <view class="input-wrap">
        <input 
          class="chat-input" 
          v-model="inputText" 
          placeholder="问问周围有什么好吃的？" 
          confirm-type="send"
          @confirm="sendMessage"
        />
      </view>
      <button class="send-btn" :disabled="loading || !inputText.trim()" @click="sendMessage">发送</button>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.chat-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f1f5f9;
}

.msg-list {
  flex: 1;
  width: 100%;
}
.msg-padding-top { height: 40rpx; }
.msg-padding-bottom { height: 140rpx; }

.msg-row {
  display: flex;
  margin-bottom: 32rpx;
  padding: 0 32rpx;
}

.msg-left {
  justify-content: flex-start;
  .avatar { margin-right: 20rpx; background: #0ea5e9; }
  .bubble {
    background: #fff;
    color: #334155;
    border-radius: 0 24rpx 24rpx 24rpx;
    box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.05);
  }
}

.msg-right {
  justify-content: flex-end;
  .avatar { margin-left: 20rpx; background: #cbd5e1; }
  .bubble {
    background: #0ea5e9;
    color: #fff;
    border-radius: 24rpx 0 24rpx 24rpx;
    box-shadow: 0 4rpx 12rpx rgba(14,165,233,0.2);
  }
}

.avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  flex-shrink: 0;
}

.bubble-wrap {
  max-width: 65%;
}
.bubble {
  padding: 20rpx 24rpx;
  font-size: 28rpx;
  line-height: 1.5;
  word-break: break-all;
}

.loading-bubble {
  color: #94a3b8 !important;
  font-style: italic;
}

.msg-rich {
  font-size: 28rpx;
  line-height: 1.6;
  word-break: break-all;
}

.copy-btn {
  display: flex;
  justify-content: flex-end;
  margin-top: 12rpx;
  padding-top: 10rpx;
  border-top: 1rpx solid rgba(0, 0, 0, 0.06);
}

.copy-icon {
  font-size: 28rpx;
  color: #94a3b8;
  padding: 4rpx 12rpx;
}

/* 底部输入框 */
.input-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  padding: 20rpx 32rpx calc(20rpx + env(safe-area-inset-bottom));
  display: flex;
  align-items: center;
  gap: 20rpx;
  box-shadow: 0 -4rpx 20rpx rgba(0,0,0,0.05);
}

.input-wrap {
  flex: 1;
  background: #f1f5f9;
  border-radius: 40rpx;
  padding: 0 32rpx;
}
.chat-input {
  height: 80rpx;
  font-size: 28rpx;
}

.send-btn {
  background: #0ea5e9;
  color: #fff;
  font-size: 28rpx;
  font-weight: 600;
  height: 80rpx;
  line-height: 80rpx;
  border-radius: 40rpx;
  padding: 0 40rpx;
  margin: 0;
  
  &[disabled] {
    background: #bae6fd;
    color: #fff;
  }
}
</style>
