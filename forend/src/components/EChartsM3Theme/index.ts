export function getEChartsM3Theme(): Record<string, unknown> {
  const root = getComputedStyle(document.documentElement);

  const getColor = (prop: string, fallback: string): string => {
    const val = root.getPropertyValue(prop).trim();
    return val || fallback;
  };

  const primary = getColor('--md-sys-color-primary', '#0B57D0');
  const secondary = getColor('--md-sys-color-secondary', '#555F71');
  const secondaryContainer = getColor('--md-sys-color-secondary-container', '#D9E3F8');
  const tertiary = getColor('--md-sys-color-tertiary', '#705575');
  const tertiaryContainer = getColor('--md-sys-color-tertiary-container', '#FAD8FD');
  const error = getColor('--md-sys-color-error', '#BA1A1A');
  const success = getColor('--md-sys-color-success', '#1B8C3B');
  const warning = getColor('--md-sys-color-warning', '#8F5900');
  const onSurface = getColor('--md-sys-color-on-surface', '#1B1B1F');
  const onSurfaceVariant = getColor('--md-sys-color-on-surface-variant', '#44474F');
  const outline = getColor('--md-sys-color-outline', '#74777F');
  const outlineVariant = getColor('--md-sys-color-outline-variant', '#C4C6D0');
  const surface = getColor('--md-sys-color-surface', '#FDFCFF');
  const surfaceContainer = getColor('--md-sys-color-surface-container', '#F0EDF2');

  return {
    color: [primary, secondary, tertiary, success, warning, error, secondaryContainer, tertiaryContainer],
    backgroundColor: 'transparent',
    textStyle: {
      color: onSurface,
      fontFamily: "'Google Sans', 'Noto Sans SC', 'Roboto', system-ui, sans-serif",
    },
    title: {
      textStyle: { color: onSurface, fontSize: 16, fontWeight: 500 },
      subtextStyle: { color: onSurfaceVariant, fontSize: 12 },
    },
    legend: {
      textStyle: { color: onSurfaceVariant },
      pageTextStyle: { color: onSurfaceVariant },
      pageIconColor: outline,
      pageIconInactiveColor: outlineVariant,
    },
    tooltip: {
      backgroundColor: surfaceContainer,
      borderColor: outlineVariant,
      borderWidth: 1,
      textStyle: { color: onSurface },
      extraCssText: `border-radius: var(--md-sys-shape-corner-medium, 12px); box-shadow: var(--md-sys-elevation-2, 0 2px 6px rgba(0,0,0,0.15));`,
    },
    categoryAxis: {
      axisLine: { lineStyle: { color: outlineVariant } },
      axisTick: { lineStyle: { color: outlineVariant } },
      axisLabel: { color: onSurfaceVariant },
      splitLine: { lineStyle: { color: outlineVariant, type: 'dashed' } },
    },
    valueAxis: {
      axisLine: { lineStyle: { color: outlineVariant } },
      axisTick: { lineStyle: { color: outlineVariant } },
      axisLabel: { color: onSurfaceVariant },
      splitLine: { lineStyle: { color: outlineVariant, type: 'dashed' } },
    },
    radar: {
      axisLine: { lineStyle: { color: outlineVariant } },
      splitLine: { lineStyle: { color: outlineVariant } },
      splitArea: { areaStyle: { color: [surfaceContainer, surface] } },
      axisName: { color: onSurfaceVariant },
    },
    gauge: {
      axisLine: { lineStyle: { color: [[1, outlineVariant]] } },
      axisTick: { lineStyle: { color: outlineVariant } },
      axisLabel: { color: onSurfaceVariant },
      detail: { color: onSurface },
      title: { color: onSurfaceVariant },
    },
    pie: {
      itemStyle: { borderColor: surface, borderWidth: 2 },
    },
    series: [
      { type: 'bar', itemStyle: { borderRadius: 4 } },
      { type: 'line', smooth: true, symbolSize: 6 },
      { type: 'radar', areaStyle: { opacity: 0.15 } },
    ],
  };
}

export const M3_CHART_COLORS = [
  'var(--md-sys-color-primary)',
  'var(--md-sys-color-secondary)',
  'var(--md-sys-color-tertiary)',
  'var(--md-sys-color-success)',
  'var(--md-sys-color-warning)',
  'var(--md-sys-color-error)',
  'var(--md-sys-color-primary-container)',
  'var(--md-sys-color-secondary-container)',
];

export function getM3ChartColor(index: number): string {
  const root = getComputedStyle(document.documentElement);
  const props = [
    '--md-sys-color-primary',
    '--md-sys-color-secondary',
    '--md-sys-color-tertiary',
    '--md-sys-color-success',
    '--md-sys-color-warning',
    '--md-sys-color-error',
    '--md-sys-color-primary-container',
    '--md-sys-color-secondary-container',
  ];
  const prop = props[index % props.length];
  return root.getPropertyValue(prop).trim() || '#0B57D0';
}