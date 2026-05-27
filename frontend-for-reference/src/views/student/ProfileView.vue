<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useStudentStore } from '@/stores/student'
import { useNavItems } from '@/composables/useNavItems'
import ApiErrorState from '@/components/ApiErrorState.vue'
import PageHeader from '@/components/PageHeader.vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { RadarChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

use([RadarChart, TitleComponent, TooltipComponent, LegendComponent, CanvasRenderer])

const store = useStudentStore()
const { findNavItemByPath } = useNavItems()
const pageItem = computed(() => findNavItemByPath('/profile'))
const profileError = ref<string | null>(null)

async function loadProfile() {
  profileError.value = null
  try {
    await store.fetchProfile()
  } catch {
    profileError.value = '加载学生画像失败，请检查网络后重试'
  }
}

// ── 简历上传相关 ──
const selectedFile = ref<File | null>(null)
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')
const showUploadDialog = ref(false)

// ── 画像入口 Tab ──
const profileInputTab = ref(0)

// ── 手动录入表单 ──
const manualForm = ref({
  education: '',
  major: '',
  university: '',
  certificates: [] as string[],
  skills: [{ skillName: '', proficiency: '了解', knowledgePoints: '' }] as Array<{
    skillName: string
    proficiency: string
    knowledgePoints: string
  }>,
  internships: [{ company: '', position: '', duration: '', description: '' }] as Array<{
    company: string
    position: string
    duration: string
    description: string
  }>,
  projects: [{ name: '', role: '', techStack: '', description: '' }] as Array<{
    name: string
    role: string
    techStack: string
    description: string
  }>,
})
const certInput = ref('')
const submittingManual = ref(false)

function addCert() {
  const val = certInput.value.trim()
  if (val && !manualForm.value.certificates.includes(val)) {
    manualForm.value.certificates.push(val)
  }
  certInput.value = ''
}

function removeCert(idx: number) {
  manualForm.value.certificates.splice(idx, 1)
}

function addSkill() {
  manualForm.value.skills.push({ skillName: '', proficiency: '了解', knowledgePoints: '' })
}

function removeSkill(idx: number) {
  manualForm.value.skills.splice(idx, 1)
}

function addInternship() {
  manualForm.value.internships.push({ company: '', position: '', duration: '', description: '' })
}

function removeInternship(idx: number) {
  manualForm.value.internships.splice(idx, 1)
}

function addProject() {
  manualForm.value.projects.push({ name: '', role: '', techStack: '', description: '' })
}

function removeProject(idx: number) {
  manualForm.value.projects.splice(idx, 1)
}

async function handleManualSubmit() {
  submittingManual.value = true
  try {
    const payload: Record<string, unknown> = {
      education: manualForm.value.education,
      major: manualForm.value.major,
      university: manualForm.value.university || undefined,
      certificates: manualForm.value.certificates,
      skills: manualForm.value.skills
        .filter((s) => s.skillName.trim())
        .map((s) => ({
          skill_name: s.skillName,
          proficiency: s.proficiency,
          knowledge_points: s.knowledgePoints
            ? s.knowledgePoints
                .split(/[,，、]/)
                .map((k: string) => k.trim())
                .filter(Boolean)
            : [],
        })),
      internships: manualForm.value.internships
        .filter((i) => i.company.trim() || i.position.trim())
        .map((i) => ({
          company: i.company,
          position: i.position,
          duration: i.duration,
          description: i.description,
        })),
      projects: manualForm.value.projects
        .filter((p) => p.name.trim() || p.description.trim())
        .map((p) => ({
          name: p.name,
          role: p.role,
          tech_stack: p.techStack
            ? p.techStack
                .split(/[,，、]/)
                .map((t: string) => t.trim())
                .filter(Boolean)
            : [],
          description: p.description,
        })),
    }
    await store.submitManualProfile(payload)
    snackbarText.value = '信息已提交，AI 正在生成画像中…'
    snackbarColor.value = 'info'
    snackbar.value = true
  } catch {
    snackbarText.value = '画像生成失败，请重试'
    snackbarColor.value = 'error'
    snackbar.value = true
  } finally {
    submittingManual.value = false
  }
}

async function handleUpload() {
  if (!selectedFile.value) return
  try {
    await store.uploadResume(selectedFile.value)
    snackbarText.value = '简历已提交，正在排队解析中…'
    snackbarColor.value = 'info'
    snackbar.value = true
    showUploadDialog.value = false
    selectedFile.value = null
  } catch {
    snackbarText.value = '简历提交失败，请重试'
    snackbarColor.value = 'error'
    snackbar.value = true
  }
}

function onFileChange(files: File | File[]) {
  selectedFile.value = Array.isArray(files) ? (files[0] ?? null) : files
}

onMounted(loadProfile)

/** 7 维度配置（key → 中文名） */
const DIMENSION_CONFIG: Array<{ key: string; label: string }> = [
  { key: 'technical', label: '技术能力' },
  { key: 'project', label: '项目经验' },
  { key: 'internship', label: '实习经历' },
  { key: 'education', label: '学术背景' },
  { key: 'achievement', label: '竞赛与成果' },
  { key: 'soft_skill', label: '软素质' },
  { key: 'professionalism', label: '职业素养' },
]

/** 子维度中文名 */
const SUB_DIMENSION_LABELS: Record<string, string> = {
  programming: '编程基础',
  tech_breadth: '技术栈广度',
  engineering: '工程实践',
  complexity: '项目复杂度',
  contribution: '个人贡献',
  outcome: '成果产出',
  quality: '实习质量',
  depth: '实习深度',
  growth: '成长收获',
  university_tier: '院校层次',
  degree_level: '学历层次',
  major_relevance: '专业相关性',
  competition: '竞赛获奖',
  certification: '专业证书',
  academic: '学术成果',
  communication: '沟通协作',
  learning: '学习能力',
  resilience: '抗压韧性',
  self_awareness: '自我认知',
  industry_awareness: '行业认知',
  completeness: '信息完整度',
}

/** 展开的维度 key */
const expandedDimension = ref<string | null>(null)

function toggleDimension(key: string) {
  expandedDimension.value = expandedDimension.value === key ? null : key
}

/** 根据分数返回颜色：≥70 绿色，40-69 黄色，<40 红色 */
function scoreColor(score: number | undefined): string {
  const v = score ?? 0
  if (v >= 70) return 'green'
  if (v >= 40) return 'orange'
  return 'red'
}

function getDimScore(key: string): number {
  return store.profile?.scoreDetail?.[key]?.score ?? 0
}

const radarOption = computed(() => ({
  tooltip: {},
  radar: {
    indicator: DIMENSION_CONFIG.map(({ label }) => ({ name: label, max: 100 })),
  },
  series: [
    {
      type: 'radar',
      data: [
        {
          value: DIMENSION_CONFIG.map(({ key }) => getDimScore(key)),
          name: '竞争力评分',
          areaStyle: { opacity: 0.3 },
        },
      ],
    },
  ],
}))
</script>

<template>
  <v-container>
    <PageHeader
      :title="pageItem?.title ?? '学生画像'"
      :description="pageItem?.description"
      :icon="pageItem?.icon"
    >
      <template v-if="store.profile" #actions>
        <v-btn color="primary" to="/match">
          <v-icon start icon="mdi-compare-horizontal" />人岗匹配
        </v-btn>
        <v-btn color="secondary" variant="tonal" to="/preference" class="ml-2">
          <v-icon start icon="mdi-briefcase-outline" />就业意向
        </v-btn>
        <v-btn variant="outlined" class="ml-2" @click="showUploadDialog = true">
          <v-icon start icon="mdi-file-upload" />重新上传简历
        </v-btn>
      </template>
    </PageHeader>

    <v-skeleton-loader v-if="store.loading && !store.profile" type="card, card" class="mb-4" />

    <ApiErrorState
      v-else-if="profileError && !store.profile"
      :error="profileError"
      title="加载失败"
      @retry="loadProfile"
    />

    <template v-if="store.profile">
      <v-row>
        <v-col cols="12" md="5">
          <v-card class="mb-4">
            <v-card-title>能力雷达图</v-card-title>
            <v-card-text>
              <v-chart :option="radarOption" style="height: 350px" autoresize />
            </v-card-text>
          </v-card>

          <v-card>
            <v-card-title>综合评分</v-card-title>
            <v-card-text>
              <div
                v-for="{ label, score } in [
                  { label: '完整度', score: store.profile.completenessScore },
                  { label: '竞争力', score: store.profile.competitivenessScore },
                ]"
                :key="label"
                class="mb-3"
              >
                <div class="d-flex justify-space-between align-center mb-1">
                  <span class="text-body-2 font-weight-medium">{{ label }}</span>
                  <span class="text-body-2 font-weight-bold">{{ score }}/100</span>
                </div>
                <v-progress-linear
                  :model-value="score"
                  :color="scoreColor(score)"
                  height="8"
                  rounded
                />
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="7">
          <v-card class="mb-4">
            <v-card-title>基础信息</v-card-title>
            <v-card-text>
              <v-row dense>
                <v-col cols="6"><strong>学历：</strong>{{ store.profile.education }}</v-col>
                <v-col cols="6"><strong>专业：</strong>{{ store.profile.major }}</v-col>
                <v-col cols="6"
                  ><strong>院校：</strong>{{ store.profile.university || '未填写' }}</v-col
                >
              </v-row>
              <div class="mt-3" v-if="store.profile.certificates?.length">
                <strong>证书：</strong>
                <v-chip
                  v-for="cert in store.profile.certificates"
                  :key="cert"
                  size="small"
                  class="mr-1 mb-1"
                  color="secondary"
                  variant="outlined"
                  >{{ cert }}</v-chip
                >
              </div>
            </v-card-text>
          </v-card>

          <v-card class="mb-4">
            <v-card-title>7 维竞争力评分</v-card-title>
            <v-card-subtitle class="text-caption text-grey">点击维度可展开子维度详情</v-card-subtitle>
            <v-card-text>
              <div
                v-for="{ key, label } in DIMENSION_CONFIG"
                :key="key"
                class="mb-3"
              >
                <!-- 一级维度 -->
                <div
                  class="d-flex justify-space-between align-center mb-1 cursor-pointer"
                  style="cursor: pointer"
                  @click="toggleDimension(key)"
                >
                  <span class="text-body-2 font-weight-medium d-flex align-center ga-1">
                    <v-icon size="14" :icon="expandedDimension === key ? 'mdi-chevron-down' : 'mdi-chevron-right'" />
                    {{ label }}
                  </span>
                  <span class="text-body-2 font-weight-bold">{{ getDimScore(key) }}/100</span>
                </div>
                <v-progress-linear
                  :model-value="getDimScore(key)"
                  :color="scoreColor(getDimScore(key))"
                  height="8"
                  rounded
                />
                <p
                  v-if="store.profile.scoreDetail?.[key]?.explanation"
                  class="text-caption text-grey mt-1"
                >
                  {{ store.profile.scoreDetail[key]!.explanation }}
                </p>

                <!-- 子维度展开 -->
                <v-expand-transition>
                  <div v-if="expandedDimension === key" class="mt-2 pl-4">
                    <div
                      v-for="(sub, subKey) in store.profile.scoreDetail?.[key]?.sub_dimensions"
                      :key="subKey"
                      class="mb-2"
                    >
                      <div class="d-flex justify-space-between align-center mb-1">
                        <span class="text-caption text-medium-emphasis">
                          {{ SUB_DIMENSION_LABELS[subKey] ?? subKey }}
                        </span>
                        <span class="text-caption font-weight-medium">{{ sub.score }}/100</span>
                      </div>
                      <v-progress-linear
                        :model-value="sub.score"
                        :color="scoreColor(sub.score)"
                        height="5"
                        rounded
                        bg-opacity="0.15"
                      />
                    </div>
                  </div>
                </v-expand-transition>
              </div>
            </v-card-text>
          </v-card>

          <v-card v-if="store.profile.summary" class="mb-4">
            <v-card-title>AI 评价</v-card-title>
            <v-card-text style="white-space: pre-line">{{ store.profile.summary }}</v-card-text>
          </v-card>

        </v-col>
      </v-row>

    </template>

    <!-- 任务入队后等待 AI 解析的过渡状态 -->
    <template v-else-if="store.parseStatus === 'parsing'">
      <v-alert type="info" variant="tonal" density="compact" class="mb-4" icon="mdi-robot-outline">
        AI 正在解析中，解析完成后页面将自动更新…
      </v-alert>
      <v-row>
        <v-col cols="12" md="5">
          <v-skeleton-loader type="card" class="mb-4" />
          <v-skeleton-loader type="card" />
        </v-col>
        <v-col cols="12" md="7">
          <v-skeleton-loader type="card" class="mb-4" />
          <v-skeleton-loader type="card" class="mb-4" />
          <v-skeleton-loader type="card" />
        </v-col>
      </v-row>
    </template>

    <!-- 尚无画像时，显示上传或手动录入 -->
    <v-card v-else-if="!store.loading" class="pa-6">
      <v-tabs v-model="profileInputTab" color="primary" class="mb-4">
        <v-tab :value="0"><v-icon start icon="mdi-file-upload" />上传简历</v-tab>
        <v-tab :value="1"><v-icon start icon="mdi-pencil" />手动录入</v-tab>
      </v-tabs>

      <v-window v-model="profileInputTab">
        <!-- Tab 1: 上传简历 -->
        <v-window-item :value="0">
          <v-card-text>
            <v-file-input
              label="选择简历文件"
              accept=".pdf,.docx,.md,.markdown"
              prepend-icon="mdi-file-upload"
              show-size
              variant="outlined"
              @update:model-value="onFileChange"
              :rules="[(v: any) => !v || !v[0] || v[0].size < 10485760 || '文件大小不能超过 10MB']"
            />

            <v-alert type="info" variant="tonal" class="mb-4">
              支持 PDF、DOCX 和 Markdown 格式，文件大小不超过 10MB
            </v-alert>

            <v-btn
              color="primary"
              size="large"
              block
              :loading="store.loading"
              :disabled="!selectedFile"
              @click="handleUpload"
            >
              <v-icon start icon="mdi-cloud-upload" />开始解析
            </v-btn>

          </v-card-text>
        </v-window-item>

        <!-- Tab 2: 手动录入 -->
        <v-window-item :value="1">
          <v-card-text>
            <v-alert type="info" variant="tonal" class="mb-4" density="compact">
              手动填写个人信息，支持技能、实习经历和项目经验。填写越完整，AI 生成的画像越准确。
            </v-alert>

            <!-- 基础信息 -->
            <div class="text-subtitle-1 font-weight-bold mb-2">基础信息</div>
            <v-row dense>
              <v-col cols="12" sm="4">
                <v-select
                  v-model="manualForm.education"
                  :items="['大专', '本科', '硕士', '博士']"
                  label="学历 *"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" sm="4">
                <v-text-field
                  v-model="manualForm.major"
                  label="专业 *"
                  placeholder="如：计算机科学与技术"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" sm="4">
                <v-text-field
                  v-model="manualForm.university"
                  label="院校"
                  placeholder="如：北京大学"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
            </v-row>

            <!-- 证书 -->
            <div class="text-subtitle-1 font-weight-bold mb-2 mt-2">证书资质</div>
            <v-row dense align="center">
              <v-col cols="12" sm="8">
                <v-text-field
                  v-model="certInput"
                  label="证书名称"
                  placeholder="如：CET-6、软考中级"
                  variant="outlined"
                  density="comfortable"
                  @keyup.enter="addCert"
                  append-inner-icon="mdi-plus"
                  @click:append-inner="addCert"
                />
              </v-col>
            </v-row>
            <div v-if="manualForm.certificates.length" class="mb-3">
              <v-chip
                v-for="(cert, idx) in manualForm.certificates"
                :key="idx"
                closable
                size="small"
                color="secondary"
                variant="outlined"
                class="mr-1 mb-1"
                @click:close="removeCert(idx)"
                >{{ cert }}</v-chip
              >
            </div>

            <v-divider class="my-4" />

            <!-- 专业技能 -->
            <div class="d-flex align-center mb-2">
              <span class="text-subtitle-1 font-weight-bold">专业技能</span>
              <v-spacer />
              <v-btn size="small" variant="text" color="primary" @click="addSkill">
                <v-icon start icon="mdi-plus" />添加技能
              </v-btn>
            </div>
            <v-card
              v-for="(skill, idx) in manualForm.skills"
              :key="'skill-' + idx"
              class="pa-3 mb-2"
            >
              <v-row dense>
                <v-col cols="12" sm="5">
                  <v-text-field
                    v-model="skill.skillName"
                    label="技能名称 *"
                    placeholder="如：Java、Python、Vue.js"
                    variant="outlined"
                    density="compact"
                    hide-details
                  />
                </v-col>
                <v-col cols="12" sm="3">
                  <v-select
                    v-model="skill.proficiency"
                    :items="['了解', '熟练', '精通']"
                    label="熟练度"
                    variant="outlined"
                    density="compact"
                    hide-details
                  />
                </v-col>
                <v-col cols="12" sm="3">
                  <v-text-field
                    v-model="skill.knowledgePoints"
                    label="知识点"
                    placeholder="逗号分隔，如：Spring Boot, MyBatis"
                    variant="outlined"
                    density="compact"
                    hide-details
                  />
                </v-col>
                <v-col cols="12" sm="1" class="d-flex align-center justify-center">
                  <v-btn
                    icon="mdi-delete"
                    size="small"
                    variant="text"
                    color="error"
                    :disabled="manualForm.skills.length <= 1"
                    @click="removeSkill(idx)"
                  />
                </v-col>
              </v-row>
            </v-card>

            <v-divider class="my-4" />

            <!-- 实习经历 -->
            <div class="d-flex align-center mb-2">
              <span class="text-subtitle-1 font-weight-bold">实习经历</span>
              <v-spacer />
              <v-btn size="small" variant="text" color="primary" @click="addInternship">
                <v-icon start icon="mdi-plus" />添加实习
              </v-btn>
            </div>
            <v-card
              v-for="(intern, idx) in manualForm.internships"
              :key="'intern-' + idx"
              class="pa-3 mb-2"
            >
              <v-row dense>
                <v-col cols="12" sm="4">
                  <v-text-field
                    v-model="intern.company"
                    label="公司名称"
                    placeholder="如：阿里巴巴"
                    variant="outlined"
                    density="compact"
                    hide-details
                  />
                </v-col>
                <v-col cols="12" sm="3">
                  <v-text-field
                    v-model="intern.position"
                    label="岗位"
                    placeholder="如：Java实习生"
                    variant="outlined"
                    density="compact"
                    hide-details
                  />
                </v-col>
                <v-col cols="12" sm="2">
                  <v-text-field
                    v-model="intern.duration"
                    label="时长"
                    placeholder="如：3个月"
                    variant="outlined"
                    density="compact"
                    hide-details
                  />
                </v-col>
                <v-col cols="12" sm="2">
                  <v-text-field
                    v-model="intern.description"
                    label="工作描述"
                    variant="outlined"
                    density="compact"
                    hide-details
                  />
                </v-col>
                <v-col cols="12" sm="1" class="d-flex align-center justify-center">
                  <v-btn
                    icon="mdi-delete"
                    size="small"
                    variant="text"
                    color="error"
                    :disabled="manualForm.internships.length <= 1"
                    @click="removeInternship(idx)"
                  />
                </v-col>
              </v-row>
            </v-card>

            <v-divider class="my-4" />

            <!-- 项目经验 -->
            <div class="d-flex align-center mb-2">
              <span class="text-subtitle-1 font-weight-bold">项目经验</span>
              <v-spacer />
              <v-btn size="small" variant="text" color="primary" @click="addProject">
                <v-icon start icon="mdi-plus" />添加项目
              </v-btn>
            </div>
            <v-card
              v-for="(proj, idx) in manualForm.projects"
              :key="'proj-' + idx"
              class="pa-3 mb-2"
            >
              <v-row dense>
                <v-col cols="12" sm="4">
                  <v-text-field
                    v-model="proj.name"
                    label="项目名称"
                    placeholder="如：在线商城系统"
                    variant="outlined"
                    density="compact"
                    hide-details
                  />
                </v-col>
                <v-col cols="12" sm="3">
                  <v-text-field
                    v-model="proj.role"
                    label="担任角色"
                    placeholder="如：后端开发"
                    variant="outlined"
                    density="compact"
                    hide-details
                  />
                </v-col>
                <v-col cols="12" sm="3">
                  <v-text-field
                    v-model="proj.techStack"
                    label="技术栈"
                    placeholder="逗号分隔，如：Vue, Spring Boot"
                    variant="outlined"
                    density="compact"
                    hide-details
                  />
                </v-col>
                <v-col cols="12" sm="1" class="d-flex align-center justify-center">
                  <v-btn
                    icon="mdi-delete"
                    size="small"
                    variant="text"
                    color="error"
                    :disabled="manualForm.projects.length <= 1"
                    @click="removeProject(idx)"
                  />
                </v-col>
                <v-col cols="12">
                  <v-textarea
                    v-model="proj.description"
                    label="项目描述"
                    placeholder="简要描述项目内容和你的贡献…"
                    variant="outlined"
                    density="compact"
                    rows="2"
                    hide-details
                  />
                </v-col>
              </v-row>
            </v-card>

            <v-btn
              color="primary"
              size="large"
              block
              class="mt-4"
              :loading="submittingManual"
              :disabled="!manualForm.education || !manualForm.major"
              @click="handleManualSubmit"
            >
              <v-icon start icon="mdi-creation" />AI 生成画像
            </v-btn>
          </v-card-text>
        </v-window-item>
      </v-window>
    </v-card>

    <!-- 重新上传简历弹窗 -->
    <v-dialog v-model="showUploadDialog" max-width="520">
      <v-card class="pa-4">
        <v-card-title class="text-h6">重新上传简历</v-card-title>
        <v-card-text>
          <v-file-input
            label="选择简历文件"
            accept=".pdf,.docx,.md,.markdown"
            prepend-icon="mdi-file-upload"
            show-size
            variant="outlined"
            @update:model-value="onFileChange"
            :rules="[(v: any) => !v || !v[0] || v[0].size < 10485760 || '文件大小不能超过 10MB']"
          />

          <v-alert type="info" variant="tonal" class="mb-4">
            支持 PDF、DOCX 和 Markdown 格式，文件大小不超过 10MB。重新上传将覆盖现有画像。
          </v-alert>

          <v-skeleton-loader v-if="store.parseStatus === 'parsing'" type="paragraph" class="mb-4" />

          <v-alert v-if="store.parseStatus === 'error'" type="error" variant="tonal" class="mb-4">
            解析失败，请检查文件格式后重试
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showUploadDialog = false">取消</v-btn>
          <v-btn
            color="primary"
            :loading="store.loading"
            :disabled="!selectedFile"
            @click="handleUpload"
          >
            <v-icon start icon="mdi-cloud-upload" />开始解析
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" :timeout="3000" :color="snackbarColor" location="top right">{{
      snackbarText
    }}</v-snackbar>
  </v-container>
</template>
