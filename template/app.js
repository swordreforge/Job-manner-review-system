// 全局状态
const state = {
    token: localStorage.getItem('token'),
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    currentPage: 1,
    pageSize: 10,
    totalStudents: 0,
    students: [],
    classes: [],
    systemStatus: null,
    currentEditStudentId: null,
    // 岗位相关
    currentJobPage: 1,
    totalJobs: 0,
    jobs: [],
    currentEditJobId: null,
    // 用户相关
    currentUserPage: 1,
    totalUsers: 0,
    users: [],
    currentEditUserId: null,
    // 数据管理相关
    tables: [],
    currentTable: null,
    currentColumns: [],
    // 图表实例
    cpuChart: null,
    memoryChart: null,
    diskChart: null,
    processChart: null,
    // 图表数据历史
    cpuHistory: [],
    memoryHistory: [],
    diskHistory: [],
    processHistory: [],
    // 历史数据时间戳
    chartLabels: []
};

// API 基础URL
const API_BASE = '/api/v1';

// DOM 元素
const elements = {
    loginPage: document.getElementById('login-page'),
    dashboardPage: document.getElementById('dashboard-page'),
    loginForm: document.getElementById('login-form'),
    loginError: document.getElementById('login-error'),
    currentUser: document.getElementById('current-user'),
    logoutBtn: document.getElementById('logout-btn'),
    navItems: document.querySelectorAll('.nav-item'),
    contentSections: {
        dashboard: document.getElementById('dashboard-content'),
        students: document.getElementById('students-content'),
        jobs: document.getElementById('jobs-content'),
        users: document.getElementById('users-content'),
        schema: document.getElementById('schema-content'),
        system: document.getElementById('system-content')
    },
    // 仪表盘元素
    totalStudents: document.getElementById('total-students'),
    totalClasses: document.getElementById('total-classes'),
    totalJobs: document.getElementById('total-jobs'),
    recentStudentsList: document.getElementById('recent-students-list'),
    // 学生管理元素
    addStudentBtn: document.getElementById('add-student-btn'),
    studentSearch: document.getElementById('student-search'),
    searchBtn: document.getElementById('search-btn'),
    studentsTableBody: document.getElementById('students-table-body'),
    prevPageBtn: document.getElementById('prev-page'),
    nextPageBtn: document.getElementById('next-page'),
    pageInfo: document.getElementById('page-info'),
    // 系统状态元素
    refreshStatusBtn: document.getElementById('refresh-status-btn'),
    backupBtn: document.getElementById('backup-btn'),
    viewBackupsBtn: document.getElementById('view-backups-btn'),
    backupsList: document.getElementById('backups-list'),
    // 模态框元素
    studentModal: document.getElementById('student-modal'),
    modalTitle: document.getElementById('modal-title'),
    studentForm: document.getElementById('student-form'),
    closeModalBtn: document.getElementById('close-modal'),
    cancelBtn: document.getElementById('cancel-btn'),
    // 提示消息
    toast: document.getElementById('toast'),
    // 快捷操作
    actionCards: document.querySelectorAll('.action-card')
};

// API 请求函数
async function apiRequest(url, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (state.token) {
        headers['Authorization'] = `Bearer ${state.token}`;
    }

    const response = await fetch(API_BASE + url, {
        ...options,
        headers
    });

    if (response.status === 401) {
        handleLogout();
        showToast('登录已过期，请重新登录', 'error');
        throw new Error('登录已过期');
    }

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || '请求失败');
    }

    return data;
}

// 显示提示消息
function showToast(message, type = 'success') {
    elements.toast.textContent = message;
    elements.toast.className = `toast ${type} active`;

    setTimeout(() => {
        elements.toast.className = 'toast';
    }, 3000);
}

// 页面切换
function switchPage(page) {
    // 更新导航状态
    elements.navItems.forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === page) {
            item.classList.add('active');
        }
    });

    // 更新内容区域
    Object.keys(elements.contentSections).forEach(key => {
        const section = elements.contentSections[key];
        if (section) {
            section.classList.remove('active');
        }
    });

    const activeSection = elements.contentSections[page];
    if (activeSection) {
        activeSection.classList.add('active');
    }

    // 加载对应页面数据
    switch (page) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'students':
            loadStudents();
            break;
        case 'jobs':
            loadJobs();
            break;
        case 'users':
            loadUsers();
            break;
        case 'schema':
            loadSchemaTables();
            break;
        case 'system':
            loadSystemStatus();
            break;
    }
}

// 登录功能
async function handleLogin(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });

        if (response.code === 200 && response.data) {
            state.token = response.data.token;
            state.user = response.data.user;

            localStorage.setItem('token', state.token);
            localStorage.setItem('user', JSON.stringify(state.user));

            elements.currentUser.textContent = state.user.name || '教师';
            elements.loginPage.classList.remove('active');
            elements.dashboardPage.classList.add('active');

            switchPage('dashboard');
            showToast('登录成功');
        } else {
            throw new Error(response.message || '登录失败');
        }
    } catch (error) {
        elements.loginError.textContent = error.message;
        showToast('登录失败: ' + error.message, 'error');
    }
}

// 登出功能
function handleLogout() {
    state.token = null;
    state.user = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    elements.dashboardPage.classList.remove('active');
    elements.loginPage.classList.add('active');
    showToast('已退出登录');
}

// 加载仪表盘数据
async function loadDashboardData() {
    try {
        // 获取学生列表（第一页）
        const studentsResponse = await apiRequest('/students?page=1&page_size=20');

        if (studentsResponse.code === 200) {
            state.students = studentsResponse.data.items;
            state.totalStudents = studentsResponse.data.total;

            // 更新统计数据
            elements.totalStudents.textContent = state.totalStudents;

            // 提取专业
            state.classes = [...new Set(state.students.map(s => s.major).filter(Boolean))];
            elements.totalClasses.textContent = state.classes.length || state.totalStudents;

            // 更新最近学生列表
            updateRecentStudents();
        }

        // 获取岗位数量
        try {
            const jobsResponse = await apiRequest('/jobs?page=1&page_size=1');
            if (jobsResponse.code === 200) {
                state.totalJobs = jobsResponse.data.total;
                elements.totalJobs.textContent = state.totalJobs;
            }
        } catch (e) {
            console.log('获取岗位数量失败:', e);
        }

        // 获取系统状态
        await loadSystemStatusData();

    } catch (error) {
        console.error('加载仪表盘数据失败:', error);
        handleLogout();
        showToast('登录会话已过期', 'error');
    }
}

// 更新最近学生列表
function updateRecentStudents() {
    const recentStudents = state.students.slice(0, 5);

    if (recentStudents.length === 0) {
        elements.recentStudentsList.innerHTML = '<div class="loading">暂无学生数据</div>';
        return;
    }

    elements.recentStudentsList.innerHTML = recentStudents.map(student => `
        <div class="student-item">
            <div class="student-info">
                <div class="student-avatar">${student.name.charAt(0)}</div>
                <div class="student-details">
                    <h4>${student.name}</h4>
                    <p>${student.major || '未填写'} - ${student.education || '未填写'}</p>
                </div>
            </div>
            <div class="student-actions">
                <button class="btn btn-secondary" onclick="viewStudent('${student.id}')">查看</button>
            </div>
        </div>
    `).join('');
}

// 加载学生列表
async function loadStudents(page = 1) {
    try {
        const keyword = elements.studentSearch.value;

        let url = `/students?page=${page}&page_size=${state.pageSize}`;
        if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;

        const response = await apiRequest(url);

        if (response.code === 200) {
            state.students = response.data.items;
            state.totalStudents = response.data.total;
            state.currentPage = page;

            updateStudentsTable();
            updatePagination();
        }
    } catch (error) {
        console.error('加载学生列表失败:', error);
        showToast('加载学生列表失败', 'error');
    }
}

// 更新学生表格
function updateStudentsTable() {
    if (state.students.length === 0) {
        elements.studentsTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="loading">暂无学生数据</td>
            </tr>
        `;
        return;
    }

    elements.studentsTableBody.innerHTML = state.students.map(student => `
        <tr>
            <td>${student.id}</td>
            <td>${student.name}</td>
            <td>${student.education || '-'}</td>
            <td>${student.major || '-'}</td>
            <td>${student.graduation_year || '-'}</td>
            <td>
                <button class="btn btn-secondary" onclick="viewStudent('${student.id}')">查看</button>
                <button class="btn btn-secondary" onclick="editStudent('${student.id}')">编辑</button>
                <button class="btn btn-secondary" style="color: var(--danger-color);" onclick="deleteStudent('${student.id}')">删除</button>
            </td>
        </tr>
    `).join('');
}

// 更新分页
function updatePagination() {
    const totalPages = Math.ceil(state.totalStudents / state.pageSize);

    elements.pageInfo.textContent = `第 ${state.currentPage} / ${totalPages || 1} 页`;
    elements.prevPageBtn.disabled = state.currentPage <= 1;
    elements.nextPageBtn.disabled = state.currentPage >= totalPages;
}

// 加载系统状态
async function loadSystemStatus() {
    initCharts();
    await loadSystemStatusData();
}

function initCharts() {
    if (state.cpuChart) return;

    const createGradient = (ctx, color) => {
        const gradient = ctx.createLinearGradient(0, 0, 0, 180);
        gradient.addColorStop(0, color.replace('1)', '0.4)').replace('rgb', 'rgba'));
        gradient.addColorStop(1, color.replace('1)', '0)').replace('rgb', 'rgba'));
        return gradient;
    };

    const baseOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            intersect: false,
            mode: 'index'
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(30, 41, 59, 0.95)',
                titleColor: '#f8fafc',
                bodyColor: '#94a3b8',
                borderColor: 'rgba(255,255,255,0.1)',
                borderWidth: 1,
                padding: 12,
                displayColors: false,
                callbacks: {
                    label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(1)}%`
                }
            }
        },
        scales: {
            x: {
                display: false
            },
            y: {
                min: 0,
                max: 100,
                grid: {
                    color: 'rgba(255,255,255,0.05)',
                    drawBorder: false
                },
                ticks: {
                    color: 'rgba(255,255,255,0.4)',
                    font: { size: 10 },
                    callback: (v) => v + '%',
                    maxTicksLimit: 5
                }
            }
        },
        elements: {
            line: {
                borderWidth: 2,
                tension: 0.4,
                cubicInterpolationMode: 'monotone'
            },
            point: {
                radius: 0,
                hoverRadius: 5,
                hoverBorderWidth: 2,
                hoverBackgroundColor: '#fff'
            }
        }
    };

    const cpuCtx = document.getElementById('cpuChart').getContext('2d');
    const cpuGradient = cpuCtx.createLinearGradient(0, 0, 0, 180);
    cpuGradient.addColorStop(0, 'rgba(99, 102, 241, 0.4)');
    cpuGradient.addColorStop(1, 'rgba(99, 102, 241, 0)');

    state.cpuChart = new Chart(cpuCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'CPU',
                data: [],
                borderColor: '#6366f1',
                backgroundColor: cpuGradient,
                fill: true,
                pointBackgroundColor: '#6366f1'
            }]
        },
        options: baseOptions
    });

    const memCtx = document.getElementById('memoryChart').getContext('2d');
    const memGradient = memCtx.createLinearGradient(0, 0, 0, 180);
    memGradient.addColorStop(0, 'rgba(16, 185, 129, 0.4)');
    memGradient.addColorStop(1, 'rgba(16, 185, 129, 0)');

    state.memoryChart = new Chart(memCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: '内存',
                data: [],
                borderColor: '#10b981',
                backgroundColor: memGradient,
                fill: true,
                pointBackgroundColor: '#10b981'
            }]
        },
        options: baseOptions
    });

    const diskCtx = document.getElementById('diskChart').getContext('2d');
    const diskGradient = diskCtx.createLinearGradient(0, 0, 0, 180);
    diskGradient.addColorStop(0, 'rgba(245, 158, 11, 0.4)');
    diskGradient.addColorStop(1, 'rgba(245, 158, 11, 0)');

    state.diskChart = new Chart(diskCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: '磁盘',
                data: [],
                borderColor: '#f59e0b',
                backgroundColor: diskGradient,
                fill: true,
                pointBackgroundColor: '#f59e0b'
            }]
        },
        options: baseOptions
    });

    // 进程数量图表配置
    const processOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            intersect: false,
            mode: 'index'
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(30, 41, 59, 0.95)',
                titleColor: '#f8fafc',
                bodyColor: '#94a3b8',
                borderColor: 'rgba(255,255,255,0.1)',
                borderWidth: 1,
                padding: 12,
                displayColors: false,
                callbacks: {
                    label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y}`
                }
            }
        },
        scales: {
            x: {
                display: false
            },
            y: {
                min: 0,
                grid: {
                    color: 'rgba(255,255,255,0.05)',
                    drawBorder: false
                },
                ticks: {
                    color: 'rgba(255,255,255,0.4)',
                    font: { size: 10 },
                    maxTicksLimit: 5
                }
            }
        },
        elements: {
            line: {
                borderWidth: 2,
                tension: 0.4,
                cubicInterpolationMode: 'monotone'
            },
            point: {
                radius: 0,
                hoverRadius: 5,
                hoverBorderWidth: 2,
                hoverBackgroundColor: '#fff'
            }
        }
    };

    const processCtx = document.getElementById('processChart').getContext('2d');
    const processGradient = processCtx.createLinearGradient(0, 0, 0, 180);
    processGradient.addColorStop(0, 'rgba(239, 68, 68, 0.4)');
    processGradient.addColorStop(1, 'rgba(239, 68, 68, 0)');

    state.processChart = new Chart(processCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: '进程',
                data: [],
                borderColor: '#ef4444',
                backgroundColor: processGradient,
                fill: true,
                pointBackgroundColor: '#ef4444'
            }]
        },
        options: processOptions
    });
}

async function loadSystemStatusData() {
    try {
        const response = await apiRequest('/ops/status');

        if (response.code === 200) {
            state.systemStatus = response.data;
            updateSystemStatusUI();
        }
    } catch (error) {
        console.error('加载系统状态失败:', error);
    }
}

function updateSystemStatusUI() {
    if (!state.systemStatus) return;

    const status = state.systemStatus;

    document.getElementById('server-status-text').textContent = status.server === 'running' ? '运行中' : '已停止';
    document.getElementById('db-status-text').textContent = status.database === 'connected' ? '已连接' : '未连接';

    // 更新首页的数据库状态
    const databaseStatusEl = document.getElementById('database-status');
    if (databaseStatusEl) {
        databaseStatusEl.textContent = status.database === 'connected' ? '已连接' : '未连接';
    }

    const uptimeSeconds = status.uptime || 0;
    const hours = Math.floor(uptimeSeconds / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    document.getElementById('uptime-text').textContent = `${hours}小时 ${minutes}分`;

    const cpuValue = status.cpu_usage || 0;
    const memoryValue = status.memory_usage || 0;
    const diskValue = status.disk_usage || 0;

    document.getElementById('cpu-usage').textContent = `${cpuValue.toFixed(1)}%`;
    document.getElementById('memory-info').textContent = `${formatBytes(status.memory_used || 0)} / ${formatBytes(status.memory_total || 0)}`;
    document.getElementById('disk-info').textContent = `${formatBytes(status.disk_used || 0)} / ${formatBytes(status.disk_total || 0)}`;

    const processCount = status.process_count || 0;
    document.getElementById('process-count-stat').textContent = processCount;
    document.getElementById('process-info').textContent = `${processCount} 个进程`;

    fetchUsersCount();

    const now = new Date().toLocaleTimeString('zh-CN', { hour12: false });

    state.cpuHistory.push(cpuValue);
    state.memoryHistory.push(memoryValue);
    state.diskHistory.push(diskValue);
    state.processHistory.push(processCount);
    state.chartLabels.push(now);

    const maxPoints = 20;
    if (state.cpuHistory.length > maxPoints) {
        state.cpuHistory.shift();
        state.memoryHistory.shift();
        state.diskHistory.shift();
        state.processHistory.shift();
        state.chartLabels.shift();
    }

    if (state.cpuChart) {
        state.cpuChart.data.labels = state.chartLabels;
        state.cpuChart.data.datasets[0].data = state.cpuHistory;
        state.cpuChart.update('none');
    }
    if (state.memoryChart) {
        state.memoryChart.data.labels = state.chartLabels;
        state.memoryChart.data.datasets[0].data = state.memoryHistory;
        state.memoryChart.update('none');
    }
    if (state.diskChart) {
        state.diskChart.data.labels = state.chartLabels;
        state.diskChart.data.datasets[0].data = state.diskHistory;
        state.diskChart.update('none');
    }
    if (state.processChart) {
        state.processChart.data.labels = state.chartLabels;
        state.processChart.data.datasets[0].data = state.processHistory;
        state.processChart.update('none');
    }

    const serverTime = new Date(status.server_time * 1000);
    document.getElementById('server-time').textContent = serverTime.toLocaleString('zh-CN');
    
    if (!window.serverTimeInterval) {
        window.serverTimeInterval = setInterval(() => {
            if (state.systemStatus && state.systemStatus.server_time) {
                state.systemStatus.server_time += 1;
                const time = new Date(state.systemStatus.server_time * 1000);
                document.getElementById('server-time').textContent = time.toLocaleString('zh-CN');
            }
        }, 1000);
    }
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function fetchUsersCount() {
    try {
        const response = await apiRequest('/users?page=1&page_size=1');
        if (response.code === 200) {
            document.getElementById('total-users-stat').textContent = response.data.total;
        }
    } catch (e) {
        document.getElementById('total-users-stat').textContent = '-';
    }
}

// 打开学生模态框
function openStudentModal(mode = 'add', studentId = null) {
    elements.studentModal.classList.add('active');
    
    const form = elements.studentForm;
    const inputs = form.querySelectorAll('input, select, textarea');
    const saveBtn = form.querySelector('[type="submit"]');
    
    if (mode === 'view' && studentId) {
        elements.modalTitle.textContent = '学生详情';
        const student = state.students.find(s => s.id == studentId);
        if (student) {
            document.getElementById('student-id').value = student.id;
            document.getElementById('student-name').value = student.name;
            document.getElementById('student-education').value = student.education || '';
            document.getElementById('student-major').value = student.major || '';
            document.getElementById('student-graduation-year').value = student.graduation_year || '';
        }
        inputs.forEach(input => input.disabled = true);
        if (saveBtn) saveBtn.style.display = 'none';
    } else if (mode === 'edit' && studentId) {
        elements.modalTitle.textContent = '编辑学生';
        inputs.forEach(input => input.disabled = false);
        const student = state.students.find(s => s.id == studentId);
        if (student) {
            document.getElementById('student-id').value = student.id;
            document.getElementById('student-name').value = student.name;
            document.getElementById('student-education').value = student.education || '';
            document.getElementById('student-major').value = student.major || '';
            document.getElementById('student-graduation-year').value = student.graduation_year || '';
            const skillsValue = Array.isArray(student.skills) ? JSON.stringify(student.skills, null, 2) : (student.skills || '');
            const certsValue = Array.isArray(student.certificates) ? JSON.stringify(student.certificates, null, 2) : (student.certificates || '');
            const projectsValue = Array.isArray(student.projects) ? JSON.stringify(student.projects, null, 2) : (student.projects || '');
            document.getElementById('student-skills').value = skillsValue;
            document.getElementById('student-certificates').value = certsValue;
            document.getElementById('student-projects').value = projectsValue;
        }
        if (saveBtn) saveBtn.style.display = '';
    } else {
        elements.modalTitle.textContent = '添加学生';
        form.reset();
        document.getElementById('student-id').value = '';
        inputs.forEach(input => input.disabled = false);
        if (saveBtn) saveBtn.style.display = '';
    }
}

// 关闭学生模态框
function closeStudentModal() {
    elements.studentModal.classList.remove('active');
    elements.studentForm.reset();
}

// 保存学生
async function saveStudent(event) {
    event.preventDefault();

    const formData = new FormData(elements.studentForm);
    const studentData = {
        name: formData.get('name'),
        education: formData.get('education') || null,
        major: formData.get('major') || null,
        graduation_year: formData.get('graduation_year') ? parseInt(formData.get('graduation_year')) : null,
        skills: formData.get('skills') || null,
        certificates: formData.get('certificates') || null,
        projects: formData.get('projects') || null
    };

    const studentId = document.getElementById('student-id').value;

    try {
        let response;
        if (studentId) {
            // 更新学生
            response = await apiRequest(`/students/${studentId}`, {
                method: 'PUT',
                body: JSON.stringify(studentData)
            });
        } else {
            // 创建学生
            response = await apiRequest('/students', {
                method: 'POST',
                body: JSON.stringify(studentData)
            });
        }

        if (response.code === 200) {
            showToast(studentId ? '更新成功' : '添加成功');
            closeStudentModal();
            loadStudents(state.currentPage);
            loadDashboardData();
        }
    } catch (error) {
        console.error('保存学生失败:', error);
        showToast('保存失败: ' + error.message, 'error');
    }
}

// 查看学生
function viewStudent(studentId) {
    const student = state.students.find(s => s.id == studentId);
    if (student) {
        showStudentDetail(student);
    }
}

// 显示学生详情
function showStudentDetail(student) {
    const educationMap = {
        'high_school': '高中',
        'associate': '大专',
        'bachelor': '本科',
        'master': '硕士',
        'doctor': '博士'
    };
    
    document.getElementById('detail-name').textContent = student.name || '-';
    document.getElementById('detail-education').textContent = educationMap[student.education] || '-';
    document.getElementById('detail-major').textContent = student.major || '-';
    document.getElementById('detail-graduation-year').textContent = student.graduation_year || '-';
    document.getElementById('detail-completeness').textContent = student.completeness_score ? student.completeness_score.toFixed(1) + '%' : '-';
    document.getElementById('detail-competitiveness').textContent = student.competitiveness_score ? student.competitiveness_score.toFixed(1) + '%' : '-';
    
    const skillsEl = document.getElementById('detail-skills');
    if (student.skills && student.skills.length > 0) {
        skillsEl.innerHTML = student.skills.map(s => 
            `<span class="tag">${s.name || s}</span>`
        ).join('');
    } else {
        skillsEl.textContent = '暂无';
    }
    
    const certsEl = document.getElementById('detail-certificates');
    if (student.certificates && student.certificates.length > 0) {
        certsEl.innerHTML = student.certificates.map(c => 
            `<span class="tag">${c.name || c} ${c.level ? '(' + c.level + ')' : ''}</span>`
        ).join('');
    } else {
        certsEl.textContent = '暂无';
    }
    
    state.currentEditStudentId = student.id;
    document.getElementById('student-detail-modal').classList.add('active');
}

// 关闭详情模态框
document.getElementById('close-detail-modal').addEventListener('click', () => {
    document.getElementById('student-detail-modal').classList.remove('active');
});
document.getElementById('close-detail-btn').addEventListener('click', () => {
    document.getElementById('student-detail-modal').classList.remove('active');
});

// 从详情进入编辑
document.getElementById('edit-from-detail-btn').addEventListener('click', () => {
    if (state.currentEditStudentId) {
        document.getElementById('student-detail-modal').classList.remove('active');
        openStudentModal('edit', state.currentEditStudentId);
    }
});

// 编辑学生
function editStudent(studentId) {
    openStudentModal('edit', studentId);
}

// 删除学生
async function deleteStudent(studentId) {
    if (!confirm('确定要删除这个学生吗？')) {
        return;
    }

    try {
        const response = await apiRequest(`/students/${studentId}`, {
            method: 'DELETE'
        });

        if (response.code === 200) {
            showToast('删除成功');
            loadStudents(state.currentPage);
            loadDashboardData();
        }
    } catch (error) {
        console.error('删除学生失败:', error);
        showToast('删除失败: ' + error.message, 'error');
    }
}

// 数据备份
async function backupData() {
    try {
        const response = await apiRequest('/ops/backup', {
            method: 'POST',
            body: JSON.stringify({ output_dir: '.' })
        });

        if (response.code === 200) {
            showToast('备份成功');
            loadBackups();
        }
    } catch (error) {
        console.error('备份失败:', error);
        showToast('备份失败: ' + error.message, 'error');
    }
}

// 加载备份列表
async function loadBackups() {
    try {
        const response = await apiRequest('/ops/backups?backup_dir=.');

        if (response.code === 200) {
            const backups = response.data.items || [];

            if (backups.length === 0) {
                elements.backupsList.innerHTML = '<div class="loading">暂无备份</div>';
                return;
            }

            elements.backupsList.innerHTML = backups.map(backup => `
                <div class="backup-item">
                    <div class="backup-info">
                        <span class="backup-name">${backup.filename}</span>
                        <span class="backup-size">${formatBytes(backup.file_size)}</span>
                        <span class="backup-date">${new Date(backup.created_at * 1000).toLocaleString('zh-CN')}</span>
                    </div>
                    <div class="backup-actions">
                        <button class="btn btn-secondary btn-sm" onclick="downloadBackup('${backup.filename}')" title="下载">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                        </button>
                        <button class="btn btn-primary btn-sm" onclick="restoreBackup('${backup.filename}')" title="恢复">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                                <path d="M3 3v5h5"></path>
                            </svg>
                        </button>
                        <button class="btn btn-secondary btn-sm" style="color: var(--danger-color);" onclick="deleteBackup('${backup.filename}')" title="删除">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('加载备份列表失败:', error);
        showToast('加载备份列表失败', 'error');
    }
}

// 下载备份文件
function downloadBackup(filename) {
    try {
        const token = state.token;
        const downloadUrl = `/api/v1/ops/backups/${filename}?backup_dir=.`;
        
        // 创建临时链接下载
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;
        
        // 添加 token 到 header
        fetch(downloadUrl, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            if (response.ok) {
                return response.blob();
            }
            throw new Error('下载失败');
        })
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            link.href = url;
            link.click();
            window.URL.revokeObjectURL(url);
            showToast('下载成功');
        })
        .catch(error => {
            console.error('下载失败:', error);
            showToast('下载失败: ' + error.message, 'error');
        });
    } catch (error) {
        console.error('下载失败:', error);
        showToast('下载失败: ' + error.message, 'error');
    }
}

// 恢复数据库
async function restoreBackup(filename) {
    if (!confirm(`确定要恢复数据库吗？\n\n恢复操作将覆盖当前数据库，此操作不可逆！\n\n备份文件: ${filename}`)) {
        return;
    }

    try {
        showToast('正在恢复数据库...', 'warning');
        
        const response = await apiRequest('/ops/restore', {
            method: 'POST',
            body: JSON.stringify({
                filename: filename,
                backup_dir: '.'
            })
        });

        if (response.code === 200) {
            showToast('数据库恢复成功');
            // 刷新数据
            loadDashboardData();
        }
    } catch (error) {
        console.error('恢复失败:', error);
        showToast('恢复失败: ' + error.message, 'error');
    }
}

// 删除备份文件
async function deleteBackup(filename) {
    if (!confirm(`确定要删除备份文件吗？\n\n${filename}\n\n删除后无法恢复！`)) {
        return;
    }

    try {
        const response = await apiRequest(`/ops/backups/${filename}?backup_dir=.`, {
            method: 'DELETE'
        });

        if (response.code === 200) {
            showToast('删除成功');
            loadBackups(); // 重新加载备份列表
        }
    } catch (error) {
        console.error('删除失败:', error);
        showToast('删除失败: ' + error.message, 'error');
    }
}

// 上传备份文件
async function uploadBackup() {
    // 创建文件选择器
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.sql';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) {
            return;
        }

        // 验证文件扩展名
        if (!file.name.toLowerCase().endsWith('.sql')) {
            showToast('只能上传 .sql 文件', 'error');
            return;
        }

        try {
            showToast('正在上传备份文件...', 'warning');

            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${API_BASE}/ops/backups/upload?backup_dir=.`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${state.token}`
                },
                body: formData
            });

            const data = await response.json();

            if (response.ok && data.code === 200) {
                showToast('备份文件上传成功');
                loadBackups(); // 重新加载备份列表
            } else {
                throw new Error(data.message || '上传失败');
            }
        } catch (error) {
            console.error('上传失败:', error);
            showToast('上传失败: ' + error.message, 'error');
        }
    };

    // 触发文件选择
    input.click();
}

// 修改密码
async function changePassword(event) {
    event.preventDefault();

    const oldPassword = document.getElementById('old-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    // 验证新密码
    if (newPassword.length < 6) {
        showToast('新密码至少需要6位', 'error');
        return;
    }

    if (newPassword !== confirmPassword) {
        showToast('两次输入的密码不一致', 'error');
        return;
    }

    if (oldPassword === newPassword) {
        showToast('新密码不能与当前密码相同', 'error');
        return;
    }

    try {
        const response = await apiRequest('/auth/change-password', {
            method: 'POST',
            body: JSON.stringify({
                old_password: oldPassword,
                new_password: newPassword
            })
        });

        if (response.code === 200) {
            showToast('密码修改成功，请重新登录');
            // 清空表单
            document.getElementById('change-password-form').reset();
            // 退出登录
            setTimeout(() => {
                handleLogout();
            }, 2000);
        }
    } catch (error) {
        console.error('修改密码失败:', error);
        showToast('修改密码失败: ' + error.message, 'error');
    }
}

// 修改用户名
async function changeUsername(event) {
    event.preventDefault();

    const password = document.getElementById('username-password').value;
    const newUsername = document.getElementById('new-username').value.trim();
    const confirmUsername = document.getElementById('confirm-username').value.trim();

    // 验证新用户名
    if (newUsername.length < 1 || newUsername.length > 50) {
        showToast('用户名长度必须在1-50位之间', 'error');
        return;
    }

    if (newUsername !== confirmUsername) {
        showToast('两次输入的用户名不一致', 'error');
        return;
    }

    if (state.user && state.user.username === newUsername) {
        showToast('新用户名不能与当前用户名相同', 'error');
        return;
    }

    try {
        const response = await apiRequest('/auth/change-username', {
            method: 'POST',
            body: JSON.stringify({
                password: password,
                new_username: newUsername
            })
        });

        if (response.code === 200) {
            showToast('用户名修改成功，请重新登录');
            // 清空表单
            document.getElementById('change-username-form').reset();
            // 退出登录
            setTimeout(() => {
                handleLogout();
            }, 2000);
        }
    } catch (error) {
        console.error('修改用户名失败:', error);
        showToast('修改用户名失败: ' + error.message, 'error');
    }
}

// 快捷操作处理
function handleQuickAction(action) {
    switch (action) {
        case 'add-student':
            switchPage('students');
            setTimeout(() => openStudentModal('add'), 100);
            break;
        case 'view-all':
            switchPage('students');
            break;
        case 'add-job':
            switchPage('jobs');
            setTimeout(() => openJobModal('add'), 100);
            break;
        case 'backup':
            switchPage('system');
            setTimeout(() => backupData(), 100);
            break;
    }
}

// 初始化
function init() {
    // 检查登录状态
    if (state.token) {
        elements.currentUser.textContent = state.user?.name || '教师';
        elements.loginPage.classList.remove('active');
        elements.dashboardPage.classList.add('active');
        switchPage('dashboard');
    }

    // 事件监听
    elements.loginForm.addEventListener('submit', handleLogin);
    elements.logoutBtn.addEventListener('click', handleLogout);

    elements.navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.dataset.page;
            if (page) {
                switchPage(page);
            }
        });
    });

    elements.addStudentBtn.addEventListener('click', () => openStudentModal('add'));
    elements.searchBtn.addEventListener('click', () => loadStudents(1));
    elements.studentSearch.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            loadStudents(1);
        }
    });

    elements.prevPageBtn.addEventListener('click', () => {
        if (state.currentPage > 1) {
            loadStudents(state.currentPage - 1);
        }
    });

    elements.nextPageBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(state.totalStudents / state.pageSize);
        if (state.currentPage < totalPages) {
            loadStudents(state.currentPage + 1);
        }
    });

    elements.refreshStatusBtn.addEventListener('click', loadSystemStatus);
    elements.backupBtn.addEventListener('click', backupData);
    elements.viewBackupsBtn.addEventListener('click', loadBackups);
    document.getElementById('upload-backup-btn').addEventListener('click', uploadBackup);

    // 账号管理事件监听
    document.getElementById('change-password-form').addEventListener('submit', changePassword);
    document.getElementById('change-username-form').addEventListener('submit', changeUsername);

    elements.closeModalBtn.addEventListener('click', closeStudentModal);
    elements.cancelBtn.addEventListener('click', closeStudentModal);
    elements.studentForm.addEventListener('submit', saveStudent);

    elements.studentModal.addEventListener('click', (e) => {
        if (e.target === elements.studentModal) {
            closeStudentModal();
        }
    });

    elements.actionCards.forEach(card => {
        card.addEventListener('click', (e) => {
            e.preventDefault();
            const action = card.dataset.action;
            if (action) {
                handleQuickAction(action);
            }
        });
    });

    // 定时刷新系统状态和服务器时间
    setInterval(() => {
        loadSystemStatusData();
    }, 5000); // 每5秒刷新一次

    // 岗位管理事件监听
    document.getElementById('add-job-btn').addEventListener('click', () => openJobModal());
    document.getElementById('job-search-btn').addEventListener('click', () => loadJobs(1));
    document.getElementById('job-search').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') loadJobs(1);
    });
    document.getElementById('job-prev-page').addEventListener('click', () => {
        if (state.currentJobPage > 1) loadJobs(state.currentJobPage - 1);
    });
    document.getElementById('job-next-page').addEventListener('click', () => {
        const totalPages = Math.ceil(state.totalJobs / state.pageSize);
        if (state.currentJobPage < totalPages) loadJobs(state.currentJobPage + 1);
    });
    document.getElementById('close-job-detail-modal').addEventListener('click', closeJobDetailModal);
    document.getElementById('close-job-detail-btn').addEventListener('click', closeJobDetailModal);
    document.getElementById('edit-from-job-detail-btn').addEventListener('click', () => {
        if (state.currentEditJobId) {
            closeJobDetailModal();
            openJobModal('edit', state.currentEditJobId);
        }
    });
    document.getElementById('close-job-modal').addEventListener('click', closeJobModal);
    document.getElementById('cancel-job-btn').addEventListener('click', closeJobModal);
    document.getElementById('job-form').addEventListener('submit', saveJob);
    document.getElementById('job-detail-modal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('job-detail-modal')) closeJobDetailModal();
    });
    document.getElementById('job-modal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('job-modal')) closeJobModal();
    });
}

// ============ 岗位管理 ============

async function loadJobs(page = 1) {
    try {
        const keyword = document.getElementById('job-search').value;
        let url = `/jobs?page=${page}&page_size=${state.pageSize}`;
        if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;

        const response = await apiRequest(url);
        if (response.code === 200) {
            state.jobs = response.data.items;
            state.totalJobs = response.data.total;
            state.currentJobPage = page;
            updateJobsTable();
            updateJobPagination();
        }
    } catch (error) {
        console.error('加载岗位列表失败:', error);
        showToast('加载岗位列表失败', 'error');
    }
}

function updateJobsTable() {
    const tbody = document.getElementById('jobs-table-body');
    if (state.jobs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="loading">暂无岗位数据</td></tr>';
        return;
    }
    tbody.innerHTML = state.jobs.map(job => `
        <tr>
            <td>${job.id}</td>
            <td>${job.name}</td>
            <td>${job.company || '-'}</td>
            <td>${job.industry || '-'}</td>
            <td>${job.category || '-'}</td>
            <td>${job.location || '-'}</td>
            <td>${job.salary_range || '-'}</td>
            <td>
                <button class="btn btn-secondary" onclick="viewJob('${job.id}')">查看</button>
                <button class="btn btn-secondary" onclick="editJob('${job.id}')">编辑</button>
                <button class="btn btn-secondary" style="color: var(--danger-color);" onclick="deleteJob('${job.id}')">删除</button>
            </td>
        </tr>
    `).join('');
}

function updateJobPagination() {
    const totalPages = Math.ceil(state.totalJobs / state.pageSize) || 1;
    document.getElementById('job-page-info').textContent = `第 ${state.currentJobPage} / ${totalPages} 页`;
    document.getElementById('job-prev-page').disabled = state.currentJobPage <= 1;
    document.getElementById('job-next-page').disabled = state.currentJobPage >= totalPages;
}

function viewJob(jobId) {
    const job = state.jobs.find(j => j.id == jobId);
    if (job) {
        showJobDetail(job);
    }
}

function showJobDetail(job) {
    document.getElementById('job-detail-name').textContent = job.name || '-';
    document.getElementById('job-detail-company').textContent = job.company || '-';
    document.getElementById('job-detail-industry').textContent = job.industry || '-';
    document.getElementById('job-detail-category').textContent = job.category || '-';
    document.getElementById('job-detail-location').textContent = job.location || '-';
    document.getElementById('job-detail-salary').textContent = job.salary_range || '-';
    document.getElementById('job-detail-description').textContent = job.description || '暂无描述';
    state.currentEditJobId = job.id;
    document.getElementById('job-detail-modal').classList.add('active');
}

function closeJobDetailModal() {
    document.getElementById('job-detail-modal').classList.remove('active');
}

function openJobModal(mode = 'add', jobId = null) {
    const modal = document.getElementById('job-modal');
    const form = document.getElementById('job-form');
    document.getElementById('job-modal-title').textContent = mode === 'add' ? '添加岗位' : '编辑岗位';
    form.reset();

    if (mode === 'edit' && jobId) {
        const job = state.jobs.find(j => j.id == jobId);
        if (job) {
            document.getElementById('job-id').value = job.id;
            document.getElementById('job-name').value = job.name || '';
            document.getElementById('job-company').value = job.company || '';
            document.getElementById('job-industry').value = job.industry || '';
            document.getElementById('job-category').value = job.category || '';
            document.getElementById('job-location').value = job.location || '';
            document.getElementById('job-salary').value = job.salary_range || '';
            document.getElementById('job-description').value = job.description || '';
        }
    } else {
        document.getElementById('job-id').value = '';
    }
    modal.classList.add('active');
}

function closeJobModal() {
    document.getElementById('job-modal').classList.remove('active');
}

function editJob(jobId) {
    openJobModal('edit', jobId);
}

async function saveJob(event) {
    event.preventDefault();
    const formData = new FormData(document.getElementById('job-form'));
    const jobData = {
        name: formData.get('name'),
        company: formData.get('company') || null,
        industry: formData.get('industry') || null,
        category: formData.get('category') || null,
        location: formData.get('location') || null,
        salary_range: formData.get('salary_range') || null,
        description: formData.get('description') || null,
        skills: formData.get('skills') || null,
        certificates: formData.get('certificates') || null,
        requirements: formData.get('requirements') || null
    };

    const jobId = document.getElementById('job-id').value;

    try {
        let response;
        if (jobId) {
            response = await apiRequest(`/jobs/${jobId}`, {
                method: 'PUT',
                body: JSON.stringify(jobData)
            });
        } else {
            response = await apiRequest('/jobs', {
                method: 'POST',
                body: JSON.stringify(jobData)
            });
        }

        if (response.code === 200) {
            showToast(jobId ? '更新成功' : '添加成功');
            closeJobModal();
            loadJobs(state.currentJobPage);
        }
    } catch (error) {
        console.error('保存岗位失败:', error);
        showToast('保存失败: ' + error.message, 'error');
    }
}

async function deleteJob(jobId) {
    if (!confirm('确定要删除这个岗位吗？')) return;
    try {
        const response = await apiRequest(`/jobs/${jobId}`, { method: 'DELETE' });
        if (response.code === 200) {
            showToast('删除成功');
            loadJobs(state.currentJobPage);
        }
    } catch (error) {
        showToast('删除失败: ' + error.message, 'error');
    }
}

// ============ 用户管理 ============

document.getElementById('add-user-btn').addEventListener('click', () => openUserModal());
document.getElementById('user-search-btn').addEventListener('click', () => loadUsers(1));
document.getElementById('user-search').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') loadUsers(1);
});
document.getElementById('user-prev-page').addEventListener('click', () => {
    if (state.currentUserPage > 1) loadUsers(state.currentUserPage - 1);
});
document.getElementById('user-next-page').addEventListener('click', () => {
    const totalPages = Math.ceil(state.totalUsers / state.pageSize);
    if (state.currentUserPage < totalPages) loadUsers(state.currentUserPage + 1);
});
document.getElementById('close-user-modal').addEventListener('click', closeUserModal);
document.getElementById('cancel-user-btn').addEventListener('click', closeUserModal);
document.getElementById('user-form').addEventListener('submit', saveUser);
document.getElementById('user-modal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('user-modal')) closeUserModal();
});

    // 数据管理事件监听
    document.getElementById('refresh-tables-btn').addEventListener('click', loadSchemaTables);
    document.getElementById('close-add-column-modal').addEventListener('click', closeAddColumnModal);
    document.getElementById('cancel-add-column').addEventListener('click', closeAddColumnModal);
    document.getElementById('add-column-form').addEventListener('submit', addColumn);
    document.getElementById('add-column-modal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('add-column-modal')) closeAddColumnModal();
    });
    document.getElementById('close-modify-column-modal').addEventListener('click', closeModifyColumnModal);
    document.getElementById('cancel-modify-column').addEventListener('click', closeModifyColumnModal);
    document.getElementById('modify-column-form').addEventListener('submit', modifyColumn);
    document.getElementById('modify-column-modal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('modify-column-modal')) closeModifyColumnModal();
    });

    // 插入/编辑数据模态框事件监听
    document.getElementById('close-insert-data-modal').addEventListener('click', closeInsertDataModal);
    document.getElementById('cancel-insert-data').addEventListener('click', closeInsertDataModal);
    document.getElementById('insert-data-form').addEventListener('submit', insertData);
    document.getElementById('insert-data-modal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('insert-data-modal')) closeInsertDataModal();
    });
    
    document.getElementById('close-edit-data-modal').addEventListener('click', closeEditDataModal);
    document.getElementById('cancel-edit-data').addEventListener('click', closeEditDataModal);
    document.getElementById('edit-data-form').addEventListener('submit', updateData);
    document.getElementById('edit-data-modal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('edit-data-modal')) closeEditDataModal();
    });

async function loadUsers(page = 1) {
    try {
        const url = `/users?page=${page}&page_size=${state.pageSize}`;
        const response = await apiRequest(url);
        if (response.code === 200) {
            state.users = response.data.items;
            state.totalUsers = response.data.total;
            state.currentUserPage = page;
            updateUsersTable();
            updateUserPagination();
        }
    } catch (error) {
        console.error('加载用户列表失败:', error);
        showToast('加载用户列表失败', 'error');
    }
}

function updateUsersTable() {
    const tbody = document.getElementById('users-table-body');
    if (state.users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="loading">暂无用户数据</td></tr>';
        return;
    }
    tbody.innerHTML = state.users.map(user => `
        <tr>
            <td>${user.id}</td>
            <td>${user.username}</td>
            <td>${user.email || '-'}</td>
            <td>${user.phone || '-'}</td>
            <td>${getRoleName(user.role)}</td>
            <td>
                <button class="btn btn-secondary" onclick="editUser('${user.id}')">编辑</button>
                <button class="btn btn-secondary" style="color: var(--danger-color);" onclick="deleteUser('${user.id}')">删除</button>
            </td>
        </tr>
    `).join('');
}

function getRoleName(role) {
    const map = { user: '普通用户', teacher: '教师', admin: '管理员' };
    return map[role] || role;
}

function updateUserPagination() {
    const totalPages = Math.ceil(state.totalUsers / state.pageSize) || 1;
    document.getElementById('user-page-info').textContent = `第 ${state.currentUserPage} / ${totalPages} 页`;
    document.getElementById('user-prev-page').disabled = state.currentUserPage <= 1;
    document.getElementById('user-next-page').disabled = state.currentUserPage >= totalPages;
}

function openUserModal(mode = 'add', userId = null) {
    const modal = document.getElementById('user-modal');
    const form = document.getElementById('user-form');
    document.getElementById('user-modal-title').textContent = mode === 'add' ? '添加用户' : '编辑用户';
    form.reset();

    if (mode === 'edit' && userId) {
        const user = state.users.find(u => u.id == userId);
        if (user) {
            document.getElementById('user-id').value = user.id;
            document.getElementById('user-username').value = user.username;
            document.getElementById('user-email').value = user.email || '';
            document.getElementById('user-phone').value = user.phone || '';
            document.getElementById('user-role').value = user.role || 'user';
            document.getElementById('user-password').value = '';
            document.getElementById('user-password').required = false;
            document.getElementById('password-hint').style.display = '';
        }
    } else {
        document.getElementById('user-id').value = '';
        document.getElementById('user-password').required = true;
        document.getElementById('password-hint').style.display = 'none';
    }
    modal.classList.add('active');
}

function closeUserModal() {
    document.getElementById('user-modal').classList.remove('active');
}

function editUser(userId) {
    openUserModal('edit', userId);
}

async function saveUser(event) {
    event.preventDefault();
    const formData = new FormData(document.getElementById('user-form'));
    const userData = {
        username: formData.get('username'),
        email: formData.get('email') || null,
        phone: formData.get('phone') || null,
        role: formData.get('role')
    };
    
    const password = formData.get('password');
    if (password) {
        userData.password = password;
    }

    const userId = document.getElementById('user-id').value;

    try {
        let response;
        if (userId) {
            response = await apiRequest(`/users/${userId}`, {
                method: 'PUT',
                body: JSON.stringify(userData)
            });
        } else {
            response = await apiRequest('/users', {
                method: 'POST',
                body: JSON.stringify(userData)
            });
        }

        if (response.code === 200) {
            showToast(userId ? '更新成功' : '添加成功');
            closeUserModal();
            loadUsers(state.currentUserPage);
        }
    } catch (error) {
        console.error('保存用户失败:', error);
        showToast('保存失败: ' + error.message, 'error');
    }
}

async function deleteUser(userId) {
    if (!confirm('确定要删除这个用户吗？')) return;
    try {
        const response = await apiRequest(`/users/${userId}`, { method: 'DELETE' });
        if (response.code === 200) {
            showToast('删除成功');
            loadUsers(state.currentUserPage);
        }
    } catch (error) {
        showToast('删除失败: ' + error.message, 'error');
    }
}

// 数据管理相关函数
async function loadSchemaTables() {
    try {
        const response = await apiRequest('/schema/tables');
        if (response.code === 200) {
            state.tables = response.data.items;
            updateTablesList();
        }
    } catch (error) {
        console.error('加载表列表失败:', error);
        showToast('加载表列表失败', 'error');
    }
}

function updateTablesList() {
    const tablesList = document.getElementById('tables-list');
    if (state.tables.length === 0) {
        tablesList.innerHTML = '<div class="loading">暂无数据表</div>';
        return;
    }

    tablesList.innerHTML = state.tables.map(table => `
        <div class="table-item ${state.currentTable === table.table_name ? 'active' : ''}" 
             onclick="selectTable('${table.table_name}')">
            <div class="table-name">${table.table_name}</div>
            <div class="table-meta">
                <span>${table.row_count || 0} 行</span>
                <span>${table.engine || 'Unknown'}</span>
            </div>
        </div>
    `).join('');
}

async function selectTable(tableName) {
    state.currentTable = tableName;
    updateTablesList();

    try {
        const response = await apiRequest(`/schema/tables/${tableName}`);
        if (response.code === 200) {
            state.currentColumns = response.data.columns;
            displayTableDetail(response.data);
        }
    } catch (error) {
        console.error('加载表结构失败:', error);
        showToast('加载表结构失败', 'error');
    }
}

function displayTableDetail(data) {
    const tableDetail = document.getElementById('table-detail');
    
    const columnsHtml = data.columns.map(col => `
        <tr>
            <td>${col.column_name}</td>
            <td>${col.data_type}</td>
            <td>${col.is_nullable}</td>
            <td>${col.column_key}</td>
            <td>${col.column_default || '-'}</td>
            <td>${col.column_comment || '-'}</td>
            <td>
                <button class="btn btn-secondary btn-sm" onclick="openModifyColumnModal('${col.column_name}')" title="修改">
                    编辑
                </button>
                <button class="btn btn-secondary btn-sm" style="color: var(--danger-color);" 
                        onclick="deleteColumn('${col.column_name}')" title="删除">
                    删除
                </button>
            </td>
        </tr>
    `).join('');

    tableDetail.innerHTML = `
        <div class="table-detail-header">
            <h2>表: ${data.table_name}</h2>
            <div class="header-actions">
                <button class="btn btn-primary" onclick="openAddColumnModal()">添加字段</button>
                <button class="btn btn-primary" onclick="loadTableData()">查看数据</button>
            </div>
        </div>
        
        <div class="table-tabs">
            <button class="tab-btn active" onclick="switchTab('structure')">表结构</button>
            <button class="tab-btn" onclick="switchTab('data')">数据查看</button>
        </div>
        
        <div id="tab-structure" class="tab-content active">
            <div class="table-columns-section">
                <h3>字段列表</h3>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>字段名</th>
                            <th>类型</th>
                            <th>允许NULL</th>
                            <th>键</th>
                            <th>默认值</th>
                            <th>注释</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${columnsHtml}
                    </tbody>
                </table>
            </div>

            <div class="table-create-section">
                <h3>CREATE语句</h3>
                <pre class="sql-code">${data.create_statement || ''}</pre>
            </div>
        </div>
        
        <div id="tab-data" class="tab-content">
            <div class="data-toolbar">
                <div class="data-filters">
                    <input type="text" id="data-where" placeholder="WHERE条件 (可选)" style="width: 300px;">
                    <button class="btn btn-secondary" onclick="loadTableData()">查询</button>
                </div>
                <button class="btn btn-primary" onclick="openInsertDataModal()">插入数据</button>
            </div>
            <div id="table-data-container">
                <div class="placeholder">
                    <p>点击"查看数据"按钮加载表数据</p>
                </div>
            </div>
        </div>
    `;
}

function openAddColumnModal() {
    const modal = document.getElementById('add-column-modal');
    const tableNameInput = document.getElementById('add-column-table-name');
    const afterSelect = document.getElementById('add-column-after');
    
    tableNameInput.value = state.currentTable;
    
    // 填充插入位置选项
    afterSelect.innerHTML = '<option value="">插入到开头</option>' + 
        state.currentColumns.map(col => 
            `<option value="${col.column_name}">在 ${col.column_name} 之后</option>`
        ).join('');
    
    modal.classList.add('active');
}

function closeAddColumnModal() {
    document.getElementById('add-column-modal').classList.remove('active');
    document.getElementById('add-column-form').reset();
}

async function addColumn(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const columnData = {
        table_name: formData.get('table_name'),
        column_name: formData.get('column_name'),
        column_type: formData.get('column_type'),
        is_nullable: formData.get('is_nullable') === 'on',
        default_value: formData.get('default_value') || null,
        comment: formData.get('comment') || null,
        after_column: formData.get('after_column') || null
    };

    try {
        const response = await apiRequest('/schema/columns', {
            method: 'POST',
            body: JSON.stringify(columnData)
        });

        if (response.code === 200) {
            showToast('字段添加成功');
            closeAddColumnModal();
            selectTable(state.currentTable);
        }
    } catch (error) {
        console.error('添加字段失败:', error);
        showToast('添加字段失败: ' + error.message, 'error');
    }
}

function openModifyColumnModal(columnName) {
    const modal = document.getElementById('modify-column-modal');
    const column = state.currentColumns.find(c => c.column_name === columnName);
    
    if (!column) return;

    document.getElementById('modify-column-table-name').value = state.currentTable;
    document.getElementById('modify-column-old-name').value = columnName;
    document.getElementById('modify-column-name').value = '';
    document.getElementById('modify-column-type').value = '';
    document.getElementById('modify-column-nullable').checked = column.is_nullable === 'YES';
    document.getElementById('modify-column-default').value = column.column_default || '';
    document.getElementById('modify-column-comment').value = column.column_comment || '';
    
    modal.classList.add('active');
}

function closeModifyColumnModal() {
    document.getElementById('modify-column-modal').classList.remove('active');
    document.getElementById('modify-column-form').reset();
}

async function modifyColumn(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const columnData = {
        table_name: formData.get('table_name'),
        old_column_name: formData.get('old_column_name'),
        new_column_name: formData.get('new_column_name') || null,
        column_type: formData.get('column_type') || null,
        is_nullable: formData.get('is_nullable') === 'on',
        default_value: formData.get('default_value') || null,
        comment: formData.get('comment') || null
    };

    try {
        const response = await apiRequest('/schema/columns', {
            method: 'PUT',
            body: JSON.stringify(columnData)
        });

        if (response.code === 200) {
            showToast('字段修改成功');
            closeModifyColumnModal();
            selectTable(state.currentTable);
        }
    } catch (error) {
        console.error('修改字段失败:', error);
        showToast('修改字段失败: ' + error.message, 'error');
    }
}

async function deleteColumn(columnName) {
    if (!confirm(`确定要删除字段 "${columnName}" 吗？此操作不可逆！`)) {
        return;
    }

    try {
        const response = await apiRequest('/schema/columns', {
            method: 'DELETE',
            body: JSON.stringify({
                table_name: state.currentTable,
                column_name: columnName
            })
        });

        if (response.code === 200) {
            showToast('字段删除成功');
            selectTable(state.currentTable);
        }
    } catch (error) {
        console.error('删除字段失败:', error);
        showToast('删除字段失败: ' + error.message, 'error');
    }
}

// 选项卡切换
function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    event.target.classList.add('active');
    document.getElementById(`tab-${tabName}`).classList.add('active');
    
    if (tabName === 'data') {
        loadTableData();
    }
}

// 加载表数据
async function loadTableData() {
    if (!state.currentTable) return;
    
    const whereClause = document.getElementById('data-where')?.value || '';
    
    try {
        const params = new URLSearchParams({
            page: '1',
            page_size: '20'
        });
        
        if (whereClause) {
            params.append('where_clause', whereClause);
        }
        
        const response = await apiRequest(`/schema/tables/${state.currentTable}/data?${params}`);
        
        if (response.code === 200) {
            displayTableData(response.data);
        }
    } catch (error) {
        console.error('加载表数据失败:', error);
        showToast('加载表数据失败: ' + error.message, 'error');
    }
}

// 显示表数据
function displayTableData(data) {
    const container = document.getElementById('table-data-container');
    
    if (data.items.length === 0) {
        container.innerHTML = '<div class="placeholder">暂无数据</div>';
        return;
    }
    
    // 获取所有列名
    const columns = Object.keys(data.items[0]);
    
    const headersHtml = columns.map(col => `<th>${col}</th>`).join('');
    
    const rowsHtml = data.items.map(row => {
        const cellsHtml = columns.map(col => {
            const value = row[col];
            const displayValue = value === null ? '<span class="null-value">NULL</span>' : 
                               (typeof value === 'object' ? JSON.stringify(value) : value);
            return `<td>${displayValue}</td>`;
        }).join('');
        
        // 获取第一列的值作为标识
        const firstColumnValue = columns[0] ? row[columns[0]] : '';
        
        return `
            <tr>
                ${cellsHtml}
                <td>
                    <button class="btn btn-secondary btn-sm" onclick='openEditDataModal(${JSON.stringify(row)})' title="编辑">
                        编辑
                    </button>
                    <button class="btn btn-secondary btn-sm" style="color: var(--danger-color);" 
                            onclick="deleteRowData('${columns[0]}', '${firstColumnValue}')" title="删除">
                        删除
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    container.innerHTML = `
        <div class="data-summary">
            <span>共 ${data.total} 条记录</span>
            <span>第 ${data.page} / ${data.total_pages} 页</span>
        </div>
        <table class="data-table">
            <thead>
                <tr>
                    ${headersHtml}
                    <th>操作</th>
                </tr>
            </thead>
            <tbody>
                ${rowsHtml}
            </tbody>
        </table>
        <div class="data-pagination">
            <button class="btn btn-secondary" onclick="changeDataPage(${data.page - 1})" ${data.page <= 1 ? 'disabled' : ''}>上一页</button>
            <button class="btn btn-secondary" onclick="changeDataPage(${data.page + 1})" ${data.page >= data.total_pages ? 'disabled' : ''}>下一页</button>
        </div>
    `;
}

// 切换数据页码
function changeDataPage(page) {
    if (page < 1) return;
    
    const whereClause = document.getElementById('data-where')?.value || '';
    
    try {
        const params = new URLSearchParams({
            page: page.toString(),
            page_size: '20'
        });
        
        if (whereClause) {
            params.append('where_clause', whereClause);
        }
        
        apiRequest(`/schema/tables/${state.currentTable}/data?${params}`)
            .then(response => {
                if (response.code === 200) {
                    displayTableData(response.data);
                }
            })
            .catch(error => {
                console.error('加载表数据失败:', error);
                showToast('加载表数据失败: ' + error.message, 'error');
            });
    } catch (error) {
        console.error('加载表数据失败:', error);
        showToast('加载表数据失败: ' + error.message, 'error');
    }
}

// 打开插入数据模态框
function openInsertDataModal() {
    if (!state.currentColumns || state.currentColumns.length === 0) {
        showToast('请先选择一个表', 'error');
        return;
    }
    
    const modal = document.getElementById('insert-data-modal');
    const form = document.getElementById('insert-data-form');
    
    // 清空表单
    form.innerHTML = '';
    
    // 为每个字段创建输入框
    state.currentColumns.forEach(col => {
        const fieldHtml = `
            <div class="form-group">
                <label for="insert-${col.column_name}">${col.column_name} (${col.data_type})</label>
                <input type="text" id="insert-${col.column_name}" name="${col.column_name}" 
                       placeholder="${col.column_default || ''}" ${col.column_key === 'PRI' ? 'required' : ''}>
            </div>
        `;
        form.innerHTML += fieldHtml;
    });
    
    modal.classList.add('active');
}

// 关闭插入数据模态框
function closeInsertDataModal() {
    document.getElementById('insert-data-modal').classList.remove('active');
}

// 插入数据
async function insertData(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const data = {};
    
    for (let [key, value] of formData.entries()) {
        if (value.trim()) {
            data[key] = value;
        }
    }
    
    try {
        const response = await apiRequest('/schema/data', {
            method: 'POST',
            body: JSON.stringify({
                table_name: state.currentTable,
                data: data
            })
        });

        if (response.code === 200) {
            showToast('数据插入成功');
            closeInsertDataModal();
            loadTableData();
        }
    } catch (error) {
        console.error('插入数据失败:', error);
        showToast('插入数据失败: ' + error.message, 'error');
    }
}

// 打开编辑数据模态框
function openEditDataModal(rowData) {
    const modal = document.getElementById('edit-data-modal');
    const form = document.getElementById('edit-data-form');
    
    // 清空表单
    form.innerHTML = '';
    
    // 为每个字段创建输入框
    state.currentColumns.forEach(col => {
        const value = rowData[col.column_name] !== null ? rowData[col.column_name] : '';
        const fieldHtml = `
            <div class="form-group">
                <label for="edit-${col.column_name}">${col.column_name} (${col.data_type})</label>
                <input type="text" id="edit-${col.column_name}" name="${col.column_name}" 
                       value="${value}" ${col.column_key === 'PRI' ? 'disabled' : ''}>
                ${col.column_key === 'PRI' ? `<input type="hidden" name="${col.column_name}" value="${value}">` : ''}
            </div>
        `;
        form.innerHTML += fieldHtml;
    });
    
    modal.classList.add('active');
}

// 关闭编辑数据模态框
function closeEditDataModal() {
    document.getElementById('edit-data-modal').classList.remove('active');
}

// 更新数据
async function updateData(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const data = {};
    let primaryKeyColumn = '';
    let primaryKeyValue = '';
    
    for (let [key, value] of formData.entries()) {
        if (state.currentColumns.find(c => c.column_name === key && c.column_key === 'PRI')) {
            primaryKeyColumn = key;
            primaryKeyValue = value;
        } else if (value.trim()) {
            data[key] = value;
        }
    }
    
    if (!primaryKeyColumn || !primaryKeyValue) {
        showToast('无法确定主键，无法更新数据', 'error');
        return;
    }
    
    try {
        const response = await apiRequest('/schema/data', {
            method: 'PUT',
            body: JSON.stringify({
                table_name: state.currentTable,
                where_column: primaryKeyColumn,
                where_value: primaryKeyValue,
                data: data
            })
        });

        if (response.code === 200) {
            showToast('数据更新成功');
            closeEditDataModal();
            loadTableData();
        }
    } catch (error) {
        console.error('更新数据失败:', error);
        showToast('更新数据失败: ' + error.message, 'error');
    }
}

// 删除数据
async function deleteRowData(columnName, columnValue) {
    if (!confirm(`确定要删除这条记录吗？此操作不可逆！`)) {
        return;
    }

    try {
        const response = await apiRequest('/schema/data', {
            method: 'DELETE',
            body: JSON.stringify({
                table_name: state.currentTable,
                where_column: columnName,
                where_value: columnValue
            })
        });

        if (response.code === 200) {
            showToast('数据删除成功');
            loadTableData();
        }
    } catch (error) {
        console.error('删除数据失败:', error);
        showToast('删除数据失败: ' + error.message, 'error');
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);