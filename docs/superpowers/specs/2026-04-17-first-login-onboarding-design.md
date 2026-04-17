# First Login Onboarding Wizard Design(prefer dark mode,a toast or model)

## Overview
When a user logs in for the first time (detected via `first_login` flag in database), show a step-by-step wizard modal to guide them through completing key tasks: upload/fill resume → take Holland test → view career plan → search jobs → practice interview.

## Database Changes

### Add `first_login` column to users table(Add it in the init logic at career.go!!!,just to modify the original ones)

```sql
ALTER TABLE users ADD COLUMN first_login TINYINT DEFAULT 1;
```

- `first_login = 1`: First login, show wizard
- `first_login = 0`: Has completed onboarding

### API Changes

**GET /api/v1/user/info**
- Include `firstLogin: boolean` in response

**POST /api/v1/user/complete-onboarding**
- Set `first_login = 0` after user completes all steps or clicks "Skip"

## Frontend Implementation

### New Component: OnboardingWizardModal

```tsx
// Steps configuration
const steps = [
  {
    key: 'resume',
    title: '完善简历',
    description: '上传简历或手动填写学生信息，让系统更好地为你推荐岗位',
    icon: <FileTextOutlined />,
    actionPath: '/resume',
  },
  {
    key: 'holland',
    title: '霍兰德职业测试',
    description: '通过测试了解你的职业兴趣类型',
    icon: <BulbOutlined />,
    actionPath: '/holland',
  },
  {
    key: 'plan',
    title: '查看职业规划',
    description: '基于测试结果生成个性化职业规划',
    icon: <AimOutlined />,
    actionPath: '/plan',
  },
  {
    key: 'jobs',
    title: '搜索岗位',
    description: '浏览并搜索符合你方向的岗位',
    icon: <BankOutlined />,
    actionPath: '/jobs',
  },
  {
    key: 'interview',
    title: '模拟面试',
    description: 'AI 面试官陪你练习面试技巧',
    icon: <MessageOutlined />,
    actionPath: '/interview',
  },
];
```

### UI Design

**Modal Properties:**
- Width: 480px
- Centered on screen
- Closable: false (no X button, must complete or skip)
- Mask closable: false

**Content per Step:**
- Progress bar at top (e.g., "1/5")
- Icon in colored circle (48px)
- Title (H2, 20px)
- Description (gray, 14px)
- "去完成" button → navigates to actionPath
- "跳过" button at bottom (gray, smaller)

**Footer:**
- "Previous" / "Next" buttons (when not on step 1 or 5)
- On step 5: "完成" instead of "Next"

### State Management

```ts
interface OnboardingState {
  isOpen: boolean;
  currentStep: number;
  completedSteps: Set<string>;
}
```

### Trigger Point

In `App.tsx` root redirect or `MainLayout`, after auth check:
```tsx
if (isAuthenticated && user?.firstLogin) {
  setShowOnboarding(true);
}
```

## User Flow

1. User logs in → API returns `firstLogin: true`
2. Frontend shows OnboardingWizardModal
3. User sees Step 1 (完善简历)
4. User clicks "去完成" → navigates to /resume
5. After completing resume action, user returns
6. Modal auto-advances to next uncompleted step
7. Repeat until Step 5 (模拟面试)
8. User clicks "完成" → API call to mark complete
9. Modal closes, first_login set to 0 in DB

## Error Handling

- If API fails to mark complete: show error toast, keep modal open
- If user navigates away manually: modal stays in same state, shows again on next login

## Acceptance Criteria

- [ ] Modal appears on first login only
- [ ] Shows 5 steps with icons and descriptions
- [ ] Progress bar reflects current step
- [ ] "去完成" navigates to correct page
- [ ] "跳过" closes modal and marks as complete
- [ ] "完成" closes modal and updates DB
- [ ] Modal does not appear again after completion
- [ ] Works on both student and teacher roles (teacher skips resume/holland steps)