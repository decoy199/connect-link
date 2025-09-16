import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { 
    port: 5173,
    host: '0.0.0.0'
  },
  // ★ Safari向け：依存を事前バンドルして再エクスポート問題を回避
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'axios', 'jwt-decode'],
  },
  // 念のためターゲットを下げる（開発時の変換に効く場合あり）
  esbuild: { target: 'es2019' },
})