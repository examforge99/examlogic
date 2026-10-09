import { COLORS } from '@/lib/design/colors'

export const dashboardColors = {
  bg: COLORS.background,
  surface: COLORS.surface,
  elevated: COLORS.elevated,
  primary: COLORS.primary,
  accent: COLORS.accent,
  text: COLORS.text.primary,
  muted: COLORS.text.muted,
  border: COLORS.border,
} as const

export const dashboardStyles = {
  shell: {
    minHeight: '100svh',
    background: dashboardColors.bg,
    color: dashboardColors.text,
    paddingBottom: 'calc(88px + env(safe-area-inset-bottom))',
  },
  main: {
    maxWidth: 620,
    width: '100%',
    margin: '0 auto',
    padding: '18px 16px 30px',
    display: 'grid',
    gap: 16,
    boxSizing: 'border-box' as const,
  },
  panel: {
    border: '1px solid ' + dashboardColors.border,
    borderRadius: 16,
    background: dashboardColors.surface,
    padding: 16,
  },
  label: {
    margin: 0,
    color: dashboardColors.muted,
    fontSize: 10,
    fontWeight: 750,
    letterSpacing: '.11em',
    textTransform: 'uppercase' as const,
  },
  title: {
    margin: '5px 0 0',
    fontSize: 20,
    lineHeight: 1.2,
    letterSpacing: '-.035em',
    fontWeight: 750,
  },
  sub: {
    margin: '6px 0 0',
    color: dashboardColors.muted,
    fontSize: 12,
    lineHeight: 1.55,
  },
  action: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    border: 0,
    borderRadius: 10,
    padding: '11px 14px',
    background: dashboardColors.primary,
    color: '#061626',
    fontWeight: 750,
    fontSize: 12,
  },
} as const

export function formatDuration(seconds: number) {
  const minutes = Math.max(0, Math.round(seconds / 60))
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return hours ? (remainder ? hours + 'h ' + remainder + 'm' : hours + 'h') : remainder + 'm'
}
