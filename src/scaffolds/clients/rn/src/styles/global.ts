/**
 * 全局通用样式集合
 * 复用同一套 StyleSheet, 各页面 import { gs } from '@/styles/global'
 */
import { StyleSheet } from 'react-native'
import { colors, fontSize, radius, spacing } from './theme'

export const gs = StyleSheet.create({
  // ---------- 屏幕容器 ----------
  screen: {
    flex: 1,
    backgroundColor: colors.bgPage
  },
  authScreen: {
    flex: 1,
    backgroundColor: colors.bgPage,
    justifyContent: 'center',
    padding: spacing.xl
  },

  // ---------- 卡片 ----------
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: spacing.md,
    marginTop: spacing.md
  },

  // ---------- 文字 ----------
  pageTitle: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.lg
  },
  text:    { fontSize: fontSize.md, color: colors.text },
  textSub: { fontSize: fontSize.md, color: colors.textSub },
  textMute:{ fontSize: fontSize.sm, color: colors.textMute },
  textDanger: { color: colors.danger },
  textPrimary: { color: colors.primary },

  // ---------- 表单 ----------
  formField: {
    marginBottom: spacing.md
  },
  fieldLabel: {
    color: colors.textMute,
    fontSize: fontSize.sm,
    marginBottom: spacing.xs
  },

  // ---------- Banner (蓝色渐变, 用纯色替代渐变避免依赖) ----------
  banner: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.xl,
    margin: spacing.lg
  },
  bannerTitle: {
    color: '#ffffff',
    fontSize: fontSize.xxl,
    fontWeight: '700'
  },
  bannerSub: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: fontSize.lg,
    marginTop: spacing.sm
  },

  // ---------- Auth 卡片 ----------
  authCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.xxl,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }
  },
  authBrand: {
    alignItems: 'center',
    marginBottom: spacing.xl
  },
  authBrandMark: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md
  },
  authBrandMarkText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700'
  },
  authTitle: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.text
  },
  authSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textMute,
    marginTop: spacing.xs
  },
  authFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.lg
  },

  // ---------- Notice item ----------
  noticeItem: {
    backgroundColor: colors.bgCard,
    padding: spacing.lg,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border
  },
  noticeTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm
  },
  noticeContent: {
    color: colors.textSub,
    lineHeight: 20,
    marginBottom: spacing.sm
  },
  noticeTime: {
    color: colors.textMute,
    fontSize: fontSize.xs
  },

  // ---------- 通用列 ----------
  row: { flexDirection: 'row', alignItems: 'center' },
  rowSpace: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  // ---------- 间距工具 ----------
  mb8:  { marginBottom: spacing.sm },
  mb12: { marginBottom: spacing.md },
  mb16: { marginBottom: spacing.lg },
  mb24: { marginBottom: spacing.xl },
  mt8:  { marginTop: spacing.sm },
  mt16: { marginTop: spacing.lg }
})
