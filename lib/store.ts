import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ReaderSettings, AITranscriptionSettings, ReadingProgress } from '@/types'

interface ReaderStore {
  // 阅读设置
  settings: ReaderSettings
  updateSettings: (settings: Partial<ReaderSettings>) => void
  
  // AI 转写设置
  aiSettings: AITranscriptionSettings
  updateAISettings: (settings: Partial<AITranscriptionSettings>) => void
  
  // 阅读进度
  readingProgress: Record<string, ReadingProgress>
  updateReadingProgress: (progress: ReadingProgress) => void
  
  // 工具栏状态
  isToolbarVisible: boolean
  setToolbarVisible: (visible: boolean) => void
  
  // 字体设置对话框状态
  isSettingsDialogVisible: boolean
  setSettingsDialogVisible: (visible: boolean) => void
  
  // 章节列表对话框状态
  isChapterListVisible: boolean
  setChapterListVisible: (visible: boolean) => void
}

export const useReaderStore = create<ReaderStore>()(
  persist(
    (set) => ({
      // 默认阅读设置
      settings: {
        fontSize: 16,
        fontFamily: 'system-ui',
        lineHeight: 1.5,
        letterSpacing: 0,
        theme: 'light',
      },
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
      
      // 默认 AI 设置
      aiSettings: {
        enabled: false,
        lexileScore: 1000,
        priorityWords: [],
        credits: 100,
      },
      updateAISettings: (newSettings) =>
        set((state) => ({
          aiSettings: { ...state.aiSettings, ...newSettings },
        })),
      
      // 阅读进度
      readingProgress: {},
      updateReadingProgress: (progress) =>
        set((state) => ({
          readingProgress: {
            ...state.readingProgress,
            [progress.bookId]: progress,
          },
        })),
      
      // UI 状态
      isToolbarVisible: true,
      setToolbarVisible: (visible) =>
        set({ isToolbarVisible: visible }),
      
      isSettingsDialogVisible: false,
      setSettingsDialogVisible: (visible) =>
        set({ isSettingsDialogVisible: visible }),
      
      isChapterListVisible: false,
      setChapterListVisible: (visible) =>
        set({ isChapterListVisible: visible }),
    }),
    {
      name: 'reader-store',
      version: 1,
    }
  )
) 