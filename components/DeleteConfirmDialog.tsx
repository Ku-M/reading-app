import type { Book } from '@/types'

interface DeleteConfirmDialogProps {
  isOpen: boolean
  book: Book | null
  onClose: () => void
  onConfirm: () => void
}

export default function DeleteConfirmDialog({
  isOpen,
  book,
  onClose,
  onConfirm
}: DeleteConfirmDialogProps) {
  if (!isOpen || !book) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-dark-100 rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b dark:border-dark-300">
          <h3 className="text-lg font-medium">确认删除</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6">
          <div className="flex items-center mb-4">
            <svg className="w-8 h-8 text-red-500 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-lg font-medium">确定要删除这本书吗？</p>
          </div>
          
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            您即将删除：<span className="font-medium text-gray-800 dark:text-gray-200">{book.bookName}</span>
          </p>
          
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            删除后将无法恢复，包括阅读进度、笔记和高亮等相关数据。
          </p>
        </div>
        
        <div className="flex justify-end p-4 border-t dark:border-dark-300">
          <button 
            className="px-4 py-2 mr-2 border border-gray-300 rounded-md hover:bg-gray-50 dark:border-dark-500 dark:hover:bg-dark-200"
            onClick={onClose}
          >
            取消
          </button>
          <button 
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
            onClick={onConfirm}
          >
            确认删除
          </button>
        </div>
      </div>
    </div>
  )
} 