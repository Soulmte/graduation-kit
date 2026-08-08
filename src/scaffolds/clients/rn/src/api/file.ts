/**
 * 文件上传 API
 * RN 端使用 fetch + FormData 上传(axios 在 RN 中处理 FormData 不友好)
 */
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Alert } from 'react-native'
import { BASE_URL } from '@/config'

export interface UploadResult {
  fileName: string
  url: string
}

export interface UploadResponse {
  code: number
  message: string
  data: UploadResult
}

export interface ImagePickerAsset {
  uri: string
  fileName?: string | null
  mimeType?: string | null
  type?: string | null
}

/**
 * 上传图片(从 expo-image-picker 拿到的 asset)
 */
export const uploadImage = async (asset: ImagePickerAsset): Promise<UploadResult> => {
  const token = await AsyncStorage.getItem('token')
  const fileName = asset.fileName || `upload_${Date.now()}.jpg`
  const mimeType = asset.mimeType || 'image/jpeg'

  const form = new FormData()
  form.append('file', {
    uri: asset.uri,
    name: fileName,
    type: mimeType
  } as any)

  const res = await fetch(`${BASE_URL}/file/upload`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
      // 注意: 不要手动设置 Content-Type, 让 fetch 自动加 boundary
    },
    body: form
  })

  const json: UploadResponse = await res.json()
  if (json.code !== 200) {
    Alert.alert('上传失败', json.message || '未知错误')
    throw new Error(json.message)
  }
  return json.data
}
