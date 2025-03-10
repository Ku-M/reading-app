import type { NextApiRequest, NextApiResponse } from 'next'

// 后端 API 地址
const BACKEND_API_URL = 'http://localhost:8080/api/translate'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 只允许 GET 请求
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: '方法不允许' })
  }

  try {
    // 从请求中获取参数
    const { text, type } = req.query

    // 验证必要参数
    if (!text) {
      return res.status(400).json({ success: false, message: '缺少必要参数: text' })
    }

    // 构建请求 URL
    const url = new URL(BACKEND_API_URL)
    url.searchParams.append('text', text.toString())
    if (type) {
      url.searchParams.append('type', type.toString())
    }

    // 发送请求到后端
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // 获取响应数据
    const data = await response.json()

    // 返回响应
    return res.status(response.status).json(data)
  } catch (error) {
    console.error('翻译代理出错:', error)
    return res.status(500).json({
      success: false,
      message: '翻译服务异常',
      error: error instanceof Error ? error.message : String(error),
    })
  }
} 