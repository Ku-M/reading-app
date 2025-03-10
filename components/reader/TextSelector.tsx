import { useState, useEffect, useCallback, useRef } from 'react'
import { useReaderStore } from '@/lib/store'
import { Tooltip } from "@heroui/react"
import type { HighlightStyle } from '@/types'

interface TextSelectorProps {
  bookId: string
  chapterId: string
}

interface TranslationResponse {
  errorCode: string;
  query: string;
  translation: string[];
  dict?: { url: string };
  webdict?: { url: string };
  l: string;
  tSpeakUrl?: string;
  speakUrl?: string;
  [key: string]: any;
}

export default function TextSelector({ bookId, chapterId }: TextSelectorProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [selectedText, setSelectedText] = useState('')
  const [selection, setSelection] = useState<Selection | null>(null)
  const setToolbarVisible = useReaderStore((state) => state.setToolbarVisible)
  
  // 翻译相关状态
  const [showTranslation, setShowTranslation] = useState(false)
  const [translationData, setTranslationData] = useState<TranslationResponse | null>(null)
  const [isTranslating, setIsTranslating] = useState(false)
  const [translationError, setTranslationError] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  
  // 移动端状态
  const [isMobile, setIsMobile] = useState(false)
  
  // 检测设备类型
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => {
      window.removeEventListener('resize', checkMobile)
    }
  }, [])

  // 处理文本选择事件
  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed) {
      return
    }

    const text = selection.toString().trim()
    if (!text) {
      return
    }

    // 获取选区位置
    const range = selection.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    
    // 当显示文本选择工具栏时，隐藏顶部导航栏
    setToolbarVisible(false)

    // 设置工具栏位置（在选区上方）
    // 在移动端上，确保工具栏在可视区域内
    const toolbarX = isMobile 
      ? Math.min(Math.max(rect.left + (rect.width / 2), 150), window.innerWidth - 150)
      : rect.left + (rect.width / 2)
    
    const toolbarY = isMobile
      ? Math.max(rect.top - 65, 70) // 确保在移动端上不会太靠近顶部
      : rect.top - 55
    
    setPosition({
      x: toolbarX,
      y: toolbarY
    })

    setSelectedText(text)
    setSelection(selection)
    setIsVisible(true)
    
    // 重置翻译状态
    setShowTranslation(false)
    setTranslationData(null)
    setIsTranslating(false)
    setTranslationError(false)
  }, [setToolbarVisible, isMobile])

  // 处理点击事件（关闭工具栏和翻译）
  const handleClickOutside = useCallback((e: MouseEvent) => {
    const toolbar = document.getElementById('text-selector-toolbar')
    const translationTooltip = document.getElementById('translation-tooltip')
    
    if (
      (!toolbar || !toolbar.contains(e.target as Node)) && 
      (!translationTooltip || !translationTooltip.contains(e.target as Node))
    ) {
      setIsVisible(false)
      setShowTranslation(false)
    }
  }, [])

  // 添加事件监听
  useEffect(() => {
    // 为移动设备启用文本选择
    if (isMobile) {
      // 使文本可选择
      document.body.style.userSelect = 'text';
      document.body.style.webkitUserSelect = 'text';
      // 使用正确的CSS属性
      (document.body.style as any).msUserSelect = 'text';
      (document.body.style as any).MozUserSelect = 'text';
      
      // 禁用默认的触摸行为
      document.addEventListener('touchstart', (e) => {
        // 允许默认行为继续，以便用户可以选择文本
      }, { passive: true });
    }
    
    // 使用mouseup事件处理文本选择
    const handleMouseUp = (e: MouseEvent) => {
      // 防止工具栏点击时关闭翻译
      const toolbar = document.getElementById('text-selector-toolbar');
      if (toolbar && toolbar.contains(e.target as Node)) {
        return;
      }
      
      setTimeout(() => {
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed && selection.toString().trim()) {
          handleTextSelection();
        }
      }, 10);
    };
    
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousedown', handleClickOutside);
    
    // 为移动设备添加触摸事件
    if (isMobile) {
      // 处理触摸结束事件，用于文本选择
      const handleTouchEnd = (e: TouchEvent) => {
        // 防止工具栏点击时关闭翻译
        const toolbar = document.getElementById('text-selector-toolbar');
        if (toolbar && toolbar.contains(e.target as Node)) {
          return;
        }
        
        setTimeout(() => {
          const selection = window.getSelection();
          if (selection && !selection.isCollapsed && selection.toString().trim()) {
            handleTextSelection();
          }
        }, 100);
      };
      
      // 处理触摸开始事件，用于关闭翻译
      const handleTouchStart = (e: TouchEvent) => {
        const toolbar = document.getElementById('text-selector-toolbar');
        const translationTooltip = document.getElementById('translation-tooltip');
        
        if (
          (!toolbar || !toolbar.contains(e.target as Node)) && 
          (!translationTooltip || !translationTooltip.contains(e.target as Node))
        ) {
          setIsVisible(false);
          setShowTranslation(false);
        }
      };
      
      document.addEventListener('touchend', handleTouchEnd);
      document.addEventListener('touchstart', handleTouchStart);
      
      return () => {
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchend', handleTouchEnd);
        document.removeEventListener('touchstart', handleTouchStart);
        
        // 恢复默认的文本选择行为
        document.body.style.userSelect = '';
        document.body.style.webkitUserSelect = '';
        // 使用正确的CSS属性
        (document.body.style as any).msUserSelect = '';
        (document.body.style as any).MozUserSelect = '';
      };
    }
    
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleTextSelection, handleClickOutside, isMobile]);

  // 复制文本
  const handleCopy = () => {
    navigator.clipboard.writeText(selectedText)
    if (!isMobile) {
      setIsVisible(false)
    }
  }

  // 添加高亮
  const handleHighlight = (style: HighlightStyle) => {
    if (!selection) return

    const range = selection.getRangeAt(0)
    const span = document.createElement('span')
    span.className = `highlight-${style}`
    span.dataset.bookId = bookId
    span.dataset.chapterId = chapterId
    span.dataset.style = style
    
    range.surroundContents(span)
    
    // 保存高亮到本地存储
    const highlights = JSON.parse(localStorage.getItem(`highlights-${bookId}-${chapterId}`) || '[]')
    highlights.push({
      text: selectedText,
      style,
      timestamp: new Date().toISOString()
    })
    localStorage.setItem(`highlights-${bookId}-${chapterId}`, JSON.stringify(highlights))

    if (!isMobile) {
      setIsVisible(false)
    }
  }
  
  // 播放原文发音
  const playOriginalAudio = (e: React.MouseEvent) => {
    e.stopPropagation(); // 防止点击事件冒泡
    
    if (!translationData?.speakUrl) return;
    
    if (!audioRef.current) {
      audioRef.current = new Audio(translationData.speakUrl);
    } else {
      audioRef.current.src = translationData.speakUrl;
    }
    
    audioRef.current.play().catch(err => {
      console.error('播放音频失败:', err);
    });
  };
  
  // 播放翻译发音
  const playTranslationAudio = (e: React.MouseEvent) => {
    e.stopPropagation(); // 防止点击事件冒泡
    
    if (!translationData?.tSpeakUrl) return;
    
    if (!audioRef.current) {
      audioRef.current = new Audio(translationData.tSpeakUrl);
    } else {
      audioRef.current.src = translationData.tSpeakUrl;
    }
    
    audioRef.current.play().catch(err => {
      console.error('播放音频失败:', err);
    });
  };
  
  // 翻译选中文本
  const handleTranslate = async (e: React.MouseEvent) => {
    e.stopPropagation(); // 防止点击事件冒泡，避免工具栏点击时关闭翻译
    
    if (isTranslating) return
    
    setIsTranslating(true)
    setTranslationError(false)
    setShowTranslation(true)
    
    try {
      // 使用 Next.js API 路由
      const response = await fetch(`/api/translate?text=${encodeURIComponent(selectedText)}&type=text`)
      
      if (!response.ok) {
        throw new Error('翻译请求失败')
      }
      
      const data = await response.json()
      
      if (data.errorCode === "0") {
        setTranslationData(data)
      } else {
        throw new Error(data.message || '翻译失败')
      }
    } catch (error) {
      console.error('翻译出错:', error)
      setTranslationError(true)
    } finally {
      setIsTranslating(false)
    }
  }

  // 关闭翻译和工具栏
  const handleClose = () => {
    setIsVisible(false)
    setShowTranslation(false)
  }

  if (!isVisible && !showTranslation) return null

  // 计算翻译弹窗位置，确保在移动端上正确显示
  const translationPosition = {
    left: position.x,
    top: isMobile 
      ? Math.min(position.y + 60, window.innerHeight - 200) // 确保在移动端上不会超出屏幕底部
      : position.y + 60
  }

  return (
    <>
      {isVisible && (
        <div
          id="text-selector-toolbar"
          className="fixed z-[60] transform -translate-x-1/2"
          style={{
            left: position.x,
            top: position.y
          }}
        >
          <div className={`bg-white/90 dark:bg-[#1a1a1a]/95 backdrop-blur-md rounded-full shadow-lg border border-gray-200 dark:border-gray-800 flex items-center h-12 px-2 ${isMobile ? 'flex-wrap justify-center' : ''}`}>
            <button
              className="flex flex-col items-center justify-center w-16 h-12 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#252525] rounded-full transition-colors group mx-1"
              onClick={handleCopy}
              aria-label="复制文本"
            >
              <svg className="w-5 h-5 mb-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              <span className="text-[10px] text-gray-600 dark:text-gray-400">复制</span>
            </button>

            <button
              className="flex flex-col items-center justify-center w-16 h-12 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#252525] rounded-full transition-colors group mx-1"
              onClick={() => handleHighlight('background')}
              aria-label="马克笔高亮"
            >
              <svg className="w-5 h-5 mb-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              <span className="text-[10px] text-gray-600 dark:text-gray-400">马克笔</span>
            </button>

            <button
              className="flex flex-col items-center justify-center w-16 h-12 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#252525] rounded-full transition-colors group mx-1"
              onClick={() => handleHighlight('wave')}
              aria-label="波浪线高亮"
            >
              <svg className="w-5 h-5 mb-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-[10px] text-gray-600 dark:text-gray-400">波浪线</span>
            </button>

            <button
              className="flex flex-col items-center justify-center w-16 h-12 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#252525] rounded-full transition-colors group mx-1"
              onClick={() => handleHighlight('underline')}
              aria-label="直线高亮"
            >
              <svg className="w-5 h-5 mb-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12h16M4 18h16" />
              </svg>
              <span className="text-[10px] text-gray-600 dark:text-gray-400">直线</span>
            </button>
            
            <button
              className="flex flex-col items-center justify-center w-16 h-12 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#252525] rounded-full transition-colors group mx-1"
              onClick={handleTranslate}
              aria-label="翻译文本"
            >
              <svg className="w-5 h-5 mb-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              <span className="text-[10px] text-gray-600 dark:text-gray-400">翻译</span>
            </button>
            
            {isMobile && (
              <button
                className="flex flex-col items-center justify-center w-16 h-12 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#252525] rounded-full transition-colors group mx-1"
                onClick={handleClose}
                aria-label="关闭"
              >
                <svg className="w-5 h-5 mb-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="text-[10px] text-gray-600 dark:text-gray-400">关闭</span>
              </button>
            )}
          </div>
        </div>
      )}
      
      {showTranslation && (
        <div
          id="translation-tooltip"
          className="fixed z-[70] transform -translate-x-1/2"
          style={{
            left: translationPosition.left,
            top: translationPosition.top,
            maxWidth: isMobile ? 'calc(100vw - 40px)' : '400px'
          }}
          onClick={(e) => e.stopPropagation()} // 防止点击翻译界面时关闭它
        >
          <div className="bg-white dark:bg-[#1a1a1a] rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 p-4 w-full">
            <div className="mb-2">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">翻译结果</h3>
            </div>
            
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
              <div className="break-words max-w-[calc(100%-30px)]">{selectedText}</div>
              {translationData?.speakUrl && (
                <button 
                  onClick={playOriginalAudio}
                  className="text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 ml-3 flex-shrink-0"
                  aria-label="播放原文发音"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                </button>
              )}
            </div>
            
            <div className="border-t border-gray-200 dark:border-gray-800 pt-2">
              {isTranslating ? (
                <div className="flex items-center justify-center py-4">
                  <div className="w-5 h-5 border-2 border-t-transparent border-primary-500 rounded-full animate-spin"></div>
                  <span className="ml-2 text-sm">翻译中...</span>
                </div>
              ) : translationError ? (
                <div className="text-sm text-red-500 py-2">翻译失败，请重试</div>
              ) : translationData ? (
                <div className="flex items-center justify-between">
                  <div className="text-sm dark:text-gray-300 break-words max-w-[calc(100%-30px)]">
                    {translationData.translation && translationData.translation.length > 0 && (
                      <span>{translationData.translation[0]}</span>
                    )}
                  </div>
                  {translationData.tSpeakUrl && (
                    <button 
                      onClick={playTranslationAudio}
                      className="text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 ml-3 flex-shrink-0"
                      aria-label="播放翻译发音"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      </svg>
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-sm dark:text-gray-300 py-2">正在加载翻译...</div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
} 