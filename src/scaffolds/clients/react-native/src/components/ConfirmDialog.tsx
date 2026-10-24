import { View } from 'react-native'
import { Dialog } from 'heroui-native'
import AppButton from './AppButton'

interface ConfirmDialogProps {
  /** 是否显示 */
  isOpen: boolean
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  /** 危险操作：确认按钮用红色 */
  danger?: boolean
  /** 确认中：禁用按钮，防重复提交 */
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/**
 * 统一确认弹窗
 *
 * 替代系统 Alert.alert，保证和 App 的圆角、配色、按钮风格一致。
 * 例：退出登录、删除数据这类需要二次确认的操作。
 */
export default function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmText = '确定',
  cancelText = '取消',
  danger = false,
  loading = false,
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  return (
    <Dialog
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onCancel()
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content>
          <View className="mb-5 gap-1.5">
            <Dialog.Title>{title}</Dialog.Title>
            {description ? <Dialog.Description>{description}</Dialog.Description> : null}
          </View>

          <View className="flex-row justify-end gap-3">
            <AppButton size="sm" variant="ghost" onPress={onCancel} isDisabled={loading}>
              {cancelText}
            </AppButton>
            <AppButton
              size="sm"
              variant={danger ? 'danger' : 'primary'}
              onPress={onConfirm}
              isDisabled={loading}
            >
              {loading ? '处理中…' : confirmText}
            </AppButton>
          </View>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
