import { Resizable } from 'react-resizable'
import 'react-resizable/css/styles.css'

/**
 * 可拖拽调整列宽的表头
 * 参考 Ant Design 官方示例: https://ant.design/components/table#resizable-column
 */
export default function ResizableTitle(props) {
  const { onResize, width, ...rest } = props

  if (!width) return <th {...rest} />

  return (
    <Resizable
      width={width}
      height={0}
      onResize={onResize}
      draggableOpts={{ enableUserSelectHack: false }}
      handle={<span className="react-resizable-handle" onClick={(e) => e.stopPropagation()} />}
    >
      <th {...rest} />
    </Resizable>
  )
}
