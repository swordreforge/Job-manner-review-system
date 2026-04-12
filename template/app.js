// 全局状态
const state = {
    token: localStorage.getItem('token'),
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    currentPage: 1,
    pageSize: 10,
    totalStudents: 0,
    students: [],
    classes: [],
    systemStatus: null
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
        system: document.getElementById('system-content')
    },
    // 仪表盘元素
    totalStudents: document.getElementById('total-students'),
    totalClasses: document.getElementById('total-classes'),
    databaseStatus: document.getElementById('database-status'),
    serverUptime: document.getElementById('server-uptime'),
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
    serverStatus: document.getElementById('server-status'),
    dbStatus: document.getElementById('db-status'),
    cpuUsage: document.getElementById('cpu-usage'),
    cpuProgress: document.getElementById('cpu-progress'),
    memoryUsage: document.getElementById('memory-usage'),
    memoryProgress: document.getElementById('memory-progress'),
    uptime: document.getElementById('uptime'),
    serverTime: document.getElementById('server-time'),
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

        // 获取系统状态
        await loadSystemStatusData();

    } catch (error) {
        console.error('加载仪表盘数据失败:', error);
        showToast('加载数据失败', 'error');
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
    await loadSystemStatusData();
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
        showToast('加载系统状态失败', 'error');
    }
}

// 更新系统状态UI
function updateSystemStatusUI() {
    if (!state.systemStatus) return;

    const status = state.systemStatus;

    // 服务器状态
    const serverIndicator = elements.serverStatus.querySelector('.status-indicator');
    const serverText = elements.serverStatus.querySelector('.status-text');
    serverIndicator.className = 'status-indicator';
    if (status.server === 'running') {
        serverText.textContent = '运行中';
    } else {
        serverIndicator.classList.add('danger');
        serverText.textContent = '停止';
    }

    // 数据库状态
    const dbIndicator = elements.dbStatus.querySelector('.status-indicator');
    const dbText = elements.dbStatus.querySelector('.status-text');
    dbIndicator.className = 'status-indicator';
    if (status.database === 'connected') {
        dbText.textContent = '已连接';
        elements.databaseStatus.textContent = '已连接';
    } else {
        dbIndicator.classList.add('danger');
        dbText.textContent = '未连接';
        elements.databaseStatus.textContent = '未连接';
    }

    // CPU 使用率
    const cpuValue = status.cpu_usage || 0;
    elements.cpuUsage.textContent = `${cpuValue.toFixed(1)}%`;
    elements.cpuProgress.style.width = `${cpuValue}%`;

    // 内存使用率
    const memoryValue = status.memory_usage || 0;
    elements.memoryUsage.textContent = `${memoryValue.toFixed(1)}%`;
    elements.memoryProgress.style.width = `${memoryValue}%`;

    // 运行时间
    const uptimeSeconds = status.uptime || 0;
    const uptimeHours = Math.floor(uptimeSeconds / 3600);
    const uptimeMinutes = Math.floor((uptimeSeconds % 3600) / 60);
    elements.uptime.textContent = `${uptimeHours}小时 ${uptimeMinutes}分钟`;
    elements.serverUptime.textContent = `${uptimeHours}h`;

    // 服务器时间
    elements.serverTime.textContent = new Date().toLocaleString('zh-CN');
}

// 打开学生模态框
function openStudentModal(mode = 'add', studentId = null) {
    elements.studentModal.classList.add('active');
    
    const form = elements.studentForm;
    const inputs = form.querySelectorAll('input, select');
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
        const student = state.students.find(s => s.id == studentId);
        if (student) {
            document.getElementById('student-id').value = student.id;
            document.getElementById('student-name').value = student.name;
            document.getElementById('student-education').value = student.education || '';
            document.getElementById('student-major').value = student.major || '';
            document.getElementById('student-graduation-year').value = student.graduation_year || '';
        }
        inputs.forEach(input => input.disabled = false);
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
        graduation_year: formData.get('graduation_year') ? parseInt(formData.get('graduation_year')) : null
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
        openStudentModal('view', studentId);
    }
}

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
        case 'search':
            switchPage('students');
            setTimeout(() => elements.studentSearch.focus(), 100);
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

    // 定时刷新系统状态
    setInterval(() => {
        if (elements.contentSections.system.classList.contains('active')) {
            loadSystemStatusData();
        }
    }, 30000); // 每30秒刷新一次
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);