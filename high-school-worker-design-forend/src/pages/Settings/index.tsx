import { Card, Tabs, Form, Input, Button, message, Modal, Avatar, Upload } from 'antd';
import { UserOutlined, LockOutlined, DeleteOutlined, UploadOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores';
import { userApi } from '../../api';

const AVATAR_STAGE_WIDTH = 360;
const AVATAR_STAGE_HEIGHT = 320;
const AVATAR_CIRCLE_SIZE = 220;
const AVATAR_OUTPUT_SIZE = 512;

const getDefaultCircleOffset = () => ({
  x: Math.round((AVATAR_STAGE_WIDTH - AVATAR_CIRCLE_SIZE) / 2),
  y: Math.round((AVATAR_STAGE_HEIGHT - AVATAR_CIRCLE_SIZE) / 2),
});

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuthStore();
  const [form] = Form.useForm<{ username: string; email: string; phone: string }>();
  const [loading, setLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarSrc, setAvatarSrc] = useState('/default-avatar.svg');
  const [avatarSelectModalOpen, setAvatarSelectModalOpen] = useState(false);
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const [pendingAvatarPreviewUrl, setPendingAvatarPreviewUrl] = useState('');
  const [pendingImageNaturalSize, setPendingImageNaturalSize] = useState({ width: 0, height: 0 });
  const [pendingCropScale, setPendingCropScale] = useState(1);
  const [pendingCropOffset, setPendingCropOffset] = useState({ x: 0, y: 0 });
  const [pendingCircleOffset, setPendingCircleOffset] = useState(getDefaultCircleOffset);
  const [pendingDragMode, setPendingDragMode] = useState<'none' | 'image' | 'circle'>('none');
  const [pendingDragStartMouse, setPendingDragStartMouse] = useState({ x: 0, y: 0 });
  const [pendingDragStartImageOffset, setPendingDragStartImageOffset] = useState({ x: 0, y: 0 });
  const [pendingDragStartCircleOffset, setPendingDragStartCircleOffset] = useState(getDefaultCircleOffset);
  const [pendingActivePointerId, setPendingActivePointerId] = useState<number | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  useEffect(() => {
    setAvatarSrc(user?.avatar || '/default-avatar.svg');
  }, [user?.avatar]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const clearPendingAvatar = () => {
    if (pendingAvatarPreviewUrl) {
      URL.revokeObjectURL(pendingAvatarPreviewUrl);
    }
    setPendingAvatarFile(null);
    setPendingAvatarPreviewUrl('');
    setPendingImageNaturalSize({ width: 0, height: 0 });
    setPendingCropScale(1);
    setPendingCropOffset({ x: 0, y: 0 });
    setPendingCircleOffset(getDefaultCircleOffset());
    setPendingDragMode('none');
    setPendingDragStartMouse({ x: 0, y: 0 });
    setPendingDragStartImageOffset({ x: 0, y: 0 });
    setPendingDragStartCircleOffset(getDefaultCircleOffset());
    setPendingActivePointerId(null);
  };

  const getCropBaseScale = (width: number, height: number) => {
    if (!width || !height) return 1;
    return Math.max(AVATAR_CIRCLE_SIZE / width, AVATAR_CIRCLE_SIZE / height);
  };

  const getCropDisplaySize = (scale: number) => {
    const baseScale = getCropBaseScale(pendingImageNaturalSize.width, pendingImageNaturalSize.height);
    const width = pendingImageNaturalSize.width * baseScale * scale;
    const ratio = pendingImageNaturalSize.width > 0 ? (pendingImageNaturalSize.height / pendingImageNaturalSize.width) : 1;
    return {
      width,
      height: width * ratio,
    };
  };

  const clampCircleOffsetByImage = (
    nextX: number,
    nextY: number,
    imageOffset: { x: number; y: number },
    scale: number,
  ) => {
    const display = getCropDisplaySize(scale);
    const stageMinX = 0;
    const stageMaxX = AVATAR_STAGE_WIDTH - AVATAR_CIRCLE_SIZE;
    const stageMinY = 0;
    const stageMaxY = AVATAR_STAGE_HEIGHT - AVATAR_CIRCLE_SIZE;
    const imageMinX = imageOffset.x;
    const imageMaxX = imageOffset.x + display.width - AVATAR_CIRCLE_SIZE;
    const imageMinY = imageOffset.y;
    const imageMaxY = imageOffset.y + display.height - AVATAR_CIRCLE_SIZE;
    const minX = Math.max(stageMinX, imageMinX);
    const maxX = Math.min(stageMaxX, imageMaxX);
    const minY = Math.max(stageMinY, imageMinY);
    const maxY = Math.min(stageMaxY, imageMaxY);

    return {
      x: Math.min(maxX, Math.max(minX, nextX)),
      y: Math.min(maxY, Math.max(minY, nextY)),
    };
  };

  const clampCropOffsetByCircle = (
    nextX: number,
    nextY: number,
    scale: number,
    circle: { x: number; y: number },
  ) => {
    const display = getCropDisplaySize(scale);
    const minX = Math.min(0, circle.x + AVATAR_CIRCLE_SIZE - display.width);
    const minY = Math.min(0, circle.y + AVATAR_CIRCLE_SIZE - display.height);
    const maxX = circle.x;
    const maxY = circle.y;
    return {
      x: Math.min(maxX, Math.max(minX, nextX)),
      y: Math.min(maxY, Math.max(minY, nextY)),
    };
  };

  const normalizeCropState = (
    nextScale: number,
    crop: { x: number; y: number },
    circle: { x: number; y: number },
  ) => {
    const clampedCircle = clampCircleOffsetByImage(circle.x, circle.y, crop, nextScale);
    const clampedCrop = clampCropOffsetByCircle(crop.x, crop.y, nextScale, clampedCircle);
    return { clampedCircle, clampedCrop };
  };

  const resetPendingCropView = () => {
    const width = pendingImageNaturalSize.width;
    const height = pendingImageNaturalSize.height;
    const defaultCircle = getDefaultCircleOffset();

    setPendingCropScale(1);
    setPendingCircleOffset(defaultCircle);
    setPendingDragMode('none');
    setPendingActivePointerId(null);

    if (!width || !height) {
      setPendingCropOffset({ x: 0, y: 0 });
      return;
    }

    const baseScale = getCropBaseScale(width, height);
    const displayWidth = width * baseScale;
    const displayHeight = height * baseScale;
    setPendingCropOffset({
      x: defaultCircle.x + (AVATAR_CIRCLE_SIZE - displayWidth) / 2,
      y: defaultCircle.y + (AVATAR_CIRCLE_SIZE - displayHeight) / 2,
    });
  };

  const stopPendingDrag = () => {
    setPendingDragMode('none');
    setPendingActivePointerId(null);
  };

  const handlePendingPointerMove = (clientX: number, clientY: number) => {
    if (pendingDragMode === 'none') return;

    const deltaX = clientX - pendingDragStartMouse.x;
    const deltaY = clientY - pendingDragStartMouse.y;

    if (pendingDragMode === 'circle') {
      const nextCircle = clampCircleOffsetByImage(
        pendingDragStartCircleOffset.x + deltaX,
        pendingDragStartCircleOffset.y + deltaY,
        pendingCropOffset,
        pendingCropScale,
      );
      setPendingCircleOffset(nextCircle);
      return;
    }

    setPendingCropOffset(
      clampCropOffsetByCircle(
        pendingDragStartImageOffset.x + deltaX,
        pendingDragStartImageOffset.y + deltaY,
        pendingCropScale,
        pendingCircleOffset,
      ),
    );
  };

  useEffect(() => {
    if (!pendingAvatarPreviewUrl) return;

    const img = new Image();
    img.onload = () => {
      const width = img.naturalWidth || 1;
      const height = img.naturalHeight || 1;
      setPendingImageNaturalSize({ width, height });
      setPendingCropScale(1);
      const initialCircle = getDefaultCircleOffset();
      setPendingCircleOffset(initialCircle);

      const baseScale = getCropBaseScale(width, height);
      const displayWidth = width * baseScale;
      const displayHeight = height * baseScale;
      setPendingCropOffset({
        x: initialCircle.x + (AVATAR_CIRCLE_SIZE - displayWidth) / 2,
        y: initialCircle.y + (AVATAR_CIRCLE_SIZE - displayHeight) / 2,
      });
    };
    img.src = pendingAvatarPreviewUrl;
  }, [pendingAvatarPreviewUrl]);

  const handleChooseAvatarFile = (file: File) => {
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.png') && !fileName.endsWith('.jpg') && !fileName.endsWith('.jpeg') && !fileName.endsWith('.webp')) {
      message.error('只支持 PNG/JPG/JPEG/WEBP 格式');
      return false;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      message.error('头像大小不能超过 5MB');
      return false;
    }

    clearPendingAvatar();
    setPendingAvatarFile(file);
    setPendingAvatarPreviewUrl(URL.createObjectURL(file));
    return false;
  };

  const handleOpenAvatarSelectModal = () => {
    clearPendingAvatar();
    setAvatarSelectModalOpen(true);
  };

  const handleCancelAvatarSelectModal = () => {
    setAvatarSelectModalOpen(false);
    clearPendingAvatar();
  };

  const handleConfirmAvatarUpload = async () => {
    if (!pendingAvatarFile) {
      message.warning('请先选择头像图片');
      return;
    }

    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('预览图片读取失败'));
        img.src = pendingAvatarPreviewUrl;
      });

      const display = getCropDisplaySize(pendingCropScale);
      const sx = Math.max(0, ((pendingCircleOffset.x - pendingCropOffset.x) / display.width) * image.naturalWidth);
      const sy = Math.max(0, ((pendingCircleOffset.y - pendingCropOffset.y) / display.height) * image.naturalHeight);
      const sw = Math.min(image.naturalWidth - sx, (AVATAR_CIRCLE_SIZE / display.width) * image.naturalWidth);
      const sh = Math.min(image.naturalHeight - sy, (AVATAR_CIRCLE_SIZE / display.height) * image.naturalHeight);

      const side = Math.min(sw, sh);
      const sxSquare = sx + (sw - side) / 2;
      const sySquare = sy + (sh - side) / 2;

      const canvas = document.createElement('canvas');
      canvas.width = AVATAR_OUTPUT_SIZE;
      canvas.height = AVATAR_OUTPUT_SIZE;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        message.error('裁剪失败，请重试');
        return;
      }

      ctx.clearRect(0, 0, AVATAR_OUTPUT_SIZE, AVATAR_OUTPUT_SIZE);
      ctx.save();
      ctx.beginPath();
      ctx.arc(AVATAR_OUTPUT_SIZE / 2, AVATAR_OUTPUT_SIZE / 2, AVATAR_OUTPUT_SIZE / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(image, sxSquare, sySquare, side, side, 0, 0, AVATAR_OUTPUT_SIZE, AVATAR_OUTPUT_SIZE);
      ctx.restore();

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((value) => resolve(value), 'image/png', 0.92);
      });
      if (!blob) {
        message.error('裁剪失败，请重试');
        return;
      }

      const croppedFile = new File([blob], `avatar-cropped-${Date.now()}.png`, { type: 'image/png' });
      await handleUploadAvatar(croppedFile);
    } catch {
      message.error('头像处理失败，请重新选择图片');
      return;
    }

    setAvatarSelectModalOpen(false);
    clearPendingAvatar();
  };

  const handleUploadAvatar = async (file: File) => {
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.png') && !fileName.endsWith('.jpg') && !fileName.endsWith('.jpeg') && !fileName.endsWith('.webp')) {
      message.error('只支持 PNG/JPG/JPEG/WEBP 格式');
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      message.error('头像大小不能超过 5MB');
      return;
    }

    setAvatarUploading(true);
    try {
      const base64 = await fileToBase64(file);
      const res = await userApi.uploadAvatar({
        fileContent: base64,
        fileName: file.name,
      });

      if (res.code === 0 && res.url) {
        setAvatarSrc(res.url);
        if (user) {
          setUser({ ...user, avatar: res.url });
        }
        message.success('头像更新成功');
        return;
      }

      message.error(res.msg || '头像更新失败');
    } catch {
      message.error('头像更新失败，请稍后重试');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleResetAvatar = () => {
    Modal.confirm({
      title: '是否重置头像？',
      content: '重置后将清空当前头像信息，并恢复默认头像。',
      okText: '确认重置',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        setAvatarUploading(true);
        try {
          const res = await userApi.resetAvatar();
          if (res.code === 0) {
            setAvatarSrc('/default-avatar.svg');
            if (user) {
              setUser({ ...user, avatar: '' });
            }
            message.success('头像已重置');
            return;
          }
          message.error(res.msg || '头像重置失败');
        } catch {
          message.error('头像重置失败，请稍后重试');
        } finally {
          setAvatarUploading(false);
        }
      },
    });
  };

  useEffect(() => {
    const loadUser = async () => {
      if (user) {
        form.setFieldsValue({
          username: user.username || '',
          email: user.email || '',
          phone: user.phone || '',
        });
        return;
      }

      try {
        const res = await userApi.getInfo();
        if (res.code === 0 && res.data) {
          setUser(res.data);
          form.setFieldsValue({
            username: res.data.username || '',
            email: res.data.email || '',
            phone: res.data.phone || '',
          });
        }
      } catch {
        message.error('获取用户信息失败，请重新登录');
      }
    };

    void loadUser();
  }, [form, setUser, user]);

  const phoneRules = [
    {
      validator: (_: unknown, value: string) => {
        if (!value) return Promise.resolve();
        return /^1\d{10}$/.test(value)
          ? Promise.resolve()
          : Promise.reject(new Error('请输入有效的11位手机号'));
      },
    },
  ];

  const handleUpdateUserInfo = async (values: { username: string; phone: string }) => {
    setLoading(true);
    try {
      const response = await userApi.updateInfo({
        username: values.username?.trim(),
        phone: values.phone?.trim() || undefined,
      });
      if (response.code === 0) {
        message.success('用户信息更新成功');
        if (response.data) {
          setUser(response.data);
          form.setFieldsValue({
            username: response.data.username || '',
            email: response.data.email || '',
            phone: response.data.phone || '',
          });
        } else if (user) {
          setUser({ ...user, username: values.username, phone: values.phone });
        }
      } else {
        message.error(response.msg || '更新失败');
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { msg?: string } } };
      message.error(err.response?.data?.msg || '更新失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (values: {
    oldPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    setLoading(true);
    try {
      const response = await userApi.updatePassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });
      if (response.code === 0) {
        message.success('密码修改成功，请重新登录');
        logout();
        navigate('/welcome');
      } else {
        message.error(response.msg || '修改失败');
      }
    } catch {
      message.error('修改失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async (values: { password: string }) => {
    setLoading(true);
    try {
      const response = await userApi.deleteAccount({ password: values.password });
      if (response.code === 0) {
        message.success('账号已注销');
        logout();
        navigate('/welcome');
      } else {
        message.error(response.msg || '注销失败');
      }
    } catch {
      message.error('注销失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const userInfoItems = [
    {
      key: 'user-info',
      label: (
        <span>
          <UserOutlined className="mr-2" />
          用户信息
        </span>
      ),
      children: (
        <Card>
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
            <Avatar
              size={64}
              src={avatarSrc}
              icon={<UserOutlined />}
              onError={() => {
                setAvatarSrc('/default-avatar.svg');
                return false;
              }}
            />
            <div className="flex-1 text-gray-500 text-sm">头像仅对当前账号生效</div>
            <div className="flex items-center gap-2">
              <Button icon={<UploadOutlined />} loading={avatarUploading} onClick={handleOpenAvatarSelectModal}>
                更换头像
              </Button>
              <Button danger loading={avatarUploading} onClick={handleResetAvatar}>
                重置头像
              </Button>
            </div>
          </div>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleUpdateUserInfo}
          >
            <Form.Item
              label="用户名"
              name="username"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input placeholder="请输入用户名" />
            </Form.Item>
            <Form.Item
              label="邮箱"
              name="email"
            >
              <Input disabled />
            </Form.Item>
            <Form.Item
              label="手机号"
              name="phone"
              rules={phoneRules}
            >
              <Input placeholder="请输入手机号（选填）" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading}>
                保存修改
              </Button>
            </Form.Item>
          </Form>
        </Card>
      ),
    },
    {
      key: 'security',
      label: (
        <span>
          <LockOutlined className="mr-2" />
          账号安全
        </span>
      ),
      children: (
        <div className="space-y-4">
          <Card title="修改密码">
            <Form layout="vertical" onFinish={handleUpdatePassword}>
              <Form.Item
                label="当前密码"
                name="oldPassword"
                rules={[
                  { required: true, message: '请输入当前密码' },
                  { min: 6, message: '密码至少6位' },
                ]}
              >
                <Input.Password placeholder="请输入当前密码" />
              </Form.Item>
              <Form.Item
                label="新密码"
                name="newPassword"
                rules={[
                  { required: true, message: '请输入新密码' },
                  { min: 6, message: '密码至少6位' },
                ]}
              >
                <Input.Password placeholder="请输入新密码" />
              </Form.Item>
              <Form.Item
                label="确认新密码"
                name="confirmPassword"
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: '请再次输入新密码' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('两次输入的密码不一致'));
                    },
                  }),
                ]}
              >
                <Input.Password placeholder="请再次输入新密码" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>
                  修改密码
                </Button>
              </Form.Item>
            </Form>
          </Card>
          <Card title="账号注销" className="border-red-200">
            <div className="text-gray-500 mb-4">
              注销账号将清除所有数据，此操作不可恢复，请谨慎操作。
            </div>
            <Button danger icon={<DeleteOutlined />} onClick={() => setDeleteModalOpen(true)} loading={loading}>
              注销账号
            </Button>
          </Card>
        </div>
      ),
    },
  ];

  return (
    <div className="settings-page min-h-screen relative z-10 p-4">
      <div
        className="sticky top-0 z-30 mb-4 -mx-4 px-4 py-2 backdrop-blur border-b border-gray-100 flex items-center gap-2"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--md-sys-color-surface-container) 90%, transparent)',
          borderBottomColor: 'var(--md-sys-color-outline-variant)',
        }}
      >
        <Button onClick={() => navigate(user?.role === 'teacher' ? '/teacher/profile' : '/profile')} icon={<ArrowLeftOutlined />}>返回{user?.role === 'teacher' ? '工作台' : '个人中心'}</Button>
        <h1 className="text-xl font-bold" style={{ color: 'var(--md-sys-color-on-surface)' }}>设置</h1>
      </div>
      <Tabs className="settings-tabs" items={userInfoItems} defaultActiveKey="user-info" />

      <Modal
        title="确认注销账号"
        open={deleteModalOpen}
        onCancel={() => setDeleteModalOpen(false)}
        footer={null}
          destroyOnHidden
      >
        <Form layout="vertical" onFinish={handleDeleteAccount}>
          <Form.Item
            label="请输入当前密码确认"
            name="password"
            rules={[
              { required: true, message: '请输入当前密码' },
              { min: 6, message: '密码至少6位' },
            ]}
          >
            <Input.Password placeholder="当前密码" />
          </Form.Item>
          <Form.Item className="mb-0">
            <div className="flex justify-end gap-2">
              <Button onClick={() => setDeleteModalOpen(false)}>取消</Button>
              <Button danger htmlType="submit" loading={loading}>确认注销</Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={avatarSelectModalOpen}
        centered
        title="更换头像"
        onCancel={handleCancelAvatarSelectModal}
        footer={null}
      >
        {!pendingAvatarFile ? (
          <Upload.Dragger
            showUploadList={false}
            multiple={false}
            accept=".png,.jpg,.jpeg,.webp"
            beforeUpload={(file) => {
              handleChooseAvatarFile(file);
              return false;
            }}
          >
            <p className="ant-upload-text">点击或拖拽选择头像图片</p>
            <p className="ant-upload-hint">支持 PNG/JPG/JPEG/WEBP，大小不超过 5MB</p>
          </Upload.Dragger>
        ) : (
          <div>
            <div
              className="mx-auto mb-4 overflow-hidden select-none relative rounded-lg border border-gray-200 bg-black/5"
              style={{ width: AVATAR_STAGE_WIDTH, height: AVATAR_STAGE_HEIGHT }}
              onWheel={(e) => {
                e.preventDefault();
                const nextScale = Math.min(4, Math.max(1, Number((e.deltaY > 0 ? pendingCropScale - 0.1 : pendingCropScale + 0.1).toFixed(2))));
                const normalized = normalizeCropState(nextScale, pendingCropOffset, pendingCircleOffset);
                setPendingCropScale(nextScale);
                setPendingCircleOffset(normalized.clampedCircle);
                setPendingCropOffset(normalized.clampedCrop);
              }}
              onPointerDown={(e) => {
                if (e.pointerType === 'mouse' && e.button !== 0) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                const centerX = pendingCircleOffset.x + AVATAR_CIRCLE_SIZE / 2;
                const centerY = pendingCircleOffset.y + AVATAR_CIRCLE_SIZE / 2;
                const distance = Math.hypot(x - centerX, y - centerY);
                const radius = AVATAR_CIRCLE_SIZE / 2;
                const isInsideCircle = distance <= radius;

                setPendingActivePointerId(e.pointerId);
                setPendingDragMode(isInsideCircle ? 'circle' : 'image');
                setPendingDragStartMouse({ x: e.clientX, y: e.clientY });
                setPendingDragStartImageOffset(pendingCropOffset);
                setPendingDragStartCircleOffset(pendingCircleOffset);

                e.currentTarget.setPointerCapture(e.pointerId);
                e.preventDefault();
              }}
              onPointerMove={(e) => {
                if (pendingActivePointerId !== e.pointerId) return;
                handlePendingPointerMove(e.clientX, e.clientY);
              }}
              onPointerUp={(e) => {
                if (pendingActivePointerId !== e.pointerId) return;
                stopPendingDrag();
              }}
              onPointerCancel={(e) => {
                if (pendingActivePointerId !== e.pointerId) return;
                stopPendingDrag();
              }}
              onLostPointerCapture={(e) => {
                if (pendingActivePointerId !== e.pointerId) return;
                stopPendingDrag();
              }}
            >
              <img
                src={pendingAvatarPreviewUrl}
                alt="待上传头像预览"
                className={`absolute top-0 left-0 max-w-none ${pendingDragMode === 'image' ? 'cursor-grabbing' : 'cursor-grab'}`}
                style={{
                  width: getCropDisplaySize(pendingCropScale).width,
                  height: 'auto',
                  transform: `translate(${pendingCropOffset.x}px, ${pendingCropOffset.y}px)`,
                  transition: pendingDragMode === 'image' ? 'none' : 'transform 0.08s linear',
                }}
              />
              <div
                className="pointer-events-none absolute border-2 border-white/90"
                style={{
                  width: AVATAR_CIRCLE_SIZE,
                  height: AVATAR_CIRCLE_SIZE,
                  left: pendingCircleOffset.x,
                  top: pendingCircleOffset.y,
                  borderRadius: '50%',
                  boxShadow: '0 0 0 9999px rgba(0,0,0,0.35)',
                }}
              />
            </div>
            <div className="text-center text-xs text-gray-500 mb-3">拖动圆形边框可移动选区，拖动图片可调整内容，滚轮缩放；边界已限制不会漏底</div>
            <div className="flex items-center justify-between mb-2 text-xs text-gray-500">
              <span>当前缩放：{Math.round(pendingCropScale * 100)}%</span>
              <Button size="small" onClick={resetPendingCropView}>重置位置和大小</Button>
            </div>
            <div className="flex justify-end gap-2">
              <Button onClick={clearPendingAvatar}>返回选择图片</Button>
              <Button type="primary" loading={avatarUploading} onClick={() => void handleConfirmAvatarUpload()}>
                确认上传
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
