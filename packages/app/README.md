# Liot Frontend

本项目是一个基于 Next.js App Router 的轻量 IoT 管理前端，覆盖设备管理、消息归档、命令下发、状态可视化和基础认证能力。

## 1. 现有功能

### 1.1 认证与访问控制

- 提供基本的多用户功能。

### 1.2 设备与模板管理

- 支持设备列表与设备详情。
- 支持按模板创建设备。
- 模板定义协议消息、状态字段、主题和 payload 渲染规则，设备行为由模板驱动。

### 1.3 MQTT 运行时与消息处理

- 支持内嵌 MQTT broker（可关闭），并连接 MQTT 客户端进行收发。
- 支持 request 命令下发并等待 response。
- 支持消息归档与解析，支持异常消息判定。
- 支持多实例场景下的 ingest 角色控制，降低重复入库风险。

### 1.4 设备消息历史

- 设备详情中提供消息历史查询。
- 可展示消息类型、消息 ID、参数、时间等信息。
- 对常见异常进行标记。

### 1.5 状态展示与图表

- 设备状态字段展示。
- 对数字类型状态支持历史曲线图。
- 支持时间范围切换与手动拉取历史。

## 2. 技术栈与架构

### 2.1 技术栈

- 框架与语言：Next.js 16、React 19、TypeScript
- UI：Tailwind CSS v4、Radix UI、shadcn 风格组件
- 认证：better-auth
- 数据层：Drizzle ORM + PostgreSQL
- IoT 通信：mqtt + aedes
- 图表：Recharts
- 日志：pino + pino-pretty

### 2.2 核心架构

- 路由层（src/app）
	- 页面、布局、API 路由。
- 组件层（src/comps）
	- 通用 UI 组件、表单组件、dashboard 业务组件。
- 领域层（src/lib）
	- auth：认证能力
	- db：数据库连接、schema、初始化
	- devices：设备业务与命令流程
	- mqtt：MQTT runtime、请求响应、消息入库
	- device-templates：协议模板与渲染/解析工具
- 数据迁移（drizzle）
	- SQL 迁移文件和元信息。

## 3. 开发流程

### 3.1 本地准备

1. 安装 Node.js 20+ 与 pnpm。
2. 准备 PostgreSQL 实例。
3. 进入 frontend 目录安装依赖：

```bash
pnpm install
```

### 3.2 配置环境变量

在 frontend 目录创建环境文件（建议同时提供给 Next 运行时和 Drizzle CLI）：

```bash
cp .env.example .env.local
cp .env.example .env
```

如果仓库中没有 .env.example，可按下文“部署流程”手工创建。

### 3.3 初始化数据库

```bash
pnpm db:migrate
```

如需根据 schema 重新生成迁移：

```bash
pnpm db:generate
pnpm db:migrate
```

### 3.4 启动开发与联调

启动前端：

```bash
pnpm dev
```

可选：启动 mock 设备模拟上报和响应：

```bash
pnpm mock:device
```

可选：运行 ingest 冒烟测试：

```bash
pnpm e2e:ingest
```

### 3.5 质量检查

```bash
pnpm check
pnpm lint
```

## 4. 部署流程（含环境变量）

### 4.1 部署前准备

1. 准备 PostgreSQL。
2. 准备 MQTT 服务（可使用内嵌 broker，生产建议使用独立 broker）。
3. 在部署环境注入环境变量。
4. 先执行数据库迁移，再构建并启动应用。

### 4.2 环境变量清单

必需变量：

- DATABASE_URL
	- PostgreSQL 连接串。
	- 示例：postgres://user:password@127.0.0.1:5432/liot

推荐变量（生产环境建议明确配置）：

- MQTT_URL
	- MQTT broker 地址。
	- 默认：mqtt://127.0.0.1:1883
- MQTT_EMBEDDED_BROKER
	- 是否启用内嵌 broker。
	- 默认：true（非 false 即视为启用）
- MQTT_PORT
	- 内嵌 broker 监听端口。
	- 默认：1883
- APP_LOG_PATH
	- 应用日志文件路径。
	- 默认：logs/app.log
- APP_LOG_LEVEL
	- 日志级别。
	- 默认：info

仅开发/测试脚本常用变量：

- MOCK_TEMPLATE_NAME
- MOCK_DEVICE_ID
- MOCK_TELEMETRY_INTERVAL_MS
- MOCK_RESPONSE_DELAY_MIN_MS
- MOCK_RESPONSE_DELAY_MAX_MS
- MOCK_FLOW_START
- MOCK_BATTERY_START
- E2E_TEMPLATE_NAME
- E2E_DEVICE_ID
- E2E_TIMEOUT_MS

### 4.3 生产部署步骤

```bash
pnpm install --frozen-lockfile
pnpm db:migrate
pnpm build
pnpm start
```

## 5. AI 生成代码声明

本项目包含部分由 AI 工具生成的代码。这些代码可能未经过完整、严格的人审与系统化安全审计。

