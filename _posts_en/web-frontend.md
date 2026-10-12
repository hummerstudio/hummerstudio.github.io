---
title: Learn Vue and Become a Full-Stack Web Developer!
date: 2025-05-10
author: Tang Moying
categories: [build]
tags: [Vue, Frontend, Ant Design Vue, Web Development]
lang: en
alt_url: /post/web-frontend
---


## 1. From Vanilla JS to Modern Frontend

Back in university I had already taught myself HTML5, CSS3 and JavaScript, and I hand-coded a blog system for writing my personal blog, in order to share technical articles on the school intranet.

But I also knew early on that with the arrival of the Google V8 engine and Node.js, web frontend development had changed beyond recognition: the frontend really is something you have to develop now!

Recently, because I needed to build a build-analysis platform (a web platform for analyzing project build artifacts), I became much more interested in web frontend development. After some initial technology selection, I decided to learn Vue.

## 2. Why I Chose Vue

Among the three mainstream frontend frameworks (React, Vue, Angular), Vue has several advantages that suit my situation:

- **Gentle learning curve**: Vue's template syntax is close to native HTML, very intuitive for anyone with an HTML/CSS/JS background, and there is no need to learn JSX on top of it.
- **Good Chinese ecosystem**: Vue's official documentation has a high-quality Chinese translation, and community tutorials are plentiful.
- **Progressive framework**: You can use Vue for just one component on a page, or use it to build a complete single-page application (SPA); you don't have to refactor the entire project in one go.
- **Backend-friendly**: Compared with React's functional programming style, Vue's reactive data binding and template syntax feel much more familiar to backend developers.

## 3. Vue 3 Basic Syntax

By working through Vue tutorials online, I found that frontend development today really is much simpler than hand-writing calls to native JavaScript as before. Below are the core Vue 3 concepts I noted down while learning.

### Creating a Project

Create a Vue 3 project with Vite:

```bash
npm create vite@latest my-app -- --template vue
cd my-app
npm install
npm run dev
```

Common Vite commands:

| Command | What it does |
|------|------|
| `npm run dev` | Start the development server, with hot reload |
| `npm run build` | Build the production version, output to `dist/` |
| `npm run preview` | Preview the production build locally |

### Reactive Data

Vue 3's reactivity system keeps data and view in sync automatically, so you never have to manipulate the DOM by hand again:

```vue
<script setup>
import { ref, reactive, computed } from 'vue'

// ref is for primitives
const count = ref(0)
const increment = () => count.value++

// reactive is for objects
const form = reactive({ name: '', email: '' })

// computed properties, cached automatically
const displayName = computed(() => form.name || '未填写')
</script>

<template>
  <p>计数：{{ count }}</p>
  <p>姓名：{{ displayName }}</p>
</template>
```

### Conditional Rendering and List Rendering

```vue
<template>
  <!-- Conditional rendering -->
  <div v-if="loading">加载中...</div>
  <div v-else-if="error">出错了</div>
  <div v-else>
    <!-- List rendering -->
    <ul>
      <li v-for="item in list" :key="item.id">
        {{ item.name }}
      </li>
    </ul>
  </div>
</template>
```

### Event Handling and Form Binding

```vue
<script setup>
import { ref } from 'vue'
const keyword = ref('')

const handleSearch = () => {
  console.log('搜索:', keyword.value)
}
</script>

<template>
  <!-- v-model two-way binding -->
  <input v-model="keyword" placeholder="输入关键词" />
  <button @click="handleSearch">搜索</button>
</template>
```

## 4. Component-Based Development

Single-File Components (SFC) are a core Vue concept: a `.vue` file keeps the template, script and styles together, one component per file, with clear logic.

### Parent-Child Component Communication

```vue
<!-- Child component SearchBar.vue -->
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
<!-- Parent component -->
<script setup>
import SearchBar from './SearchBar.vue'
const handleSearch = (kw) => { /* handle the search */ }
</script>

<template>
  <SearchBar placeholder="请输入模块名" @search="handleSearch" />
</template>
```

- **props**: parent to child; `defineProps` declares the data received.
- **emit**: child to parent; `defineEmits` declares the events emitted.

## 5. Vue Router

The build-analysis platform designs its URLs in RESTful API style, with the hierarchy: project → pipeline → build. The routing needs to support nested relationships:

```bash
npm install vue-router
```

Route configuration:

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

Register it in `main.js`:

```javascript
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

createApp(App).use(router).mount('#app')
```

A few key points:
- **RESTful routes**: the URL hierarchy is clear, and `/projects/:projectId/pipelines/:pipelineId/builds/:buildId` fully expresses the ownership relationship between resources.
- **Lazy loading**: `() => import(...)` achieves route-level code splitting, so the first screen only loads the current page.
- **Dynamic route parameters**: get them in a component via `route.params.projectId`, `route.params.pipelineId`, `route.params.buildId`.
- **Programmatic navigation**: `router.push({ name: 'builds', params: { projectId: '123', pipelineId: '456' } })`.

## 6. Common Ant Design Vue Components

Armed with a UI framework adapted for Vue, people like me — who can tweak CSS a little but don't understand design — can use ready-made components directly and focus on developing functionality. This gives web development something of the flavour of client-side development, which is much more convenient.

I chose **Ant Design Vue**, a Vue 3 component library produced by Ant Financial. It has a rich set of components and thorough documentation, and is very well suited to enterprise-grade admin backends.

Installation:

```bash
npm install ant-design-vue @ant-design/icons-vue
```

On-demand imports (recommended, reduces bundle size):

```javascript
// main.js
import { createApp } from 'vue'
import { Button, Table, Form, Input, Layout, Menu } from 'ant-design-vue'

const app = createApp(App)
app.use(Button).use(Table).use(Form).use(Input).use(Layout).use(Menu)
app.mount('#app')
```

### Layout Components

`Layout` is the foundation for structuring an admin page structure; it provides the common sidebar + header + content-area layout:

```vue
<script setup>
import { ref } from 'vue'
const collapsed = ref(false)
</script>

<template>
  <a-layout style="min-height: 100vh">
    <!-- Sidebar -->
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

    <!-- Right-hand area -->
    <a-layout>
      <a-layout-header style="background: #fff; padding: 0 24px">
        <h2>页面标题</h2>
      </a-layout-header>
      <a-layout-content style="margin: 24px">
        <!-- Put the page content here -->
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>
```

What the layout-related components do:

- **`a-layout`**: the outermost layout container, usually set to `min-height: 100vh` to fill the screen.
- **`a-layout-sider`**: the sidebar; `collapsible` supports collapsing and expanding, and `v-model:collapsed` controls the collapsed state.
- **`a-layout-header`**: the top bar, for the page title or breadcrumbs.
- **`a-layout-content`**: the main content area; all page content goes inside it.
- **`a-menu`**: the menu component; `mode="inline"` is the usual mode for a sidebar, and together with `a-sub-menu` it gives you multi-level menus.

### Other Common Components

| Component | Purpose |
|------|------|
| `a-table` | Data table, supports pagination, sorting and filtering |
| `a-form` / `a-input` | Forms and inputs, support validation and two-way binding |
| `a-modal` | Modal dialog |
| `a-descriptions` | Description list, for read-only information display |
| `a-statistic` | Statistical value display |
| `a-tag` | Tag, status indicator |
| `a-progress` | Progress bar |
| `a-button` | Button |
| `a-select` | Dropdown selector |

## 7. Summary

From a frontend beginner to independently developing the build-analysis platform with Vue 3 + Ant Design Vue, the whole process went more smoothly than I expected. Modern frontend engineering has added complexity to builds and dependency management, but the gain in development efficiency it brings is enormous.

If you are also a backend developer who wants to learn frontend, I suggest starting straight from Vue 3 + Vite, skipping the jQuery and Webpack era; the learning path is shorter. Choose a mature UI framework (such as Ant Design Vue) and you can put more energy into the business logic.

A small step forward every day is a new height!
