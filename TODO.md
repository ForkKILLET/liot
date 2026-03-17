# Liot MQTT 功能化 TODO

## 全局约束（当前阶段）

- 功能优先：安全性强化项暂缓（账号体系、ACL、证书、审计强化等放到后续阶段）。
- 先单用户/最简用户系统：暂不做多租户隔离，沿用现有用户模型。

---

## 阶段总览

- Phase 1（P0）：打通端到端最小闭环（详情页动态状态 + 请求型操作 + MQTT 收发 + 状态回写）。
- Phase 2（P1）：完善可用性与稳定性（命令状态跟踪、超时、错误处理、历史记录）。
- Phase 3（P2）：体验与可观测性增强（状态历史、模板演进工具、告警与监控）。
- Phase 4（P3，暂缓）：安全与租户化（本轮不做，保留 TODO）。

---

## Module A：模板规范（Template Schema）

### Phase 1（P0）

- [x] 固化现有模板协议字段：`state.fields`、`protocol.messages`、`payloadTemplate`。（已在 `src/lib/device-templates/protocol.ts` 固化解析与渲染入口）
- [x] 约定 `request` 消息的最小可执行规则：必须有 `responseId`。（已在运行时校验中校验 `responseId` 及响应消息存在性）
- [x] 增加模板校验函数（运行时）：字段类型、消息类型、必填字段。（已实现 `validateDeviceTemplate`）
- [x] 输出模板解析器接口，供前端/后端共用（至少共享类型定义）。（已实现 `renderTopicTemplate` / `renderPayloadTemplate` / `formatStateFieldValue`）

### Phase 2（P1）

- [ ] 扩展 `request` 参数定义（前端可自动生成输入表单）。
- [ ] 扩展 `response -> state` 映射规则（避免硬编码字段更新）。
- [ ] 增加模板版本字段并支持向后兼容读取。

### Phase 3（P2）

- [ ] 提供模板可视化检查工具（消息流预览、payload 渲染预览）。

### Phase 4（P3，暂缓）

- [ ] 增加模板级权限声明（谁可执行哪些消息）。

---

## Module B：后端 MQTT 接入（Broker + Ingest + Command）

### Phase 1（P0）

- [x] 选择并接入 MQTT 实现（开发环境先可运行，生产部署方式后定）。（已接入 `mqtt + aedes`，实现运行时 `src/lib/mqtt/runtime.ts`）
- [x] 启动 MQTT 服务并接收设备上报消息（report）。（已实现嵌入 broker 启动与 `device/+/+/#` 订阅）
- [x] 按模板解析上报消息并更新 `devices.state`、`stateUpdatedAt`。（已按模板 report 消息匹配 topic 并回写状态）
- [x] 实现命令发送服务：根据 `topicTemplate` + `payloadTemplate` 构造并发布消息。（已实现模板渲染并发布 request）
- [x] 对 `request` 命令支持响应等待：按 `responseId` 监听并匹配结果。（已实现超时等待与匹配）
- [x] 提供后端命令 API：
  - `POST /api/devices/:id/commands/:messageId`
  - 返回 `commandId` 与执行结果。（已落地 `src/app/api/devices/[id]/commands/[messageId]/route.ts`）

### Phase 2（P1）

- [ ] 建立命令状态机：`pending -> success | failed | timeout`。
- [ ] 增加超时处理与错误码映射。
- [ ] 增加幂等处理（同一请求重复触发不重复执行或可追踪）。
- [ ] 增加基础重试策略（可配置次数/间隔）。

### Phase 3（P2）

- [ ] 支持消息回放与问题排查工具（按设备/时间窗口查询）。
- [ ] 增加 broker 与消息链路健康检查。

### Phase 4（P3，暂缓）

- [ ] 设备认证、topic ACL、传输安全（TLS/证书）。
- [ ] 细粒度授权与审计增强。

---

## Module C：后端数据模型与持久化

### Phase 1（P0）

- [x] 新增 `device_commands` 表（命令记录、状态、时间、错误信息）。（已在 schema 落地）
- [x] 新增 `device_messages` 表（原始 MQTT 消息归档，至少保存关键字段）。（已在 schema 落地）
- [x] 新增 Drizzle schema + migration + 基础查询函数。（已生成 migration `drizzle/0001_natural_vision.sql` 并补齐基础写入函数）

### Phase 2（P1）

- [ ] 命令-响应关联字段完善（requestId/correlationId）。
- [ ] 增加索引优化（按设备、时间、状态查询）。

### Phase 3（P2）

- [ ] 增加 `device_state_history`（可选）用于趋势查看和回溯。

---

## Module D：前端设备详情页（动态状态 + 操作）

### Phase 1（P0）

- [x] 详情页按 `template.state.fields` 动态渲染状态（已实现 `DeviceStateFields`）
- [x] 字段展示规则：
  - number：精度、单位
  - boolean：状态标签
  - string：文本兜底
  （已在模板解析层 `formatStateFieldValue` 落地并用于详情页渲染）
- [x] 按 `template.protocol.messages` 渲染 `request` 操作按钮。（已实现 `DeviceRequestActions`）
- [x] 点击操作按钮调用命令 API，显示进行中状态。（按钮已带 pending 状态与禁用）
- [x] 响应成功后刷新状态（先全量刷新，后续再做增量更新）。（已调用 `router.refresh()` 全量刷新）

### Phase 2（P1）

- [ ] 操作按钮支持参数输入（基于模板 `params`）。
- [ ] 操作执行结果在详情页展示（最近一次状态与时间）。
- [ ] 错误态文案细化（超时、离线、模板错误等）。

### Phase 3（P2）

- [ ] 状态可视化增强（数值趋势、阈值高亮）。

---

## Module E：前后端实时通信（命令结果反馈）

### Phase 1（P0）

- [x] 方案选型：SSE 或 WebSocket（二选一，先实现 SSE 更轻量）。（已确定并落地 SSE）
- [x] 实现 `commandId` 结果订阅通道。（已实现 `GET /api/commands/:id/events`）
- [x] 前端订阅后更新按钮状态与提示信息。（`DeviceRequestActions` 已接入 EventSource）

### Phase 2（P1）

- [ ] 增加断线重连策略。
- [ ] 增加超时与取消订阅机制。

---

## Module F：测试与验收

### Phase 1（P0）

- [ ] 单元测试：模板解析、payload 渲染、topic 渲染。（按当前策略暂缓，优先全流程验证）
- [ ] 集成测试：
  - 上报消息 -> 状态入库
  - request 命令 -> 发布 MQTT -> 收到 response -> 前端收到成功
- [x] 集成测试：
  - 上报消息 -> 状态入库（已提供 `pnpm e2e:ingest`）
  - request 命令 -> 发布 MQTT -> 收到 response -> 前端收到成功（已提供 `pnpm mock:device` 配合页面操作验证）
- [x] 页面验收：详情页状态动态展示、操作按钮可用、状态回写可见。（已形成可执行手工验收路径）

### Phase 2（P1）

- [ ] 超时/失败路径测试。
- [ ] 异常消息容错测试（字段缺失、类型不匹配）。

---

## 里程碑（建议）

- M1（P0 完成）：能看到动态状态，能点请求按钮并拿到响应结果，数据库状态同步更新。
- M2（P1 完成）：命令生命周期完整可追踪，失败与超时可解释。
- M3（P2 完成）：可观测性与交互体验达到可运维水平。
- M4（P3 暂缓）：安全和多租户统一规划后再落地。

---

## 本轮明确不做（避免范围蔓延）

- [ ] 多租户隔离模型改造。
- [ ] 复杂权限系统、ACL 细分策略。
- [ ] 证书体系与端到端加密治理。

---

## 最近变更记录（2026-03-21）

### 1. 设备详情页结构调整

- [x] 设备详情页增加二级目录：`属性`、`状态`、`消息历史`。
- [x] `属性`：保留基本信息编辑与删除设备。
- [x] `状态`：保留状态面板与主动操作按钮。
- [x] `消息历史`：新增分页表格，展示 `消息类型 | 消息 ID | 参数 | 时间 | 状态`。
- [x] 异常显示迁移到 `状态` 列：无异常显示 `正常`，异常显示原因。

### 2. 消息历史与异常判定

- [x] 新增消息历史 API：`GET /api/devices/:id/messages?page=&pageSize=`。
- [x] 支持模板消息类型识别：`report / request / response / set / action`。
- [x] 异常类型覆盖：
  - `未定义的 path`
  - `消息格式错误`
  - `未收到 response`
- [x] 当 `parsedMessageId` 缺失时，支持按 `topicTemplate` 反推消息 ID（兜底识别）。

### 3. 命令超时联动

- [x] 命令超时状态改为 `timeout`。
- [x] 命令超时时将设备标记为离线（`devices.isOnline = false`）。

### 4. MQTT 重复入库问题修复（核心）

- [x] 修复 `EADDRINUSE`：端口占用时不崩溃，回退到连接已有 broker。
- [x] 主从实例角色控制：
  - 主实例（primary）负责全局通配订阅与 ingest。
  - 从实例（secondary）不做全局订阅，仅在请求时临时订阅响应 topic。
- [x] 云端下发消息不作为入站重复落库：
  - 入站消息匹配到 `request / set / action` 时直接跳过落库。
- [x] response 单路径落库：
  - 命中 pending 请求的 response 在匹配路径落库一次。
  - 通用 ingest 路径对 response（request 对应的 responseId）跳过落库。

---

## 当前 MQTT 入库逻辑（最新）

以下为 `src/lib/mqtt/runtime.ts` 的当前行为定义（已按最近联调结果修正）：

1. 角色选举与订阅策略

- 启动时通过专用数据库连接（`pg.Client`）竞争并持有 advisory lock，决定 primary / secondary。
- primary：订阅 `device/+/+/#`，负责通用 ingest 与状态更新。
- secondary：不订阅通配主题；仅在发起 request 时临时订阅对应 `responseTopic`。
- secondary 会定时重试抢锁；抢锁成功后升级为 primary 并开始通配订阅。

2. 出站 request（direction = out）

- 发送 request 前先写 `device_messages` 一条出站记录：
  - `direction = out`
  - `topic = requestTopic`
  - `payload = requestPayload`
  - `parsedMessageId = request message id`
- 有 response 的 request 采用“先订阅/注册 waiter，再发布”顺序，避免快速响应导致 waiter 漏接而误超时。

3. 入站消息主流程

- 消息到达后先做 `self-echo` 过滤（忽略本进程刚发布后回环收到的同内容消息）。
- 然后优先匹配 pending response：
  - 命中时立即按 response 路径入库一次（带 `responseMessageId`）并返回。
  - 该路径用于保证 response 不丢失且不再重复进入通用 ingest。
- 未命中 pending 时：
  - secondary 直接返回（不写库）。
  - primary 进入通用 ingest。

4. 通用 ingest（仅 primary）

- 解析 topic 中 deviceId，读取设备与模板。
- 按模板 `topicTemplate` 匹配消息定义。
- 匹配不到：按未知入站消息落库（`parsedMessageId` 为空）。
- 匹配到 `request / set / action`：跳过入站落库（云到设备下发消息不作为设备上行存档）。
- 匹配到 `report`：更新 `devices.state / stateUpdatedAt / isOnline`，并写一条入站消息。

5. 当前结果保证

- request 仅保留出站记录，不再出现额外入站重复。
- response 命中 pending 后会入库，并用于完成命令状态流转。
- telemetry 等 report 仅由 primary ingest，避免多进程重复写入。
