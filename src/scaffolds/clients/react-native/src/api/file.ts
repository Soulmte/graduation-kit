/**
 * 文件上传 API
 *
 * 用 expo-file-system 的 File.upload 走原生 multipart 上传。
 * 不再用 fetch + FormData：Expo SDK 58 的 fetch 是 WinterCG 实现，
 * 不接受 { uri, name, type } 这种 RN 的文件描述对象，会在序列化阶段直接失败。
 */
import AsyncStorage from '@react-native-async-storage/async-storage'
import { File, UploadType } from 'expo-file-system'
import { BASE_URL } from '@/config'

export interface UploadResult {
  fileName: string
  url: string
}

export interface ImagePickerAsset {
  uri: string
  fileName?: string | null
  mimeType?: string | null
}

export const uploadImage = async (asset: ImagePickerAsset): Promise<UploadResult> => {
  if (!asset?.uri) throw new Error('没有拿到图片地址')

  const token = await AsyncStorage.getItem('token')
  const file = new File(asset.uri)

  if (!file.exists) {
    throw new Error('图片文件读取失败，请重新选择')
  }

  const result = await file.upload(`${BASE_URL}/file/upload`, {
    httpMethod: 'POST',
    uploadType: UploadType.MULTIPART,
    fieldName: 'file',
    mimeType: asset.mimeType || 'image/jpeg',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined
  })

  if (result.status < 200 || result.status >= 300) {
    throw new Error(`服务器返回 ${result.status}`)
  }

  let json: any
  try {
    json = JSON.parse(result.body)
  } catch {
    throw new Error('服务器返回格式不正确')
  }

  if (json.code !== 200) throw new Error(json.message || '上传失败')
  if (!json.data?.url) throw new Error('服务器没有返回文件地址')

  return json.data
}
