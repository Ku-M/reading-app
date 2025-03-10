// 书籍相关类型
export interface Book {
  bookId: string
  bookName: string
  author: string
  coverUrl: string
  description: string
  totalChapters: number
  readProgress: number
  chapters?: string[]
}

// 章节相关类型
export interface Chapter {
  chapterId: string
  bookId: string
  chapterName: string
  chapterContent: string
  chapterOrder?: number
  lexileScore?: number  // 章节的蓝思值
  availableLexileScores?: number[]  // 可用的蓝思值列表
}

// 阅读设置类型
export interface ReaderSettings {
  fontSize: number
  fontFamily: string
  lineHeight: number
  letterSpacing: number
  theme: 'light' | 'dark'
}

// 高亮样式类型
export type HighlightStyle = 'background' | 'wave' | 'underline'

// 高亮记录类型
export interface Highlight {
  text: string
  style: HighlightStyle
  timestamp: string
}

// AI 转写设置类型
export interface AITranscriptionSettings {
  enabled: boolean
  lexileScore: number
  priorityWords: string[]
  credits: number
}

// 阅读进度类型
export interface ReadingProgress {
  bookId: string
  chapterId: string
  pageIndex: number
  percentage: number
  lastRead: string
}

// API 响应类型 - 不再需要，因为后端直接返回数据
// export interface ApiResponse<T> {
//   code: number
//   message: string
//   data: T
// }

// 分页响应类型
export interface PaginatedResponse<T> {
  content: T[]
  pageable: {
    pageNumber: number
    pageSize: number
    sort: {
      sorted: boolean
      unsorted: boolean
      empty: boolean
    }
  }
  totalElements: number
  totalPages: number
  last: boolean
  first: boolean
  size: number
  number: number
  sort: {
    sorted: boolean
    unsorted: boolean
    empty: boolean
  }
  numberOfElements: number
  empty: boolean
} 