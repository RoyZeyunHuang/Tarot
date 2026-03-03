# 塔罗解读 · Tarot Vercel

一个基于 Next.js 15 + Anthropic Claude 的 AI 塔罗牌解读 Web 应用，可安全部署到 Vercel。

---

## Assumptions

- 使用 **Anthropic Claude** API（原始 TSX 调用 `api.anthropic.com`），环境变量名为 `ANTHROPIC_API_KEY`。
- 原始 TSX 中的 `window.storage` 为非标准 API，已替换为 `localStorage`（数据仅存于浏览器本地）。
- 原始模型 ID `claude-sonnet-4-20250514` 保持不变；若遇到模型不存在错误，请在 `components/TarotApp.tsx` 第 346 行更新为有效 ID（如 `claude-3-5-sonnet-20241022`）。

---

## 项目结构

```
tarotvercel/
├── app/
│   ├── layout.tsx          # 根布局
│   ├── page.tsx            # 首页（挂载 TarotApp）
│   ├── globals.css         # 全局样式
│   └── api/
│       └── chat/
│           └── route.ts    # ★ 服务端 Anthropic 代理（API Key 在这里读取）
├── components/
│   └── TarotApp.tsx        # 迁移自 tarot-app-v2.tsx
├── .env.example            # 提交到仓库的变量名示例
├── .env.local              # 本地密钥（git-ignored，绝不提交）
├── next.config.js
├── tsconfig.json
└── package.json
```

---

## 本地运行

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env.local
```

编辑 `.env.local`，填入你的真实 API Key：

```
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxx
```

> ⚠️ **绝对不要**把真实 Key 提交到 git，`.env.local` 已在 `.gitignore` 中。

### 3. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

### 4. 生产构建（本地验证）

```bash
npm run build
npm start
```

---

## 部署到 Vercel

### 第一步：初始化 Git 并推送到 GitHub

```bash
# 在项目根目录执行
git init
git add .
git commit -m "init: Next.js tarot app"

# 在 GitHub 创建一个新仓库（不要勾选 Initialize），然后：
git remote add origin https://github.com/<你的用户名>/<仓库名>.git
git branch -M main
git push -u origin main
```

### 第二步：在 Vercel 导入项目

1. 打开 [https://vercel.com/new](https://vercel.com/new)
2. 点击 **Import Git Repository**，选择刚刚 push 的仓库
3. Framework Preset 选 **Next.js**（通常会自动检测）
4. 点击 **Deploy**（此时先不填 Key，部署后再配置）

### 第三步：配置环境变量

1. 进入 Vercel 项目 → **Settings** → **Environment Variables**
2. 添加：
   - Name: `ANTHROPIC_API_KEY`
   - Value: `sk-ant-xxxxxxxxxxxxxxxxxxxxxxxx`（你的真实 Key）
   - Environments: 勾选 **Production**（和 Preview，按需）
3. 点击 **Save**

### 第四步：触发重新部署

```bash
# 方法一：在 Vercel Dashboard → Deployments → Redeploy
# 方法二：推送一个空 commit
git commit --allow-empty -m "chore: trigger redeploy"
git push
```

### 第五步：验证部署

访问你的 Vercel 域名（如 `https://tarot-xxx.vercel.app`），选择类别、输入问题、抽牌，能收到 AI 解读即成功。

---

## 安全说明（重要）

| 规则 | 说明 |
|------|------|
| API Key 仅在服务器读取 | `ANTHROPIC_API_KEY` 只在 `app/api/chat/route.ts` 中通过 `process.env` 读取 |
| 绝不加 `NEXT_PUBLIC_` 前缀 | 带此前缀的变量会被打包到浏览器端 bundle，造成泄露 |
| 前端只调用本项目路由 | 所有 AI 请求发往 `/api/chat`，而非直接调用 `api.anthropic.com` |
| `.env.local` 被 gitignore | 真实 Key 永远不进入代码仓库 |
| 响应不透传 | 服务端只返回 `{ text: string }`，不将第三方完整响应暴露给客户端 |

---

## 常见问题

**Q: 页面报错 "API key not configured"**  
A: 检查 Vercel 环境变量是否正确填写并触发了重新部署。

**Q: 报错 "model_not_found"**  
A: 将 `components/TarotApp.tsx` 第 346 行的模型 ID 改为你有权限的 Anthropic 模型，如 `claude-3-5-sonnet-20241022`。

**Q: 本地数据（历史、档案）会丢失吗？**  
A: 数据存在浏览器 `localStorage`，清除浏览器缓存或换设备会丢失，这是原始设计行为。
