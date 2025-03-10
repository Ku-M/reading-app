import { useState, useEffect } from 'react'
import { useReaderStore } from '@/lib/store'
import type { Book } from '@/types'

interface BatchTranscribeDialogProps {
  isOpen: boolean
  book: Book
  onClose: () => void
  onConfirm: (startChapter: number, endChapter: number) => void
}

export default function BatchTranscribeDialog({
  isOpen,
  book,
  onClose,
  onConfirm
}: BatchTranscribeDialogProps) {
  const [startChapter, setStartChapter] = useState(1)
  const [endChapter, setEndChapter] = useState(book?.totalChapters || 1)
  const [isLoading, setIsLoading] = useState(false)
  const aiSettings = useReaderStore((state) => state.aiSettings)

  // 当书籍变化时更新结束章节
  useEffect(() => {
    if (book) {
      setEndChapter(book.totalChapters)
    }
  }, [book])

  if (!isOpen || !book) return null

  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value)
    if (value >= 1 && value <= book.totalChapters) {
      setStartChapter(value)
      // 如果开始章节大于结束章节，则更新结束章节
      if (value > endChapter) {
        setEndChapter(value)
      }
    }
  }

  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value)
    if (value >= startChapter && value <= book.totalChapters) {
      setEndChapter(value)
    }
  }

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      await onConfirm(startChapter, endChapter)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium">批量转写设置</h3>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            disabled={isLoading}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">书籍名称</label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-md bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 cursor-not-allowed"
              value={book.bookName}
              disabled
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">总章节数</label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-md bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 cursor-not-allowed"
              value={book.totalChapters}
              disabled
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">批量范围</label>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">开始章节</label>
                <input
                  type="number"
                  min={1}
                  max={book.totalChapters}
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                  value={startChapter}
                  onChange={handleStartChange}
                  disabled={isLoading}
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">结束章节</label>
                <input
                  type="number"
                  min={startChapter}
                  max={book.totalChapters}
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                  value={endChapter}
                  onChange={handleEndChange}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>
          
          <div className="pt-2">
            <div className="flex items-center justify-between text-sm">
              <span>当前蓝思值</span>
              <span>{aiSettings.lexileScore}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span>预计消耗积分</span>
              <span>{(endChapter - startChapter + 1) * 5} 积分</span>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end p-4 border-t border-gray-200 dark:border-gray-700">
          <button 
            className="px-4 py-2 mr-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
            onClick={onClose}
            disabled={isLoading}
          >
            取消
          </button>
          <button 
            className={`px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                处理中...
              </>
            ) : (
              '开始转写'
            )}
          </button>
        </div>
      </div>
    </div>
  )
} 