'use client'

import { useState, useEffect } from 'react'
import { useReaderStore } from '@/lib/store'
import Button from '@/components/ui/Button'

interface AISettingsDialogProps {
  isOpen: boolean
  enabled: boolean
  onClose: () => void
  onEnableChange: (enabled: boolean) => void
}

export default function AISettingsDialog({ 
  isOpen, 
  enabled, 
  onClose,
  onEnableChange 
}: AISettingsDialogProps) {
  const aiSettings = useReaderStore((state) => state.aiSettings)
  const updateAISettings = useReaderStore((state) => state.updateAISettings)
  
  // 使用本地状态，避免直接修改全局状态导致页面刷新
  const [lexileScore, setLexileScore] = useState(aiSettings.lexileScore)
  const [priorityWords, setPriorityWords] = useState(aiSettings.priorityWords.join(', '))
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
  
  // 当对话框关闭时，将本地状态同步到全局状态
  const handleSave = () => {
    updateAISettings({
      enabled,
      lexileScore,
      priorityWords: priorityWords.split(',').map(word => word.trim()).filter(Boolean)
    })
    onClose()
  }

  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className={`bg-white dark:bg-dark-100 ${isMobile ? 'w-full h-full' : 'rounded-lg max-w-md mx-4'} shadow-xl`}>
        <div className="flex items-center justify-between p-4 border-b dark:border-dark-300">
          <h3 className="text-lg font-medium">AI 转写设置</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className={`${isMobile ? 'p-4 h-[calc(100vh-120px)] overflow-y-auto' : 'p-4'}`}>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="font-medium text-gray-700 dark:text-gray-300">启用 AI 转写</label>
              <div className="relative inline-block w-10 align-middle select-none">
                <input 
                  type="checkbox" 
                  checked={enabled}
                  onChange={(e) => onEnableChange(e.target.checked)}
                  className="sr-only"
                  id="ai-toggle"
                />
                <label 
                  htmlFor="ai-toggle"
                  className={`block h-6 overflow-hidden rounded-full cursor-pointer transition-colors duration-200 ease-in-out ${enabled ? 'bg-primary-500' : 'bg-gray-300 dark:bg-dark-300'}`}
                >
                  <span 
                    className={`block h-6 w-6 rounded-full bg-white shadow transform transition-transform duration-200 ease-in-out ${enabled ? 'translate-x-4' : 'translate-x-0'}`}
                  />
                </label>
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              启用后，系统将使用 AI 技术自动转写文本，使其更易于理解
            </p>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">蓝思值</label>
            <div className="flex items-center">
              <button 
                className="p-2 bg-gray-100 dark:bg-dark-200 rounded-l-md hover:bg-gray-200 dark:hover:bg-dark-300 disabled:opacity-50"
                onClick={() => setLexileScore(Math.max(500, lexileScore - 50))}
                disabled={!enabled}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <input
                type="range"
                min="500"
                max="1500"
                step="50"
                value={lexileScore}
                onChange={(e) => setLexileScore(parseInt(e.target.value, 10))}
                className="slider flex-1 mx-2"
                disabled={!enabled}
              />
              <button 
                className="p-2 bg-gray-100 dark:bg-dark-200 rounded-r-md hover:bg-gray-200 dark:hover:bg-dark-300 disabled:opacity-50"
                onClick={() => setLexileScore(Math.min(1500, lexileScore + 50))}
                disabled={!enabled}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
            <div className="flex justify-between text-sm text-gray-500 mt-1">
              <span>简单</span>
              <span>{lexileScore}</span>
              <span>复杂</span>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">优先词汇</label>
            <textarea
              className="w-full px-3 py-2 border rounded-md dark:bg-dark-200 dark:border-dark-300 disabled:opacity-50"
              rows={3}
              placeholder="输入优先使用的词汇，用逗号分隔"
              value={priorityWords}
              onChange={(e) => setPriorityWords(e.target.value)}
              disabled={!enabled}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              AI 转写时会优先使用这些词汇
            </p>
          </div>
          
          <div className="pt-2">
            <div className="flex items-center justify-between text-sm">
              <span>已消耗积分</span>
              <span>{aiSettings.credits}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span>平均每章消耗</span>
              <span>5 积分</span>
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