import React, { useEffect, useRef, useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from 'react-query'
import { useReaderStore } from '@/lib/store'
import { fetchBook, fetchChapters, fetchChapter, fetchChaptersWithLexileScores } from '@/lib/api'
import Toolbar from './Toolbar'
import ChapterList from './ChapterList'
import SettingsDialog from './SettingsDialog'
import AISettingsDialog from './AISettingsDialog'
import TextSelector from './TextSelector'
import SideNavigation from './SideNavigation'
import WordTranslator from './WordTranslator'
import type { Book, Chapter, Highlight } from '@/types'

interface ReaderProps {
  bookId: string
  initialChapterId: string
}

export default function Reader({ bookId, initialChapterId }: ReaderProps) {
  const router = useRouter()
  const contentRef = useRef<HTMLDivElement>(null)
  const lastScrollPosition = useRef(0)

  // 状态管理
  const settings = useReaderStore((state) => state.settings)
  const isToolbarVisible = useReaderStore((state) => state.isToolbarVisible)
  const setToolbarVisible = useReaderStore((state) => state.setToolbarVisible)
  const setSettingsDialogVisible = useReaderStore((state) => state.setSettingsDialogVisible)
  const setChapterListVisible = useReaderStore((state) => state.setChapterListVisible)
  const readingProgress = useReaderStore((state) => state.readingProgress[bookId])
  const updateReadingProgress = useReaderStore((state) => state.updateReadingProgress)
  const aiSettings = useReaderStore((state) => state.aiSettings)

  // 本地状态
  const [currentChapterId, setCurrentChapterId] = useState<string>(initialChapterId)
  const [targetChapterId, setTargetChapterId] = useState<string>(initialChapterId)
  const [isAISettingsVisible, setIsAISettingsVisible] = useState(false)
  const [readingPercentage, setReadingPercentage] = useState(0)
  const [isManualChange, setIsManualChange] = useState(false)
  
  // 监听主题变化
  useEffect(() => {
    document.documentElement.classList.toggle('dark', settings.theme === 'dark')
  }, [settings.theme])

  // 获取书籍信息
  const { data: book } = useQuery<Book>(
    ['book', bookId],
    () => fetchBook(bookId),
    { enabled: !!bookId, staleTime: Infinity }
  )

  // 获取章节列表（带蓝思值）
  const { data: chaptersWithLexileData } = useQuery(
    ['chaptersWithLexile', bookId],
    () => fetchChaptersWithLexileScores(bookId),
    { enabled: !!bookId, staleTime: 60000 } // 1分钟缓存
  )

  // 保留原有的章节列表查询，以保持兼容性
  const { data: chaptersData } = useQuery(
    ['chapters', bookId],
    () => fetchChapters(bookId),
    { enabled: !!bookId && !chaptersWithLexileData, staleTime: Infinity }
  )

  // 获取当前章节内容
  const { 
    data: currentChapter,
    isLoading: isLoadingChapter,
    error: chapterError,
    refetch: refetchChapter
  } = useQuery<Chapter>(
    ['chapter', targetChapterId, aiSettings.enabled],
    async () => {
      console.log('开始加载目标章节:', targetChapterId)
      
      if (!targetChapterId) {
        throw new Error('无效的章节ID')
      }

      try {
        const chapter = await fetchChapter(
          targetChapterId,
          aiSettings.enabled,
          aiSettings.enabled ? aiSettings.lexileScore : undefined,
          aiSettings.priorityWords.length > 0 ? aiSettings.priorityWords.join(',') : undefined
        )
        
        console.log('章节加载成功:', chapter.chapterName)
        // 章节加载成功后，更新当前章节ID
        setCurrentChapterId(targetChapterId)
        return chapter
      } catch (error) {
        console.error('章节加载失败:', error)
        throw error
      }
    },
    {
      enabled: !!targetChapterId,
      retry: 2,
      staleTime: 0,
      cacheTime: 0,
      refetchOnWindowFocus: false,
      onSuccess: (data) => {
        console.log('章节内容已更新:', data.chapterName)
        if (contentRef.current) {
          contentRef.current.scrollTop = 0
        }
        setReadingPercentage(0)
        setIsManualChange(false)
        
        // 章节切换成功后再次确认更新阅读进度
        console.log('章节加载成功，再次确认更新阅读进度:', data.chapterId)
        updateReadingProgress({
          bookId,
          chapterId: data.chapterId,
          pageIndex: 0,
          percentage: 0,
          lastRead: new Date().toISOString(),
        })
      },
      onError: (error) => {
        console.error('加载章节失败:', error)
        setIsManualChange(false)
      }
    }
  )

  // 处理章节切换
  const handleChapterSelect = useCallback(async (chapterId: string) => {
    console.log('准备切换到章节:', chapterId)
    
    if (chapterId === targetChapterId) {
      console.log('已经是目标章节，无需切换')
      return
    }

    try {
      // 更新目标章节ID，这会触发新的章节内容请求
      setTargetChapterId(chapterId)
      
      // 直接更新阅读进度，确保记录当前章节
      console.log('立即更新阅读进度，章节ID:', chapterId)
      updateReadingProgress({
        bookId,
        chapterId: chapterId,
        pageIndex: 0,
        percentage: 0,
        lastRead: new Date().toISOString(),
      })
      
      // 更新URL，但不触发导航
      window.history.replaceState(
        { chapterId },
        '',
        `/books/${bookId}?chapter=${chapterId}`
      )
      console.log('目标章节已更新，等待加载新内容')
    } catch (error) {
      console.error('切换章节失败:', error)
    }
  }, [bookId, targetChapterId, updateReadingProgress])

  // 在组件加载时从URL获取章节ID
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const chapterId = params.get('chapter')
    if (chapterId && chapterId !== targetChapterId) {
      setTargetChapterId(chapterId)
    }
  }, [targetChapterId])

  // 调试：打印当前阅读进度
  useEffect(() => {
    console.log('当前阅读进度状态:', {
      bookId,
      readingProgress,
      currentChapterId,
      targetChapterId,
      storeState: useReaderStore.getState().readingProgress
    })
  }, [bookId, readingProgress, currentChapterId, targetChapterId])

  // 处理章节内容分页
  useEffect(() => {
    if (currentChapter?.chapterContent) {
      // 重置滚动位置
      if (contentRef.current) {
        contentRef.current.scrollTop = 0;
      }
    }
  }, [currentChapter]);

  // 处理上一章/下一章导航
  const handlePrevChapter = useCallback(() => {
    if (!chaptersData?.content || !currentChapter) return;
    
    // 按章节顺序排序
    const sortedChapters = [...chaptersData.content].sort((a, b) => {
      if (a.chapterOrder !== undefined && b.chapterOrder !== undefined) {
        return a.chapterOrder - b.chapterOrder;
      }
      
      // 尝试从章节名称中提取数字进行排序
      const aMatch = a.chapterName.match(/(\d+)/);
      const bMatch = b.chapterName.match(/(\d+)/);
      
      if (aMatch && bMatch) {
        return parseInt(aMatch[1]) - parseInt(bMatch[1]);
      }
      
      // 默认按照章节名称字母顺序排序
      return a.chapterName.localeCompare(b.chapterName);
    });
    
    const currentIndex = sortedChapters.findIndex(
      ch => ch.chapterId === currentChapter.chapterId
    );
    
    if (currentIndex > 0) {
      const prevChapter = sortedChapters[currentIndex - 1];
      console.log('切换到上一章:', prevChapter.chapterName);
      handleChapterSelect(prevChapter.chapterId);
    }
  }, [chaptersData, currentChapter, handleChapterSelect]);

  const handleNextChapter = useCallback(() => {
    if (!chaptersData?.content || !currentChapter) return;
    
    // 按章节顺序排序
    const sortedChapters = [...chaptersData.content].sort((a, b) => {
      if (a.chapterOrder !== undefined && b.chapterOrder !== undefined) {
        return a.chapterOrder - b.chapterOrder;
      }
      
      // 尝试从章节名称中提取数字进行排序
      const aMatch = a.chapterName.match(/(\d+)/);
      const bMatch = b.chapterName.match(/(\d+)/);
      
      if (aMatch && bMatch) {
        return parseInt(aMatch[1]) - parseInt(bMatch[1]);
      }
      
      // 默认按照章节名称字母顺序排序
      return a.chapterName.localeCompare(b.chapterName);
    });
    
    const currentIndex = sortedChapters.findIndex(
      ch => ch.chapterId === currentChapter.chapterId
    );
    
    if (currentIndex < sortedChapters.length - 1) {
      const nextChapter = sortedChapters[currentIndex + 1];
      console.log('切换到下一章:', nextChapter.chapterName);
      handleChapterSelect(nextChapter.chapterId);
    }
  }, [chaptersData, currentChapter, handleChapterSelect]);

  // 处理滚动事件
  const handleScroll = useCallback(() => {
    if (!contentRef.current) return

    const { scrollTop, scrollHeight, clientHeight } = contentRef.current
    const percentage = scrollTop / (scrollHeight - clientHeight)
    const newPercentage = Math.min(Math.max(percentage, 0), 1)
    
    setReadingPercentage(newPercentage)

    // 自动隐藏/显示工具栏
    if (scrollTop > lastScrollPosition.current + 50) {
      setToolbarVisible(false)
      lastScrollPosition.current = scrollTop
    } else if (scrollTop < lastScrollPosition.current - 50) {
      setToolbarVisible(true)
      lastScrollPosition.current = scrollTop
    }
  }, [setToolbarVisible])

  // 添加滚动事件监听
  useEffect(() => {
    const contentElement = contentRef.current
    if (contentElement) {
      contentElement.addEventListener('scroll', handleScroll)
      return () => {
        contentElement.removeEventListener('scroll', handleScroll)
      }
    }
  }, [handleScroll])

  // 更新阅读进度
  useEffect(() => {
    if (book && currentChapter && readingPercentage > 0) {
      updateReadingProgress({
        bookId,
        chapterId: currentChapter.chapterId,
        pageIndex: 0,
        percentage: readingPercentage,
        lastRead: new Date().toISOString(),
      })
    }
  }, [book, currentChapter, readingPercentage, bookId, updateReadingProgress])

  // 恢复阅读进度
  useEffect(() => {
    if (contentRef.current && readingProgress && currentChapter && 
        readingProgress.chapterId === currentChapter.chapterId) {
      const { scrollHeight, clientHeight } = contentRef.current
      const scrollPosition = readingProgress.percentage * (scrollHeight - clientHeight)
      contentRef.current.scrollTop = scrollPosition
      lastScrollPosition.current = scrollPosition
    }
  }, [currentChapter, readingProgress])

  // 恢复高亮
  useEffect(() => {
    if (contentRef.current && currentChapter) {
      try {
        const highlights = JSON.parse(
          localStorage.getItem(`highlights-${bookId}-${currentChapter.chapterId}`) || '[]'
        ) as Highlight[]

        // 清除现有高亮
        contentRef.current.querySelectorAll('[data-book-id]').forEach(el => {
          const parent = el.parentNode
          if (parent) {
            parent.replaceChild(document.createTextNode(el.textContent || ''), el)
          }
        })

        // 重新应用高亮
        const paragraphs = contentRef.current.querySelectorAll('p')
        highlights.forEach(highlight => {
          paragraphs.forEach(paragraph => {
            const paragraphText = paragraph.textContent || ''
            const index = paragraphText.indexOf(highlight.text)
            
            if (index !== -1) {
              try {
                const range = document.createRange()
                const startNode = paragraph.firstChild
                
                if (startNode) {
                  range.setStart(startNode, index)
                  range.setEnd(startNode, index + highlight.text.length)
                  
                  const span = document.createElement('span')
                  span.className = `highlight-${highlight.style}`
                  span.dataset.bookId = bookId
                  span.dataset.chapterId = currentChapter.chapterId
                  span.dataset.style = highlight.style
                  
                  range.surroundContents(span)
                }
              } catch (rangeError) {
                console.error('恢复高亮失败（单个段落）:', rangeError)
              }
            }
          })
        })
      } catch (error) {
        console.error('恢复高亮失败:', error)
      }
    }
  }, [bookId, currentChapter])

  // 处理工具栏事件
  const handleClick = useCallback(() => {
    setToolbarVisible(!isToolbarVisible)
  }, [isToolbarVisible, setToolbarVisible])

  const handleToggleAI = useCallback(() => {
    setIsAISettingsVisible(true)
  }, [])

  // 渲染加载状态
  if (!book || !chaptersData) {
    return <div className="flex items-center justify-center h-screen">加载中...</div>
  }

  if (isLoadingChapter) {
    return <div className="flex items-center justify-center h-screen">正在加载章节内容...</div>
  }

  if (chapterError) {
    return (
      <div className="flex items-center justify-center h-screen flex-col">
        <div className="text-red-500 mb-4">加载章节内容失败</div>
        <button 
          className="px-4 py-2 bg-primary-500 text-white rounded-md"
          onClick={() => refetchChapter()}
        >
          重试
        </button>
      </div>
    )
  }

  if (!currentChapter) {
    return (
      <div className="flex items-center justify-center h-screen flex-col">
        <div className="text-red-500 mb-4">章节不存在</div>
        {chaptersData.content.length > 0 && (
          <button 
            className="px-4 py-2 bg-primary-500 text-white rounded-md"
            onClick={() => handleChapterSelect(chaptersData.content[0].chapterId)}
          >
            加载第一章
          </button>
        )}
      </div>
    )
  }

  // 格式化章节内容，识别单词并添加翻译功能
  const formattedContent = currentChapter?.chapterContent
    ? currentChapter.chapterContent
        .split('\n')
        .filter(Boolean)
        .map((paragraph, paragraphIndex) => {
          // 使用正则表达式匹配英文单词
          // 匹配独立的英文单词（前后有空格或标点符号）
          const regex = /\b([a-zA-Z]+)\b/g;
          let lastIndex = 0;
          const parts = [];
          let match;
          
          // 遍历所有匹配的英文单词
          while ((match = regex.exec(paragraph)) !== null) {
            // 添加单词前的文本
            if (match.index > lastIndex) {
              parts.push(paragraph.substring(lastIndex, match.index));
            }
            
            // 添加带翻译功能的单词
            parts.push(
              <WordTranslator key={`${paragraphIndex}-${match.index}`} word={match[0]} />
            );
            
            lastIndex = match.index + match[0].length;
          }
          
          // 添加最后一个单词后的文本
          if (lastIndex < paragraph.length) {
            parts.push(paragraph.substring(lastIndex));
          }
          
          return <p key={paragraphIndex} className="mb-4">{parts}</p>;
        })
    : [];

  // 获取当前章节索引和总章节数
  const sortedChapters = chaptersData?.content 
    ? [...chaptersData.content].sort((a, b) => {
        if (a.chapterOrder !== undefined && b.chapterOrder !== undefined) {
          return a.chapterOrder - b.chapterOrder;
        }
        
        // 尝试从章节名称中提取数字进行排序
        const aMatch = a.chapterName.match(/(\d+)/);
        const bMatch = b.chapterName.match(/(\d+)/);
        
        if (aMatch && bMatch) {
          return parseInt(aMatch[1]) - parseInt(bMatch[1]);
        }
        
        // 默认按照章节名称字母顺序排序
        return a.chapterName.localeCompare(b.chapterName);
      })
    : [];
    
  const currentChapterIndex = sortedChapters.findIndex(ch => ch.chapterId === currentChapter?.chapterId);
  const hasPrevChapter = currentChapterIndex > 0;
  const hasNextChapter = currentChapterIndex < sortedChapters.length - 1;
  const currentChapterNumber = currentChapterIndex + 1;
  const totalChapters = sortedChapters.length;

  return (
    <div className="relative h-screen bg-white dark:bg-dark-100 flex flex-col">
      <Toolbar
        title={`${book?.bookName || ''} - ${currentChapter?.chapterName || ''}`}
        onBack={() => router.back()}
        onOpenChapterList={() => setChapterListVisible(true)}
        onOpenSettings={() => setSettingsDialogVisible(true)}
        onToggleAI={handleToggleAI}
      />

      <div 
        ref={contentRef}
        className="flex-1 overflow-y-auto px-4 md:px-0"
        onClick={handleClick}
      >
        <div className="max-w-3xl mx-auto py-8">
          <h1 className="text-2xl font-bold mb-6 text-center">{currentChapter?.chapterName}</h1>
          
          <div
            className="reader-content"
            style={{
              fontSize: `${settings.fontSize}px`,
              fontFamily: settings.fontFamily,
              lineHeight: settings.lineHeight,
              letterSpacing: `${settings.letterSpacing}px`,
            }}
          >
            {formattedContent.length > 0 ? (
              formattedContent
            ) : (
              <div className="text-center py-12 text-gray-500">
                章节内容为空
              </div>
            )}
          </div>

          {/* 章节导航 */}
          <div className="mt-12 pt-6 border-t dark:border-dark-300 flex flex-col items-center">
            <div className="flex space-x-4 justify-center">
              {hasPrevChapter && (
                <button 
                  className="px-6 py-3 bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-100 rounded-md hover:bg-primary-200 dark:hover:bg-primary-900/30 transition-colors"
                  onClick={handlePrevChapter}
                >
                  上一章
                </button>
              )}
              
              {hasNextChapter && (
                <button 
                  className="px-6 py-3 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
                  onClick={handleNextChapter}
                >
                  下一章
                </button>
              )}
            </div>
            
            <button 
              className="mt-4 text-primary-500 dark:text-primary-400 hover:underline"
              onClick={() => setChapterListVisible(true)}
            >
              查看目录
            </button>
          </div>
        </div>
      </div>

      {/* 侧边导航 */}
      <SideNavigation
        onPrevChapter={handlePrevChapter}
        onNextChapter={handleNextChapter}
        onOpenChapterList={() => setChapterListVisible(true)}
        onOpenSettings={() => setSettingsDialogVisible(true)}
        hasPrevChapter={hasPrevChapter}
        hasNextChapter={hasNextChapter}
        currentChapter={currentChapterNumber}
        totalChapters={totalChapters}
      />

      <TextSelector
        bookId={bookId}
        chapterId={currentChapter?.chapterId || ''}
      />

      <ChapterList
        chapters={chaptersWithLexileData?.content || chaptersData?.content || []}
        currentChapterId={currentChapterId}
        onChapterSelect={handleChapterSelect}
        onClose={() => setChapterListVisible(false)}
      />

      <SettingsDialog onClose={() => setSettingsDialogVisible(false)} />
      
      <AISettingsDialog 
        isOpen={isAISettingsVisible}
        enabled={aiSettings.enabled}
        onEnableChange={(enabled) => {
          useReaderStore.getState().updateAISettings({
            ...aiSettings,
            enabled
          })
        }}
        onClose={() => setIsAISettingsVisible(false)} 
      />
    </div>
  )
} 