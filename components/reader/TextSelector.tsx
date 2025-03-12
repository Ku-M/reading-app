import { useState, useEffect, useCallback, useRef } from 'react'
import { useReaderStore } from '@/lib/store'
import { Tooltip } from "@heroui/react"
import type { HighlightStyle } from '@/types'
import { translateText } from '@/lib/api'

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

interface TranslationResult {
  errorCode: string;
  query: string;
  translation: any[];
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
  const [showWordTranslation, setShowWordTranslation] = useState(false)
  const [translationData, setTranslationData] = useState<TranslationResult | null>(null)
  const [isTranslating, setIsTranslating] = useState(false)
  const [translationError, setTranslationError] = useState(false)
  const [wordToTranslate, setWordToTranslate] = useState('')
  const audioRef = useRef<HTMLAudioElement | null>(null)
  
  // 移动端状态
  const [isMobile, setIsMobile] = useState(false)
  const [isTouching, setIsTouching] = useState(false)
  const touchStartRef = useRef<{x: number, y: number, target: Element | null} | null>(null)
  const [touchSelection, setTouchSelection] = useState<{start: number, end: number} | null>(null)
  
  // Refs
  const toolbarRef = useRef<HTMLDivElement>(null)
  const translationRef = useRef<HTMLDivElement>(null)
  
  // 获取所有文本节点
  const getAllTextNodes = useCallback((element: Element): Text[] => {
    const textNodes: Text[] = [];
    const walk = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null
    );
    
    let node: Text | null;
    while (node = walk.nextNode() as Text) {
      if (node.textContent?.trim()) {
        textNodes.push(node);
      }
    }
    return textNodes;
  }, []);

  // 获取触摸位置对应的文本节点和偏移量
  const getTouchPosition = useCallback((x: number, y: number) => {
    const range = document.caretRangeFromPoint(x, y);
    if (!range) return null;
    return {
      node: range.startContainer,
      offset: range.startOffset
    };
  }, []);

  // 创建文本选择范围
  const createSelectionFromTouch = useCallback((startNode: Node, startOffset: number, endNode: Node, endOffset: number) => {
    const range = document.createRange();
    range.setStart(startNode, startOffset);
    range.setEnd(endNode, endOffset);
    
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
      return selection;
    }
    return null;
  }, []);

  // 处理文本选择事件
  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed) {
      return
    }

    // 检查选择的文本是否在阅读区域内
    const selectedElement = selection.anchorNode?.parentElement;
    const readerContent = document.querySelector('.reader-content');
    
    if (!readerContent || !selectedElement || !readerContent.contains(selectedElement)) {
      return;
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
  const handleClickOutside = useCallback((e: MouseEvent | TouchEvent) => {
    const toolbar = document.getElementById('text-selector-toolbar')
    const translationTooltip = document.getElementById('translation-tooltip')
    
    if (
      (!toolbar || !toolbar.contains(e.target as Node)) && 
      (!translationTooltip || !translationTooltip.contains(e.target as Node))
    ) {
      setIsVisible(false)
      setShowWordTranslation(false)
    }
  }, [])

  // 处理触摸开始事件
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    const position = getTouchPosition(touch.clientX, touch.clientY);
    if (!position) return;
    
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      target: e.target as Element
    };
    setIsTouching(true);
    setTouchSelection(null);
  }, [getTouchPosition]);

  // 处理触摸移动事件
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!touchStartRef.current || !isTouching || e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    const startPos = getTouchPosition(touchStartRef.current.x, touchStartRef.current.y);
    const currentPos = getTouchPosition(touch.clientX, touch.clientY);
    
    if (!startPos || !currentPos) return;
    
    // 创建选区
    const selection = createSelectionFromTouch(
      startPos.node,
      startPos.offset,
      currentPos.node,
      currentPos.offset
    );
    
    if (selection) {
      handleTextSelection();
    }
  }, [isTouching, getTouchPosition, createSelectionFromTouch, handleTextSelection]);

  // 处理触摸结束事件
  const handleTouchEnd = useCallback((e: TouchEvent) => {
    setIsTouching(false);
    
    // 防止工具栏点击时关闭翻译
    const toolbar = document.getElementById('text-selector-toolbar');
    const translationTooltip = document.getElementById('translation-tooltip');
    
    if (
      (toolbar && toolbar.contains(e.target as Node)) || 
      (translationTooltip && translationTooltip.contains(e.target as Node))
    ) {
      return;
    }
    
    // 处理文本选择
    setTimeout(() => {
      const selection = window.getSelection();
      if (selection && !selection.isCollapsed && selection.toString().trim()) {
        handleTextSelection();
      } else {
        // 如果没有选择文本，则关闭工具栏和翻译
        handleClickOutside(e);
      }
    }, 100);
  }, [handleTextSelection, handleClickOutside]);

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
  
  // 禁止页面缩放
  useEffect(() => {
    if (isMobile) {
      // 添加meta标签禁止缩放
      let viewportMeta = document.querySelector('meta[name="viewport"]')
      if (!viewportMeta) {
        viewportMeta = document.createElement('meta')
        viewportMeta.setAttribute('name', 'viewport')
        document.head.appendChild(viewportMeta)
      }
      viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
      
      // 禁止双指缩放
      const preventZoom = (e: TouchEvent) => {
        if (e.touches.length > 1) {
          e.preventDefault()
        }
      }
      
      document.addEventListener('touchmove', preventZoom, { passive: false })
      
      return () => {
        document.removeEventListener('touchmove', preventZoom)
        // 恢复meta标签
        if (viewportMeta) {
          viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0')
        }
      }
    }
  }, [isMobile])

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
    }
    
    // 使用mouseup事件处理文本选择
    const handleMouseUp = (e: MouseEvent) => {
      // 防止工具栏点击时关闭翻译
      const toolbar = document.getElementById('text-selector-toolbar');
      const translationTooltip = document.getElementById('translation-tooltip');
      
      if (
        (toolbar && toolbar.contains(e.target as Node)) || 
        (translationTooltip && translationTooltip.contains(e.target as Node))
      ) {
        return;
      }
      
      // 处理文本选择
      setTimeout(() => {
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed && selection.toString().trim()) {
          handleTextSelection();
        } else {
          // 如果没有选择文本，则关闭工具栏和翻译
          handleClickOutside(e);
        }
      }, 10);
    };
    
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousedown', handleClickOutside);
    
    // 为移动设备添加触摸事件
    if (isMobile) {
      document.addEventListener('touchstart', handleTouchStart, { passive: true });
      document.addEventListener('touchmove', handleTouchMove, { passive: true });
      document.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleTouchStart);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
        
        // 恢复默认的文本选择行为
        document.body.style.userSelect = '';
        document.body.style.webkitUserSelect = '';
        (document.body.style as any).msUserSelect = '';
        (document.body.style as any).MozUserSelect = '';
      };
    }
    
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleTextSelection, handleClickOutside, isMobile, isTouching, handleTouchStart, handleTouchMove, handleTouchEnd]);

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
  const handleTranslate = async () => {
    if (!selectedText) return;
    setIsTranslating(true);
    try {
      const translation = await translateText(selectedText);
      setTranslationData({ 
        errorCode: "0", 
        translation: [translation],
        query: selectedText,
        l: "en2zh"
      });
    } catch (error) {
      console.error('翻译出错:', error);
      setTranslationData(null);
    } finally {
      setIsTranslating(false);
    }
    setShowTranslation(true);
  };

  // 处理单词点击
  const handleWordClick = async (word: string) => {
    setWordToTranslate(word);
    setShowWordTranslation(true);
    setIsTranslating(true);
    setTranslationData(null);

    try {
      const response = await fetch(`/api/translate?text=${encodeURIComponent(word)}&type=word`);
      
      if (!response.ok) {
        throw new Error('翻译请求失败');
      }
      
      const data = await response.json();
      
      if (data.errorCode === "0") {
        setTranslationData(data);
      } else {
        throw new Error(data.message || '翻译失败');
      }
    } catch (error) {
      console.error('翻译出错:', error);
      setTranslationData(null);
    } finally {
      setIsTranslating(false);
    }
  };

  // 关闭翻译和工具栏
  const handleClose = () => {
    setIsVisible(false)
    setShowTranslation(false)
    setShowWordTranslation(false)
  }

  // 关闭函数，用于关闭翻译页面和工具栏
  const closeAll = useCallback(() => {
    setShowTranslation(false)
    setShowWordTranslation(false)
    setIsVisible(false)
    setToolbarVisible(false)
  }, [setToolbarVisible])

  if (!isVisible && !showTranslation && !showWordTranslation) return null

  // 计算翻译弹窗位置，确保在移动端上正确显示
  const translationPosition = {
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)'
  }

  return (
    <>
      {/* 工具栏 */}
      {isVisible && (
        <div
          id="text-selector-toolbar"
          className="fixed z-[60] transform -translate-x-1/2"
          style={{
            left: position.x,
            top: position.y
          }}
        >
          <div className={`bg-white/90 dark:bg-[#1a1a1a]/95 backdrop-blur-md rounded-full shadow-lg border border-gray-200 dark:border-gray-800 flex items-center h-12 px-2 ${isMobile ? 'flex-wrap gap-1 justify-center w-[calc(100vw-32px)] max-w-md' : ''}`}>
            <button
              className={`flex flex-col items-center justify-center ${isMobile ? 'w-14' : 'w-16'} h-12 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#252525] rounded-full transition-colors group`}
              onClick={handleCopy}
              aria-label="复制文本"
            >
              <svg className="w-5 h-5 mb-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              <span className="text-[10px] text-gray-600 dark:text-gray-400">复制</span>
            </button>

            <button
              className={`flex flex-col items-center justify-center ${isMobile ? 'w-14' : 'w-16'} h-12 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#252525] rounded-full transition-colors group`}
              onClick={() => handleHighlight('background')}
              aria-label="马克笔高亮"
            >
              <svg className="w-5 h-5 mb-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              <span className="text-[10px] text-gray-600 dark:text-gray-400">马克笔</span>
            </button>

            <button
              className={`flex flex-col items-center justify-center ${isMobile ? 'w-14' : 'w-16'} h-12 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#252525] rounded-full transition-colors group`}
              onClick={() => handleHighlight('wave')}
              aria-label="波浪线高亮"
            >
              <svg className="w-5 h-5 mb-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-[10px] text-gray-600 dark:text-gray-400">波浪线</span>
            </button>

            <button
              className={`flex flex-col items-center justify-center ${isMobile ? 'w-14' : 'w-16'} h-12 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#252525] rounded-full transition-colors group`}
              onClick={() => handleHighlight('underline')}
              aria-label="直线高亮"
            >
              <svg className="w-5 h-5 mb-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12h16M4 18h16" />
              </svg>
              <span className="text-[10px] text-gray-600 dark:text-gray-400">直线</span>
            </button>
            
            <button
              className={`flex flex-col items-center justify-center ${isMobile ? 'w-14' : 'w-16'} h-12 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#252525] rounded-full transition-colors group`}
              onClick={handleTranslate}
              aria-label="翻译文本"
            >
              <svg className="w-5 h-5 mb-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              <span className="text-[10px] text-gray-600 dark:text-gray-400">翻译</span>
            </button>
          </div>
        </div>
      )}
      
      {/* 工具栏触发的翻译结果 */}
      {showTranslation && (
        <>
          {/* 遮罩层 */}
          <div 
            className="fixed inset-0 z-[9998] bg-black/30" 
            onClick={closeAll}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
            }}
          />
          
          {/* 翻译内容 */}
          <div 
            id="translation-tooltip"
            className="fixed z-[9999] bg-white dark:bg-[#1a1a1a] shadow-xl rounded-lg border dark:border-gray-800 p-4 w-[calc(100vw-32px)] max-w-sm"
            style={{
              position: 'fixed',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              maxHeight: '70vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-2">
              {isTranslating ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
                </div>
              ) : translationData ? (
                <div>
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
                    <div className="break-words max-w-[calc(100%-60px)]">{selectedText}</div>
                    {translationData?.speakUrl && (
                      <button 
                        onClick={playOriginalAudio}
                        className="text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 ml-5 flex-shrink-0"
                        aria-label="播放原文发音"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <div className="border-b border-gray-200 dark:border-gray-800 mb-2"></div>
                  <div>
                    {translationData.basic ? (
                      <div>
                        <div className="font-medium text-lg mb-1 dark:text-white">{translationData.basic.phonetic && `[${translationData.basic.phonetic}]`}</div>
                        <div className="space-y-1">
                          {translationData.basic.explains.map((explain: string, i: number) => (
                            <div key={i} className="text-sm dark:text-gray-300">{explain}</div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="text-sm dark:text-gray-300 break-words max-w-[calc(100%-60px)]">
                          {translationData.translation && translationData.translation.length > 0 && (
                            <span>{translationData.translation[0]}</span>
                          )}
                        </div>
                        {translationData.tSpeakUrl && (
                          <button 
                            onClick={playTranslationAudio}
                            className="text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 ml-5 flex-shrink-0"
                            aria-label="播放翻译发音"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </>
      )}

      {/* 单词点击触发的翻译结果 */}
      {showWordTranslation && (
        <>
          {/* 遮罩层 */}
          <div 
            className="fixed inset-0 z-[9998] bg-black/30" 
            onClick={(e) => {
              // 只有点击遮罩层本身时才关闭
              if (e.target === e.currentTarget) {
                setShowWordTranslation(false);
              }
            }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
            }}
          />
          
          {/* 翻译内容 */}
          <div 
            id="word-translation-tooltip"
            className="fixed z-[9999] bg-white dark:bg-[#1a1a1a] shadow-xl rounded-lg border dark:border-gray-800 p-4 w-[calc(100vw-32px)] max-w-sm"
            style={{
              position: 'fixed',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              maxHeight: '70vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-2">
              {isTranslating ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
                </div>
              ) : translationData ? (
                <div>
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
                    <div className="break-words max-w-[calc(100%-60px)]">{wordToTranslate}</div>
                    {translationData?.speakUrl && (
                      <button 
                        onClick={playOriginalAudio}
                        className="text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 ml-5 flex-shrink-0"
                        aria-label="播放原文发音"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <div className="border-b border-gray-200 dark:border-gray-800 mb-2"></div>
                  <div>
                    {translationData.basic ? (
                      <div>
                        <div className="font-medium text-lg mb-1 dark:text-white">{translationData.basic.phonetic && `[${translationData.basic.phonetic}]`}</div>
                        <div className="space-y-1">
                          {translationData.basic.explains.map((explain: string, i: number) => (
                            <div key={i} className="text-sm dark:text-gray-300">{explain}</div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="text-sm dark:text-gray-300 break-words max-w-[calc(100%-60px)]">
                          {translationData.translation && translationData.translation.length > 0 && (
                            <span>{translationData.translation[0]}</span>
                          )}
                        </div>
                        {translationData.tSpeakUrl && (
                          <button 
                            onClick={playTranslationAudio}
                            className="text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 ml-5 flex-shrink-0"
                            aria-label="播放翻译发音"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </>
      )}

      <div 
        className="reader-content"
        style={{
          WebkitUserSelect: 'text',
          userSelect: 'text'
        }}
      >
        {/* ... existing code ... */}
      </div>
    </>
  )
} 