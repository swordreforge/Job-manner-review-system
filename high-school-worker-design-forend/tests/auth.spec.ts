import { test, expect } from '@playwright/test';

test.describe('登录注册页面', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
  });

  test('应该显示登录页面', async ({ page }) => {
    await expect(page).toHaveTitle(/职业规划助手/);
    await expect(page.getByText('欢迎使用职业规划助手')).toBeVisible();
    await expect(page.getByText('登录')).toBeVisible();
    await expect(page.getByText('注册')).toBeVisible();
  });

  test('应该能切换到注册页面', async ({ page }) => {
    await page.getByText('注册').click();
    await expect(page.getByText('用户名')).toBeVisible();
    await expect(page.getByText('邮箱')).toBeVisible();
    await expect(page.getByText('确认密码')).toBeVisible();
  });

  test('注册新用户', async ({ page }) => {
    const timestamp = Date.now();
    const username = `testuser_${timestamp}`;
    const email = `test_${timestamp}@example.com`;
    const password = 'test123456';

    // 切换到注册页面
    await page.getByText('注册').click();

    // 填写注册表单
    await page.getByPlaceholder('用户名').fill(username);
    await page.getByPlaceholder('邮箱').fill(email);
    await page.getByPlaceholder('密码', { exact: true }).fill(password);
    await page.getByPlaceholder('确认密码').fill(password);

    // 提交注册
    await page.getByRole('button', { name: '注册' }).click();

    // 等待成功消息
    await expect(page.getByText('注册成功，请登录')).toBeVisible({ timeout: 10000 });

    // 应该自动切换到登录标签
    await expect(page.getByText('登录')).toBeVisible();
  });

  test('注册时密码不一致应该显示错误', async ({ page }) => {
    const timestamp = Date.now();
    const username = `testuser_${timestamp}`;
    const email = `test_${timestamp}@example.com`;

    // 切换到注册页面
    await page.getByText('注册').click();

    // 填写注册表单，密码不一致
    await page.getByPlaceholder('用户名').fill(username);
    await page.getByPlaceholder('邮箱').fill(email);
    await page.getByPlaceholder('密码', { exact: true }).fill('password123');
    await page.getByPlaceholder('确认密码').fill('different123');

    // 提交注册
    await page.getByRole('button', { name: '注册' }).click();

    // 应该显示错误消息
    await expect(page.getByText('两次输入的密码不一致')).toBeVisible();
  });

  test('登录成功后应该跳转到首页', async ({ page }) => {
    // 使用之前创建的测试账户
    await page.getByPlaceholder('用户名').fill('newuser');
    await page.getByPlaceholder('密码').fill('test123');

    // 提交登录
    await page.getByRole('button', { name: '登录' }).click();

    // 等待跳转到首页
    await expect(page).toHaveURL('/');
    await expect(page.getByText('欢迎使用职业规划助手')).toBeVisible();
  });

  test('登录失败应该显示错误消息', async ({ page }) => {
    await page.getByPlaceholder('用户名').fill('wronguser');
    await page.getByPlaceholder('密码').fill('wrongpassword');

    // 提交登录
    await page.getByRole('button', { name: '登录' }).click();

    // 应该显示错误消息
    await expect(page.getByText('invalid username or password')).toBeVisible({ timeout: 5000 });
  });

  test('表单验证：用户名为空应该显示错误', async ({ page }) => {
    await page.getByPlaceholder('密码').fill('test123');

    // 提交登录
    await page.getByRole('button', { name: '登录' }).click();

    // 应该显示验证错误
    await expect(page.getByText('请输入用户名')).toBeVisible();
  });

  test('表单验证：密码为空应该显示错误', async ({ page }) => {
    await page.getByPlaceholder('用户名').fill('testuser');

    // 提交登录
    await page.getByRole('button', { name: '登录' }).click();

    // 应该显示验证错误
    await expect(page.getByText('请输入密码')).toBeVisible();
  });

  test('从注册页面可以切换回登录页面', async ({ page }) => {
    // 切换到注册页面
    await page.getByText('注册').click();
    await expect(page.getByText('确认密码')).toBeVisible();

    // 点击"立即登录"链接
    await page.getByText('立即登录').click();

    // 应该回到登录页面
    await expect(page.getByPlaceholder('密码', { exact: true })).toBeVisible();
    await expect(page.getByText('确认密码')).not.toBeVisible();
  });
});

test.describe('登录后的功能', () => {
  test.beforeEach(async ({ page }) => {
    // 先登录
    await page.goto('/auth');
    await page.getByPlaceholder('用户名').fill('newuser');
    await page.getByPlaceholder('密码').fill('test123');
    await page.getByRole('button', { name: '登录' }).click();
    await page.waitForURL('/');
  });

  test('登录后应该能访问个人中心页面', async ({ page }) => {
    // 点击个人中心（假设在底部导航栏）
    await page.getByText('个人中心').click();
    
    // 应该显示用户信息
    await expect(page.getByText('newuser')).toBeVisible();
    await expect(page.getByText('退出登录')).toBeVisible();
  });

  test('退出登录应该跳转到登录页面', async ({ page }) => {
    // 点击个人中心
    await page.getByText('个人中心').click();
    
    // 点击退出登录
    await page.getByRole('button', { name: '退出登录' }).click();
    
    // 应该跳转到登录页面
    await expect(page).toHaveURL('/auth');
    await expect(page.getByPlaceholder('用户名')).toBeVisible();
  });

  test('未登录访问受保护页面应该跳转到登录页面', async ({ page, context }) => {
    // 清除所有 cookie 和 localStorage
    await context.clearCookies();
    await page.evaluate(() => localStorage.clear());
    
    // 直接访问受保护页面
    await page.goto('/profile');
    
    // 应该跳转到登录页面
    await expect(page).toHaveURL('/auth');
  });
});

test.describe('UI/UX 测试', () => {
  test('登录表单应该有正确的占位符', async ({ page }) => {
    await page.goto('/auth');
    
    const usernameInput = page.getByPlaceholder('用户名');
    const passwordInput = page.getByPlaceholder('密码', { exact: true });
    
    await expect(usernameInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test('注册表单应该有正确的占位符', async ({ page }) => {
    await page.goto('/auth');
    await page.getByText('注册').click();
    
    await expect(page.getByPlaceholder('用户名')).toBeVisible();
    await expect(page.getByPlaceholder('邮箱')).toBeVisible();
    await expect(page.getByPlaceholder('密码', { exact: true })).toBeVisible();
    await expect(page.getByPlaceholder('确认密码')).toBeVisible();
    await expect(page.getByPlaceholder('手机号（可选）')).toBeVisible();
  });

  test('按钮在加载状态应该禁用', async ({ page }) => {
    await page.goto('/auth');
    
    // 填写表单
    await page.getByPlaceholder('用户名').fill('testuser');
    await page.getByPlaceholder('密码').fill('test123');
    
    // 点击登录按钮
    const loginButton = page.getByRole('button', { name: '登录' });
    await loginButton.click();
    
    // 按钮应该在加载状态
    await expect(loginButton).toBeDisabled();
  });
});