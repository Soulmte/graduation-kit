import { useEffect, useRef, useState } from 'react'
import { Keyboard, type ScrollViewInstance, type TextInputFocusEvent } from 'react-native'

/**
 * 表单页的键盘适配
 *
 * 安卓的 adjustResize 只会把可视区压小，不会替你把输入框挪到键盘上方；
 * 当表单刚好一屏时，ScrollView 也没有可滚的余量，键盘就会盖住下面的输入框。
 * 这里补两件事：
 *   1. 键盘弹出时在内容末尾撑出等高的留白，制造滚动余量；
 *   2. 输入框获得焦点时，把它滚到键盘上方。
 *
 * 用法：
 *   const { scrollRef, revealField, keyboardSpacer } = useKeyboardAwareScroll()
 *   <ScrollView ref={scrollRef}>
 *     <Input onFocus={revealField} />
 *     <View style={{ height: keyboardSpacer }} />
 *   </ScrollView>
 */
export function useKeyboardAwareScroll(offset = 16) {
  const scrollRef = useRef<ScrollViewInstance>(null)
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  // 第一次聚焦时键盘还在弹出动画中，滚动要等它到位，否则量出来的位置是旧的
  const keyboardHeightRef = useRef(0)
  const pendingScrollRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    const runPendingScroll = () => {
      const pending = pendingScrollRef.current
      if (!pending) return
      pendingScrollRef.current = null
      // 让 ScrollView 自己的键盘监听先更新完再滚
      setTimeout(pending, 50)
    }

    const show = Keyboard.addListener('keyboardDidShow', (event) => {
      keyboardHeightRef.current = event.endCoordinates.height
      setKeyboardHeight(event.endCoordinates.height)
      runPendingScroll()
    })
    const hide = Keyboard.addListener('keyboardDidHide', () => {
      keyboardHeightRef.current = 0
      setKeyboardHeight(0)
      pendingScrollRef.current = null
    })

    return () => {
      show.remove()
      hide.remove()
    }
  }, [])

  /** 放到 Input 的 onFocus 上 */
  const revealField = (event: TextInputFocusEvent) => {
    const handle = event.target
    if (handle == null) return

    const scroll = () =>
      scrollRef.current?.scrollResponderScrollNativeHandleToKeyboard(handle, offset, true)

    if (keyboardHeightRef.current > 0) {
      scroll()
      return
    }
    pendingScrollRef.current = scroll
  }

  return {
    scrollRef,
    revealField,
    /** 内容末尾留白高度，键盘收起时为 0 */
    keyboardSpacer: keyboardHeight
  }
}
