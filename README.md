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
- 邮箱：`admin@yuwei.com`
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
| `feature/project-setup` | Next.js 初始化、Prisma schema、数据库迁移、环境配置 | ✅ 已完成 |
| `feature/auth` | 注册、登录、邮箱 OTP 验证、JWT session、角色权限中间件 | ✅ 已完成 |
| `feature/products-admin` | 后台商品/分类 CRUD、图片上传 | 进行中 |
| `feature/products-customer` | 顾客端产品列表、商品详情 | 待开始 |
| `feature/cart-checkout` | 购物车、常规自提订单 | 待开始 |
| `feature/order-management` | 后台订单管理、状态流转 | 待开始 |
| `feature/deal-day-admin` | 优惠日活动管理、优惠商品配置 | 待开始 |
| `feature/deal-day-customer` | 优惠日专区、库存扣减、剩余数量展示 | 待开始 |
| `feature/delivery` | 配送规则、区域起送金额校验、混合订单配送资格 | 待开始 |
| `feature/reporting` | 订单导出、归档、销售统计仪表盘 | 待开始 |

## 核心业务规则

1. 常规订单仅支持自提；配送入口展示但提示"功能未开放"。
2. 优惠日活动由管理员开启，关闭期间顾客端不显示入口。
3. 订单包含至少一个优惠日商品时，才可选择优惠日配送规则。
4. 只购买普通商品不支持配送，即使优惠日活动开启。
5. 优惠日库存扣减使用数据库行锁，防止超卖。
6. 所有订单快照商品名称和规格，历史订单不受商品改名影响。

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
