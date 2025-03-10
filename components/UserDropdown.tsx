import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// 个人资料对话框组件
function ProfileDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-dark-100 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b dark:border-dark-200">
          <h3 className="text-lg font-medium">个人资料</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                用户名
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-md dark:border-dark-200 dark:bg-dark-200"
                defaultValue="测试用户"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                邮箱
              </label>
              <input
                type="email"
                className="w-full px-3 py-2 border rounded-md dark:border-dark-200 dark:bg-dark-200"
                defaultValue="test@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                头像
              </label>
              <div className="flex items-center space-x-4">
                <img
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                  alt="用户头像"
                  className="w-16 h-16 rounded-full"
                />
                <button className="px-3 py-1 text-sm border rounded-md hover:bg-gray-50 dark:border-dark-200 dark:hover:bg-dark-200">
                  更换头像
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end px-6 py-4 border-t dark:border-dark-200">
          <button
            className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600"
            onClick={onClose}
          >
            保存更改
          </button>
        </div>
      </div>
    </div>
  )
}

// 修改密码对话框组件
function PasswordDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-dark-100 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b dark:border-dark-200">
          <h3 className="text-lg font-medium">修改密码</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                当前密码
              </label>
              <input
                type="password"
                className="w-full px-3 py-2 border rounded-md dark:border-dark-200 dark:bg-dark-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                新密码
              </label>
              <input
                type="password"
                className="w-full px-3 py-2 border rounded-md dark:border-dark-200 dark:bg-dark-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                确认新密码
              </label>
              <input
                type="password"
                className="w-full px-3 py-2 border rounded-md dark:border-dark-200 dark:bg-dark-200"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end px-6 py-4 border-t dark:border-dark-200">
          <button
            className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600"
            onClick={onClose}
          >
            确认修改
          </button>
        </div>
      </div>
    </div>
  )
}

export default function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const [showProfileDialog, setShowProfileDialog] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // 点击外部关闭下拉菜单
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // 模拟用户信息
  const user = {
    name: '测试用户',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-dark-200 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <img
          src={user.avatar}
          alt={user.name}
          className="w-8 h-8 rounded-full"
        />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{user.name}</span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-100 rounded-lg shadow-lg py-1 z-40">
          <button
            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-200"
            onClick={() => {
              setIsOpen(false)
              setShowProfileDialog(true)
            }}
          >
            <svg className="w-4 h-4 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            个人资料
          </button>

          <button
            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-200"
            onClick={() => {
              setIsOpen(false)
              setShowPasswordDialog(true)
            }}
          >
            <svg className="w-4 h-4 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
            修改密码
          </button>

          <hr className="my-1 border-gray-200 dark:border-dark-300" />

          <button
            className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-dark-200"
            onClick={() => {
              setIsOpen(false)
              router.push('/login')
            }}
          >
            <svg className="w-4 h-4 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            退出登录
          </button>
        </div>
      )}

      {/* 个人资料对话框 */}
      <ProfileDialog isOpen={showProfileDialog} onClose={() => setShowProfileDialog(false)} />

      {/* 修改密码对话框 */}
      <PasswordDialog isOpen={showPasswordDialog} onClose={() => setShowPasswordDialog(false)} />
    </div>
  )
} 