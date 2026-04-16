# 学生通过邀请码加入学校

## 概述

已注册学生输入教师提供的邀请码，加入学校。教师可以在后台看到加入的学生。

## 需求

- 学生可以多次加入不同学校（多校归属）
- 需要输入邀请码和姓名
- 学生在个人中心页面点击"加入学校"按钮

## 后端实现

### API: POST /api/v1/students/join-school

**请求体:**
```json
{
  "inviteCode": "ABC123",
  "name": "张三"
}
```

**响应:**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "schoolId": 1,
    "schoolName": "第一中学",
    "joinedAt": 1234567890
  }
}
```

**错误码:**
- 400: invalid invite code
- 400: invite code is not active
- 400: invite code has expired
- 400: invite code has reached max uses

### 逻辑

1. 查询邀请码有效性（复用 existing `invite_codes` table）
2. 验证邀请码状态为 active且未过期且未达最大使用次数
3. 获取当前登录学生 ID
4. 在 `student_schools` 表中插入记录，status 为 'active'
5. 更新学生姓名（如未设置）
6. 增加邀请码使用计数
7. 返回学校信息

### 数据库

Table: `student_schools` (已有)
- `student_id`: 学生ID
- `school_id`: 学校ID
- `teacher_id`: 教师ID (邀请码创建者)
- `invite_code_id`: 邀请码ID
- `status`: 'active' | 'inactive'
- `joined_at`: 加入时间

## 前端实现

### 页面: /profile (学生个人中心)

**UI:**
- 在个人中心页面添加"加入学校"按钮（Card形式）
- 点击后弹出 Modal
- Modal 包含:
  - 邀请码输入框 (Input)
  - 姓名输入框 (Input)
  - 提交按钮

**状态:**
- 已加入学校: 显示已加入的学校列表
- 未加入学校: 显示"加入学校"按钮

### API 调用

```typescript
// api/index.ts
joinSchool: (data: { inviteCode: string; name: string }) =>
  api.post('/students/join-school', data)
```

## 验收标准

1. 学生可以输入邀请码成功加入学校
2. 加入后在教师端可以看到该学生
3. 学生可以加入多所学校
4. 邀请码无效/过期/已达次数时返回正确错误信息