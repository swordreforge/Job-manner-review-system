<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const { mobile } = useDisplay()
const mobileMenu = ref(false)

// ─── 可见性控制 ───
const heroVisible = ref(false)
const featuresVisible = ref(false)
const comparisonVisible = ref(false)
const stepsVisible = ref(false)
const scrollStoryVisible = ref(false)
const statsVisible = ref(false)
const testimonialsVisible = ref(false)
const faqVisible = ref(false)
const ctaVisible = ref(false)
const scrollStorySectionRef = ref<HTMLElement | null>(null)
const scrollStoryProgress = ref(0)
const scrollStoryCards = [
  {
    icon: 'mdi-account-search-outline',
    title: '滚动看见你的优势画像',
    desc: '随着页面滚动，系统会逐层展示你的能力结构、兴趣倾向与成长潜力。',
    accent: '#6366F1',
  },
  {
    icon: 'mdi-briefcase-search',
    title: '滚动进入岗位智能匹配',
    desc: '通过七维度算法动态对比岗位要求与个人画像，推荐最适合你的方向。',
    accent: '#06B6D4',
  },
  {
    icon: 'mdi-file-chart-outline',
    title: '滚动解锁职业路线图',
    desc: '从短期行动到长期晋升路径，AI 会持续输出可执行的职业发展建议。',
    accent: '#10B981',
  },
]
const maxStoryCardIndex = scrollStoryCards.length - 1
const activeScrollStoryIndex = computed(() =>
  Math.min(maxStoryCardIndex, Math.round(scrollStoryProgress.value * maxStoryCardIndex)),
)
const scrollStoryTranslatePercent = computed(() => scrollStoryProgress.value * maxStoryCardIndex * 100)

function updateScrollStoryProgress() {
  const section = scrollStorySectionRef.value
  if (!section) return
  const rect = section.getBoundingClientRect()
  if (rect.top > window.innerHeight) {
    scrollStoryProgress.value = 0
    return
  }
  const totalScrollable = section.offsetHeight - window.innerHeight
  if (totalScrollable <= 0) {
    // 区块高度不足以产生滚动区间时：进入视口上沿后视为完成态，否则保持起始态
    if (rect.top <= 0) {
      scrollStoryProgress.value = 1
    } else {
      scrollStoryProgress.value = 0
    }
    return
  }
  const consumed = window.innerHeight - rect.top
  const progress = consumed / totalScrollable
  scrollStoryProgress.value = Math.min(1, Math.max(0, progress))
}

function onWindowScroll() {
  updateScrollStoryProgress()
}

function onWindowResizeForStory() {
  updateScrollStoryProgress()
}

// ─── 打字机效果 ───
const typedText = ref('')
const fullText = '职业未来'
const typingDone = ref(false)

function startTyping() {
  let i = 0
  const interval = setInterval(() => {
    typedText.value = fullText.slice(0, i + 1)
    i++
    if (i >= fullText.length) {
      clearInterval(interval)
      typingDone.value = true
    }
  }, 200)
}

// ─── 鼠标跟随光效 ───
const mouseGlow = reactive({ x: 0, y: 0 })
function onMouseMove(e: MouseEvent) {
  mouseGlow.x = e.clientX
  mouseGlow.y = e.clientY
}

// ─── Canvas 粒子系统 ───
const canvasRef = ref<HTMLCanvasElement | null>(null)
let animationId = 0
let particles: { x: number; y: number; vx: number; vy: number; size: number; opacity: number }[] =
  []
// 保存 resize 回调引用，以便在 onUnmounted 时移除
let resizeHandler: (() => void) | null = null
// 保存 IntersectionObserver 引用，以便在 onUnmounted 时 disconnect
let sectionObserver: IntersectionObserver | null = null

function initParticles() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const resize = () => {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  }
  resizeHandler = resize
  resize()
  window.addEventListener('resize', resize)

  const count = Math.min(80, Math.floor(window.innerWidth / 18))
  particles = Array.from({ length: count }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * 0.6,
    vy: (Math.random() - 0.5) * 0.6,
    size: Math.random() * 2 + 1,
    opacity: Math.random() * 0.5 + 0.2,
  }))

  function draw() {
    ctx!.clearRect(0, 0, canvas!.width, canvas!.height)
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i]
      if (!p) continue
      p.x += p.vx
      p.y += p.vy
      if (p.x < 0 || p.x > canvas!.width) p.vx *= -1
      if (p.y < 0 || p.y > canvas!.height) p.vy *= -1

      ctx!.beginPath()
      ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx!.fillStyle = `rgba(99, 102, 241, ${p.opacity})`
      ctx!.fill()

      // 连线
      for (let j = i + 1; j < particles.length; j++) {
        const p2 = particles[j]
        if (!p2) continue
        const dx = p.x - p2.x
        const dy = p.y - p2.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 140) {
          ctx!.beginPath()
          ctx!.moveTo(p.x, p.y)
          ctx!.lineTo(p2.x, p2.y)
          ctx!.strokeStyle = `rgba(99, 102, 241, ${0.12 * (1 - dist / 140)})`
          ctx!.lineWidth = 0.8
          ctx!.stroke()
        }
      }
    }
    animationId = requestAnimationFrame(draw)
  }
  draw()
}

// ─── 统计数字动画 ───
const animatedStats = reactive([
  { current: 0, target: 50, suffix: '+', label: '覆盖岗位类型', icon: 'mdi-briefcase-variant' },
  { current: 0, target: 95, suffix: '%', label: '匹配满意度', icon: 'mdi-thumb-up-outline' },
  { current: 0, target: 30, suffix: 's', label: '平均出报告', icon: 'mdi-lightning-bolt' },
  { current: 0, target: 7, suffix: ' 维', label: '精准匹配分析', icon: 'mdi-radar' },
])

function animateCounters() {
  animatedStats.forEach((stat) => {
    const duration = 2000
    const step = stat.target / (duration / 16)
    const timer = setInterval(() => {
      stat.current = Math.min(stat.current + step, stat.target)
      if (stat.current >= stat.target) {
        stat.current = stat.target
        clearInterval(timer)
      }
    }, 16)
  })
}

// ─── 卡片 hover（无旋转）─── 已由 CSS 处理，保留空函数兼容模板绑定
function onCardMouseMove() {}

function onCardMouseLeave() {}

// ─── 数据 ───
const features = [
  {
    icon: 'mdi-brain',
    title: 'AI 智能解析简历',
    desc: '上传简历即刻生成多维能力画像，精准定位你的职业竞争力与成长潜力',
    color: '#6366F1',
    gradient: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
  },
  {
    icon: 'mdi-briefcase-search-outline',
    title: '海量岗位全覆盖',
    desc: '汇聚真实市场岗位数据，纵览行业全貌与晋升路径，找准自己的赛道',
    color: '#06B6D4',
    gradient: 'linear-gradient(135deg, #06B6D4 0%, #22D3EE 100%)',
  },
  {
    icon: 'mdi-crosshairs-gps',
    title: '七维精准匹配',
    desc: '技能·经验·教育·兴趣·性格·薪资·地域七维智能对比，发现最适合你的发展方向',
    color: '#F59E0B',
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)',
  },
  {
    icon: 'mdi-file-document-edit-outline',
    title: '一键生成规划报告',
    desc: '自动撰写个性化职业发展报告，支持 AI 润色与 PDF 导出，开箱即用',
    color: '#10B981',
    gradient: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
  },
]

const steps = [
  {
    num: '01',
    title: '上传简历',
    sub: '支持 Word / PDF 格式，或手动填写个人信息',
    icon: 'mdi-cloud-upload-outline',
    color: '#4338CA',
  },
  {
    num: '02',
    title: 'AI 解析画像',
    sub: 'AI 自动提取技能、经验、教育等多维信息，生成专属能力画像',
    icon: 'mdi-auto-fix',
    color: '#0891B2',
  },
  {
    num: '03',
    title: '智能匹配岗位',
    sub: '综合七个维度智能对比分析，精准推荐最匹配的岗位',
    icon: 'mdi-target',
    color: '#D97706',
  },
  {
    num: '04',
    title: '获取规划报告',
    sub: '生成个性化职业发展路线图，支持一键导出 PDF',
    icon: 'mdi-rocket-launch-outline',
    color: '#059669',
  },
]

// 对比表格数据
interface ComparisonCell {
  icon: string
  text: string
  negative?: boolean
  neutral?: boolean
}

interface ComparisonRow {
  label: string
  self: ComparisonCell
  human: ComparisonCell
  ai: ComparisonCell
  us: ComparisonCell
}

const comparisonRows: ComparisonRow[] = [
  {
    label: '岗位数据覆盖',
    self: { icon: 'mdi-close-circle', text: '手动查找', negative: true },
    human: { icon: 'mdi-minus-circle', text: '有限范围', neutral: true },
    ai: { icon: 'mdi-minus-circle', text: '通用数据', neutral: true },
    us: { icon: 'mdi-check-circle', text: '真实市场数据' },
  },
  {
    label: '个性化程度',
    self: { icon: 'mdi-close-circle', text: '几乎没有', negative: true },
    human: { icon: 'mdi-check-circle', text: '较高' },
    ai: { icon: 'mdi-minus-circle', text: '一般', neutral: true },
    us: { icon: 'mdi-check-circle', text: '深度个性化' },
  },
  {
    label: '报告质量',
    self: { icon: 'mdi-close-circle', text: '无报告', negative: true },
    human: { icon: 'mdi-check-circle', text: '高' },
    ai: { icon: 'mdi-minus-circle', text: '中等', neutral: true },
    us: { icon: 'mdi-check-circle', text: '专业报告' },
  },
  {
    label: '响应速度',
    self: { icon: 'mdi-minus-circle', text: '数天', neutral: true },
    human: { icon: 'mdi-minus-circle', text: '数天', neutral: true },
    ai: { icon: 'mdi-check-circle', text: '秒级' },
    us: { icon: 'mdi-check-circle', text: '30 秒出结果' },
  },
  {
    label: '费用',
    self: { icon: 'mdi-check-circle', text: '免费' },
    human: { icon: 'mdi-close-circle', text: '数百元/次', negative: true },
    ai: { icon: 'mdi-minus-circle', text: '按量计费', neutral: true },
    us: { icon: 'mdi-check-circle', text: '完全免费' },
  },
  {
    label: '数据安全',
    self: { icon: 'mdi-check-circle', text: '本地存储' },
    human: { icon: 'mdi-minus-circle', text: '第三方', neutral: true },
    ai: { icon: 'mdi-minus-circle', text: '云端存储', neutral: true },
    us: { icon: 'mdi-check-circle', text: '加密保障' },
  },
]

// 用户评价数据
const testimonials = [
  {
    avatar: 'mdi-account-circle',
    name: '张同学',
    major: '计算机科学 · 大四',
    rating: 5,
    content:
      '上传简历后不到一分钟就生成了详细的能力画像，匹配到的岗位和我的预期高度吻合。职业报告写得非常专业，帮我在面试中节省了大量自我介绍的时间！',
  },
  {
    avatar: 'mdi-account-circle',
    name: '李同学',
    major: '市场营销 · 研二',
    rating: 5,
    content:
      '之前对自己的职业方向很迷茫，用了 Career Planner 之后发现自己在品牌运营方向的匹配度很高。七维匹配分析让我第一次清楚地看到自己的优势和短板。',
  },
  {
    avatar: 'mdi-account-circle',
    name: '王同学',
    major: '金融学 · 大三',
    rating: 5,
    content:
      '完全免费还能生成这么详细的规划报告，真的很惊喜。同学们都说比花钱找的职业规划老师给的建议还要具体，强烈推荐给正在找实习的同学！',
  },
]

// FAQ 数据
const faqs = [
  {
    q: '使用 Career Planner 需要付费吗？',
    a: '完全免费。无论是简历解析、岗位匹配还是报告生成，所有核心功能均对大学生免费开放，无需绑定信用卡。',
  },
  {
    q: '我的个人信息和简历数据安全吗？',
    a: '我们采用加密传输和存储，你的简历数据仅用于生成个人画像和匹配分析，不会对外共享或用于商业目的。',
  },
  {
    q: '支持上传哪些格式的简历？',
    a: '目前支持 PDF 和 Word（.doc/.docx）格式。如果没有简历，也可以通过表单手动填写个人信息来创建画像。',
  },
  {
    q: '岗位匹配的准确性如何保证？',
    a: '系统综合技能、经验、教育背景、兴趣意向、性格特质、薪资期望、意向地域七个维度进行匹配，基于真实市场岗位数据构建知识图谱，匹配满意度达 95% 以上。',
  },
  {
    q: '生成的职业规划报告可以导出吗？',
    a: '可以。报告生成后支持 AI 二次润色，并可一键导出为 PDF 格式，方便保存或在面试中使用。',
  },
  {
    q: '这个平台适合哪些阶段的学生使用？',
    a: '从大一到研究生均可使用。大一大二适合做职业方向探索，大三大四适合做精准岗位匹配和实习求职规划，研究生可用于转行或晋升路径分析。',
  },
]

// ─── 生命周期 ───
onMounted(async () => {
  await nextTick()
  initParticles()
  window.addEventListener('mousemove', onMouseMove)

  setTimeout(() => {
    heroVisible.value = true
    setTimeout(startTyping, 600)
  }, 200)

  sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('data-section')
          if (id === 'features') featuresVisible.value = true
          if (id === 'comparison') comparisonVisible.value = true
          if (id === 'steps') stepsVisible.value = true
          if (id === 'scroll-story') scrollStoryVisible.value = true
          if (id === 'stats') {
            statsVisible.value = true
            animateCounters()
          }
          if (id === 'testimonials') testimonialsVisible.value = true
          if (id === 'faq') faqVisible.value = true
          if (id === 'cta') ctaVisible.value = true
          sectionObserver?.unobserve(entry.target)
        }
      })
    },
    { threshold: 0.12 },
  )
  document.querySelectorAll('[data-section]').forEach((el) => sectionObserver!.observe(el))
  updateScrollStoryProgress()
  window.addEventListener('scroll', onWindowScroll, { passive: true })
  window.addEventListener('resize', onWindowResizeForStory)
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  window.removeEventListener('mousemove', onMouseMove)
  // 移除 resize 监听器，防止内存泄漏
  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler)
    resizeHandler = null
  }
  // 断开 IntersectionObserver，防止内存泄漏
  if (sectionObserver) {
    sectionObserver.disconnect()
    sectionObserver = null
  }
  window.removeEventListener('scroll', onWindowScroll)
  window.removeEventListener('resize', onWindowResizeForStory)
})
</script>

<template>
  <!-- ==================== 导航栏 ==================== -->
  <v-app-bar flat class="landing-nav" :elevation="0" height="64">
      <v-container class="d-flex align-center py-0" style="max-width: 1200px">
        <div class="d-flex align-center cursor-pointer" @click="router.push('/')">
          <div class="logo-icon mr-3">
            <img src="@/assets/logo.svg" alt="Logo" width="32" height="32" />
          </div>
          <span class="text-h6 font-weight-bold logo-text">
            Career <span class="text-primary">Planner</span>
          </span>
        </div>
        <v-spacer />
        <!-- 桌面端导航按钮 -->
        <template v-if="!mobile">
          <v-btn
            variant="text"
            class="mr-2 text-none nav-btn"
            rounded="lg"
            @click="router.push('/docs')"
          >
            <v-icon start icon="mdi-book-open-variant" size="18" />
            帮助文档
          </v-btn>

          <template v-if="authStore.isAuthenticated">
            <v-btn
              color="primary"
              class="text-none px-6 nav-cta-btn"
              rounded="lg"
              variant="elevated"
              @click="router.push('/dashboard')"
            >
              <v-icon start icon="mdi-view-dashboard-outline" size="18" />
              进入后台
            </v-btn>
          </template>
          <template v-else>
            <v-btn
              variant="text"
              class="mr-2 text-none nav-btn"
              rounded="lg"
              @click="router.push('/login')"
            >
              登录
            </v-btn>
            <v-btn
              color="primary"
              class="text-none px-6 nav-cta-btn"
              rounded="lg"
              variant="elevated"
              @click="router.push('/register')"
            >
              <v-icon start icon="mdi-account-plus-outline" size="18" />
              免费注册
            </v-btn>
          </template>
        </template>
        <!-- 移动端汉堡按钮 -->
        <v-btn v-else icon="mdi-menu" variant="text" @click="mobileMenu = true" />
      </v-container>
    </v-app-bar>

    <!-- 移动端导航抽屉 -->
    <v-navigation-drawer v-model="mobileMenu" temporary location="right" width="220">
      <v-list nav>
        <v-list-item
          prepend-icon="mdi-book-open-variant"
          title="帮助文档"
          @click="router.push('/docs'); mobileMenu = false"
        />
        <template v-if="authStore.isAuthenticated">
          <v-list-item
            prepend-icon="mdi-view-dashboard-outline"
            title="进入后台"
            @click="router.push('/dashboard'); mobileMenu = false"
          />
        </template>
        <template v-else>
          <v-list-item
            prepend-icon="mdi-login-variant"
            title="登录"
            @click="router.push('/login'); mobileMenu = false"
          />
          <v-list-item
            prepend-icon="mdi-account-plus-outline"
            title="免费注册"
            @click="router.push('/register'); mobileMenu = false"
          />
        </template>
      </v-list>
    </v-navigation-drawer>

    <v-main class="landing-page" @mousemove="onMouseMove">
      <!-- ==================== Hero ==================== -->
      <section class="hero-section">
        <!-- 粒子 Canvas -->
        <canvas ref="canvasRef" class="particle-canvas" />

        <!-- 渐变背景层 -->
        <div class="hero-bg">
          <div class="hero-gradient" />
          <div class="hero-mesh" />
          <div class="geo geo-1" />
          <div class="geo geo-2" />
          <div class="geo geo-3" />
          <div class="geo geo-4" />
        </div>

        <!-- 鼠标跟随光效 -->
        <div
          class="mouse-glow"
          :style="{
            left: mouseGlow.x + 'px',
            top: mouseGlow.y + 'px',
          }"
        />

        <v-container style="max-width: 1200px; position: relative; z-index: 2">
          <v-row align="center" justify="center" style="min-height: 100vh">
            <v-col cols="12" md="9" lg="8" class="text-center">
              <div v-if="heroVisible" class="animate-hero">
                  <!-- 顶部 badge -->
                  <div class="hero-badge mb-8">
                    <span class="badge-dot" />
                    <span>AI 驱动 · 10万+大学生的选择 · 免费使用</span>
                  </div>

                  <!-- 主标题 -->
                  <h1 class="hero-title mb-6">
                    用 <span class="text-gradient-animated">AI</span> 规划你的
                    <br />
                    <span class="text-gradient-animated typed-wrapper">
                      {{ typedText }}<span v-if="!typingDone" class="typing-cursor">|</span>
                    </span>
                  </h1>

                  <!-- 副标题 -->
                  <p class="hero-subtitle mb-10 mx-auto" style="max-width: 660px">
                    最懂大学生的 AI 职业规划助手<br class="d-none d-sm-block" />
                    上传简历即获专属画像，智能匹配最优岗位，一键生成职业发展报告
                  </p>

                  <!-- 操作按钮 -->
                  <div class="d-flex justify-center ga-4 flex-wrap">
                    <v-btn
                      color="primary"
                      size="x-large"
                      rounded="pill"
                      class="text-none px-10 hero-btn-glow"
                      @click="router.push('/register')"
                    >
                      <v-icon start icon="mdi-rocket-launch-outline" />
                      立即开始
                      <v-icon end icon="mdi-arrow-right" size="18" />
                    </v-btn>
                    <v-btn
                      variant="tonal"
                      size="x-large"
                      rounded="pill"
                      class="text-none px-8 hero-btn-glass"
                      @click="router.push('/login')"
                    >
                      <v-icon start icon="mdi-login-variant" />
                      已有账号
                    </v-btn>
                  </div>
                </div>
            </v-col>
          </v-row>
        </v-container>
      </section>

      <!-- ==================== 功能亮点 ==================== -->
      <section class="features-section" data-section="features">
        <v-container style="max-width: 1200px">
          <div v-if="featuresVisible" class="animate-slide-up">
              <div class="text-center mb-14">
                <div class="section-badge mb-4">
                  <v-icon icon="mdi-star-four-points" size="14" class="mr-1" />
                  核心功能
                </div>
                <h2 class="section-title mb-4">四大核心能力，助你精准规划</h2>
                <p class="section-desc mx-auto" style="max-width: 560px">
                  从简历解析到职业报告，让人工智能成为你最靠谱的职业规划顾问
                </p>
              </div>

              <v-row>
                <v-col
                  v-for="(f, i) in features"
                  :key="f.title"
                  cols="12"
                  sm="6"
                  lg="3"
                  :style="{ animationDelay: `${i * 120}ms` }"
                  class="feature-col"
                >
                  <div
                    class="feature-card-wrapper"
                    @mousemove="onCardMouseMove"
                    @mouseleave="onCardMouseLeave"
                  >
                    <div class="feature-card-inner" :style="{ '--card-accent': f.color }">
                      <div class="glow-border" />
                      <div class="card-content">
                        <div class="feature-icon-wrap mb-5" :style="{ background: f.gradient }">
                          <v-icon :icon="f.icon" color="white" size="28" />
                        </div>
                        <h3 class="text-h6 font-weight-bold mb-2">{{ f.title }}</h3>
                        <p class="text-body-2 text-medium-emphasis feature-desc">{{ f.desc }}</p>
                        <div class="card-shine" />
                      </div>
                    </div>
                  </div>
                </v-col>
              </v-row>
            </div>
        </v-container>
      </section>

      <!-- ==================== 产品对比 ==================== -->
      <section class="comparison-section" data-section="comparison">
        <v-container style="max-width: 1100px">
          <div v-if="comparisonVisible" class="animate-slide-up">
              <div class="text-center mb-12">
                <div class="section-badge mb-4">
                  <v-icon icon="mdi-compare" size="14" class="mr-1" />
                  产品对比
                </div>
                <h2 class="section-title mb-4">为什么选择 Career Planner？</h2>
                <p class="section-desc mx-auto" style="max-width: 520px">
                  与其他方式相比，体验全面的优势
                </p>
              </div>

              <div class="comparison-table-wrap">
                <table class="comparison-table">
                  <thead>
                    <tr>
                      <th class="col-label">对比维度</th>
                      <th class="col-self">自行搜索</th>
                      <th class="col-human">人工咨询</th>
                      <th class="col-ai">通用 AI</th>
                      <th class="col-us">Career Planner</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="row in comparisonRows" :key="row.label">
                      <td class="row-label">{{ row.label }}</td>
                      <td>
                        <div class="cell-content">
                          <v-icon
                            :icon="row.self.icon"
                            size="18"
                            :color="row.self.negative ? '#ef4444' : row.self.neutral ? '#94a3b8' : '#10b981'"
                          />
                          <span>{{ row.self.text }}</span>
                        </div>
                      </td>
                      <td>
                        <div class="cell-content">
                          <v-icon
                            :icon="row.human.icon"
                            size="18"
                            :color="row.human.negative ? '#ef4444' : row.human.neutral ? '#94a3b8' : '#10b981'"
                          />
                          <span>{{ row.human.text }}</span>
                        </div>
                      </td>
                      <td>
                        <div class="cell-content">
                          <v-icon
                            :icon="row.ai.icon"
                            size="18"
                            :color="row.ai.negative ? '#ef4444' : row.ai.neutral ? '#94a3b8' : '#10b981'"
                          />
                          <span>{{ row.ai.text }}</span>
                        </div>
                      </td>
                      <td class="col-us-cell">
                        <div class="cell-content cell-content-us">
                          <v-icon icon="mdi-check-circle" size="18" color="#1976d2" />
                          <span class="font-weight-medium">{{ row.us.text }}</span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
        </v-container>
      </section>

      <!-- ==================== 使用步骤 ==================== -->
      <section class="steps-section" data-section="steps">
        <v-container style="max-width: 1000px">
          <div v-if="stepsVisible" class="animate-slide-up">
              <div class="text-center mb-14">
                <div class="section-badge section-badge-dark mb-4">
                  <v-icon icon="mdi-shoe-print" size="14" class="mr-1" />
                  使用流程
                </div>
                <h2 class="section-title mb-4" style="color: #0f172a;">四步开启智能规划</h2>
                <p class="section-desc" style="color: #475569;">简单几步，即可获得专属职业发展方案</p>
              </div>

              <div class="steps-grid">
                <div class="steps-line" />
                <v-row>
                  <v-col
                    v-for="(s, i) in steps"
                    :key="s.num"
                    cols="12"
                    sm="6"
                    md="3"
                    class="step-col"
                    :style="{ animationDelay: `${i * 150}ms` }"
                  >
                    <div class="step-card-wrap">
                      <div class="step-number" :style="{ color: s.color }">{{ s.num }}</div>
                      <div class="step-icon-circle" :style="{ background: s.color }">
                        <v-icon :icon="s.icon" color="white" size="24" />
                      </div>
                      <h3 class="text-subtitle-1 font-weight-bold mt-4 mb-1" style="color: #0f172a;">
                        {{ s.title }}
                      </h3>
                      <p class="text-body-2" style="color: #475569;">{{ s.sub }}</p>
                    </div>
                  </v-col>
                </v-row>
              </div>
            </div>
        </v-container>
      </section>

      <!-- ==================== 滚动叙事展示 ==================== -->
      <section ref="scrollStorySectionRef" class="scroll-story-section" data-section="scroll-story">
        <v-container style="max-width: 1100px">
          <div v-if="scrollStoryVisible" class="animate-slide-up">
            <div class="text-center mb-10">
              <div class="section-badge mb-4">
                <v-icon icon="mdi-gesture-swipe-vertical" size="14" class="mr-1" />
                滚动体验
              </div>
              <h2 class="section-title mb-4">像看新品发布一样，滚动了解全部能力</h2>
              <p class="section-desc mx-auto" style="max-width: 620px">
                页面滚动距离会驱动内容过渡与动效，让你一步步看到 Career Planner 的核心价值。
              </p>
            </div>

            <div class="scroll-story-track">
              <div class="scroll-story-sticky">
                <div class="story-device-shell">
                  <div class="story-progress">
                    <span class="story-progress-inner" :style="{ width: `${scrollStoryProgress * 100}%` }" />
                  </div>
                  <div class="story-cards-window">
                    <div
                      class="story-cards-slider"
                      :style="{ transform: `translateX(-${scrollStoryTranslatePercent}%)` }"
                    >
                      <article
                        v-for="(card, idx) in scrollStoryCards"
                        :key="card.title"
                        class="story-card"
                        :class="{ 'is-active': idx === activeScrollStoryIndex }"
                      >
                        <div class="story-icon-wrap" :style="{ background: card.accent }">
                          <v-icon :icon="card.icon" color="white" size="26" />
                        </div>
                        <h3 class="text-h6 font-weight-bold mb-3">{{ card.title }}</h3>
                        <p class="text-body-1 text-medium-emphasis">{{ card.desc }}</p>
                      </article>
                    </div>
                  </div>
                  <div class="story-dots">
                    <span
                      v-for="(card, idx) in scrollStoryCards"
                      :key="idx"
                      class="story-dot"
                      :class="{ 'is-active': idx <= activeScrollStoryIndex }"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </v-container>
      </section>

      <!-- ==================== 数字统计 ==================== -->
      <section class="stats-section" data-section="stats">
        <v-container style="max-width: 1000px">
          <div v-if="statsVisible" class="animate-slide-up">
              <v-row>
                <v-col v-for="(s, i) in animatedStats" :key="s.label" cols="6" md="3">
                  <div class="stat-card" :style="{ animationDelay: `${i * 100}ms` }">
                    <div class="stat-icon-bg">
                      <v-icon :icon="s.icon" size="28" color="primary" />
                    </div>
                    <div class="stat-value">
                      {{ Math.round(s.current) }}<span class="stat-suffix">{{ s.suffix }}</span>
                    </div>
                    <div class="stat-label">{{ s.label }}</div>
                  </div>
                </v-col>
              </v-row>
            </div>
        </v-container>
      </section>

      <!-- ==================== 用户评价 ==================== -->
      <section class="testimonials-section" data-section="testimonials">
        <v-container style="max-width: 1100px">
          <div v-if="testimonialsVisible" class="animate-slide-up">
              <div class="text-center mb-12">
                <div class="section-badge mb-4">
                  <v-icon icon="mdi-account-group-outline" size="14" class="mr-1" />
                  用户评价
                </div>
                <h2 class="section-title mb-4">同学们都在说什么</h2>
                <p class="section-desc mx-auto" style="max-width: 500px">
                  来自真实用户的使用反馈
                </p>
              </div>

              <v-row>
                <v-col
                  v-for="(t, i) in testimonials"
                  :key="t.name"
                  cols="12"
                  md="4"
                  :style="{ animationDelay: `${i * 120}ms` }"
                >
                  <div class="testimonial-card">
                    <div class="testimonial-quote">
                      <v-icon icon="mdi-format-quote-open" size="32" color="primary" style="opacity: 0.25" />
                    </div>
                    <p class="testimonial-text">{{ t.content }}</p>
                    <div class="testimonial-rating mb-3">
                      <v-icon
                        v-for="n in 5"
                        :key="n"
                        icon="mdi-star"
                        size="16"
                        :color="n <= t.rating ? '#f59e0b' : '#e2e8f0'"
                      />
                    </div>
                    <div class="testimonial-user">
                      <div class="testimonial-avatar">
                        <v-icon :icon="t.avatar" size="36" color="primary" style="opacity: 0.7" />
                      </div>
                      <div>
                        <div class="text-subtitle-2 font-weight-bold">{{ t.name }}</div>
                        <div class="text-caption text-medium-emphasis">{{ t.major }}</div>
                      </div>
                    </div>
                  </div>
                </v-col>
              </v-row>
            </div>
        </v-container>
      </section>

      <!-- ==================== FAQ ==================== -->
      <section class="faq-section" data-section="faq">
        <v-container style="max-width: 800px">
          <div v-if="faqVisible" class="animate-slide-up">
              <div class="text-center mb-12">
                <div class="section-badge mb-4">
                  <v-icon icon="mdi-help-circle-outline" size="14" class="mr-1" />
                  常见问题
                </div>
                <h2 class="section-title mb-4">你可能想知道的</h2>
              </div>

              <v-expansion-panels variant="accordion" class="faq-panels">
                <v-expansion-panel
                  v-for="(faq, i) in faqs"
                  :key="i"
                  :title="faq.q"
                  :text="faq.a"
                  class="faq-panel"
                />
              </v-expansion-panels>
            </div>
        </v-container>
      </section>

      <!-- ==================== CTA ==================== -->
      <section class="cta-section" data-section="cta">
        <v-container style="max-width: 880px">
          <div v-if="ctaVisible" class="animate-scale-up">
              <div class="cta-card">
                <div class="cta-bg-orbs">
                  <div class="cta-orb cta-orb-1" />
                  <div class="cta-orb cta-orb-2" />
                </div>
                <div class="cta-content text-center">
                  <div class="cta-icon-wrap mb-5">
                    <v-icon icon="mdi-creation" size="40" color="white" />
                  </div>
                  <h2 class="text-h4 font-weight-bold mb-3 text-white">准备好规划你的未来了吗？</h2>
                  <p class="text-body-1 mb-8 cta-desc">
                    加入众多大学生，免费体验 AI 职业规划全流程
                  </p>
                  <div class="d-flex justify-center ga-4 flex-wrap">
                    <v-btn
                      color="white"
                      size="x-large"
                      rounded="pill"
                      class="text-none px-10 font-weight-bold cta-main-btn"
                      @click="router.push('/register')"
                    >
                      <v-icon start icon="mdi-account-plus" />
                      免费注册
                      <v-icon end icon="mdi-arrow-right" size="18" />
                    </v-btn>
                  </div>
                </div>
              </div>
            </div>
        </v-container>
      </section>

      <!-- ==================== Footer ==================== -->
      <footer class="landing-footer">
        <v-container style="max-width: 1200px">
          <v-row align="center">
            <v-col cols="12" md="6">
              <div class="d-flex align-center">
                <div class="logo-icon logo-icon-sm mr-2">
                  <img src="@/assets/logo.svg" alt="Logo" width="22" height="22" />
                </div>
                <span class="text-subtitle-2 font-weight-bold">
                  Career<span class="text-primary">Planner</span>
                </span>
              </div>
            </v-col>
            <v-col cols="12" md="6" class="text-md-right">
              <p class="text-body-2 text-medium-emphasis mb-0">
                © 2026 Career Planner · 面向大学生的智能职业规划平台
              </p>
            </v-col>
          </v-row>
        </v-container>
      </footer>
    </v-main>
</template>

<style scoped>
/* 全局基础 */
.landing-page {
  background: #fafbfe;
  overflow-x: hidden;
  padding-top: 0 !important;
}

/* 导航栏 */
.landing-nav {
  position: sticky !important;
  top: 0;
  backdrop-filter: blur(20px) saturate(1.8);
  background: rgba(255, 255, 255, 0.72) !important;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  z-index: 100;
}

:deep(.v-navigation-drawer) {
  max-height: 100vh !important;
  height: 100vh !important;
}

.logo-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  filter: drop-shadow(0 4px 8px rgba(25, 118, 210, 0.45));
}

.logo-icon-sm {
  width: 26px;
  height: 26px;
}

.logo-text {
  letter-spacing: -0.5px;
}

.nav-btn {
  font-weight: 500;
}

.nav-cta-btn {
  box-shadow: 0 4px 14px rgba(25, 118, 210, 0.3);
  transition: all 0.3s ease;
}

.nav-cta-btn:hover {
  box-shadow: 0 6px 20px rgba(25, 118, 210, 0.45);
  transform: translateY(-1px);
}

/* Hero Section */
.hero-section {
  position: relative;
  overflow: hidden;
  min-height: 100vh;
}

.particle-canvas {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
}

.hero-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.hero-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    160deg,
    #eef2ff 0%,
    #e0e7ff 20%,
    #ede9fe 40%,
    #e0f2fe 60%,
    #f0fdf4 80%,
    #fefce8 100%
  );
}

.hero-mesh {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(99, 102, 241, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(99, 102, 241, 0.03) 1px, transparent 1px);
  background-size: 48px 48px;
}

/* 浮动几何体 */
.geo {
  position: absolute;
  border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
  filter: blur(60px);
  opacity: 0.4;
  animation: morph 15s ease-in-out infinite;
  z-index: 0;
}

.geo-1 {
  width: 500px;
  height: 500px;
  background: linear-gradient(135deg, #6366f1, #a78bfa);
  top: -150px;
  right: -120px;
  animation-delay: 0s;
}

.geo-2 {
  width: 400px;
  height: 400px;
  background: linear-gradient(135deg, #06b6d4, #67e8f9);
  bottom: -120px;
  left: -100px;
  animation-delay: -5s;
}

.geo-3 {
  width: 300px;
  height: 300px;
  background: linear-gradient(135deg, #f59e0b, #fde68a);
  top: 45%;
  left: 55%;
  animation-delay: -10s;
}

.geo-4 {
  width: 200px;
  height: 200px;
  background: linear-gradient(135deg, #10b981, #6ee7b7);
  top: 25%;
  left: 10%;
  animation-delay: -7s;
}

@keyframes morph {
  0%,
  100% {
    border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
    transform: translate(0, 0) rotate(0deg);
  }
  25% {
    border-radius: 58% 42% 35% 65% / 50% 60% 40% 50%;
    transform: translate(20px, -30px) rotate(5deg);
  }
  50% {
    border-radius: 50% 50% 60% 40% / 40% 50% 50% 60%;
    transform: translate(-15px, 20px) rotate(-3deg);
  }
  75% {
    border-radius: 40% 60% 50% 50% / 55% 35% 65% 45%;
    transform: translate(25px, 10px) rotate(4deg);
  }
}

/* 鼠标光效 */
.mouse-glow {
  position: fixed;
  width: 500px;
  height: 500px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%);
  pointer-events: none;
  transform: translate(-50%, -50%);
  z-index: 1;
  transition:
    left 0.3s ease-out,
    top 0.3s ease-out;
}

/* Hero 内容 */
.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 18px;
  border-radius: 100px;
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.2);
  font-size: 0.82rem;
  font-weight: 500;
  color: #6366f1;
  backdrop-filter: blur(8px);
}

.badge-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #6366f1;
  animation: pulse-dot 2s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(99, 102, 241, 0);
  }
}

.hero-title {
  font-size: clamp(2.6rem, 6.5vw, 4.2rem);
  font-weight: 900;
  line-height: 1.15;
  letter-spacing: -2px;
  color: #0f172a;
}

.text-gradient-animated {
  background: linear-gradient(
    90deg,
    #1976d2 0%,
    #6366f1 25%,
    #a855f7 50%,
    #06b6d4 75%,
    #1976d2 100%
  );
  background-size: 200% auto;
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: gradient-flow 4s linear infinite;
}

@keyframes gradient-flow {
  to {
    background-position: 200% center;
  }
}

.typed-wrapper {
  display: inline-block;
  min-width: 4ch;
}

.typing-cursor {
  -webkit-text-fill-color: #6366f1;
  animation: blink-cursor 0.75s step-end infinite;
  font-weight: 300;
}

@keyframes blink-cursor {
  50% {
    opacity: 0;
  }
}

.hero-subtitle {
  font-size: 1.15rem;
  line-height: 1.85;
  color: #475569;
}

.hero-btn-glow {
  box-shadow:
    0 8px 32px rgba(25, 118, 210, 0.35),
    0 0 0 0 rgba(25, 118, 210, 0);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  font-weight: 600;
  letter-spacing: 0.3px;
}

.hero-btn-glow:hover {
  transform: translateY(-3px);
  box-shadow:
    0 14px 44px rgba(25, 118, 210, 0.4),
    0 0 0 4px rgba(25, 118, 210, 0.1);
}

.hero-btn-glass {
  backdrop-filter: blur(12px);
  background: rgba(255, 255, 255, 0.5) !important;
  border: 1px solid rgba(0, 0, 0, 0.08);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.hero-btn-glass:hover {
  transform: translateY(-3px);
  background: rgba(255, 255, 255, 0.8) !important;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
}

/* 滚动指示器 */
/* 新动画类 */
.animate-hero {
  animation: heroEntrance 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes heroEntrance {
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-up {
  animation: slideUpFade 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes slideUpFade {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-scale-up {
  animation: scaleUpFade 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes scaleUpFade {
  from {
    opacity: 0;
    transform: scale(0.92);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* 通用 Section 样式 */
.section-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 14px;
  border-radius: 100px;
  background: rgba(25, 118, 210, 0.08);
  color: #1976d2;
  font-size: 0.8rem;
  font-weight: 600;
}

.section-badge-dark {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
}

.section-title {
  font-size: clamp(1.8rem, 4vw, 2.5rem);
  font-weight: 800;
  letter-spacing: -1px;
  color: #0f172a;
}

.section-title-light {
  color: #fff;
}

.section-desc {
  font-size: 1.05rem;
  color: #64748b;
  line-height: 1.7;
}

.section-desc-light {
  color: rgba(255, 255, 255, 0.6);
}

/* 功能卡片（3D 倾斜 + 流光边框） */
.features-section {
  background: #fff;
  padding: 100px 0;
}

.feature-card-wrapper {
  height: 100%;
}

.feature-card-inner {
  --card-accent: #6366f1;
  position: relative;
  padding: 32px 28px;
  border-radius: 20px;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  height: 100%;
  transition:
    transform 0.35s cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 0.35s cubic-bezier(0.16, 1, 0.3, 1),
    border-color 0.35s ease;
  overflow: hidden;
}

.feature-card-inner:hover {
  transform: translateY(-6px) scale(1.01);
  border-color: var(--card-accent);
  box-shadow:
    0 20px 50px rgba(0, 0, 0, 0.1),
    0 0 0 1px var(--card-accent);
}

.feature-card-inner:hover .glow-border {
  opacity: 1;
}

.feature-card-inner:hover .card-shine {
  opacity: 1;
  transform: translateX(100%);
}

.glow-border {
  position: absolute;
  inset: -1px;
  border-radius: 21px;
  background: linear-gradient(
    135deg,
    var(--card-accent),
    transparent 40%,
    transparent 60%,
    var(--card-accent)
  );
  opacity: 0;
  transition: opacity 0.35s ease;
  z-index: -1;
}

.card-content {
  position: relative;
  z-index: 1;
}

.card-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  opacity: 0;
  transition:
    transform 0.6s ease,
    opacity 0.3s ease;
  pointer-events: none;
}

.feature-icon-wrap {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.feature-desc {
  line-height: 1.7;
}

/* 产品对比 */
.comparison-section {
  background: #f8fafc;
  padding: 100px 0;
}

.comparison-table-wrap {
  overflow-x: auto;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
}

.comparison-table {
  width: 100%;
  min-width: 640px;
  border-collapse: collapse;
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
}

.comparison-table thead tr {
  background: #f8fafc;
}

.comparison-table thead th {
  padding: 16px 20px;
  font-size: 0.85rem;
  font-weight: 700;
  color: #64748b;
  text-align: center;
  border-bottom: 2px solid #e2e8f0;
}

.comparison-table thead th.col-label {
  text-align: left;
  color: #0f172a;
}

.comparison-table thead th.col-us {
  background: rgba(25, 118, 210, 0.06);
  color: #1976d2;
}

.comparison-table tbody tr {
  border-bottom: 1px solid #f1f5f9;
  transition: background 0.2s;
}

.comparison-table tbody tr:last-child {
  border-bottom: none;
}

.comparison-table tbody tr:hover {
  background: #fafbfe;
}

.comparison-table tbody td {
  padding: 14px 20px;
  text-align: center;
  font-size: 0.88rem;
  color: #475569;
}

.comparison-table tbody td.row-label {
  text-align: left;
  font-weight: 600;
  color: #0f172a;
  font-size: 0.9rem;
}

.comparison-table tbody td.col-us-cell {
  background: rgba(25, 118, 210, 0.04);
}

.cell-content {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  justify-content: center;
}

.cell-content-us {
  color: #1976d2;
}

/* 使用步骤（暗色背景） */
.steps-section {
  background: linear-gradient(160deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
  padding: 100px 0;
  position: relative;
  overflow: hidden;
}

.steps-section::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle, rgba(99, 102, 241, 0.06) 1px, transparent 1px);
  background-size: 32px 32px;
}

.steps-grid {
  position: relative;
}

.steps-line {
  display: none;
}

@media (min-width: 960px) {
  .steps-line {
    display: block;
    position: absolute;
    top: 76px;
    left: 16%;
    right: 16%;
    height: 2px;
    background: linear-gradient(90deg, #6366f1, #06b6d4, #f59e0b, #10b981);
    opacity: 0.3;
  }
}

.step-card-wrap {
  text-align: center;
  padding: 24px 16px;
  position: relative;
}

.step-number {
  font-size: 3rem;
  font-weight: 900;
  opacity: 0.15;
  position: absolute;
  top: 0;
  right: 16px;
  line-height: 1;
}

.step-icon-circle {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  position: relative;
  z-index: 1;
}

.step-icon-circle::after {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 2px dashed rgba(255, 255, 255, 0.15);
  animation: spin-slow 20s linear infinite;
}

@keyframes spin-slow {
  to {
    transform: rotate(360deg);
  }
}

.step-sub {
  color: rgba(255, 255, 255, 0.45);
  line-height: 1.6;
}

/* 滚动叙事展示 */
.scroll-story-section {
  padding: 100px 0 20px;
  background:
    radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.08), transparent 30%),
    radial-gradient(circle at 90% 10%, rgba(6, 182, 212, 0.08), transparent 30%),
    #fff;
}

.scroll-story-track {
  /* 通过延长滚动轨道，给 sticky 内容留出足够“讲述”空间，形成滚动驱动动画感 */
  height: 180vh;
  position: relative;
}

.scroll-story-sticky {
  position: sticky;
  top: 110px;
}

.story-device-shell {
  border-radius: 28px;
  padding: 28px;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.12);
  backdrop-filter: blur(16px);
}

.story-progress {
  height: 4px;
  background: rgba(15, 23, 42, 0.08);
  border-radius: 999px;
  overflow: hidden;
  margin-bottom: 20px;
}

.story-progress-inner {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #6366f1, #06b6d4, #10b981);
  transition: width 0.22s ease-out;
}

.story-cards-window {
  overflow: hidden;
}

.story-cards-slider {
  display: flex;
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.story-card {
  min-width: 100%;
  padding: 44px 30px;
  border-radius: 20px;
  background: linear-gradient(135deg, rgba(248, 250, 252, 0.96), rgba(255, 255, 255, 0.96));
  border: 1px solid rgba(15, 23, 42, 0.06);
  opacity: 0.62;
  transform: scale(0.97);
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.story-card.is-active {
  opacity: 1;
  transform: scale(1);
}

.story-icon-wrap {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.2);
}

.story-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 18px;
}

.story-dot {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: rgba(100, 116, 139, 0.35);
  transition: all 0.25s ease;
}

.story-dot.is-active {
  width: 24px;
  background: #6366f1;
}

/* 数字统计 */
.stats-section {
  background: #fff;
  padding: 80px 0;
}

.stat-card {
  text-align: center;
  padding: 32px 20px;
  border-radius: 20px;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.04);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.06);
}

.stat-icon-bg {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: rgba(25, 118, 210, 0.08);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.stat-value {
  font-size: 2.8rem;
  font-weight: 900;
  letter-spacing: -2px;
  background: linear-gradient(135deg, #1976d2, #6366f1);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1.1;
}

.stat-suffix {
  font-size: 1.2rem;
  font-weight: 700;
  letter-spacing: 0;
}

.stat-label {
  font-size: 0.92rem;
  color: #64748b;
  margin-top: 6px;
  font-weight: 500;
}

/* 用户评价 */
.testimonials-section {
  background: #f8fafc;
  padding: 100px 0;
}

.testimonial-card {
  background: #fff;
  border-radius: 20px;
  padding: 32px 28px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  height: 100%;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
}

.testimonial-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 20px 48px rgba(0, 0, 0, 0.08);
}

.testimonial-quote {
  margin-bottom: 12px;
  line-height: 1;
}

.testimonial-text {
  font-size: 0.95rem;
  line-height: 1.75;
  color: #475569;
  margin-bottom: 20px;
  flex-grow: 1;
}

.testimonial-rating {
  display: flex;
  gap: 2px;
}

.testimonial-user {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid #f1f5f9;
}

.testimonial-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: rgba(25, 118, 210, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* FAQ */
.faq-section {
  background: #fff;
  padding: 100px 0;
}

.faq-panels {
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.faq-panel {
  border-bottom: 1px solid #f1f5f9 !important;
}

.faq-panel:last-child {
  border-bottom: none !important;
}

/* CTA */
.cta-section {
  padding: 40px 0 100px;
  background: #f8fafc;
}

.cta-card {
  position: relative;
  padding: 72px 48px;
  border-radius: 28px;
  background: linear-gradient(135deg, #1976d2 0%, #6366f1 50%, #06b6d4 100%);
  background-size: 200% 200%;
  animation: gradient-shift 8s ease-in-out infinite;
  overflow: hidden;
}

@keyframes gradient-shift {
  0%,
  100% {
    background-position: 0 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

.cta-bg-orbs {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.cta-orb {
  position: absolute;
  border-radius: 50%;
  opacity: 0.15;
}

.cta-orb-1 {
  width: 300px;
  height: 300px;
  background: #fff;
  top: -100px;
  right: -60px;
  animation: float-orb 8s ease-in-out infinite;
}

.cta-orb-2 {
  width: 200px;
  height: 200px;
  background: #fff;
  bottom: -60px;
  left: -40px;
  animation: float-orb 8s ease-in-out infinite reverse;
}

@keyframes float-orb {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(20px, -20px) scale(1.1);
  }
}

.cta-content {
  position: relative;
  z-index: 1;
}

.cta-icon-wrap {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(8px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.cta-desc {
  color: rgba(255, 255, 255, 0.8);
}

.cta-main-btn {
  color: #1976d2 !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.cta-main-btn:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 14px 44px rgba(0, 0, 0, 0.2);
}

/* Footer */
.landing-footer {
  background: #fafbfe;
  padding: 32px 0;
  border-top: 1px solid rgba(0, 0, 0, 0.04);
  position: relative;
  z-index: 10;
}

/* 响应式 */
@media (max-width: 600px) {
  .hero-title {
    letter-spacing: -1px;
  }

  .features-section,
  .steps-section,
  .scroll-story-section,
  .comparison-section,
  .testimonials-section,
  .faq-section {
    padding: 64px 0;
  }

  .cta-card {
    padding: 48px 24px;
  }

  .geo-1,
  .geo-2,
  .geo-3 {
    opacity: 0.25;
  }

  .scroll-story-track {
    height: auto;
  }

  .scroll-story-sticky {
    position: static;
  }

  .story-device-shell {
    padding: 18px;
  }

  .story-card {
    padding: 28px 18px;
  }
}
</style>
