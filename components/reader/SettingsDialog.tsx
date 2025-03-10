import { useState, useEffect } from 'react'
import { useReaderStore } from '@/lib/store'
import Button from '@/components/ui/Button'

interface SettingsDialogProps {
  onClose: () => void
}

export default function SettingsDialog({ onClose }: SettingsDialogProps) {
  const isVisible = useReaderStore((state) => state.isSettingsDialogVisible)
  const settings = useReaderStore((state) => state.settings)
  const updateSettings = useReaderStore((state) => state.updateSettings)
  
  // 使用本地状态，避免直接修改全局状态导致页面刷新
  const [fontSize, setFontSize] = useState(settings.fontSize)
  const [lineHeight, setLineHeight] = useState(settings.lineHeight)
  const [letterSpacing, setLetterSpacing] = useState(settings.letterSpacing)
  const [fontFamily, setFontFamily] = useState(settings.fontFamily)
  const [theme, setTheme] = useState(settings.theme)
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
  
  // 当设置变化时，更新本地状态
  useEffect(() => {
    setFontSize(settings.fontSize)
    setLineHeight(settings.lineHeight)
    setLetterSpacing(settings.letterSpacing)
    setFontFamily(settings.fontFamily)
    setTheme(settings.theme)
  }, [settings])
  
  // 应用主题变化
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])
  
  // 保存设置
  const handleSave = () => {
    updateSettings({
      fontSize,
      lineHeight,
      letterSpacing,
      fontFamily,
      theme
    })
    onClose()
  }

  if (!isVisible) return null

  const dialogClass = `fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center ${isMobile ? 'p-0' : 'p-4'}`

  return (
    <div className={dialogClass}>
      <div className={`bg-white dark:bg-dark-100 rounded-lg shadow-lg w-full ${isMobile ? 'h-full rounded-none' : 'max-w-2xl'} overflow-hidden`}>
        <div className="flex items-center justify-between p-4 border-b dark:border-dark-300">
          <h3 className="text-lg font-medium">阅读设置</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </Button>
        </div>

        <div className={`${isMobile ? 'p-4' : 'p-4 md:p-6'} overflow-y-auto ${isMobile ? 'h-[calc(100vh-60px)]' : 'max-h-[calc(100vh-150px)]'}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div className="space-y-6">
              {/* 字体大小设置 */}
              <div>
                <label className="block text-sm font-medium mb-2">字体大小</label>
                <div className="flex items-center">
                  <button 
                    className="p-2 bg-gray-100 dark:bg-dark-200 rounded-l-md hover:bg-gray-200 dark:hover:bg-dark-300"
                    onClick={() => setFontSize(Math.max(12, fontSize - 1))}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                  <input
                    type="range"
                    min="12"
                    max="24"
                    step="1"
                    value={fontSize}
                    onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                    className="slider flex-1 mx-2"
                  />
                  <button 
                    className="p-2 bg-gray-100 dark:bg-dark-200 rounded-r-md hover:bg-gray-200 dark:hover:bg-dark-300"
                    onClick={() => setFontSize(Math.min(24, fontSize + 1))}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                  {fontSize}px
                </div>
              </div>
              
              {/* 行高设置 */}
              <div>
                <label className="block text-sm font-medium mb-2">行高</label>
                <div className="flex items-center">
                  <button 
                    className="p-2 bg-gray-100 dark:bg-dark-200 rounded-l-md hover:bg-gray-200 dark:hover:bg-dark-300"
                    onClick={() => setLineHeight(Math.max(1.2, lineHeight - 0.1))}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                  <input
                    type="range"
                    min="1.2"
                    max="2.0"
                    step="0.1"
                    value={lineHeight}
                    onChange={(e) => setLineHeight(parseFloat(e.target.value))}
                    className="slider flex-1 mx-2"
                  />
                  <button 
                    className="p-2 bg-gray-100 dark:bg-dark-200 rounded-r-md hover:bg-gray-200 dark:hover:bg-dark-300"
                    onClick={() => setLineHeight(Math.min(2.0, lineHeight + 0.1))}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                  {lineHeight.toFixed(1)}
                </div>
              </div>
              
              {/* 字间距设置 */}
              <div>
                <label className="block text-sm font-medium mb-2">字间距</label>
                <div className="flex items-center">
                  <button 
                    className="p-2 bg-gray-100 dark:bg-dark-200 rounded-l-md hover:bg-gray-200 dark:hover:bg-dark-300"
                    onClick={() => setLetterSpacing(Math.max(0, letterSpacing - 0.5))}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.5"
                    value={letterSpacing}
                    onChange={(e) => setLetterSpacing(parseFloat(e.target.value))}
                    className="slider flex-1 mx-2"
                  />
                  <button 
                    className="p-2 bg-gray-100 dark:bg-dark-200 rounded-r-md hover:bg-gray-200 dark:hover:bg-dark-300"
                    onClick={() => setLetterSpacing(Math.min(5, letterSpacing + 0.5))}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                  {letterSpacing.toFixed(1)}px
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              {/* 字体选择 */}
              <div>
                <label className="block text-sm font-medium mb-2">字体</label>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    className={`p-2 rounded-md border ${
                      fontFamily === 'serif' 
                        ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-700' 
                        : 'bg-white dark:bg-dark-200 border-gray-200 dark:border-dark-300'
                    }`}
                    onClick={() => setFontFamily('serif')}
                  >
                    <span className="font-serif">衬线字体 (Serif)</span>
                  </button>
                  <button
                    className={`p-2 rounded-md border ${
                      fontFamily === 'sans' 
                        ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-700' 
                        : 'bg-white dark:bg-dark-200 border-gray-200 dark:border-dark-300'
                    }`}
                    onClick={() => setFontFamily('sans')}
                  >
                    <span className="font-sans">无衬线字体 (Sans)</span>
                  </button>
                  <button
                    className={`p-2 rounded-md border ${
                      fontFamily === 'mono' 
                        ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-700' 
                        : 'bg-white dark:bg-dark-200 border-gray-200 dark:border-dark-300'
                    }`}
                    onClick={() => setFontFamily('mono')}
                  >
                    <span className="font-mono">等宽字体 (Mono)</span>
                  </button>
                </div>
              </div>
              
              {/* 主题选择 */}
              <div>
                <label className="block text-sm font-medium mb-2">主题</label>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    className={`p-2 rounded-md border ${
                      theme === 'light' 
                        ? 'bg-primary-50 border-primary-200' 
                        : 'bg-white border-gray-200'
                    }`}
                    onClick={() => setTheme('light')}
                  >
                    <div className="flex items-center">
                      <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <span>浅色主题</span>
                    </div>
                  </button>
                  <button
                    className={`p-2 rounded-md border ${
                      theme === 'dark' 
                        ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-700' 
                        : 'bg-white dark:bg-dark-200 border-gray-200 dark:border-dark-300'
                    }`}
                    onClick={() => setTheme('dark')}
                  >
                    <div className="flex items-center">
                      <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                      <span>深色主题</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t dark:border-dark-300">
          <Button variant="ghost" onClick={onClose}>取消</Button>
          <Button variant="primary" onClick={handleSave}>保存</Button>
        </div>
      </div>
    </div>
  )
} 