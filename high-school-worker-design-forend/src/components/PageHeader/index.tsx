import { Link } from 'react-router-dom';
import { useBreadcrumbs } from '../../hooks/useBreadcrumbs';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  breadcrumbTitle?: string;
  hideBreadcrumb?: boolean;
  children?: React.ReactNode;
}

export default function PageHeader({
  title,
  description,
  icon,
  breadcrumbTitle,
  hideBreadcrumb = false,
  children,
}: PageHeaderProps) {
  const breadcrumbs = useBreadcrumbs(breadcrumbTitle);

  const showBreadcrumb = !hideBreadcrumb && breadcrumbs.length > 1;

  return (
    <div className="mb-6">
      {showBreadcrumb && (
        <nav className="flex items-center gap-1 px-0 pt-0 pb-1" aria-label="面包屑导航">
          {breadcrumbs.map((item, idx) => (
            <span key={idx} className="flex items-center gap-1">
              {idx > 0 && (
                <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }} className="text-sm">
                  /
                </span>
              )}
              {item.path ? (
                <Link
                  to={item.path}
                  className="text-sm no-underline transition-colors"
                  style={{ color: 'var(--md-sys-color-primary)' }}
                >
                  {item.title}
                </Link>
              ) : (
                <span
                  className="text-sm"
                  style={{ color: 'var(--md-sys-color-on-surface)' }}
                >
                  {item.title}
                </span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon && (
            <span style={{ color: 'var(--md-sys-color-primary)' }} className="text-[26px]">
              {icon}
            </span>
          )}
          <h1 className="md-typescale-headline-small">{title}</h1>
        </div>
        {children && <div className="flex items-center gap-2">{children}</div>}
      </div>
      {description && (
        <p className="md-typescale-body-medium mt-1 ml-[34px]" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
          {description}
        </p>
      )}
      <div
        className="mt-3"
        style={{ borderBottom: '1px solid var(--md-sys-color-outline-variant)' }}
      />
    </div>
  );
}