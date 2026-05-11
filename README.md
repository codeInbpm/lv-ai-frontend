# 旅途AI - 微信小程序前端

> AI驱动的个性化智能旅游规划小程序 — UniApp + Vue 3 前端

## 技术栈

| 组件 | 版本 | 说明 |
|------|------|------|
| UniApp | 3.x | 跨端框架 |
| Vue 3 | 3.x | 渐进式框架 |
| TypeScript | 5.x | 类型系统 |
| Pinia | 2.x | 状态管理 |
| Vite | 5.x | 构建工具 |
| wot-design-uni | 1.4.x | UI组件库 |

## 快速开始

### 环境要求

- Node.js 18+
- pnpm 8+ 或 npm 9+
- HBuilderX（推荐）或 VSCode + uni-app 插件
- 微信开发者工具

### 1. 安装依赖

```bash
npm install
# 或
pnpm install
```

### 2. 修改配置

**修改后端API地址** `src/utils/request.ts`：
```ts
const BASE_URL = 'http://你的后端服务器IP:8080/api'
```

**修改微信AppID** `src/manifest.json`：
```json
{
  "mp-weixin": {
    "appid": "你的微信小程序AppID"
  }
}
```

### 3. 开发模式运行

```bash
npm run dev:mp-weixin
```

然后在微信开发者工具中导入 `dist/dev/mp-weixin` 目录。

### 4. 生产构建

```bash
npm run build:mp-weixin
```

上传 `dist/build/mp-weixin` 到微信小程序后台。

## 项目结构

```
src/
├── App.vue                  # 应用入口（全局样式/变量定义）
├── manifest.json            # 小程序配置（AppID等）
├── pages.json               # 页面路由 + TabBar配置
├── uni.scss                 # 全局基础样式
│
├── api/                     # API请求层
│   ├── user.ts              # 用户相关API
│   ├── plan.ts              # 行程相关API + 类型定义
│   ├── discover.ts          # 发现/攻略API
│   ├── execution.ts         # 打卡记账API
│   └── profile.ts           # 个人中心API
│
├── stores/                  # Pinia状态管理
│   ├── user.ts              # 用户状态（登录/信息）
│   └── plan.ts              # 行程状态（当前行程/列表）
│
├── utils/
│   └── request.ts           # Axios封装（uni.request）
│
└── pages/
    ├── login/index.vue       # 登录页
    ├── index/index.vue       # 首页（TabBar）
    ├── plan/
    │   ├── create/index.vue  # 创建行程页（表单输入）
    │   ├── result/index.vue  # AI生成结果页（时间轴展示）
    │   ├── detail/index.vue  # 行程详情+打卡+记账
    │   └── list/index.vue    # 我的行程列表（TabBar）
    ├── discover/index.vue    # 发现/攻略页（TabBar）
    └── profile/index.vue     # 个人中心（TabBar）
```

## 页面功能说明

### 登录页 `/pages/login/index`
- 渐变蓝色登录界面
- 微信一键登录（调用 `uni.login` 获取code，发送到后端）
- 功能特性介绍展示

### 首页 `/pages/index/index`
- 个性化问候（登录后显示昵称）
- AI规划入口（醒目的入口按钮）
- 轮播Banner（热门旅行场景）
- 热门目的地横向滚动列表
- 精选攻略卡片列表

### 创建行程 `/pages/plan/create/index`
- 出发地/目的地输入（支持地图选点 `uni.chooseLocation`）
- 日期选择器
- 天数/人数选择（Picker）
- 偏好标签多选（美食/摄影/亲子/情侣/自驾等）
- 预算输入
- 补充说明输入
- 提交到后端调用AI生成

### AI生成结果页 `/pages/plan/result/index`
- 行程头部信息（路线/天数/预算）
- 天数Tab切换
- 每日行程时间轴展示（景点/餐厅/酒店/交通）
- 每个项目显示：名称/地址/时长/费用/描述/Tips
- 底部操作：重新生成 | 保存行程

### 行程详情 `/pages/plan/detail/index`
- 顶部行程信息（状态/标题/路线/时间）
- 行程进度条（进行中状态）
- 天数Tab切换
- 每日行程时间轴（含打卡状态）
- 打卡/记账弹窗
- 分享/公开/开始行程操作

### 我的行程 `/pages/plan/list/index`
- 状态筛选Tab（全部/未开始/进行中/已完成）
- 行程卡片列表（含封面/路线/日期/人数）
- 删除行程
- 悬浮创建按钮

### 发现页 `/pages/discover/index`
- 搜索框（关键词搜索攻略）
- 热门目的地列表（点击跳转创建并预填目的地）
- 公开行程攻略网格展示
- 上拉加载更多

### 个人中心 `/pages/profile/index`
- 用户头像/昵称（点击修改）
- 旅行统计（行程数/进行中/已完成）
- 功能菜单（我的行程/收藏/足迹/设置）
- 邀请码展示和复制
- 退出登录

## 颜色主题

项目使用蓝绿为主色调，在 `App.vue` 中以 CSS 变量定义：

```scss
--primary: #0ea5e9;       // 主色（天空蓝）
--primary-light: #bae6fd; // 浅色主色
--primary-dark: #0369a1;  // 深色主色
--secondary: #f97316;     // 辅助色（橙色）
--success: #10b981;       // 成功色（绿色）
```

## wot-design-uni 组件使用

组件库文档：https://wot-design-uni.cn/

常用组件：
- `wd-button` - 按钮
- `wd-input` - 输入框
- `wd-picker` - 选择器
- `wd-toast` - 轻提示
- `wd-loading` - 加载
- `wd-skeleton` - 骨架屏

## 微信能力集成

### 已集成
- ✅ `uni.login` — 微信一键登录（获取code）
- ✅ `uni.chooseLocation` — 地图选点（出发地/目的地）
- ✅ `uni.chooseImage` — 选择图片（头像/打卡照片）
- ✅ `uni.setClipboardData` — 复制邀请码
- ✅ `uni.getSystemInfo` — 获取系统信息（适配状态栏）

### 待集成（需申请权限）
- 📋 订阅消息 — 行程提醒（需在微信后台申请）
- 📍 实时位置 — 导航功能（需申请 scope.userLocation）
- 📤 分享转发 — 行程分享（`uni.share` / `onShareAppMessage`）

## 注意事项

1. **微信AppID**：必须在 `manifest.json` 中填写真实的AppID，否则 `uni.login` 会报错
2. **网络请求**：微信小程序要求所有请求必须是HTTPS（开发时可在微信开发者工具中关闭校验）
3. **合法域名**：上线前需在微信公众平台配置后端域名为合法域名
4. **地图选点**：需要在微信公众平台配置腾讯地图Key，并在 `manifest.json` 中申请 `chooseLocation` 权限
5. **AI接口超时**：AI生成行程可能需要10-30秒，前端已添加 Loading 提示

## 打包上线

1. `npm run build:mp-weixin` 打包
2. 打开微信开发者工具
3. 点击「上传」，填写版本号
4. 在微信公众平台提交审核
5. 审核通过后发布
