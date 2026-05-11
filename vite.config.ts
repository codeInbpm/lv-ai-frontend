import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

export default defineConfig({
    plugins: [uni()],
    // 针对小程序端的优化配置
    optimizeDeps: {
        // 强制包含 uni-app 相关的核心依赖，减少 Vite 扫描警告
        include: [
            '@dcloudio/uni-ui',
            '@dcloudio/uni-app',
            'vue'
        ]
    },
    server: {
        // 注意：此代理仅在 H5 环境生效
        proxy: {
            '/api': {
                target: 'http://localhost:8080',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api/, '')
            }
        }
    }
})