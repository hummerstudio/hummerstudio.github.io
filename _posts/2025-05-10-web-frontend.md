---
title: 学习Vue，成为web全栈开发者!
date: 2025-05-10
author: 唐明
categories: [build]
tags: [Vue, 前端, Ant Design Vue, Web开发]
---

* TOC
{:toc}

## 1、从原生JS到现代前端

在大学的时候已经自学过 HTML5、CSS3 和 JavaScript，并纯手工编写博客系统用于个人博客写作，以在学校内网分享技术文章。

但很早也已知道，随着 Google V8 引擎、Node.js 的到来，Web 前端开发已经变了样：前端是真的需要开发了！

最近由于需要开发一个构建分析平台（Web 平台，用于分析项目构建产物），对 Web 前端开发有了更大的兴趣。经过初步选型，决定学习 Vue。

## 2、为什么选择Vue

在三大主流前端框架（React、Vue、Angular）中，Vue 有几个优势比较适合我的场景：

- **上手曲线平缓**：Vue 的模板语法接近原生 HTML，对有 HTML/CSS/JS 基础的人来说非常直观，不需要额外学习 JSX。
- **中文生态好**：Vue 官方文档中文翻译质量很高，社区教程也丰富。
- **渐进式框架**：可以只用 Vue 做页面中的一个组件，也可以用它构建完整的单页应用（SPA），不需要一次性重构整个项目。
- **后端友好**：相比 React 的函数式编程风格，Vue 的响应式数据绑定和模板语法对后端开发者更亲切。

## 3、Vue 3 基础语法

通过学习网上的 Vue 教程，发现相比以前的纯手写调用原生 JavaScript，现在的前端开发确实简单了很多。下面是我在学习过程中记录的 Vue 3 核心概念。

### 创建项目

使用 Vite 创建 Vue 3 项目：

```bash
npm create vite@latest my-app -- --template vue
cd my-app
npm install
npm run dev
```

常用 Vite 命令：

| 命令 | 作用 |
|------|------|
| `npm run dev` | 启动开发服务器，支持热更新 |
| `npm run build` | 构建生产版本，输出到 `dist/` |
| `npm run preview` | 本地预览生产构建结果 |

### 响应式数据

Vue 3 的响应式系统让数据和视图自动同步，再也不用手动操作 DOM：

```vue
<script setup>
import { ref, reactive, computed } from 'vue'

// ref 用于基本类型
const count = ref(0)
const increment = () => count.value++

// reactive 用于对象
const form = reactive({ name: '', email: '' })

// computed 计算属性，自动缓存
const displayName = computed(() => form.name || '未填写')
</script>

<template>
  <p>计数：{{ count }}</p>
  <p>姓名：{{ displayName }}</p>
</template>
```

### 条件渲染与列表渲染

```vue
<template>
  <!-- 条件渲染 -->
  <div v-if="loading">加载中...</div>
  <div v-else-if="error">出错了</div>
  <div v-else>
    <!-- 列表渲染 -->
    <ul>
      <li v-for="item in list" :key="item.id">
        {{ item.name }}
      </li>
    </ul>
  </div>
</template>
```

### 事件处理与表单绑定

```vue
<script setup>
import { ref } from 'vue'
const keyword = ref('')

const handleSearch = () => {
  console.log('搜索:', keyword.value)
}
</script>

<template>
  <!-- v-model 双向绑定 -->
  <input v-model="keyword" placeholder="输入关键词" />
  <button @click="handleSearch">搜索</button>
</template>
```

## 4、组件化开发

单文件组件（SFC）是 Vue 的核心概念，`.vue` 文件把模板、脚本、样式放在一起，一个组件一个文件，逻辑清晰。

### 父子组件通信

```vue
<!-- 子组件 SearchBar.vue -->
<script setup>
const props = defineProps({ placeholder: String })
const emit = defineEmits(['search'])

const keyword = ref('')
const onSearch = () => emit('search', keyword.value)
</script>

<template>
  <input v-model="keyword" :placeholder="props.placeholder" />
  <button @click="onSearch">搜索</button>
</template>
```

```vue
<!-- 父组件 -->
<script setup>
import SearchBar from './SearchBar.vue'
const handleSearch = (kw) => { /* 处理搜索 */ }
</script>

<template>
  <SearchBar placeholder="请输入模块名" @search="handleSearch" />
</template>
```

- **props**：父传子，`defineProps` 声明接收的数据。
- **emit**：子传父，`defineEmits` 声明抛出的事件。

## 5、Vue Router 路由

构建分析平台采用 RESTful API 风格设计 URL，层级关系为：项目 → 流水线 → 构建。路由需要支持嵌套关系：

```bash
npm install vue-router
```

路由配置：

```javascript
// router/index.js
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', redirect: '/projects' },
  {
    path: '/projects',
    name: 'projects',
    component: () => import('@/views/ProjectList.vue'),
  },
  {
    path: '/projects/:projectId',
    name: 'projectDetail',
    component: () => import('@/views/ProjectDetail.vue'),
  },
  {
    path: '/projects/:projectId/pipelines',
    name: 'pipelines',
    component: () => import('@/views/PipelineList.vue'),
  },
  {
    path: '/projects/:projectId/pipelines/:pipelineId',
    name: 'pipelineDetail',
    component: () => import('@/views/PipelineDetail.vue'),
  },
  {
    path: '/projects/:projectId/pipelines/:pipelineId/builds',
    name: 'builds',
    component: () => import('@/views/BuildList.vue'),
  },
  {
    path: '/projects/:projectId/pipelines/:pipelineId/builds/:buildId',
    name: 'buildDetail',
    component: () => import('@/views/BuildDetail.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
```

在 `main.js` 中注册：

```javascript
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

createApp(App).use(router).mount('#app')
```

几个关键点：
- **RESTful 路由**：URL 层级清晰，`/projects/:projectId/pipelines/:pipelineId/builds/:buildId` 完整表达了资源归属关系。
- **懒加载**：`() => import(...)` 实现路由级别的代码分割，首屏只加载当前页面。
- **动态路由参数**：在组件中通过 `route.params.projectId`、`route.params.pipelineId`、`route.params.buildId` 获取。
- **编程式导航**：`router.push({ name: 'builds', params: { projectId: '123', pipelineId: '456' } })`。

## 6、Ant Design Vue 常用组件

搭载适配 Vue 的 UI 框架，像我这样的虽然能小改 CSS，但不懂得设计的人，也可以直接使用现成的组件，专注于功能开发了。这点使得 Web 开发有了客户端开发的味道，方便很多。

我选择了 **Ant Design Vue**，它是蚂蚁金服出品的 Vue 3 组件库，组件丰富、文档完善，非常适合企业级后台管理系统。

安装：

```bash
npm install ant-design-vue @ant-design/icons-vue
```

按需引入（推荐，减小打包体积）：

```javascript
// main.js
import { createApp } from 'vue'
import { Button, Table, Form, Input, Layout, Menu } from 'ant-design-vue'

const app = createApp(App)
app.use(Button).use(Table).use(Form).use(Input).use(Layout).use(Menu)
app.mount('#app')
```

### 布局组件

`Layout` 是搭建后台页面结构的基础，提供了常见的侧边栏 + 顶栏 + 内容区布局：

```vue
<script setup>
import { ref } from 'vue'
const collapsed = ref(false)
</script>

<template>
  <a-layout style="min-height: 100vh">
    <!-- 侧边栏 -->
    <a-layout-sider v-model:collapsed="collapsed" collapsible>
      <div class="logo">LOGO</div>
      <a-menu theme="dark" mode="inline">
        <a-menu-item key="1">菜单项一</a-menu-item>
        <a-menu-item key="2">菜单项二</a-menu-item>
        <a-sub-menu key="sub1" title="子菜单">
          <a-menu-item key="3">子项一</a-menu-item>
          <a-menu-item key="4">子项二</a-menu-item>
        </a-sub-menu>
      </a-menu>
    </a-layout-sider>

    <!-- 右侧区域 -->
    <a-layout>
      <a-layout-header style="background: #fff; padding: 0 24px">
        <h2>页面标题</h2>
      </a-layout-header>
      <a-layout-content style="margin: 24px">
        <!-- 页面内容放这里 -->
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>
```

几个布局相关组件的作用：

- **`a-layout`**：最外层布局容器，通常设为 `min-height: 100vh` 铺满屏幕。
- **`a-layout-sider`**：侧边栏，`collapsible` 支持折叠展开，`v-model:collapsed` 控制折叠状态。
- **`a-layout-header`**：顶部栏，放页面标题或面包屑。
- **`a-layout-content`**：主内容区，所有页面内容放在这里面。
- **`a-menu`**：菜单组件，`mode="inline"` 是侧边栏常用模式，配合 `a-sub-menu` 实现多级菜单。

### 其他常用组件

| 组件 | 用途 |
|------|------|
| `a-table` | 数据表格，支持分页、排序、筛选 |
| `a-form` / `a-input` | 表单与输入框，支持校验、双向绑定 |
| `a-modal` | 弹窗对话框 |
| `a-descriptions` | 描述列表，只读信息展示 |
| `a-statistic` | 统计数值展示 |
| `a-tag` | 标签，状态标识 |
| `a-progress` | 进度条 |
| `a-button` | 按钮 |
| `a-select` | 下拉选择器 |

## 7、总结

从前端小白到用 Vue 3 + Ant Design Vue 独立开发构建分析平台，整个过程比预期的顺利。现代前端工程化虽然增加了构建和依赖管理的复杂度，但带来的开发效率提升是巨大的。

如果也有后端开发想学前端，建议直接从 Vue 3 + Vite 入手，跳过 jQuery 和 Webpack 的时代，学习路径更短。选一个成熟的 UI 框架（如 Ant Design Vue），能把更多精力放在业务逻辑上。

每天前进一小步，就是一个新的高度！
