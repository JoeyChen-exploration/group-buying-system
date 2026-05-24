# 悦味 Baking Studio 网站与订单系统开发计划

本项目为悦味 Baking Studio 建设一个面向顾客的官网、产品展示、订单系统与优惠日活动模块。当前阶段以中文版为主，英文版后续通过翻译能力接入。

## 项目目标

- 顾客可以浏览店铺介绍、产品、优惠日活动，并提交订单。
- 常规订单暂时只支持自提，配送入口可保留但提示“功能目前未开放”。
- 优惠日活动由管理员开启后才对顾客可见。
- 优惠日不是全店优惠，而是管理员上架隐藏款或指定商品到优惠列表。
- 优惠日订单支持预购、限量、剩余数量展示和特定区域配送规则。
- 后台仅保留两级权限：店员、管理员。
- 所有订单需要入库、归档、导出，并支持销售统计。

## 建议技术路线

最终技术栈可以按实际预算和部署环境调整。建议优先选择开发效率高、后期维护简单的方案：

- 前端：Next.js / React
- 后端：Next.js API Routes、NestJS、Laravel 或 Django 任选其一
- 数据库：PostgreSQL 或 MySQL
- 文件存储：本地存储起步，后续可迁移到对象存储
- 部署：Vercel、Render、Railway、云服务器或客户自有主机
- 导出：订单 CSV / Excel

## 开发阶段

### Phase 1：基础官网与常规订单

目标：先完成可上线的最小版本。

- 首页
- 关于我们
- 产品分类与产品列表
- 商品详情
- 顾客注册/登录
- 顾客资料：手机号、所在区域、详细地址
- 购物车
- 常规自提订单
- 订单查询
- 后台登录
- 店员订单管理
- 管理员商品管理
- 管理员内容管理

常规订单规则：

- 仅支持自提。
- 配送选项可以展示，但点击提示“功能目前未开放”。
- 暂不接入在线支付。
- 保留付款方式、支付状态、交易参考号等字段，方便未来接入支付。

### Phase 2：优惠日专区

目标：完成项目核心差异化功能。

- 管理员创建优惠日活动
- 活动开启时间、结束时间
- 活动倒计时
- 预购配送日期
- 优惠日入口开关
- 优惠日专区
- 优惠商品列表
- 隐藏款商品上架
- 指定普通商品加入优惠列表
- 优惠价格
- 可售数量 / 限购数量
- 顾客端剩余数量展示
- 下单后自动扣减数量
- 优惠商品与普通商品混合下单

优惠日展示规则：

- 活动关闭时，顾客看不到优惠日入口。
- 活动未到开始时间时，顾客看不到优惠日入口。
- 活动开启且处于有效时间内，顾客才看到优惠日专区。
- 优惠日不代表全店打折，只有优惠列表里的商品享受优惠价。

### Phase 3：优惠日配送

目标：只为优惠日订单开放配送能力。

配送规则：

- 常规订单不支持配送。
- 优惠日活动开启时，如果订单包含至少一个优惠日商品，可以选择配送。
- 如果顾客只购买普通商品，即使优惠日活动开启，也不支持配送。
- 自取没有起送金额限制。
- 当前配送费固定为 0。

区域起送金额：

| 区域 | 起送金额 | 说明 |
|---|---:|---|
| 东区 | 60 刀 | 普通东区优惠日配送 |
| 东区（含 Flat Bush） | Flat Bush 70 刀 | Flat Bush 属于东区，但使用单独起送金额 |
| 中区 | 50 刀 | 优惠日配送 |
| 西区 | 80 刀 | 优惠日配送 |
| 北岸阳光超市自提点 | 80 刀 | 店里从 Epsom 送到自提点，顾客到自提点取货 |

### Phase 4：后台统计、导出与归档

目标：让门店能日常运营和复盘。

- 所有订单入库
- 订单归档
- 按日期、状态、订单类型筛选
- 导出订单表格
- 管理员仪表盘
- 总销售额
- 总订单数
- 优惠日销售额
- 优惠日订单数
- 热销商品
- 待处理订单提醒

### Phase 5：后续扩展预留

当前不实现，但代码和数据结构尽量预留：

- 英文版接入翻译能力
- 在线支付
- 会员经验值
- 会员等级
- 进度条
- 优惠券
- 评价
- 发票
- 售后退款

## 页面规划

### 顾客端页面

- `/` 首页
- `/about` 关于我们
- `/products` 产品列表
- `/products/[id]` 商品详情
- `/deal-day` 优惠日专区
- `/cart` 购物车
- `/checkout` 结算页
- `/orders/[id]` 订单详情
- `/account` 个人资料
- `/login` 登录
- `/register` 注册

### 后台页面

- `/admin/login` 后台登录
- `/admin/dashboard` 管理员仪表盘
- `/admin/orders` 订单列表
- `/admin/orders/[id]` 订单详情
- `/admin/products` 商品管理
- `/admin/categories` 分类管理
- `/admin/deal-days` 优惠日活动管理
- `/admin/deal-days/[id]/items` 优惠商品列表
- `/admin/delivery-rules` 配送规则配置
- `/admin/content` 内容管理
- `/admin/users` 用户/员工管理
- `/admin/export` 数据导出

## 核心数据模型

### User

- id
- name
- phone
- email
- password_hash
- role: customer / staff / admin
- delivery_area
- address_detail
- language_preference
- member_experience
- member_level
- created_at
- updated_at

### Product

- id
- name_zh
- name_en
- description_zh
- description_en
- category_id
- images
- base_price
- status
- is_hidden
- created_at
- updated_at

### ProductVariant

- id
- product_id
- size
- flavor
- filling
- extra_options
- price_delta
- status

### DealDay

- id
- title_zh
- title_en
- is_enabled
- activity_start_at
- activity_end_at
- show_countdown
- preorder_delivery_date
- delivery_fee
- description_zh
- description_en
- created_by
- created_at
- updated_at

### DealDayItem

- id
- deal_day_id
- product_id
- variant_id
- deal_price
- total_quantity
- sold_quantity
- remaining_quantity
- per_order_limit
- per_user_limit
- status

### Order

- id
- order_number
- user_id
- order_type: regular / deal_day / mixed
- status
- fulfillment_method: pickup / delivery
- subtotal
- delivery_fee
- total_amount
- payment_method
- payment_status
- payment_reference
- pickup_store
- pickup_time
- delivery_area
- delivery_address
- preorder_delivery_date
- archived_at
- created_at
- updated_at

### OrderItem

- id
- order_id
- product_id
- variant_id
- deal_day_item_id
- product_name_snapshot
- variant_snapshot
- quantity
- unit_price
- line_total
- is_deal_day_item

### DeliveryRule

- id
- area_name
- min_order_amount
- delivery_fee
- description
- is_enabled

## 关键业务规则

1. 普通订单只支持自提。
2. 普通订单点击配送时提示“功能目前未开放”。
3. 优惠日活动只有管理员能开启和配置。
4. 优惠日关闭时，顾客端隐藏优惠日入口。
5. 优惠日商品必须有限购或可售数量。
6. 顾客购买优惠商品后，系统扣减剩余数量。
7. 顾客可以看到优惠商品剩余数量。
8. 优惠商品可以和普通商品放在同一个订单。
9. 订单包含至少一个优惠日商品，才可进入优惠日配送规则。
10. 只买普通商品不支持配送。
11. 优惠日订单是预购单，不支持当天配送。
12. 管理员必须填写预购配送日期。
13. 当前配送费为 0。
14. 所有订单必须保存、归档、可导出。
15. 后台只保留店员和管理员两级权限。

## 接口规划

### 顾客端接口

- `GET /api/products`
- `GET /api/products/:id`
- `GET /api/deal-day/active`
- `POST /api/cart`
- `POST /api/orders`
- `GET /api/orders/:id`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/me`
- `PATCH /api/me`

### 后台接口

- `GET /api/admin/dashboard`
- `GET /api/admin/orders`
- `GET /api/admin/orders/:id`
- `PATCH /api/admin/orders/:id/status`
- `POST /api/admin/products`
- `PATCH /api/admin/products/:id`
- `POST /api/admin/deal-days`
- `PATCH /api/admin/deal-days/:id`
- `POST /api/admin/deal-days/:id/items`
- `PATCH /api/admin/deal-day-items/:id`
- `GET /api/admin/delivery-rules`
- `PATCH /api/admin/delivery-rules/:id`
- `GET /api/admin/orders/export`

## 权限规划

| 功能 | 店员 | 管理员 |
|---|---:|---:|
| 查看订单 | 是 | 是 |
| 更新订单状态 | 是 | 是 |
| 导出订单 | 可选 | 是 |
| 商品管理 | 否 | 是 |
| 优惠日活动管理 | 否 | 是 |
| 配送规则配置 | 否 | 是 |
| 内容管理 | 否 | 是 |
| 用户/员工管理 | 否 | 是 |
| 销售统计 | 可选查看 | 是 |

## 开发顺序建议

1. 建立项目框架、数据库连接、登录权限。
2. 完成商品、分类、图片和后台商品管理。
3. 完成顾客端产品浏览和商品详情。
4. 完成购物车和常规自提订单。
5. 完成后台订单管理和订单状态流转。
6. 完成优惠日活动管理和优惠商品列表。
7. 完成优惠日专区、库存扣减和剩余数量展示。
8. 完成优惠日配送规则、区域起送金额校验。
9. 完成订单导出、归档和销售统计。
10. 做移动端适配、表单校验、错误提示和上线前测试。

## 测试重点

- 活动关闭时，顾客端不能看到优惠日入口。
- 活动开启时，顾客端可以看到优惠日专区。
- 优惠商品下单后库存正确扣减。
- 剩余数量不能低于 0。
- 普通订单不能选择配送。
- 只买普通商品不能选择配送。
- 混合订单包含优惠商品时，可以按优惠日规则配送。
- 区域起送金额校验正确。
- 北岸阳光超市自提点规则正确。
- 所有订单都能在后台查询、归档和导出。
- 店员不能进入管理员配置页面。
- 管理员能看到销售统计。

## 当前文档

- `悦味Baking_Studio.docx`：给甲方看的需求确认书。
- `悦味Baking_Studio_网站订单系统_SRS.docx`：更细的需求规格说明书。

## 后续待细化

- 优惠商品限购按每单、每人，还是两者都限制。
- 英文版后续如何接入翻译能力。
- 未来在线支付服务商、商户主体和对账规则。
- 会员经验值和等级规则的具体计算方式。
