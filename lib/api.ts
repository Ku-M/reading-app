import axios from 'axios'
import type { PaginatedResponse, Book, Chapter } from '@/types'

// const API_BASE_URL = 'http://127.0.0.1:8081/api'
const API_BASE_URL = 'https://ra.ku-m.cn/api'
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
})

// 获取书籍列表
export async function fetchBooks(
  page = 0, 
  size = 10, 
  sortBy = 'bookName', 
  direction: 'asc' | 'desc' = 'asc'
): Promise<PaginatedResponse<Book>> {
  const { data } = await api.get<PaginatedResponse<Book>>('/books', {
    params: { page, size, sortBy, direction },
  })
  return data
}

// 获取书籍详情
export async function fetchBook(id: string): Promise<Book> {
  const { data } = await api.get<Book>(`/books/${id}`)
  return data
}

// 获取章节列表
export async function fetchChapters(
  bookId: string,
  page = 0,
  size = 100, // 获取更多章节
  sortBy = 'chapterName',
  direction: 'asc' | 'desc' = 'asc'
): Promise<PaginatedResponse<Chapter>> {
  const { data } = await api.get<PaginatedResponse<Chapter>>(`/chapters/book/${bookId}`, {
    params: { page, size, sortBy, direction },
  })
  return data
}

// 获取带有蓝思值的章节列表
export async function fetchChaptersWithLexileScores(
  bookId: string,
  page: number = 0,
  size: number = 100,
  sortBy: string = 'chapterOrder',
  direction: string = 'asc'
): Promise<{
  content: Array<{
    chapterId: string;
    chapterName: string;
    chapterOrder: number;
    availableLexileScores: number[];
  }>;
  totalElements: number;
  totalPages: number;
  currentPage: number;
  size: number;
}> {
  const { data } = await api.get(`/chapters/book/${bookId}/with-lexile`, {
    params: {
      page,
      size,
      sortBy,
      direction
    }
  });
  return data;
}

// 获取章节内容
export async function fetchChapter(
  chapterId: string, 
  startAI = false, 
  lexileNo?: number, 
  priorityVocabulary?: string
): Promise<Chapter> {
  console.log('=== API 调用 fetchChapter 开始 ===')
  console.log('参数:', { chapterId, startAI, lexileNo, priorityVocabulary })
  
  try {
    const { data } = await api.get<Chapter>(`/chapters/${chapterId}`, {
      params: { 
        startAI, 
        ...(lexileNo && { lexileNo }), 
        ...(priorityVocabulary && { priorityVocabulary }),
        // 添加时间戳参数，避免缓存
        _t: Date.now()
      },
    })
    console.log('=== API 调用 fetchChapter 成功 ===')
    console.log('返回数据:', { chapterId: data.chapterId, chapterName: data.chapterName })
    return data
  } catch (error) {
    console.error('=== API 调用 fetchChapter 失败 ===', error)
    throw error
  }
}

// 获取章节内容
export async function fetchChapterContent(id: string): Promise<string> {
  console.log('=== API 调用 fetchChapterContent 开始 ===', id)
  try {
    const { data } = await api.get<string>(`/chapters/${id}/content`, {
      params: {
        // 添加时间戳参数，避免缓存
        _t: Date.now()
      }
    })
    console.log('=== API 调用 fetchChapterContent 成功 ===')
    return data
  } catch (error) {
    console.error('=== API 调用 fetchChapterContent 失败 ===', error)
    throw error
  }
}

// 批量转写章节
export async function batchTranscribeChapters(
  bookId: string,
  startChapter: number,
  endChapter: number,
  lexileScore: number
): Promise<{ success: boolean; message: string }> {
  if (!bookId) {
    return {
      success: false,
      message: '书籍ID不能为空'
    }
  }

  console.log(`开始批量转写书籍 ${bookId} 的章节 ${startChapter} 到 ${endChapter}，蓝思值: ${lexileScore}`)
  try {
    // 直接发送请求，让后端处理错误情况
    const { data } = await api.post<{ success: boolean; message: string }>(
      `/books/${bookId}/batch-transcribe`,
      null,  // 请求体为空
      {
        params: {  // 使用查询参数
          startChapter,
          endChapter,
          lexileScore
        }
      }
    )
    
    console.log('批量转写响应:', data)
    
    // 如果后端返回"该书籍没有章节"的错误，提供更详细的指导
    if (!data.success && data.message === "该书籍没有章节") {
      return {
        success: false,
        message: '该书籍没有章节。请先导入章节内容，或者检查书籍ID是否正确。'
      }
    }
    
    return data
  } catch (error: any) {
    console.error('批量转写失败:', error.response?.data || error.message)
    return {
      success: false,
      message: error.response?.data?.message || '批量转写请求失败，请稍后再试'
    }
  }
}

// 删除书籍
export async function deleteBook(bookId: string): Promise<{ success: boolean; message: string }> {
  console.log(`删除书籍 ${bookId}`)
  try {
    const { data } = await api.delete<{ success: boolean; message: string }>(`/books/${bookId}`)
    return data
  } catch (error) {
    console.error('删除书籍失败:', error)
    return { success: false, message: '删除书籍请求失败' }
  }
}

// 导入书籍
export async function importBook(bookData: {
  bookName: string,
  chapters: Array<{
    chapterName: string,
    content: string,
    order: number
  }>
}): Promise<{ success: boolean; message: string; bookId?: string }> {
  try {
    console.log('开始导入书籍:', bookData.bookName, '章节数:', bookData.chapters.length)
    
    // 转换数据格式以匹配后端 API 期望的格式
    const requestData = {
      bookName: bookData.bookName,
      chapters: bookData.chapters.map(chapter => ({
        chapterName: chapter.chapterName,
        content: chapter.content,
        order: chapter.order
      }))
    }
    
    const { data } = await api.post('/books/import', requestData)
    console.log('导入书籍成功:', data)
    
    return {
      success: data.success === true,
      message: data.message || '书籍导入成功',
      bookId: data.bookId
    }
  } catch (error: any) {
    console.error('导入书籍失败:', error.response?.data || error.message)
    return {
      success: false,
      message: error.response?.data?.message || '导入书籍失败，请稍后再试'
    }
  }
}

// 翻译文本
export async function translateText(text: string, type: 'word' | 'text' = 'text'): Promise<{
  translation: string;
  speakUrl?: string;
  tSpeakUrl?: string;
  basic?: {
    phonetic?: string;
    explains: string[];
  };
  [key: string]: any;
}> {
  try {
    const response = await api.get<{
      translation: string[];
      basic?: {
        phonetic?: string;
        explains: string[];
      };
      speakUrl?: string;
      tSpeakUrl?: string;
      [key: string]: any;
    }>('/translate', {
      params: { 
        text, 
        type 
      }
    });

    const data = response.data;

    return {
      translation: data.translation && data.translation.length > 0 ? data.translation[0] : text,
      speakUrl: data.speakUrl,
      tSpeakUrl: data.tSpeakUrl,
      basic: data.basic,
      ...(data as object)
    };
  } catch (error) {
    console.error('翻译请求失败:', error);
    return {
      translation: text,
      basic: {
        explains: ['翻译失败']
      }
    };
  }
}

// 错误处理中间件
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // 服务器返回错误状态码
      const { status, data } = error.response
      console.error(`API Error (${status}):`, data)
    } else if (error.request) {
      // 请求发送失败
      console.error('Request Error:', error.request)
    } else {
      // 请求配置错误
      console.error('Error:', error.message)
    }
    return Promise.reject(error)
  }
) 