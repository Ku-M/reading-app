# ABHISECA - 外语阅读器

外语阅读器，使用 Next.js 和 TypeScript 构建。

## 主要功能

1. 📚 书籍和章节管理
   - 书籍列表展示
   - 章节目录浏览
   - 阅读进度保存

2. 📖 阅读体验
   - 流畅的分页显示
   - 优雅的页面翻转动画
   - 夜间模式支持
   - 自定义字体设置（大小、字体、行高、字间距）

3. ✨ 交互功能
   - 文本选择和高亮
   - 工具栏自动隐藏
   - 双击切换工具栏
   - 触摸屏支持

4. 🤖 AI 功能
   - 智能文本转写
   - 阅读理解辅助
   - 个性化推荐

## 技术栈

- Next.js 14
- TypeScript
- Tailwind CSS
- Zustand (状态管理)
- Framer Motion (动画效果)
- React Query (数据获取)

## 开发环境设置

1. 安装依赖：
```bash
npm install
```

2. 启动开发服务器：
```bash
npm run dev
```

3. 构建生产版本：
```bash
npm run build
```

## API 接口

基础 URL: https://ra.s7.tunnelfrp.com/api

主要接口：
- GET /books - 获取书籍列表
- GET /books/:id - 获取书籍详情
- GET /chapters/:bookId - 获取章节列表
- GET /chapters/:id/content - 获取章节内容

## 项目结构

```
reading-app/
├── app/                # Next.js 应用目录
│   ├── layout.tsx     # 根布局组件
│   ├── page.tsx       # 首页组件
│   └── books/         # 书籍相关页面
├── components/        # React 组件
├── lib/              # 工具函数和配置
├── styles/           # 全局样式
└── types/            # TypeScript 类型定义
```

## 贡献指南

欢迎提交 Pull Request 和 Issue！

## 许可证

MIT License 