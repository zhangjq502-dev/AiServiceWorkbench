# AI 智能客服工作台 - 学习 & 开发路线图

## 项目目标
用 React + TypeScript + Node.js 独立实现一个 AI 辅助客服工作台（对标你在"电信SCRM客服工作台"工作中做过的真实场景），作为个人项目补充简历，同时系统补齐 React 技能中 `useEffect`、TypeScript、状态管理、路由等缺口。

**项目定位**：不拼代码量，拼深度。每个模块都要能经得起面试官追问（为什么这么做、遇到什么坑、怎么量化效果）。

## 技术栈
- 前端：React 19 + TypeScript + Vite + Zustand + React Router + Ant Design v5 + ECharts
- 后端：Node.js + Express + TypeScript + ws（WebSocket）+ SSE + Zod + JWT
- 数据库：Prisma ORM + SQLite（本地开发）→ PostgreSQL（Neon，线上部署）
- 认证：双 Token（JWT）+ GitHub OAuth2.0 + Keycloak（OIDC / SSO）
- AI：可插拔 Provider，mock 与真实大模型 API 用环境变量切换
- 工程化：Git（feature 分支 + PR + Conventional Commits）、husky + commitlint、GitHub Actions CI、pnpm monorepo

## 你的能力基线（2026-10-12 评估）
**已经扎实的**：JSX、函数/类组件、props、`useState`、`useRef`、受控表单、事件处理、条件渲染、Portal、diff/key 原理

**本项目要补的缺口**：
- [ ] `useEffect`（数据请求、副作用、清理函数）—— 最大缺口
- [ ] 自定义 Hook 封装
- [x] TypeScript + React（给 props/state/事件加类型）—— 阶段 1 已入门
- [ ] 状态管理（Zustand，对标你熟悉的 Pinia）
- [ ] React Router 多页面
- [ ] WebSocket 在 React 里的正确封装方式（你 Vue 项目里做过，这次用 Hook 方式重做）
- [ ] Ant Design 等组件库接入
- [ ] 性能优化（`memo`/`useMemo`/`useCallback`，对应你做过的虚拟列表优化经验）
- [ ] 身份认证（OAuth2.0 / OIDC / JWT / SSO）—— 对标 JD 要求新增
- [ ] Git 工作流 & 工程化 —— 对标 JD 要求新增

---

## 产品设计

### 一、功能规划

**P0 · 核心闭环（必须做）**

| 模块 | 功能 |
|---|---|
| 客户模拟端 | 独立页面 `/customer`，扮演客户发消息。**很关键**：没它就没法演示，面试官打开 Demo 只能看到一个空工作台 |
| 会话列表 | 按"待接入 / 进行中 / 已结束"分组，显示未读数、最后一条消息、时间，支持搜索 |
| 聊天窗口 | 实时收发（WebSocket）、历史消息加载、发送状态（发送中 / 已送达 / 失败重发） |
| 坐席登录 | 登录鉴权，坐席状态切换（在线 / 忙碌 / 离开） |

**P1 · AI 能力（项目亮点）**

| 功能 | 说明 |
|---|---|
| AI 回复建议 | 客户发来消息后自动生成 2~3 条候选回复，一键采纳或编辑后发送，流式输出 |
| 会话摘要 | 会话结束时自动生成摘要（问题、处理结果、待跟进事项） |
| 意图 / 情绪识别 | 给会话打标签（"投诉"、"情绪激动"），会话列表高亮 |
| 快捷话术库 | 输入 `/` 唤出常用话术 |

**P2 · 加分项（时间够再做）**
- 数据仪表盘：会话量、平均首次响应时长、**AI 建议采纳率**（体现产品思维的好指标）
- 知识库问答（RAG）：上传 FAQ，AI 基于知识库回答
- 会话转接给其他坐席

**管理后台 `admin`（独立前端应用，为 SSO 提供真实场景）**：坐席管理、话术库管理、数据仪表盘

### 二、UI 设计

经典客服**三栏布局**：

```
┌────────────────────────────────────────────────────────────────┐
│ Logo  工作台 | 仪表盘 | 话术库              ● 在线 ▾   张三 ▾ │
├──────────────┬────────────────────────────┬────────────────────┤
│ 🔍 搜索会话   │  客户A · 宽带报修    [结束]  │ 👤 客户信息         │
│ [进行中 3]    │                            │ 手机 / 套餐 / 标签   │
│ ┌──────────┐ │   ┌──────────────┐         ├────────────────────┤
│ │客户A  ②  │ │   │ 网络断了...   │         │ ✨ AI 助手          │
│ │网络断了.. │ │   └──────────────┘         │ 意图：故障报修       │
│ └──────────┘ │        ┌──────────────┐     │ 情绪：😠 焦急        │
│ ┌──────────┐ │        │ 您好，请问...  │     │ ── 建议回复 ──       │
│ │客户B     │ │        └──────────────┘     │ ① 非常抱歉... [采纳] │
│ └──────────┘ │                            │ ② 请您先重启... [采纳]│
│ [待接入 2]    ├────────────────────────────┤ ────────────────     │
│ [已结束]      │ /话术  😊  📎   [ 发送 ]    │ 📝 会话摘要          │
└──────────────┴────────────────────────────┴────────────────────┘
   ~280px              自适应                     ~320px
```

- **Ant Design v5**：`Layout` / `List` / `Badge` / `Tabs` / `Card` 搭骨架，中后台风格和客服工作台契合
- **聊天气泡自己写**：气泡、自动滚到底部、加载历史时保持滚动位置，都是练 `useRef` + `useEffect` 的好素材
- **图表**：ECharts（`echarts-for-react`），Vue 时期的经验可直接迁移
- **主题**：`ConfigProvider` 统一主题色，AI 相关模块用紫色系区分

### 三、后端选型

| 层 | 选择 | 理由 |
|---|---|---|
| 框架 | **Express + TS** | 够轻、资料多，精力放在业务上；NestJS 概念多（装饰器、DI、模块），会分散精力 |
| 分层 | `routes → services → db` | 不把逻辑全堆在路由里，面试能讲清分层 |
| 实时通信 | **`ws` 库，不用 Socket.IO** | Socket.IO 自带重连 / 心跳，用了就学不到；手写心跳、重连、消息补拉才是亮点 |
| AI 流式 | SSE（`text/event-stream`） | 单向推送，比 WebSocket 简单，正好适合大模型输出 |
| 鉴权 | JWT（`jsonwebtoken`）+ `bcrypt` | 标准做法，阶段 8 再升级为完整认证体系 |
| 参数校验 | **Zod** | 校验规则和 TS 类型一份定义，前后端可共用（放 `shared` 包） |

### 四、数据库选型

**Prisma ORM + 本地 SQLite → 部署时切 PostgreSQL（Neon 免费版）**
- **本地用 SQLite**：零配置，数据库就是一个文件，不用装 MySQL / Docker
- **部署换 PostgreSQL**：Render 等免费平台磁盘是临时的，重启后 SQLite 文件会丢；Prisma 改 `provider` + 连接串即可切换
- **用 Prisma**：根据 schema 自动生成 TS 类型，查询结果有完整类型提示，继续练 TS
- **不上 Redis**：这个规模用不上，硬加反而会被追问"为什么要用"

**核心数据表（初稿，用到时再细化）**：
```
Agent         坐席：id, name, password, status
Customer      客户：id, name, phone, tags
Conversation  会话：id, customerId, agentId, status(waiting/active/closed), summary, intent, emotion
Message       消息：id, conversationId, sender(customer/agent/ai), content, status, createdAt
QuickReply    话术：id, title, content
AiSuggestion  AI建议：id, messageId, content, adopted(是否采纳)  ← 用来算采纳率
```

---

## JD 对标（目标岗位要求）

> 4. 熟悉现代 Web 构建工具和 Git 工作流，掌握复杂的前端状态管理，熟悉 WebSocket / SSE 等长连接与流式数据交互技术；
> 5. 熟悉常见的身份认证协议与机制（如 OAuth2.0、OIDC、JWT），有统一账号体系、单点登录（SSO）或跨域状态同步的实际落地经验；

| JD 要求 | 项目中对应的落地点 | 所在阶段 |
|---|---|---|
| 现代 Web 构建工具 | Vite 代理 / 多环境变量、路由懒加载代码分割、产物体积分析、pnpm monorepo | 1、10 |
| Git 工作流 | feature 分支 + PR、Conventional Commits、husky + commitlint、GitHub Actions CI | **贯穿全程** |
| 复杂前端状态管理 | Zustand 多 slice、消息范式化、乐观更新与回滚、WS / SSE / REST 多数据源合并 | 3、5、7 |
| WebSocket / SSE | 心跳、指数退避重连、断线补拉；SSE 流式输出、AbortController 中断 | 5、7 |
| JWT | 双 Token、无感刷新、并发 401 请求排队、WS 握手鉴权 | 8 |
| OAuth2.0 | GitHub 登录：授权码模式 + `state` + PKCE | 8 |
| OIDC / 统一账号体系 | Keycloak 作为 IdP，工作台和 admin 都通过 OIDC 接入 | 8 |
| SSO | 工作台登录后 admin 免登，单点登出 | 8 |
| 跨域 / 跨标签页状态同步 | `BroadcastChannel` 同步 token 刷新与退出登录 | 8 |

**⚠️ 提醒**：JD 写的是"实际落地经验"，个人项目能证明"懂且做过"，但分量比工作经历轻。
- 回忆 SCRM 工作台的登录方式（电信系统大概率有统一门户 / SSO），如果对接过，哪怕只是前端 token 处理部分，也写进工作经历，个人项目作补充
- 面试必须能讲原理，不能只会配置：
  - 授权码模式为什么要配 PKCE？
  - `id_token` 和 `access_token` 的区别？
  - refresh token 被盗怎么办？（refresh token 轮换 rotation）
  - access token 为什么放内存、refresh token 为什么放 httpOnly Cookie？

---

## 阶段路线图

### 贯穿全程：Git 工作流（从现在开始，越早越好，提交历史本身就是证据）
- [ ] `git init`、配置 `.gitignore`、推送到 GitHub
- [ ] 每个功能开 feature 分支，通过 PR 合并到 main
- [ ] Conventional Commits 提交规范（`feat:` / `fix:` / `refactor:` / `docs:`），husky + commitlint 强制检查
- [ ] GitHub Actions CI：每个 PR 自动跑 lint、类型检查、测试、构建

### 阶段 0：脚手架搭建 ✅ 已完成（2026-10-12）
- [x] 创建前端项目（Vite + React + TS + ESLint）
- [x] 验证前端能跑起来
- [x] 创建后端项目（Express + TS + tsx）
- [x] 后端起了一个 `GET /api/ping` 接口

### 阶段 1：TypeScript + React 基础强化 ✅ 已完成（2026-10-12）
- [x] 给一个简单组件的 props 写 `interface`（`PingCard`）
- [x] `useState` 配合泛型类型标注（`useState<PingResponse | null>(null)`）
- [x] 事件处理函数的类型写法（`React.ChangeEvent<HTMLInputElement>`）
- [x] Vite `server.proxy` 代理 `/api` 到后端，前后端打通

### 阶段 2：`useEffect` + 自定义 Hook（重点）
- [ ] 后端接入 Prisma + SQLite，建表、写种子数据（seed）
- [ ] 后端接口：`GET /api/conversations`、`GET /api/conversations/:id/messages`（routes → services → db 分层）
- [ ] 前端用 `useEffect` 请求会话列表
- [ ] 封装 `useFetch` 或 `useConversations` 自定义 Hook
- [ ] 理解依赖数组、清理函数（请求竞态 / 组件卸载时取消请求）、避免无限循环

### 阶段 3：Zustand 全局状态管理
- [ ] 对比 Pinia 的写法理解 Zustand store
- [ ] 把会话列表、当前选中会话放进全局 store
- [ ] 按领域拆 slice：会话 / 消息 / 坐席 / AI
- [ ] 消息按 `conversationId` 范式化存储
- [ ] **乐观更新**：消息先上屏，失败回滚 + 重发
- [ ] selector 精细订阅，避免无关组件重渲染

### 阶段 4：React Router 多页面
- [ ] 工作台 / 仪表盘 / 话术库 / 客户模拟端 `/customer` 路由
- [ ] 嵌套路由、路由参数（会话 id）
- [ ] 路由守卫（未登录跳转登录页）
- [ ] 路由懒加载（`React.lazy` + `Suspense`），为代码分割做准备

### 阶段 5：WebSocket 实时通信
- [ ] 后端 `ws` 服务：坐席端、客户端连接管理，消息转发
- [ ] 封装 `useWebSocket` Hook：连接、心跳、指数退避重连、清理
- [ ] 断线恢复后补拉离线消息，消息去重与顺序保证
- [ ] 消息实时推送到聊天窗口，WS 事件写入 Zustand store

### 阶段 6：Ant Design 接入
- [ ] 三栏布局（`Layout`）、会话列表、表单用 Ant Design 组件重做
- [ ] 聊天气泡自己实现：自动滚到底部、加载历史保持滚动位置
- [ ] `ConfigProvider` 统一主题

### 阶段 7：AI 回复/摘要功能
- [ ] 后端预留可插拔的 AI Provider 接口（先 mock，后续换真实 API）
- [ ] 前端：AI 回复建议、一键采纳；会话摘要；意图 / 情绪标签
- [ ] **接入真实大模型 API**（mock Provider 保留，用环境变量切换；API Key 只放后端 `.env`，不进前端、不进 git）
- [ ] **SSE 流式输出**：后端 `text/event-stream` 转发模型流，前端逐字渲染（打字机效果）
- [ ] **请求中断**：`AbortController` 支持"停止生成"，切换会话时自动取消上一个流
- [ ] 异常兜底：超时、限流、模型报错时的降级提示
- [ ] 记录 AI 建议是否被采纳（`AiSuggestion.adopted`），用于仪表盘统计采纳率

### 阶段 8：统一认证体系 ★ 对标 JD 第 5 条新增
- [ ] 新建 **admin 管理后台**（独立前端应用、不同端口 / 域名）：坐席管理、话术库、仪表盘 —— 有两个应用才有真实 SSO 场景
- [ ] ① **双 Token**：access token 存内存，refresh token 存 httpOnly Cookie；axios 拦截器无感刷新，并发 401 请求排队只刷新一次；refresh token 轮换；WebSocket 握手校验 token
- [ ] ② **OAuth2.0**：「GitHub 登录」，授权码模式 + `state` 防 CSRF + PKCE，后端用 code 换 token
- [ ] ③ **OIDC / 统一账号**：Docker 跑 **Keycloak** 作为统一身份中心（IdP），工作台与 admin 都通过 OIDC 接入；理解发现文档（`.well-known/openid-configuration`）、`id_token`、JWKS 验签
- [ ] ④ **SSO**：工作台登录后打开 admin 直接免登；一处退出两处都退出（OIDC 单点登出）
- [ ] ⑤ **多标签页状态同步**：`BroadcastChannel` 同步 token 刷新、退出登录，避免多个标签页并发刷新 token
- [ ] 整理面试八股：PKCE 原理、`id_token` vs `access_token`、token 存储位置取舍、refresh token 被盗应对

### 阶段 9：性能优化
- [ ] 消息列表虚拟滚动（`react-window` 或 `react-virtuoso`，处理不定高）
- [ ] `memo`/`useMemo`/`useCallback` 实际场景应用
- [ ] 用 React DevTools Profiler 量化优化前后数据（写进简历）

### 阶段 10：工程化 + 部署收尾
- [ ] **pnpm monorepo**：`client` / `admin` / `server` / `shared`（前后端共用 Zod schema 和类型）
- [ ] `rollup-plugin-visualizer` 分析产物体积，代码分割优化前后对比
- [ ] 多环境变量（`.env.development` / `.env.production`）
- [ ] Vitest 测试自定义 Hook 和关键 service
- [ ] **部署上线**：前端（Vercel / Netlify）+ 后端（Render / Railway / 云服务器）+ 数据库（Neon PostgreSQL），拿到可公开访问的在线 Demo 链接
- [ ] 线上环境配置：环境变量、CORS 白名单、WebSocket 走 `wss://`
- [ ] README：在线 Demo 链接、截图 / GIF、架构图、技术决策说明（为什么选 Zustand、为什么不用 Socket.IO、虚拟列表方案对比等）
- [ ] 简历项目描述打磨（写成"技术点 + 量化结果"，不写功能清单）

**简历描述参考写法**：
> - 封装 `useWebSocket` Hook，实现心跳检测与指数退避重连，断线恢复后自动补拉离线消息；
> - 基于 react-virtuoso 实现不定高消息列表虚拟滚动，万条消息下滚动保持 60fps；
> - 设计可插拔 AI Provider 层，支持 SSE 流式输出与请求中断；
> - 基于 Keycloak + OIDC 搭建统一认证中心，实现工作台与管理后台单点登录、单点登出及多标签页登录态同步。

---

## 操作步骤（阶段 0）

### 1. 创建前端项目
在 `~/AiServiceWorkbench` 目录下执行：
```bash
cd ~/AiServiceWorkbench
npm create vite@latest client -- --template react-ts
```
说明：
- `npm create vite@latest` 是 Vite 官方提供的脚手架工具，会交互式或直接生成一个前端项目模板
- `client` 是项目目录名（前端代码都放这里）
- `--template react-ts` 指定用 React + TypeScript 模板（不是普通 JS，这样我们才能顺带把 TS 补上）

### 2. 安装依赖并启动
```bash
cd client
npm install
npm run dev
```
说明：
- `npm install` 根据 `package.json` 下载所有依赖包到 `node_modules`
- `npm run dev` 启动本地开发服务器，终端会打印一个地址（通常是 `http://localhost:5173`），浏览器打开能看到 Vite + React 默认页面（旋转的 React 图标）就算成功

### 3. 创建后端项目
```bash
cd ~/AiServiceWorkbench
mkdir server && cd server
npm init -y
```
说明：
- `npm init -y` 用默认配置生成一个空的 `package.json`，后续再装 Express、TypeScript 等依赖

### 4. 安装后端依赖
```bash
npm install express cors
npm install -D typescript @types/node @types/express @types/cors tsx
```
说明：
- `express`：Node.js 最常用的 web 框架，用来写接口、路由
- `cors`：解决前端（5173端口）请求后端（3000端口）跨域的问题
- `typescript`：TS 编译器本体
- `@types/node` / `@types/express` / `@types/cors`：给这几个本身是 JS 写的库补充 TS 类型定义，让 TS 能检查到它们的用法
- `tsx`：直接运行 `.ts` 文件并支持热重载，不用先手动编译成 `.js` 再运行

### 5. 创建 `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```
这是 TypeScript 编译器的配置文件——告诉编译器"用什么规则把 `.ts` 转成 `.js`、要不要做严格类型检查"，概念上跟 `vite.config.js`、`babel.config.js` 是一类东西。逐项含义：

| 配置项 | 作用 |
|---|---|
| `target: "ES2020"` | 编译产物兼容到 ES2020 语法（后端跑在 Node.js 里，不用担心浏览器兼容，可以设得比较新） |
| `module` / `moduleResolution: "NodeNext"` | 现代 Node.js 项目推荐的模块系统预设，会跟着 `package.json` 里的 `"type"` 字段走 |
| `strict: true` | **最重要的一项**：开启所有严格类型检查的总开关（杜绝隐式 any、空值乱用等）。学习阶段必须开，不开约等于没用 TS |
| `esModuleInterop: true` | 让老牌 CommonJS 库（如 `express`）可以用 `import express from 'express'` 这种现代写法导入，不开容易到处报错 |
| `skipLibCheck: true` | 跳过对第三方库类型文件的检查，减少无关报错、加快编译速度 |
| `outDir` / `rootDir` | 源码在 `src`，编译产物输出到 `dist`（开发阶段用 `tsx` 直接跑 `.ts`，这两项是给以后生产部署执行 `tsc` 编译用的） |
| `include: ["src"]` | 只处理 `src` 目录下的文件 |

### 6. 写第一个接口 `src/index.ts`
```ts
import express from "express";
import cors from "cors";

const app = express()
const PORT = 3000

app.use(cors())
app.use(express.json())

app.get('/api/ping',(req,res)=> {
  res.json({
    message:'pong',
    time: new Date().toISOString()
  })
})

app.listen(PORT,() => {
  console.log(`Server running at http://localhost:${PORT}`)
})
```
逐行作用：
- `const app = express()`：创建一个 Express 应用实例，后面所有路由、中间件都挂在这个 `app` 上
- `app.use(cors())` / `app.use(express.json())`：**中间件**，每个请求进来都会先经过这些函数处理。`cors()` 处理跨域；`express.json()` 自动把请求体里的 JSON 字符串解析成 JS 对象（不加这个 `req.body` 会是 `undefined`）
- `app.get('/api/ping', (req, res) => {...})`：定义一条 GET 路由，`req` 是请求对象，`res` 是响应对象，用来返回数据给前端
- `app.listen(PORT, ...)`：启动服务器监听 3000 端口，回调在服务器成功启动后执行一次

### 7. 配置启动脚本
`server/package.json` 里 `"scripts"` 改成：
```json
"scripts": {
  "dev": "tsx watch src/index.ts"
}
```
**踩坑记录**：第一次手滑把 key 写成了 `"test"`，导致要用 `npm run test` 才能启动，容易和"跑测试"的惯例混淆。按 npm 约定，启动开发服务器的脚本统一叫 `"dev"`，前后端命令保持一致好记。

### 8. 启动验证
```bash
npm run dev
```
终端打印 `Server running at http://localhost:3000` 即成功，浏览器访问 `http://localhost:3000/api/ping` 能看到 `{"message":"pong","time":"..."}`。

---

## 操作步骤（阶段 1）

### 1. Vite 代理
`client/vite.config.ts` 加 `server.proxy`，把 `/api` 开头的请求转发到 `http://localhost:3000`。前端只写 `fetch('/api/ping')`，浏览器认为是同源请求，不触发跨域；对应 Vue 项目里的 `devServer.proxy`。改完要重启 `npm run dev`。

### 2. 类型文件 `client/src/type.ts`
```ts
export interface PingResponse {
  message: string
  time: string
}
```
和后端 `res.json({...})` 的结构一一对应，后续会话、消息等类型也放这里。

### 3. 带 props 类型的组件 `client/src/components/PingCard.tsx`
- `interface PingCardProps` 描述 props，解构时 `({ data, loading, error, onRefresh }: PingCardProps)`
- **`import type`**：只导入类型。Vite 模板开启了 `verbatimModuleSyntax`，导入类型不加 `type` 会报错
- **`PingResponse | null`**：联合类型，没先判断 `data &&` 就直接用 `data.message` 会报错——这就是 `strict` 在防空指针
- **`onRefresh: () => void`**：函数类型的 prop，相当于 Vue 的 `emit`。React 没有 emit，子组件通知父组件就是调用父组件传下来的函数

### 4. App 里管理状态 + 发请求
- **`useState<PingResponse | null>(null)`**：初始值是 `null` 时必须写泛型，否则类型被推断成 `null`，之后无法 `setData(json)`；`useState(false)` 能自动推断成 `boolean`，不用写
- **`React.ChangeEvent<HTMLInputElement>`**：事件类型，尖括号里是触发事件的 DOM 元素类型。常用还有 `React.MouseEvent<HTMLButtonElement>`、`React.FormEvent<HTMLFormElement>`
- **`catch (e)`** 的 `e` 在 strict 模式下是 `unknown`，要先 `e instanceof Error` 收窄类型才能访问 `.message`
- 这一阶段故意用按钮点击触发请求，**不用 `useEffect`**，把 `useEffect` 留到阶段 2 专门学

### 5. 验证
- 点按钮显示 `pong @ 时间` ✅
- 停掉后端再点，显示红色错误信息 ✅

---

## 当前进度
**阶段 0、阶段 1 已完成**（2026-10-12）：前后端通过 Vite 代理打通，前端能请求 `/api/ping` 并展示结果，掌握了 props / state / 事件的 TS 类型写法。产品设计、技术选型、JD 对标已确定（见上文）。

**下一步**：
1. **Git 初始化**：`git init` + `.gitignore` + 第一次提交 + 推送 GitHub
2. **阶段 2**：后端接入 Prisma + SQLite（建表 + 种子数据 + 会话列表接口），前端用 `useEffect` 请求会话列表并封装 `useConversations` Hook
