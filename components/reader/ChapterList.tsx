import { useCallback, useState, useEffect, useRef } from 'react'
import { useReaderStore } from '@/lib/store'
import Button from '@/components/ui/Button'
import type { Chapter } from '@/types'

// 扩展章节类型，兼容后端返回的带有蓝思值的章节数据
type ChapterWithLexile = {
  chapterId: string;
  chapterName: string;
  chapterOrder?: number;
  availableLexileScores?: number[];
  lexileScore?: number;
  bookId?: string;
  chapterContent?: string;
}

interface ChapterListProps {
  chapters: (Chapter | ChapterWithLexile)[]
  currentChapterId: string
  onChapterSelect: (chapterId: string) => void
  onClose: () => void
}

export default function ChapterList({
  chapters,
  currentChapterId,
  onChapterSelect,
  onClose,
}: ChapterListProps) {
  const isVisible = useReaderStore((state) => state.isChapterListVisible)
  const setChapterListVisible = useReaderStore((state) => state.setChapterListVisible)
  const setToolbarVisible = useReaderStore((state) => state.setToolbarVisible)
  const [searchTerm, setSearchTerm] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  
  // 当章节列表打开时，隐藏工具栏
  useEffect(() => {
    if (isVisible) {
      setToolbarVisible(false);
    }
  }, [isVisible, setToolbarVisible]);
  
  // 对章节进行排序，确保按照章节顺序显示
  const sortedChapters = [...chapters].sort((a, b) => {
    // 如果有 chapterOrder 属性，优先使用它排序
    if (a.chapterOrder !== undefined && b.chapterOrder !== undefined) {
      return a.chapterOrder - b.chapterOrder
    }
    
    // 尝试从章节名称中提取数字进行排序
    const aMatch = a.chapterName.match(/(\d+)/)
    const bMatch = b.chapterName.match(/(\d+)/)
    
    if (aMatch && bMatch) {
      return parseInt(aMatch[1]) - parseInt(bMatch[1])
    }
    
    // 默认按照章节名称字母顺序排序
    return a.chapterName.localeCompare(b.chapterName)
  })
  
  // 过滤章节
  const filteredChapters = sortedChapters.filter(chapter => 
    chapter.chapterName.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  // 当对话框打开时，自动滚动到当前章节
  useEffect(() => {
    if (isVisible && currentChapterId && listRef.current) {
      const currentChapterElement = document.getElementById(`chapter-${currentChapterId}`)
      if (currentChapterElement) {
        setTimeout(() => {
          currentChapterElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 100)
      }
    }
  }, [isVisible, currentChapterId])

  const handleChapterClick = useCallback(
    (chapterId: string) => {
      console.log('章节列表中点击章节:', chapterId, '当前章节:', currentChapterId)
      
      // 如果点击的是当前章节，只关闭目录
      if (chapterId === currentChapterId) {
        console.log('点击了当前章节，关闭目录')
        onClose()
        return
      }
      
      // 选择新章节
      console.log('选择新章节:', chapterId)
      onChapterSelect(chapterId)
      
      // 延迟关闭目录，给用户一点视觉反馈时间
      setTimeout(() => {
        onClose()
      }, 200)
    },
    [currentChapterId, onChapterSelect, onClose]
  )

  // 处理关闭按钮点击
  const handleClose = () => {
    setChapterListVisible(false)
    onClose()
  }

  return (
    <div 
      className={`chapter-list fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={(e) => {
        // 点击背景关闭目录
        if (e.target === e.currentTarget) {
          handleClose()
        }
      }}
    >
      <div className={`absolute right-0 top-0 bottom-0 w-80 bg-white dark:bg-[#1a1a1a] shadow-xl transition-transform ${
        isVisible ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">目录</h3>
            <button 
              onClick={handleClose} 
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <div className="relative">
              <input
                type="text"
                placeholder="搜索章节..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-[#252525] dark:text-white"
              />
              <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto scrollbar-hide" ref={listRef}>
            {filteredChapters.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                {searchTerm ? '没有找到匹配的章节' : '没有章节'}
              </div>
            ) : (
              <ul className="divide-y divide-gray-200 dark:divide-gray-800">
                {filteredChapters.map((chapter) => (
                  <li
                    key={chapter.chapterId}
                    id={`chapter-${chapter.chapterId}`}
                    className={`p-4 hover:bg-gray-100 dark:hover:bg-[#252525] cursor-pointer transition-colors duration-150 ${
                      chapter.chapterId === currentChapterId ? 'bg-primary-50 dark:bg-[#252525] font-medium' : ''
                    }`}
                    onClick={() => handleChapterClick(chapter.chapterId)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-900 dark:text-gray-100">{chapter.chapterName}</div>
                      {chapter.lexileScore && (
                        <span className="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 dark:bg-[#252525] dark:text-primary-300 rounded-full">
                          {chapter.lexileScore}L
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 