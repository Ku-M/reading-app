'use client'

import { useEffect } from 'react'
import { useQuery } from 'react-query'
import { useParams } from 'next/navigation'
import { useReaderStore } from '@/lib/store'
import { fetchBook, fetchChapters } from '@/lib/api'
import Reader from '@/components/reader/Reader'
import type { Book, Chapter } from '@/types'

export default function BookPage() {
  const params = useParams()
  const bookId = params.id as string
  
  console.log('书籍ID:', bookId)
  
  const readingProgress = useReaderStore((state) => state.readingProgress[bookId])

  // 获取书籍信息
  const { 
    data: book, 
    isLoading: isLoadingBook, 
    error: bookError 
  } = useQuery<Book>(
    ['book', bookId],
    () => fetchBook(bookId),
    {
      enabled: !!bookId,
      retry: 1,
      onError: (err) => console.error('获取书籍详情失败:', err)
    }
  )

  // 获取章节列表
  const { 
    data: chaptersData, 
    isLoading: isLoadingChapters,
    error: chaptersError
  } = useQuery(
    ['chapters', bookId],
    () => fetchChapters(bookId),
    {
      enabled: !!bookId,
      retry: 1,
      onError: (err) => console.error('获取章节列表失败:', err)
    }
  )

  // 设置主题
  useEffect(() => {
    const theme = useReaderStore.getState().settings.theme
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [])

  if (isLoadingBook || isLoadingChapters) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">加载中...</div>
      </div>
    )
  }

  if (bookError || chaptersError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-500">
          {bookError ? '加载书籍失败' : '加载章节列表失败'}
        </div>
      </div>
    )
  }

  if (!book || !chaptersData || chaptersData.content.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-500">
          {!book ? '书籍不存在' : '该书籍暂无章节'}
        </div>
      </div>
    )
  }

  console.log('书籍信息:', book)
  console.log('章节列表:', chaptersData.content)

  // 确定初始章节 - 优先使用阅读进度中的章节，如果没有则使用第一个章节
  const initialChapterId = readingProgress?.chapterId || chaptersData.content[0]?.chapterId
  console.log('初始章节ID:', initialChapterId)

  // 确保有初始章节ID
  if (!initialChapterId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-500">无法确定初始章节</div>
      </div>
    )
  }

  return <Reader bookId={bookId} initialChapterId={initialChapterId} />
} 