## 鉴权

- [初始化模式] 平台绑定鉴权流程

  ```mermaid
  sequenceDiagram
    participant 设备
    participant 辅助应用
    participant 平台

    辅助应用->>设备: [wifi] 连接设备 AP

    设备->>辅助应用: [tcp] 提供 deviceId
    辅助应用->>平台: [http] 转发 deviceId
    平台->>辅助应用: [http] 开始 deviceId 绑定 challenge，返回随机数 nonce
    辅助应用->>设备: [tcp] 转发 nonce
    设备->>辅助应用: [tcp] 用内置 deviceSecret 加密 nonce 返回 signature
    辅助应用->>平台: [http] 转发 signature
    平台->>辅助应用: [http] 验证 signature，返回绑定结果
  ```

  - 防止未授权的设备接入平台（因为 deviceSecret 只有设备和平台持有）
  - 防止设备被恶意绑定（因为必须连接设备 AP 才能进行绑定流程）
  - 进入初始化模式有物理限制（例如必须在上电一段时间内进入，或是按钮触发），防止攻击者获得高权限

- [初始化模式] 设备配网流程

  ```mermaid
  sequenceDiagram
    participant 常用 AP
    participant 设备
    participant 辅助应用

    辅助应用->>设备: [wifi] 连接设备 AP

    辅助应用->>设备: [tcp] 发送 wifi 配网信息
    设备->>常用 AP: [wifi] 连接常用 AP

    辅助应用->>设备: [tcp] 查询配网结果
    设备->>辅助应用: [tcp] 返回配网结果
  ```

- [运行模式] 设备正常运行状态

  ```mermaid
  sequenceDiagram
    participant 常用 AP
    participant 设备
    participant 平台
    participant 辅助应用

    设备->>常用 AP: [wifi] 连接常用 AP
    设备<<->>平台: [mqtt] 上报/查询状态

    辅助应用<<->>平台: [http] 查询设备状态和数据

    辅助应用--x设备: 安全模式下禁止直接交互
  ```

  - 打开安全模式，可以限制设备正常运行时只能通过平台交互，防止伪造 AP 窃取数据

## RBAC

- 角色

  - `admin`：管理平台
  - `provider`：创建设备（导入设备 id / secret 对）、设备模板
  - `customer`：绑定、使用设备

- 设备权限

  - `device/${id}/query`
  - `device/${id}/query/history`
  - `device/${id}/action/${action}`
  - `device/${id}/action/*`
  - `device/${id}/admin`

## 用户界面

- 平台

- APP

- 小程序
