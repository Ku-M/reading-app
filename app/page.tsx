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
  ) || []

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
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <header className="bg-white dark:bg-gray-800 shadow-sm text-gray-800 dark:text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">微阅读</h1>
          <div className="flex items-center space-x-4">
            {/* 模式切换和 AI 转写开关 */}
            <div className="flex items-center space-x-4 bg-gray-100 dark:bg-gray-700 p-1 rounded-full">
              {/* 暗黑/亮色模式切换 */}
              <button 
                onClick={toggleDarkMode}
                className={`p-2 rounded-full ${isDarkMode ? 'text-gray-400' : 'bg-white text-gray-800 shadow'}`}
                aria-label="亮色模式"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd"></path>
                </svg>
              </button>
              <button 
                onClick={toggleDarkMode}
                className={`p-2 rounded-full ${isDarkMode ? 'bg-gray-800 text-white shadow' : 'text-gray-400'}`}
                aria-label="暗黑模式"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
                </svg>
              </button>
            </div>
            
            {/* AI转写按钮 */}
            <button 
              onClick={() => setShowAISettings(true)}
              className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-sm">AI转写设置</span>
            </button>
            
            <UserDropdown />
          </div>
        </div>
      </header>

      <div className="container mx-auto p-4 flex-1">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">我的书架</h2>
          
          {/* 工具栏：搜索框和导入按钮 */}
          <div className="flex items-center mb-4 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="搜索书籍..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-md focus:outline-none dark:bg-gray-800 dark:text-white"
              />
              <svg
                className="absolute left-3 top-2.5 w-5 h-5 text-gray-400 dark:text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            
            <button
              onClick={() => setShowImportDialog(true)}
              className="ml-2 flex items-center px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              <svg
                className="w-5 h-5 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              导入书籍
            </button>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-lg text-red-500">加载失败，请重试</div>
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
              <svg className="w-16 h-16 text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchQuery ? '没有找到匹配的书籍' : '书架上还没有书籍'}
              </p>
              <button
                onClick={() => setShowImportDialog(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                导入书籍
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {filteredBooks.map((book) => (
                <div
                  key={book.bookId}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden flex flex-col transition-transform hover:scale-105 cursor-pointer"
                >
                  <div
                    className="h-48 bg-gray-200 dark:bg-gray-700 relative"
                    onClick={() => handleBookClick(book)}
                  >
                    {book.coverUrl ? (
                      <img
                        src={book.coverUrl}
                        alt={book.bookName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center ${
                        isDarkMode 
                          ? 'bg-gradient-to-br from-gray-700 to-gray-900' 
                          : 'bg-gradient-to-br from-blue-400 to-purple-500'
                      }`}>
                        <span className="text-4xl font-bold text-white">
                          {book.bookName.substring(0, 2)}
                        </span>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                      <div className="text-white text-sm">
                        已读 {Math.round(book.readProgress * 100)}%
                      </div>
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <h3
                      className="text-lg font-semibold mb-1 text-gray-800 dark:text-white line-clamp-1"
                      onClick={() => handleBookClick(book)}
                    >
                      {book.bookName}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {book.author || '未知作者'}
                    </p>
                    <div className="mt-auto flex justify-between">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleBatchTranscribe(book)
                        }}
                        className="text-xs px-2 py-1 bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300 rounded"
                      >
                        AI转写
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteBook(book)
                        }}
                        className="text-xs px-2 py-1 bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300 rounded"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 页脚版权信息 */}
      <footer className="py-6 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                © 2024 微阅读. All rights reserved.
              </span>
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500">
              Powered by Next.js & React | 浙ICP备XXXXXXXX号-1
            </div>
          </div>
        </div>
      </footer>

      {/* AI设置对话框 */}
      <AISettingsDialog
        isOpen={showAISettings}
        enabled={isAIEnabled}
        onClose={() => setShowAISettings(false)}
        onEnableChange={setIsAIEnabled}
      />

      {/* 批量转写对话框 */}
      {selectedBook && (
        <BatchTranscribeDialog
          isOpen={showBatchTranscribe}
          book={selectedBook}
          onClose={() => setShowBatchTranscribe(false)}
          onConfirm={handleConfirmBatchTranscribe}
        />
      )}

      {/* 删除确认对话框 */}
      {selectedBook && (
        <DeleteConfirmDialog
          isOpen={showDeleteConfirm}
          book={selectedBook}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={handleConfirmDelete}
        />
      )}
      
      {/* 导入书籍对话框 */}
      <ImportBookDialog
        isOpen={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        onImport={handleImportBook}
      />

      {/* Toast 通知 */}
      {toast.show && (
        <ToastMessage
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(prev => ({ ...prev, show: false }))}
        />
      )}
    </main>
  )
} 