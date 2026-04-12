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
    // 图表实例
    cpuChart: null,
    memoryChart: null,
    diskChart: null,
    // 图表数据历史
    cpuHistory: [],
    memoryHistory: [],
    diskHistory: []
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

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false }
        },
        scales: {
            r: {
                min: 0,
                max: 100,
                ticks: {
                    stepSize: 25,
                    color: 'rgba(255,255,255,0.6)',
                    backdropColor: 'transparent'
                },
                grid: { color: 'rgba(255,255,255,0.1)' },
                pointLabels: { color: 'rgba(255,255,255,0.8)' }
            }
        }
    };

    state.cpuChart = new Chart(document.getElementById('cpuChart'), {
        type: 'doughnut',
        data: {
            labels: ['已使用', '空闲'],
            datasets: [{
                data: [0, 100],
                backgroundColor: ['#6366f1', '#334155'],
                borderWidth: 0
            }]
        },
        options: {
            ...chartOptions,
            cutout: '70%'
        }
    });

    state.memoryChart = new Chart(document.getElementById('memoryChart'), {
        type: 'doughnut',
        data: {
            labels: ['已使用', '空闲'],
            datasets: [{
                data: [0, 100],
                backgroundColor: ['#10b981', '#334155'],
                borderWidth: 0
            }]
        },
        options: {
            ...chartOptions,
            cutout: '70%'
        }
    });

    state.diskChart = new Chart(document.getElementById('diskChart'), {
        type: 'doughnut',
        data: {
            labels: ['已使用', '空闲'],
            datasets: [{
                data: [0, 100],
                backgroundColor: ['#f59e0b', '#334155'],
                borderWidth: 0
            }]
        },
        options: {
            ...chartOptions,
            cutout: '70%'
        }
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

    if (state.cpuChart) {
        state.cpuChart.data.datasets[0].data = [cpuValue, 100 - cpuValue];
        state.cpuChart.update('none');
    }
    if (state.memoryChart) {
        state.memoryChart.data.datasets[0].data = [memoryValue, 100 - memoryValue];
        state.memoryChart.update('none');
    }
    if (state.diskChart) {
        state.diskChart.data.datasets[0].data = [diskValue, 100 - diskValue];
        state.diskChart.update('none');
    }

    const serverTime = new Date(status.server_time * 1000);
    document.getElementById('server-time').textContent = serverTime.toLocaleString('zh-CN');
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
            method: 'POST'
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
        const response = await apiRequest('/ops/backups');

        if (response.code === 200) {
            const backups = response.data.items || [];

            if (backups.length === 0) {
                elements.backupsList.innerHTML = '<div class="loading">暂无备份</div>';
                return;
            }

            elements.backupsList.innerHTML = backups.map(backup => `
                <div class="backup-item">
                    <span>${backup.filename}</span>
                    <span>${new Date(backup.created_at).toLocaleString('zh-CN')}</span>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('加载备份列表失败:', error);
        showToast('加载备份列表失败', 'error');
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
        tbody.innerHTML = '<tr><td colspan="7" class="loading">暂无岗位数据</td></tr>';
        return;
    }
    tbody.innerHTML = state.jobs.map(job => `
        <tr>
            <td>${job.id}</td>
            <td>${job.name}</td>
            <td>${job.company || '-'}</td>
            <td>${job.industry || '-'}</td>
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

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);