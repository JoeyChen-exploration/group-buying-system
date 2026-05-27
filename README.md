# 悦味 Baking Studio — 网站与订单系统

面向顾客的烘焙工作室官网、产品展示、订单系统与优惠日活动模块。

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | Next.js 15 (App Router) + TypeScript + Tailwind CSS |
| 后端 | Next.js API Routes |
| 数据库 | PostgreSQL (Prisma ORM) |
| 认证 | JWT (jose) + HttpOnly Cookie |
| 部署 | Vercel + Neon (托管 PostgreSQL) |

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env.local
```

编辑 `.env.local`，填入以下配置：

```env
# 数据库
DATABASE_URL="postgresql://user:password@localhost:5432/yuwei"

# JWT
JWT_SECRET="your-random-secret"

# 应用地址
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# SMTP（邮箱验证）— 推荐 Gmail App Password
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your@gmail.com"
SMTP_PASS="your-16-digit-app-password"
```

> **Gmail App Password 获取方式：** Google 账号 → 安全 → 开启两步验证 → 搜索「App passwords」→ 创建 → 复制 16 位密码填入 `SMTP_PASS`

### 3. 初始化数据库

```bash
# 执行迁移
npm run db:migrate

# 写入初始数据（配送规则 + 管理员账户）
npm run db:seed
```

默认管理员账户：
- 邮箱：`admin@yuewei.com`
- 密码：`Admin@123456`（首次登录后请修改）

### 4. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

## 常用命令

```bash
npm run dev                   # 开发服务器
npm run build                 # 生产构建
npm run db:migrate            # 执行数据库迁移
npm run db:seed               # 写入种子数据（配送规则 + admin 账号）
npm run db:studio             # 打开 Prisma Studio（数据库 GUI）
npm run db:clear-test-users   # 删除所有 customer 测试账号（admin 不受影响）
npm run lint                  # ESLint 检查
```

## 项目结构

```
src/
├── app/
│   ├── api/              # API Routes（后端接口）
│   │   ├── auth/         # 注册、登录、登出
│   │   ├── products/     # 顾客端商品接口
│   │   ├── deal-day/     # 顾客端优惠日接口
│   │   ├── orders/       # 顾客端订单接口
│   │   └── admin/        # 后台接口（需要 staff/admin 权限）
│   ├── (customer)/       # 顾客端页面
│   ├── admin/            # 后台页面
│   └── layout.tsx
├── components/
│   ├── ui/               # 通用 UI 组件
│   ├── customer/         # 顾客端专用组件
│   └── admin/            # 后台专用组件
├── lib/
│   ├── prisma.ts         # Prisma 单例
│   ├── auth.ts           # JWT 工具
│   └── response.ts       # API 响应工具
├── middleware/
│   └── require-auth.ts   # 接口权限校验
└── types/
    └── index.ts          # 类型导出
prisma/
├── schema.prisma         # 数据库 schema
└── seed.ts               # 种子数据
```

## 开发阶段

| Branch | 内容 | 状态 |
|---|---|---|
| `feature/project-setup` | Next.js 初始化、Prisma schema、数据库迁移、环境配置 | ✅ 已合并 |
| `feature/auth` | 注册、登录、邮箱 OTP 验证、JWT session、角色权限中间件 | ✅ 已合并 |
| `feature/products-admin` | 后台商品/分类 CRUD、图片上传、规格管理 | ✅ 已合并 |
| `feature/customer-storefront` | 首页、顾客端产品列表/详情、购物车、结账、我的订单、个人资料、登录守卫 | ✅ 已合并 |
| `feature/order-management` | 后台订单列表/详情、状态流转、搜索排序、XLSX 导出 | ✅ 已推送，待合并 |
| `feature/deal-day-admin` | 后台优惠日 CRUD、团购商品配置；顾客端团购页（预热/进行中/售罄）、购物车集成、库存行锁、每人限购执行 | 🚧 进行中 |
| `feature/reporting` | 销售统计仪表盘、订单归档 | 待开始 |

## 核心业务规则

1. 常规商品仅支持到店自取；配送仅在优惠日活动期间对团购订单开放。
2. 优惠日由管理员创建并启用；顾客端仅在活动存在时显示"团购"入口。
3. 活动开始前可提前展示商品预热（显示商品与团购价），开始时间到达后购买按钮自动解锁。
4. 团购库存扣减在数据库事务内加行锁（`SELECT FOR UPDATE`），彻底防止超卖。
5. 团购每人限购（`perUserLimit`）在事务内查询历史已购量后执行，不可通过多次下单绕过。
6. 订单创建时快照商品名称、规格和价格，历史订单不受后续改价影响。
7. 订单状态流转遵循白名单：`pending → confirmed → preparing → ready → completed`，任意阶段可取消。

## 安全问题追踪

### ✅ 已处理

| 问题 | 处理方式 |
|---|---|
| SQL 注入 | 全程 Prisma ORM，无拼接 SQL |
| XSS | JWT 存 HttpOnly Cookie，前端无法读取 |
| 接口越权 | `requireAuth(roles)` 中间件校验角色 |
| 价格篡改 | 下单时服务端重新从 DB 读取价格，忽略客户端传入的金额 |
| 团购超卖竞态 | 事务内 `SELECT FOR UPDATE` 行锁，排队扣减库存 |
| 团购每人限购绕过 | 事务内查历史已购量与 `perUserLimit` 比较，cancelled 订单不计入 |
| 订单越权访问 | 顾客端订单详情接口验证 `order.userId === session.userId` |
| 状态流转越权 | 管理端状态变更使用白名单 `VALID_TRANSITIONS`，非法跳转被拒绝 |
| 商品/价格快照 | 下单时写入名称与价格快照，历史订单不受改价影响 |

---

### ❌ 尚未处理（待修复）

#### 🔴 高危

**1. 认证接口无频率限制（Rate Limiting）**
- 影响：`/api/auth/login` 可被无限暴力枚举密码；`/api/auth/register` 和 `/api/auth/resend-code` 可被滥用批量发垃圾邮件，耗尽 SMTP 配额
- 修复方向：在 Vercel 层配置 Edge Rate Limiting，或引入 `upstash/ratelimit`（基于 Redis），按 IP + 邮箱限制请求频率

**2. OTP 验证码无暴力破解保护**
- 影响：`/api/auth/verify-code` 对验证码错误无尝试次数限制。6 位数字共 100 万种组合，结合高速请求理论上可遍历
- 修复方向：记录错误尝试次数（写 DB 或 Redis），超过 5 次使验证码作废，强制重新发送

**~~3. 团购每人限购（`perUserLimit`）未执行~~** ✅ 已修复（`feature/deal-day-admin`）

#### 🟡 中危

**4. JWT 无法主动吊销**
- 影响：用户登出仅清除浏览器 Cookie，JWT 本身在 7 天有效期内仍然有效。若 Token 泄露，或管理员修改用户角色，旧 Token 继续生效
- 修复方向：引入 Token 版本号（DB 存 `tokenVersion`），签发时写入，验证时比对；或改用短期 Access Token + Refresh Token 机制

**5. 邮箱枚举漏洞**
- 影响：`/api/auth/verify-code` 在邮箱不存在时返回 `"邮箱不存在"(404)`，攻击者可批量探测哪些邮箱已注册
- 修复方向：统一返回模糊提示，不透露邮箱是否存在

**6. 图片上传缺乏内容校验**
- 影响：后台产品图片上传若仅验证扩展名，攻击者可上传伪装成图片的恶意文件
- 修复方向：验证文件 MIME 类型（读取文件头 Magic Bytes），限制文件大小，仅接受 `image/jpeg`、`image/png`、`image/webp`

#### 🟢 低危 / 待考虑

**7. 无登录失败账号锁定**
- 影响：无限次密码错误不触发锁定，配合无频率限制风险更高
- 修复方向：连续错误 N 次后锁定账号或要求人机验证（CAPTCHA）

**8. 无密码重置流程**
- 影响：用户忘记密码只能联系管理员，体验差且存在社工风险
- 修复方向：实现邮件重置密码流程（发送限时重置链接）

**9. 导出 XLSX 含完整 PII**
- 影响：订单导出包含顾客姓名、邮箱、手机、配送地址。若导出文件外泄，违反隐私保护义务
- 修复方向：记录导出操作日志（谁、何时、导出了哪段数据）；生产环境考虑按需脱敏

**10. 无活跃 Session 管理**
- 影响：用户无法查看或撤销自己的登录设备，管理员无法强制下线账号
- 修复方向：配合第 4 条 Token 版本号机制，增加"退出所有设备"功能

---

## 权限

| 功能 | 顾客 | 店员 | 管理员 |
|---|:---:|:---:|:---:|
| 浏览商品 | ✓ | ✓ | ✓ |
| 下单 | ✓ | — | — |
| 查看/更新订单状态 | — | ✓ | ✓ |
| 导出订单 | — | 可选 | ✓ |
| 商品/分类管理 | — | — | ✓ |
| 优惠日管理 | — | — | ✓ |
| 配送规则配置 | — | — | ✓ |
| 销售统计 | — | 可选 | ✓ |
