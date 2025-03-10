import { useState, useRef, useEffect } from 'react'
import { Toast, Button } from '@heroui/react'
import ToastMessage from './ui/Toast'

interface ImportBookDialogProps {
  isOpen: boolean
  onClose: () => void
  onImport: (bookData: {
    bookName: string,
    chapters: Array<{
      chapterName: string,
      content: string,
      order: number
    }>
  }) => Promise<void>
}

// 每页的最大字符数
const MAX_CHARS_PER_PAGE = 3000;

export default function ImportBookDialog({ isOpen, onClose, onImport }: ImportBookDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [bookName, setBookName] = useState('')
  const [pages, setPages] = useState<Array<{ chapterName: string, content: string, order: number }>>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' | 'info' }>({
    show: false,
    message: '',
    type: 'info'
  })
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // 当文件选择变化时更新状态
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)
      
      // 从文件名中提取书名（去掉扩展名）
      const fileName = selectedFile.name
      const bookNameWithoutExt = fileName.replace(/\.[^/.]+$/, '')
      setBookName(bookNameWithoutExt)
    }
  }
  
  // 处理文件内容，按长度分割页面
  const processFile = async () => {
    if (!file) return
    
    setIsProcessing(true)
    setPages([])
    
    try {
      const text = await readFileAsText(file)
      const splitPages = splitTextIntoPages(text)
      setPages(splitPages)
    } catch (error) {
      console.error('处理文件时出错:', error)
      setToast({
        show: true,
        message: '处理文件时出错，请重试',
        type: 'error'
      })
    } finally {
      setIsProcessing(false)
    }
  }
  
  // 读取文件内容为文本
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result as string)
        } else {
          reject(new Error('读取文件失败'))
        }
      }
      reader.onerror = () => reject(new Error('读取文件失败'))
      reader.readAsText(file, 'UTF-8')
    })
  }
  
  // 按长度分割文本为页面
  const splitTextIntoPages = (text: string): Array<{ chapterName: string, content: string, order: number }> => {
    const pages = []
    let currentIndex = 0
    let pageNumber = 1
    
    // 移除多余的空白字符
    const cleanedText = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n')
    
    while (currentIndex < cleanedText.length) {
      // 计算当前页的结束位置
      let endIndex = Math.min(currentIndex + MAX_CHARS_PER_PAGE, cleanedText.length)
      
      // 如果不是文本末尾，尝试在句子或段落结束处分割
      if (endIndex < cleanedText.length) {
        // 尝试在段落结束处分割
        const paragraphEnd = cleanedText.lastIndexOf('\n\n', endIndex)
        if (paragraphEnd > currentIndex && paragraphEnd <= endIndex - 100) {
          endIndex = paragraphEnd + 2 // 包含换行符
        } else {
          // 尝试在句子结束处分割
          const sentenceEnd = Math.max(
            cleanedText.lastIndexOf('. ', endIndex),
            cleanedText.lastIndexOf('。', endIndex),
            cleanedText.lastIndexOf('！', endIndex),
            cleanedText.lastIndexOf('？', endIndex)
          )
          
          if (sentenceEnd > currentIndex && sentenceEnd <= endIndex - 20) {
            endIndex = sentenceEnd + 1 // 包含句号
          }
        }
      }
      
      // 提取当前页内容
      const pageContent = cleanedText.substring(currentIndex, endIndex)
      
      pages.push({
        chapterName: `第 ${pageNumber} 页`,
        content: pageContent,
        order: pageNumber
      })
      
      currentIndex = endIndex
      pageNumber++
    }
    
    return pages
  }
  
  // 处理导入按钮点击
  const handleImport = async () => {
    if (pages.length === 0) {
      setToast({
        show: true,
        message: '没有内容可导入',
        type: 'error'
      })
      return
    }
    
    try {
      await onImport({
        bookName,
        chapters: pages
      })
      
      // 重置状态
      resetForm()
      
      onClose()
    } catch (error) {
      console.error('导入书籍时出错:', error)
      setToast({
        show: true,
        message: '导入书籍时出错，请重试',
        type: 'error'
      })
    }
  }
  
  // 重置表单
  const resetForm = () => {
    setFile(null)
    setBookName('')
    setPages([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }
  
  // 处理关闭对话框
  const handleClose = () => {
    resetForm()
    onClose()
  }
  
  // 当文件变化时自动处理
  useEffect(() => {
    if (file) {
      processFile()
    }
  }, [file])
  
  // 当对话框关闭时重置表单
  useEffect(() => {
    if (!isOpen) {
      resetForm()
    }
  }, [isOpen])
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">导入TXT书籍</h2>
          <button 
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-4 flex-1 overflow-auto">
          {!file ? (
            <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
              <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-gray-600 dark:text-gray-400 mb-4">点击或拖拽TXT文件到此处</p>
              <input
                type="file"
                accept=".txt"
                onChange={handleFileChange}
                className="hidden"
                ref={fileInputRef}
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                color="primary"
              >
                选择文件
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 mb-2">书籍名称</label>
                <input
                  type="text"
                  value={bookName}
                  onChange={(e) => setBookName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              {isProcessing ? (
                <div className="flex flex-col items-center justify-center h-48">
                  <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">正在分析内容，请稍候...</p>
                </div>
              ) : pages.length > 0 ? (
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">共分割为 {pages.length} 页</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">序号</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">内容长度</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                        {pages.map((page, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{page.order}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{page.content.length} 字符</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-48">
                  <svg className="w-12 h-12 text-yellow-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">文件内容为空</p>
                </div>
              )}
            </>
          )}
        </div>
        
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-2">
          <Button
            onClick={handleClose}
            color="default"
            variant="bordered"
          >
            取消
          </Button>
          {file && pages.length > 0 && (
            <Button
              onClick={handleImport}
              color="primary"
            >
              导入
            </Button>
          )}
        </div>
      </div>
      
      {/* Toast 通知 */}
      {toast.show && (
        <ToastMessage
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(prev => ({ ...prev, show: false }))}
        />
      )}
    </div>
  )
} 