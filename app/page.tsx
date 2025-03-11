'use client'

import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from 'react-query'
import { useRouter } from 'next/navigation'
import { fetchBooks, batchTranscribeChapters, deleteBook, importBook } from '@/lib/api'
import { useReaderStore } from '@/lib/store'
import type { Book } from '@/types'
import { Button } from '@heroui/react'
import UserDropdown from '@/components/UserDropdown'
import AISettingsDialog from '@/components/reader/AISettingsDialog'
import BatchTranscribeDialog from '@/components/BatchTranscribeDialog'
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog'
import ToastMessage from '@/components/ui/Toast'
import ImportBookDialog from '@/components/ImportBookDialog'

// 扩展 Book 类型
interface ExtendedBook extends Book {
  wordCount: number;
}

export default function Home() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isAIEnabled, setIsAIEnabled] = useState(false)
  const [showAISettings, setShowAISettings] = useState(false)
  const [showBatchTranscribe, setShowBatchTranscribe] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [toast, setToast] = useState<{
    show: boolean
    message: string
    type: 'success' | 'error' | 'info'
  }>({
    show: false,
    message: '',
    type: 'info'
  })
  
  const aiSettings = useReaderStore((state) => state.aiSettings)
  
  const { data: booksData, isLoading, error } = useQuery('books', () => fetchBooks())

  // 过滤书籍列表
  const filteredBooks = booksData?.content.filter(book => 
    book.bookName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.author.toLowerCase().includes(searchQuery.toLowerCase())
  ) as ExtendedBook[] || []

  // 初始化时检查暗黑模式
  useEffect(() => {
    // 检查系统偏好或本地存储
    const savedMode = localStorage.getItem('darkMode')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    
    const shouldBeDark = savedMode === 'dark' || (savedMode === null && prefersDark)
    setIsDarkMode(shouldBeDark)
    
    if (shouldBeDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  // 切换暗黑模式
  const toggleDarkMode = () => {
    const newMode = !isDarkMode
    setIsDarkMode(newMode)
    
    if (newMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('darkMode', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('darkMode', 'light')
    }
  }

  const handleBookClick = (book: Book) => {
    router.push(`/books/${book.bookId}`)
  }

  const handleBatchTranscribe = (book: Book) => {
    setSelectedBook(book)
    setShowBatchTranscribe(true)
  }

  const handleDeleteBook = (book: Book) => {
    setSelectedBook(book)
    setShowDeleteConfirm(true)
  }

  const handleConfirmBatchTranscribe = async (startChapter: number, endChapter: number) => {
    if (!selectedBook) return
    
    try {
      console.log('开始批量转写:', selectedBook.bookId, startChapter, endChapter, aiSettings.lexileScore)
      
      const result = await batchTranscribeChapters(
        selectedBook.bookId,
        startChapter,
        endChapter,
        aiSettings.lexileScore
      )
      
      console.log('批量转写结果:', result)
      
      if (result.success) {
        setToast({
          show: true,
          message: '批量转写任务已提交，请稍后查看结果',
          type: 'success'
        })
      } else {
        setToast({
          show: true,
          message: `批量转写失败: ${result.message}`,
          type: 'error'
        })
      }
      
      // 关闭对话框
      setShowBatchTranscribe(false)
      return result
    } catch (error) {
      console.error('批量转写出错:', error)
      setToast({
        show: true,
        message: '批量转写请求出错，请稍后再试',
        type: 'error'
      })
      
      // 关闭对话框
      setShowBatchTranscribe(false)
      throw error
    }
  }

  const handleConfirmDelete = async () => {
    if (!selectedBook) return
    
    try {
      const result = await deleteBook(selectedBook.bookId)
      
      if (result.success) {
        queryClient.invalidateQueries('books')
        setToast({
          show: true,
          message: '书籍已成功删除',
          type: 'success'
        })
      } else {
        setToast({
          show: true,
          message: `删除失败: ${result.message}`,
          type: 'error'
        })
      }
    } catch (error) {
      console.error('删除书籍出错:', error)
      setToast({
        show: true,
        message: '删除书籍请求出错，请稍后再试',
        type: 'error'
      })
    } finally {
      setShowDeleteConfirm(false)
    }
  }

  // 处理导入书籍
  const handleImportBook = async (bookData: {
    bookName: string,
    chapters: Array<{
      chapterName: string,
      content: string,
      order: number
    }>
  }) => {
    try {
      const result = await importBook(bookData)
      
      if (result.success) {
        // 刷新书籍列表
        queryClient.invalidateQueries('books')
        
        setToast({
          show: true,
          message: '书籍导入成功',
          type: 'success'
        })
      } else {
        setToast({
          show: true,
          message: `导入失败: ${result.message}`,
          type: 'error'
        })
      }
    } catch (error) {
      console.error('导入书籍出错:', error)
      setToast({
        show: true,
        message: '导入书籍请求出错，请稍后再试',
        type: 'error'
      })
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-[#1a1a1a] flex flex-col">
      <header className="bg-white dark:bg-[#1a1a1a] shadow-sm text-gray-800 dark:text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">ABHISECA</h1>
          <div className="flex items-center space-x-4">
            {/* 模式切换和 AI 转写按钮 */}
            <div className="flex items-center space-x-4">
              {/* 暗黑/亮色模式切换 */}
              <button 
                onClick={toggleDarkMode}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label={isDarkMode ? "切换到亮色模式" : "切换到暗色模式"}
              >
                {isDarkMode ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd"></path>
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
                  </svg>
                )}
              </button>
              
              {/* AI转写按钮 */}
              <button 
                onClick={() => setShowAISettings(true)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-blue-500"
                aria-label="AI转写设置"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </button>
            </div>
            
            <UserDropdown />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 flex-1">
        {/* 搜索栏 */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="搜索书籍..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border dark:border-gray-700 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <svg className="w-5 h-5 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* 书籍列表 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {/* 导入书籍卡片 */}
          <button
            onClick={() => setShowImportDialog(true)}
            className="aspect-[4/5] rounded-lg border-2 border-dashed dark:border-gray-700 flex flex-col items-center justify-center p-4 text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 hover:border-gray-500 dark:hover:border-gray-400 transition-colors bg-white dark:bg-[#1a1a1a]"
          >
            <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span className="text-xs">导入新书籍</span>
          </button>

          {/* 书籍卡片 */}
          {filteredBooks.map((book) => (
            <div
              key={book.bookId}
              className="aspect-[4/5] rounded-lg border dark:border-gray-700 bg-white dark:bg-[#1a1a1a] shadow-sm hover:shadow-md transition-shadow relative group overflow-hidden"
            >
              <button
                onClick={() => handleBookClick(book)}
                className="w-full h-full flex flex-col relative"
              >
                {/* 默认封面文字 */}
                <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#1a1a1a] dark:to-[#242424] relative overflow-hidden">
                  {/* 装饰圆环 */}
                  <div className="absolute w-48 h-48 rounded-full border-[16px] border-gray-100 dark:border-[#242424] opacity-50 -top-12 -right-12 transform rotate-12"></div>
                  <div className="absolute w-32 h-32 rounded-full border-[12px] border-gray-100 dark:border-[#242424] opacity-30 bottom-4 -left-8"></div>
                  
                  {/* 文字容器 */}
                  <div className="relative transform hover:scale-105 transition-transform duration-300">
                    <span className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-gray-300 to-gray-100 dark:from-gray-500 dark:to-gray-700 select-none filter drop-shadow-lg">
                      {book.bookName.charAt(0).toUpperCase()}
                    </span>
                    {/* 文字阴影效果 */}
                    <span className="absolute inset-0 text-8xl font-black text-gray-200 dark:text-[#242424] select-none blur-sm opacity-60 transform -translate-y-1 translate-x-1">
                      {book.bookName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                
                {/* 书籍信息 */}
                <div className="p-3 bg-white/90 dark:bg-[#1a1a1a] backdrop-blur-sm border-t dark:border-[#242424]">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">{book.bookName}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">{book.author}</p>
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-2">
                    <span>{book.totalChapters} 章</span>
                    <span className="mx-1">·</span>
                    <span>{book.wordCount} 字</span>
                  </div>
                </div>

                {/* 操作按钮 - 悬浮时显示 */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBatchTranscribe(book);
                    }}
                    className="p-1.5 rounded-full bg-white/80 dark:bg-[#1a1a1a]/90 text-gray-600 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400"
                    title="AI转写"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteBook(book);
                    }}
                    className="p-1.5 rounded-full bg-white/80 dark:bg-[#1a1a1a]/90 text-gray-600 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                    title="删除"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 对话框和提示 */}
      <AISettingsDialog
        isOpen={showAISettings}
        enabled={isAIEnabled}
        onClose={() => setShowAISettings(false)}
        onEnableChange={setIsAIEnabled}
      />
      
      <BatchTranscribeDialog
        isOpen={showBatchTranscribe}
        onClose={() => setShowBatchTranscribe(false)}
        onConfirm={handleConfirmBatchTranscribe}
        book={selectedBook as Book}
      />
      
      <DeleteConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        book={selectedBook as Book}
      />
      
      <ImportBookDialog
        isOpen={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        onImport={handleImportBook}
      />
      
      {toast.show && (
        <ToastMessage
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
    </main>
  )
} 