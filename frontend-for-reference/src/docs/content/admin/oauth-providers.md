# OAuth 提供商管理

管理员可以配置第三方 OAuth 登录提供商，允许用户使用 GitHub、Google 等账号快速登录。

## 功能说明

- 查看当前已配置的 OAuth 提供商列表
- 添加新的 OAuth 提供商
- 编辑现有提供商的配置（Client ID、Client Secret 等）
- 启用 / 禁用某个提供商

## 配置步骤

### 1. 在第三方平台创建 OAuth 应用

以 GitHub 为例：

1. 前往 GitHub → Settings → Developer settings → OAuth Apps
2. 点击 **New OAuth App**
3. 填写应用信息，**Callback URL** 填写：`https://您的域名/oauth2/callback/github`
4. 记录 **Client ID** 和 **Client Secret**

### 2. 在系统中添加提供商

1. 进入 **管理功能 → OAuth 提供商**
2. 点击 **添加提供商**
3. 填写提供商名称、Client ID、Client Secret 和授权端点
4. 保存并启用

## 安全注意

> ⚠️ Client Secret 为敏感信息，配置后不会明文展示。请妥善保管原始密钥。
