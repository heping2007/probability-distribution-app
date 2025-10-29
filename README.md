# Probability Distribution App

A statistical web application built with React, TypeScript, and Vite for generating and visualizing various probability distributions and performing data analysis.

## 功能特性

- 多种数据输入方式：文件上传、统计分布生成、AI数据生成
- 全面的数据分析工具：基础统计、MLE/MoM分析、置信区间、假设检验
- 实时数据可视化
- 响应式设计，支持各种设备

## 技术栈

- React 19
- TypeScript
- Vite
- Recharts (图表库)
- MathJS (数学计算)

## 本地开发

1. 安装依赖
```bash
npm install
```

2. 启动开发服务器
```bash
npm run dev
```

3. 构建生产版本
```bash
npm run build
```

4. 预览生产版本
```bash
npm run preview
```

## 部署到GitHub Pages

1. 确保已经在GitHub上创建了仓库
2. 运行部署命令
```bash
npm run deploy
```

## 部署说明

- 应用使用gh-pages自动部署到GitHub Pages
- 部署配置已在vite.config.ts中设置
- 部署后的应用将在 https://your-username.github.io/probability-distribution-app/ 访问

## 用户使用指南

### 1. 数据输入（Data Input）
应用提供三种数据输入方式：

#### 文件上传（File Upload）
- 支持上传JSON和CSV格式的数据文件
- 数据将自动解析并显示在可视化区域

#### 分布生成器（Distribution Generator）
- 选择概率分布类型（二项分布、正态分布、泊松分布等）
- 设置相应参数（如n、p、μ、σ、λ等）
- 生成模拟数据进行分析

#### AI数据生成（AI Generate Data）
- 描述您需要的数据模式和特征
- AI将根据描述生成符合要求的数据

### 2. 数据分析功能
成功输入数据后，以下分析功能将可用：

#### 基础统计（Basic Statistics）
- 查看数据的描述性统计信息
- 包括均值、中位数、标准差、最大值、最小值等

#### MLE/MoM分析（MLE/MoM Analysis）
- 最大似然估计和矩估计分析
- 估算数据的分布参数

#### 置信区间（Confidence Intervals）
- 计算不同置信水平下的置信区间
- 分析参数的不确定性

#### 假设检验（Hypothesis Testing）
- 执行统计假设检验
- 分析数据的统计显著性

### 3. 数据可视化
- 所有输入的数据都将实时显示在可视化区域
- 图表将随数据变化而更新

## 共享应用给其他用户

要让其他用户能够访问您的应用，请按照以下步骤操作：

1. 确保您已成功部署应用到GitHub Pages
   ```bash
   npm run deploy
   ```

2. 部署完成后，应用将在以下URL可用：
   `https://heping2007.github.io/probability-distribution-app/`

3. 您可以通过以下方式共享给其他用户：
   - 直接分享上述URL链接
   - 在GitHub仓库的页面上，点击"Settings" > "Pages"查看部署状态和访问链接
   - 确保您的仓库是公开的，这样其他用户才能访问

4. 其他用户只需在浏览器中打开该链接，即可使用完整功能的应用，无需安装任何软件

## 项目结构

- `src/` - 源代码目录
  - `components/` - React组件
  - `services/` - API服务
  - `utils/` - 工具函数
  - `types/` - TypeScript类型定义
- `public/` - 静态资源
- `dist/` - 构建输出目录

## ESLint配置

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
