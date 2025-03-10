import React, { useState, useEffect } from 'react';

interface SideNavigationProps {
  onPrevChapter: () => void;
  onNextChapter: () => void;
  onOpenChapterList: () => void;
  onOpenSettings: () => void;
  hasPrevChapter: boolean;
  hasNextChapter: boolean;
  currentChapter: number;
  totalChapters: number;
}

const SideNavigation: React.FC<SideNavigationProps> = ({
  onPrevChapter,
  onNextChapter,
  onOpenChapterList,
  onOpenSettings,
  hasPrevChapter,
  hasNextChapter,
  currentChapter,
  totalChapters
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
  // 检测设备类型
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      // 在移动端默认收起侧边栏
      if (window.innerWidth < 768) {
        setIsExpanded(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={`fixed ${isMobile ? 'bottom-24 left-0' : 'bottom-1/2 left-0 transform translate-y-1/2'} z-30`}>
      {/* 折叠/展开按钮 */}
      <button
        onClick={toggleExpanded}
        className={`absolute ${isMobile ? 'left-1' : 'left-2'} top-1/2 transform -translate-y-1/2 bg-white/90 dark:bg-[#1a1a1a]/95 rounded-full p-2 shadow-lg border border-gray-200 dark:border-gray-800 backdrop-blur-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-all duration-300 z-40`}
        aria-label={isExpanded ? "收起导航" : "展开导航"}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          {isExpanded ? (
            <polyline points="15 18 9 12 15 6" />
          ) : (
            <polyline points="9 18 15 12 9 6" />
          )}
        </svg>
      </button>

      {/* 导航栏 */}
      <nav 
        className={`bg-white/90 dark:bg-[#1a1a1a]/95 rounded-full px-2 py-4 shadow-lg border border-gray-200 dark:border-gray-800 backdrop-blur-md flex flex-col items-center space-y-6 transition-all duration-300 ${
          isExpanded 
            ? `${isMobile ? 'ml-10' : 'ml-12'} opacity-100` 
            : '-ml-20 opacity-0 pointer-events-none'
        }`}
      >
        {/* 上一章按钮 */}
        <div className="relative group">
          <button 
            className={`p-2 rounded-full ${hasPrevChapter ? 'hover:bg-gray-100 dark:hover:bg-gray-800/50 cursor-pointer' : 'opacity-50 cursor-not-allowed'} transition-all duration-300 text-gray-700 dark:text-gray-300`}
            onClick={onPrevChapter}
            disabled={!hasPrevChapter}
            aria-label="上一章"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            {!isMobile && (
              <div className="absolute invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-300 left-full ml-2 top-1/2 transform -translate-y-1/2 z-50">
                <div className="bg-white dark:bg-[#1a1a1a] text-gray-800 dark:text-gray-200 text-xs px-3 py-1.5 rounded-lg whitespace-nowrap font-light tracking-wider shadow-lg border border-gray-200 dark:border-gray-800">
                  上一章
                  <div className="absolute top-1/2 left-0 transform -translate-x-1 -translate-y-1/2">
                    <div className="border-4 border-transparent border-r-white dark:border-r-[#1a1a1a]" />
                  </div>
                </div>
              </div>
            )}
          </button>
        </div>
        
        {/* 章节列表按钮 */}
        <div className="relative group">
          <button 
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800/50 cursor-pointer transition-all duration-300 text-gray-700 dark:text-gray-300"
            onClick={onOpenChapterList}
            aria-label="章节目录"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
            {!isMobile && (
              <div className="absolute invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-300 left-full ml-2 top-1/2 transform -translate-y-1/2 z-50">
                <div className="bg-white dark:bg-[#1a1a1a] text-gray-800 dark:text-gray-200 text-xs px-3 py-1.5 rounded-lg whitespace-nowrap font-light tracking-wider shadow-lg border border-gray-200 dark:border-gray-800">
                  章节目录
                  <div className="absolute top-1/2 left-0 transform -translate-x-1 -translate-y-1/2">
                    <div className="border-4 border-transparent border-r-white dark:border-r-[#1a1a1a]" />
                  </div>
                </div>
              </div>
            )}
          </button>
        </div>
        
        {/* 设置按钮 */}
        <div className="relative group">
          <button 
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800/50 cursor-pointer transition-all duration-300 text-gray-700 dark:text-gray-300"
            onClick={onOpenSettings}
            aria-label="设置"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx={12} cy={12} r={3} />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            {!isMobile && (
              <div className="absolute invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-300 left-full ml-2 top-1/2 transform -translate-y-1/2 z-50">
                <div className="bg-white dark:bg-[#1a1a1a] text-gray-800 dark:text-gray-200 text-xs px-3 py-1.5 rounded-lg whitespace-nowrap font-light tracking-wider shadow-lg border border-gray-200 dark:border-gray-800">
                  设置
                  <div className="absolute top-1/2 left-0 transform -translate-x-1 -translate-y-1/2">
                    <div className="border-4 border-transparent border-r-white dark:border-r-[#1a1a1a]" />
                  </div>
                </div>
              </div>
            )}
          </button>
        </div>
        
        {/* 下一章按钮 */}
        <div className="relative group">
          <button 
            className={`p-2 rounded-full ${hasNextChapter ? 'hover:bg-gray-100 dark:hover:bg-gray-800/50 cursor-pointer' : 'opacity-50 cursor-not-allowed'} transition-all duration-300 text-gray-700 dark:text-gray-300`}
            onClick={onNextChapter}
            disabled={!hasNextChapter}
            aria-label="下一章"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
            {!isMobile && (
              <div className="absolute invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-300 left-full ml-2 top-1/2 transform -translate-y-1/2 z-50">
                <div className="bg-white dark:bg-[#1a1a1a] text-gray-800 dark:text-gray-200 text-xs px-3 py-1.5 rounded-lg whitespace-nowrap font-light tracking-wider shadow-lg border border-gray-200 dark:border-gray-800">
                  下一章
                  <div className="absolute top-1/2 left-0 transform -translate-x-1 -translate-y-1/2">
                    <div className="border-4 border-transparent border-r-white dark:border-r-[#1a1a1a]" />
                  </div>
                </div>
              </div>
            )}
          </button>
        </div>
        
        {/* 章节指示器 */}
        <div className="bg-gray-100 dark:bg-[#1a1a1a] rounded-full px-2 py-1 text-xs text-gray-700 dark:text-gray-300 border border-transparent dark:border-gray-800">
          {currentChapter}/{totalChapters}
        </div>
      </nav>
    </div>
  );
}

export default SideNavigation; 