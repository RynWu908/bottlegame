import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * @brief Vite 构建配置
 * @desc base 支持 GitHub Pages 子路径（通过 GITHUB_PAGES_BASE 环境变量注入）
 * @note 本地开发无需设置 base，默认 '/'
 */
export default defineConfig({
    base: process.env.GITHUB_PAGES_BASE || '/',
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['icon-512.jpg'],
            manifest: {
                name: '倒水瓶 - 益智游戏',
                short_name: '倒水瓶',
                description: '排序颜色水，挑战 50+ 关卡。无需广告，纯享乐趣。',
                theme_color: '#fce4ec',
                background_color: '#fce4ec',
                display: 'standalone',
                orientation: 'any',
                lang: 'zh-CN',
                icons: [
                    {
                        src: 'icon-512.jpg',
                        sizes: '512x512',
                        type: 'image/jpeg',
                        purpose: 'any',
                    },
                    {
                        src: 'icon-512.jpg',
                        sizes: '512x512',
                        type: 'image/jpeg',
                        purpose: 'maskable',
                    },
                ],
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,svg,jpg,png,woff2}'],
            },
        }),
    ],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './tests/setup.ts',
        include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    },
});
