import type { ReaderSettings } from '@/types'

// 计算文本分页
export function calculatePages(
  content: string,
  settings: ReaderSettings,
  containerWidth = 800,
  containerHeight = 600
): string[] {
  // 在客户端环境中，创建一个临时的 div 元素来计算文本
  if (typeof document !== 'undefined') {
    const tempDiv = document.createElement('div')
    tempDiv.style.position = 'absolute'
    tempDiv.style.visibility = 'hidden'
    tempDiv.style.width = `${containerWidth}px`
    tempDiv.style.fontSize = `${settings.fontSize}px`
    tempDiv.style.fontFamily = settings.fontFamily
    tempDiv.style.lineHeight = `${settings.lineHeight}`
    tempDiv.style.letterSpacing = `${settings.letterSpacing}px`
    document.body.appendChild(tempDiv)

    // 将内容按段落分割
    const paragraphs = content.split('\n').filter(Boolean)
    const pages: string[] = []
    let currentPage = ''
    let currentHeight = 0

    // 遍历每个段落
    for (const paragraph of paragraphs) {
      tempDiv.textContent = currentPage + paragraph + '\n'
      const newHeight = tempDiv.offsetHeight

      // 如果添加新段落后超出容器高度，创建新页面
      if (newHeight > containerHeight && currentPage) {
        pages.push(currentPage.trim())
        currentPage = paragraph + '\n'
        currentHeight = tempDiv.offsetHeight
      } else {
        currentPage += paragraph + '\n'
        currentHeight = newHeight
      }
    }

    // 添加最后一页
    if (currentPage) {
      pages.push(currentPage.trim())
    }

    // 清理临时元素
    document.body.removeChild(tempDiv)

    return pages
  }
  
  // 在服务器端环境中，简单地按段落分页
  const paragraphs = content.split('\n').filter(Boolean)
  const pages: string[] = []
  let currentPage = ''
  let paragraphCount = 0
  
  for (const paragraph of paragraphs) {
    currentPage += paragraph + '\n'
    paragraphCount++
    
    if (paragraphCount >= 5) {
      pages.push(currentPage.trim())
      currentPage = ''
      paragraphCount = 0
    }
  }
  
  if (currentPage) {
    pages.push(currentPage.trim())
  }
  
  return pages
}

// 检查页面翻转手势
export function isValidPageTurn(
  e: React.MouseEvent | React.TouchEvent,
  containerWidth: number
): 'prev' | 'next' | null {
  const x = 'touches' in e ? e.touches[0]?.clientX : e.clientX
  
  if (!x) return null
  
  const threshold = containerWidth / 3

  if (x < threshold) {
    return 'prev'
  } else if (x > containerWidth - threshold) {
    return 'next'
  }

  return null
}

// 格式化阅读进度
export function formatProgress(progress: number): string {
  return `${Math.round(progress * 100)}%`
}

// 格式化最后阅读时间
export function formatLastRead(date: string): string {
  const now = new Date()
  const lastRead = new Date(date)
  const diff = now.getTime() - lastRead.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours === 0) {
      const minutes = Math.floor(diff / (1000 * 60))
      return `${minutes} 分钟前`
    }
    return `${hours} 小时前`
  } else if (days < 30) {
    return `${days} 天前`
  } else {
    return lastRead.toLocaleDateString('zh-CN')
  }
}

// 防抖函数
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function(this: any, ...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout)
    }

    timeout = setTimeout(() => {
      func.apply(this, args)
    }, wait)
  }
}

// 节流函数
export function throttle<T extends (...args: any[]) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false

  return function(this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
} 