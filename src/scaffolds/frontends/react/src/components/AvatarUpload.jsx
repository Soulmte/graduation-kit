import { useState } from 'react'
import { Upload, Avatar, message } from 'antd'
import { UserOutlined, LoadingOutlined, PlusOutlined } from '@ant-design/icons'
import { uploadFile } from '../api/file'

/**
 * 头像上传组件
 * - 调用 /api/file/upload 统一上传接口
 * - 校验类型与大小
 * - 上传成功后通过 onChange 把返回的 url 抛给父组件
 *
 * @param {string}   value     当前头像 URL (受控)
 * @param {function} onChange  上传成功回调, 参数为 url
 * @param {number}   size      头像尺寸, 默认 100
 */
export default function AvatarUpload({ value, onChange, size = 100, disabled = false }) {
  const [loading, setLoading] = useState(false)

  const beforeUpload = (file) => {
    const ok = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)
    if (!ok) {
      message.error('仅支持 JPG / PNG / GIF / WEBP 格式')
      return Upload.LIST_IGNORE
    }
    const smallEnough = file.size / 1024 / 1024 < 2
    if (!smallEnough) {
      message.error('图片不能超过 2 MB')
      return Upload.LIST_IGNORE
    }
    return true
  }

  // 自定义上传: 用项目统一的 request 实例, 避开 Upload 默认 action
  const customRequest = async ({ file, onSuccess, onError }) => {
    setLoading(true)
    try {
      const res = await uploadFile(file)
      const url = res?.data?.url
      if (url) {
        onChange?.(url)
        message.success('头像上传成功')
        onSuccess(res, file)
      } else {
        throw new Error('服务端未返回 URL')
      }
    } catch (err) {
      message.error('头像上传失败')
      onError(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Upload
      name="file"
      listType="picture-circle"
      showUploadList={false}
      beforeUpload={beforeUpload}
      customRequest={customRequest}
      disabled={disabled}
      style={{ display: 'block' }}
    >
      {value ? (
        <Avatar size={size} src={value} style={{ display: 'block' }} />
      ) : (
        <div style={{ textAlign: 'center', color: 'var(--color-text-mute)' }}>
          {loading ? <LoadingOutlined /> : <PlusOutlined />}
          <div style={{ marginTop: 4, fontSize: 12 }}>上传头像</div>
        </div>
      )}
    </Upload>
  )
}
