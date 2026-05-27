<script setup lang="ts">
import { useRouter } from 'vue-router'

defineProps<{
  brandTitle: string
  brandSubtitle: string
  gradientVariant?: 'login' | 'register'
}>()
const router = useRouter()

const FEATURE_POOL = [
  { icon: 'mdi-brain', text: 'AI 智能解析简历' },
  { icon: 'mdi-target', text: '精准岗位匹配' },
  { icon: 'mdi-file-chart', text: '一键生成职业报告' },
  { icon: 'mdi-map-marker-path', text: '可视化晋升路径' },
  { icon: 'mdi-chart-line', text: '职业成长趋势分析' },
  { icon: 'mdi-magnify', text: '海量岗位数据库' },
  { icon: 'mdi-school', text: '技能差距精准定位' },
  { icon: 'mdi-account-tie', text: '个性化职业建议' },
  { icon: 'mdi-lightning-bolt', text: '秒级智能分析' },
]

function pickRandom<T>(arr: T[], n: number): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j]!, copy[i]!]
  }
  return copy.slice(0, n)
}

const features = pickRandom(FEATURE_POOL, 3)
</script>

<template>
  <div class="auth-root">
    <!-- 桌面端左侧品牌区 / 移动端顶部条 -->
    <div class="brand-panel" :class="gradientVariant === 'register' ? 'variant-register' : 'variant-login'">
      <!-- Blob 装饰 -->
      <div class="blob blob-1" />
      <div class="blob blob-2" />

      <div class="brand-inner">
        <!-- Logo -->
        <div class="brand-logo">
          <img src="@/assets/logo.svg" alt="Logo" width="40" height="40" style="filter: brightness(0) invert(1)" />
          <span class="brand-name">Career Planner</span>
        </div>

        <!-- 标语 -->
        <div class="brand-tagline">
          <div class="tagline-main">{{ brandTitle }}</div>
          <div class="tagline-sub">{{ brandSubtitle }}</div>
        </div>

        <!-- 功能亮点 -->
        <div class="feature-list">
          <div
            v-for="(feat, idx) in features"
            :key="feat.icon"
            class="feature-item"
            :style="{ animationDelay: `${0.4 + idx * 0.12}s` }"
          >
            <div class="feature-icon-wrap">
              <v-icon :icon="feat.icon" size="20" color="white" />
            </div>
            <span class="feature-text">{{ feat.text }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧 / 移动端主体 表单区 -->
    <div class="form-panel">
      <div class="form-inner">
        <v-btn
          variant="text"
          size="small"
          class="home-link-btn text-none mb-4"
          prepend-icon="mdi-arrow-left"
          aria-label="返回官网首页"
          @click="router.push('/')"
        >
          返回官网
        </v-btn>
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── 根容器 ───────────────────────────────────── */
.auth-root {
  display: flex;
  min-height: 100vh;
  background: #f8fafc;
}

/* ── 左侧品牌区 ──────────────────────────────── */
.brand-panel {
  position: relative;
  width: 42%;
  flex-shrink: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 40px;

  /* 渐变背景 */
  background: linear-gradient(135deg, #1976d2 0%, #6366f1 50%, #06b6d4 100%);
  background-size: 200% 200%;
  animation: gradient-shift 8s ease-in-out infinite;

  animation: brand-fadein 0.6s cubic-bezier(0.16, 1, 0.3, 1) both, gradient-shift 8s ease-in-out infinite;
}

.brand-panel.variant-register {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 40%, #06b6d4 100%);
  background-size: 200% 200%;
}

/* ── Blob ─────────────────────────────────────── */
.blob {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  filter: blur(2px);
  animation: morph 15s ease-in-out infinite;
}
.blob-1 {
  width: 280px;
  height: 280px;
  top: -60px;
  right: -60px;
  animation-delay: 0s;
}
.blob-2 {
  width: 220px;
  height: 220px;
  bottom: -40px;
  left: -50px;
  animation-delay: -7s;
}

/* ── 品牌内容 ─────────────────────────────────── */
.brand-inner {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 36px;
  color: white;
}

.brand-logo {
  display: flex;
  align-items: center;
  gap: 12px;
}
.brand-name {
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.tagline-main {
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1.3;
  margin-bottom: 8px;
}
.tagline-sub {
  font-size: 0.95rem;
  opacity: 0.82;
  line-height: 1.6;
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  animation: feat-slidein 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
}
.feature-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.feature-text {
  font-size: 0.9rem;
  font-weight: 500;
  opacity: 0.9;
}

/* ── 右侧表单区 ───────────────────────────────── */
.form-panel {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 40px;
  animation: form-fadein 0.6s 0.2s cubic-bezier(0.16, 1, 0.3, 1) both;
}
.form-inner {
  width: 100%;
  max-width: 420px;
}

.home-link-btn {
  color: #64748b;
  align-self: flex-start;
  border-radius: 999px;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.home-link-btn:hover {
  color: #1976d2;
  background: rgba(25, 118, 210, 0.08);
  transform: translateX(-1px);
}

/* ── 动画 ─────────────────────────────────────── */
@keyframes gradient-shift {
  0%,
  100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

@keyframes morph {
  0%,
  100% {
    border-radius: 60% 40% 70% 30% / 50% 60% 40% 50%;
    transform: scale(1) rotate(0deg);
  }
  33% {
    border-radius: 40% 60% 30% 70% / 60% 40% 70% 30%;
    transform: scale(1.05) rotate(5deg);
  }
  66% {
    border-radius: 70% 30% 50% 50% / 30% 70% 60% 40%;
    transform: scale(0.97) rotate(-3deg);
  }
}

@keyframes brand-fadein {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes form-fadein {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes feat-slidein {
  from {
    opacity: 0;
    transform: translateX(-12px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* ── 响应式：移动端 ──────────────────────────── */
@media (max-width: 959px) {
  .auth-root {
    flex-direction: column;
  }

  .brand-panel {
    width: 100%;
    min-height: 160px;
    padding: 28px 24px;
    animation: brand-fadein 0.5s cubic-bezier(0.16, 1, 0.3, 1) both, gradient-shift 8s ease-in-out infinite;
  }

  .brand-inner {
    gap: 16px;
    flex-direction: row;
    align-items: center;
    flex-wrap: wrap;
  }

  .tagline-main {
    font-size: 1.2rem;
  }
  .tagline-sub {
    font-size: 0.82rem;
  }

  .feature-list {
    flex-direction: row;
    gap: 12px;
  }
  .feature-text {
    font-size: 0.78rem;
  }

  .form-panel {
    padding: 32px 20px;
    align-items: flex-start;
  }
}
</style>
