# Playwright 测试指南

## 安装

```bash
npm install -D @playwright/test
npx playwright install chromium
```

## 运行测试

### 运行所有测试
```bash
npm run test
```

### 运行特定测试文件
```bash
npx playwright test tests/auth.spec.ts
```

### 使用 UI 模式运行测试
```bash
npm run test:ui
```

### 查看测试报告
```bash
npm run test:report
```

## 测试覆盖范围

### 登录注册页面 (`auth.spec.ts`)

- ✅ 页面加载测试
- ✅ 表单验证测试
- ✅ 用户注册功能测试
- ✅ 用户登录功能测试
- ✅ 错误处理测试
- ✅ 页面切换测试
- ✅ 登录后功能测试
- ✅ 退出登录测试
- ✅ 路由守卫测试
- ✅ UI/UX 测试

## 测试环境

- 基础 URL: `http://localhost:5173`
- 浏览器: Chromium, Firefox, WebKit
- 自动启动开发服务器

## 注意事项

1. 测试会自动启动开发服务器
2. 测试使用真实的后端 API
3. 测试数据会创建临时用户，不影响生产环境
4. 测试失败会自动重试（CI 环境 2 次，本地环境不重试）

## 测试账户

测试使用以下账户：
- 用户名: `newuser`
- 密码: `test123`

如果该账户不存在，测试会自动创建新账户。