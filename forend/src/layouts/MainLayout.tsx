import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Modal } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { useTaskStore, useAuthStore } from '../stores';
import { useState, useEffect, useMemo } from 'react';
import TopAppBar from '../components/TopAppBar';
import NavigationDrawer from '../components/NavigationDrawer';
import CommandPalette, { type FlatNavItem } from '../components/CommandPalette';
import { useNavItems } from '../hooks/useNavItems';

const DESKTOP_BREAKPOINT = 1024;

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { hasActiveTask, taskDescription, setActiveTask } = useTaskStore();
  const { role } = useAuthStore();
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const isMobile = !isDesktop;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= DESKTOP_BREAKPOINT);
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (isMobile) setDrawerOpen(false);
    else setDrawerOpen(true);
  }, [isMobile]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navRole = role === 'teacher' ? 'teacher' : 'student';
  const { navGroups } = useNavItems(navRole);

  const flatNavItemsWithGroups: FlatNavItem[] = useMemo(() =>
    navGroups.flatMap(group =>
      group.items.map(item => ({ ...item, group: group.title }))
    ), [navGroups]);

  const activePath = location.pathname;

  const handleNavClick = (path: string) => {
    if (hasActiveTask) {
      setPendingNavigation(path);
      setIsModalVisible(true);
    } else {
      navigate(path);
    }
    if (isMobile) setDrawerOpen(false);
  };

  const handleNavigate = (path: string) => {
    if (hasActiveTask) {
      setPendingNavigation(path);
      setIsModalVisible(true);
    } else {
      navigate(path);
    }
    setCommandOpen(false);
  };

  const handleConfirmNavigation = () => {
    setIsModalVisible(false);
    setActiveTask(false);
    if (pendingNavigation) {
      navigate(pendingNavigation);
      setPendingNavigation(null);
    }
  };

  const handleCancelNavigation = () => {
    setIsModalVisible(false);
    setPendingNavigation(null);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--md-sys-color-surface)' }}>
      <TopAppBar
        onMenuClick={() => setDrawerOpen(true)}
        onCommandOpen={() => setCommandOpen(true)}
        isMobile={isMobile}
      />
      <NavigationDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onCommandOpen={() => setCommandOpen(true)}
        isMobile={isMobile}
        activePath={activePath}
        onNavClick={handleNavClick}
      />
      <main style={{ marginLeft: isMobile ? 0 : 320 }}>
        <div className="mx-auto w-full max-w-[1400px] px-4 md:px-6 lg:px-8 py-4 md:py-6">
          <Outlet />
        </div>
      </main>
      <CommandPalette
        open={commandOpen}
        onClose={() => setCommandOpen(false)}
        onNavigate={handleNavigate}
        navItems={flatNavItemsWithGroups}
      />
      <Modal
        title={
          <div className="flex items-center gap-2" style={{ color: 'var(--md-sys-color-on-surface)' }}>
            <ExclamationCircleOutlined style={{ color: 'var(--md-sys-color-warning)' }} />
            <span>确认切换页面</span>
          </div>
        }
        open={isModalVisible}
        onOk={handleConfirmNavigation}
        onCancel={handleCancelNavigation}
        okText="确定切换"
        cancelText="取消"
        okButtonProps={{ danger: true }}
        styles={{
          header: { backgroundColor: 'var(--md-sys-color-surface-container)' },
          body: { backgroundColor: 'var(--md-sys-color-surface-container)' },
          footer: { backgroundColor: 'var(--md-sys-color-surface-container)' }
        }}
      >
        <div className="py-2">
          <p className="text-base" style={{ color: 'var(--md-sys-color-on-surface)' }}>
            当前有任务正在执行中：<span className="font-semibold" style={{ color: 'var(--md-sys-color-on-surface)' }}>{taskDescription || '简历上传或解析'}</span>
          </p>
          <p className="mt-2 text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            切换页面可能会导致任务中断，是否确认要继续切换？
          </p>
        </div>
      </Modal>
    </div>
  );
}
