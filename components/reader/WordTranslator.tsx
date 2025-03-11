import React, { useState, useEffect, useRef } from 'react';

interface WordTranslatorProps {
  word: string;
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

export default function WordTranslator({ word }: WordTranslatorProps) {
  const [translationData, setTranslationData] = useState<TranslationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const wordRef = useRef<HTMLSpanElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // 移动端检测
  const [isMobile, setIsMobile] = useState(false);
  
  // 检测设备类型
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);
  
  const handleTranslate = async () => {
    if (translationData) return; // 如果已经有翻译结果，不再请求
    
    setIsLoading(true);
    setIsError(false);
    
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
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 点击单词时显示翻译
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡
    setIsOpen(!isOpen);
    
    if (!isOpen && !translationData && !isLoading) {
      handleTranslate();
    }
  };
  
  // 点击外部时关闭翻译
  // useEffect(() => {
  //   const handleClickOutside = (event: MouseEvent) => {
  //     if (
  //       tooltipRef.current && 
  //       !tooltipRef.current.contains(event.target as Node) &&
  //       wordRef.current && 
  //       !wordRef.current.contains(event.target as Node)
  //     ) {
  //       // 在移动端上，给用户更多时间操作，不要立即关闭
  //       // if (!isMobile) {
  //       //   setIsOpen(false);
  //       // }
  //     }
  //   };
    
  //   document.addEventListener('mousedown', handleClickOutside);
  //   return () => {
  //     document.removeEventListener('mousedown', handleClickOutside);
  //   };
  // }, [isMobile]);
  
  // 计算tooltip位置
  const getTooltipPosition = () => {
    if (!wordRef.current) return { top: 0, left: 0 };
    
    const rect = wordRef.current.getBoundingClientRect();
    
    // 在移动端上，确保tooltip在可视区域内
    if (isMobile) {
      const left = Math.min(Math.max(rect.left + rect.width / 2, 150), window.innerWidth - 150);
      const top = Math.max(rect.top - 10, 50); // 确保不会太靠近顶部
      
      return { top, left };
    }
    
    return {
      top: rect.top - 10, // 在单词上方显示
      left: rect.left + rect.width / 2, // 居中显示
    };
  };
  
  // 播放原文发音
  const playOriginalAudio = () => {
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
  const playTranslationAudio = () => {
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
  
  // 关闭翻译
  const handleClose = () => {
    setIsOpen(false);
  };
  
  const position = getTooltipPosition();
  
  return (
    <>
      <span 
        ref={wordRef}
        className="cursor-pointer hover:bg-primary-100 dark:hover:bg-primary-900/20 px-0.5 rounded transition-colors inline-block"
        onClick={handleClick}
      >
        {word}
      </span>
      
      {isOpen && (
        <div
          ref={tooltipRef}
          className="fixed z-[100] transform -translate-x-1/2 pointer-events-auto"
          style={{
            top: `${position.top - 40}px`,
            left: `${position.left}px`,
            maxWidth: isMobile ? 'calc(100vw - 40px)' : '300px'
          }}
        >
          <div className="bg-white dark:bg-[#1a1a1a] rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 p-3 w-full">
            <div className="relative">
            {/* {isMobile && (
                <div className="absolute top-0 right-0">
                  <button 
                    onClick={handleClose}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
               */}
              {isLoading ? (
                <div className="flex items-center justify-center py-2">
                  <div className="w-5 h-5 border-2 border-t-transparent border-primary-500 rounded-full animate-spin"></div>
                  <span className="ml-2 text-sm">翻译中...</span>
                </div>
              ) : isError ? (
                <div className="text-sm text-red-500">翻译失败，请重试</div>
              ) : translationData ? (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm font-bold dark:text-gray-200 break-words max-w-[85%]">{translationData.query}</div>
                    {translationData.speakUrl && (
                      <button 
                        onClick={playOriginalAudio}
                        className="text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 flex-shrink-0"
                        aria-label="播放原文发音"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        </svg>
                      </button>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs dark:text-gray-300 break-words max-w-[85%]">
                      {translationData.translation && translationData.translation.length > 0 && (
                        <span>{translationData.translation[0]}</span>
                      )}
                    </div>
                    {translationData.tSpeakUrl && (
                      <button 
                        onClick={playTranslationAudio}
                        className="text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 flex-shrink-0"
                        aria-label="播放翻译发音"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-sm dark:text-gray-300">正在加载翻译...</div>
              )}
              
              {/* 箭头 - 在移动端上不显示 */}
              {!isMobile && (
                <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-full">
                  <div className="border-8 border-transparent border-t-white dark:border-t-[#1a1a1a]"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
} 