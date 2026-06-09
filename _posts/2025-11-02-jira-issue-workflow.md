---
title: Jira Issue 管理与工作流设计
author: 唐明
categories: [pm]
tags: [Jira, 工作流, Issue, 需求管理]
---
* TOC
{:toc}

## 1、Issue 是 Jira 的心脏

上一篇介绍了 Jira 的核心概念，其中 Issue 是 Jira 最基本的单元。如果说 Project 是容器，那 Issue 就是容器里的血液。团队的日常工作，本质上就是对 Issue 的创建、流转、追踪和关闭。

## 2、创建 Issue 的最佳实践

创建 Issue 看似简单，但要写出一个"好的" Issue，让后续的开发和协作顺畅，有一些值得遵循的规范：

### 标题（Summary）

好的标题应该：**一句话说清做什么**。遵循"动词 + 对象"的格式。

```
✅ 用户可以修改个人头像
✅ 修复订单金额计算精度问题
✅ 优化首页加载速度至 2 秒以内

❌ 需求
❌ bug 修复
❌ 首页问题
```

### 描述（Description）

描述应该回答三个问题：

- **为什么做**：背景和业务价值
- **做什么**：功能范围，包括验收标准
- **怎么做**：技术方案（可选，复杂的需要）

```markdown
## 背景
用户反馈无法在移动端查看订单物流信息。

## 验收标准
- 订单详情页新增"查看物流"按钮
- 点击后跳转到物流轨迹页面
- 物流信息实时从第三方 API 获取

## 技术方案
- 对接快递鸟物流查询 API
- 新增 OrderTracking 组件
```

### 关联关系

Jira 支持在 Issue 之间建立链接：

| 链接类型 | 含义 |
|---------|------|
| blocks / is blocked by | 阻塞关系，A 没做完 B 不能开始 |
| relates to | 相关关系 |
| clones / is cloned by | 克隆关系 |
| duplicates / is duplicated by | 重复关系 |
| causes / is caused by | 因果关系 |

正确使用 Issue 链接可以清晰地表达工作依赖关系，帮助团队做排期。

## 3、工作流（Workflow）

工作流定义了 Issue 从创建到关闭的完整生命周期。每个项目的核心工作流设计直接影响团队的协作效率。

### 状态（Status）

最常见的状态流转：

```
待办（To Do） → 进行中（In Progress） → 已完成（Done）
```

一个更贴近实际开发的状态模型：

```
待办 → 待排期 → 开发中 → 代码审查 → 测试中 → 待发布 → 已完成
              ↘ 阻塞（从任意状态进入，解决后回到原状态）
```

### 状态分类

Jira 将状态分为三类：

| 分类 | 颜色 | 含义 |
|------|------|------|
| To Do（待办） | 灰色 | 还没开始的工作 |
| In Progress（进行中） | 蓝色 | 正在处理的工作 |
| Done（已完成） | 绿色 | 已经完成的工作 |

一个工作流中每个状态必须归类到这三类之一，Jira 的看板和报告依赖这个分类。

### 转换（Transition）

状态之间的变化称为转换。转换可以配置：

- **触发条件**：谁可以执行这个转换
- **校验器**：执行前必须满足的条件（如"经办人不能为空"）
- **后处理功能**：执行后自动触发的操作（如"分配经办人"、"更新字段"）
- **触发按钮名称**：用户看到的按钮文字

### 一个实际的工作流示例

```
To Do ──领取任务──▶ In Progress ──提交审查──▶ Code Review ──审查通过──▶ Testing ──测试通过──▶ Done
                                             │
                                             ▼ 审查不通过
                                          In Progress（打回修改）
```

解释一下图中的流转规则：
- 从 **To Do** 领取任务后，状态变为 **In Progress**（开始开发）
- 开发完成后提交审查，进入 **Code Review**
- 审查通过则进入 **Testing**，审查不通过则打回 **In Progress** 重新修改
- 测试通过后状态变为 **Done**
- 测试通过后状态变为 **Done**

## 4、工作流方案

Jira 支持为不同 Issue 类型配置不同的工作流：

- Bug 的工作流可能更简单：待办 → 确认 → 修复中 → 验证 → 关闭
- Story 的工作流可能需要经过产品评审和验收
- Epic 可能不需要工作流（它只是一个容器）

工作流方案就是将多个工作流打包分配给一个项目。这让不同类型的 Issue 走不同的流程，而又统一在一个项目中管理。

## 5、自动化规则

Jira 内置了强大的自动化引擎，可以减少大量手工操作。以下是几个实际可操作的自动化规则示例：

### 规则 1：Bug 单自动继承 Epic 经办人

当创建一个 Bug 单并关联到某个 Epic 时，自动将 Epic 的经办人设为 Bug 的经办人：

```
触发器：Issue 创建时
条件：Issue 类型 = Bug 且 Epic Link 不为空
动作：编辑 Issue 字段 → 经办人 = 上级 Epic 的经办人
```

配置步骤：
1. 进入 **Project Settings → Automations**
2. 新建规则，触发器选择"Issue created"
3. 添加条件：Issue Type = Bug
4. 再添加条件：Epic Link IS NOT EMPTY
5. 添加动作：Edit Issue → Assignee → "Linked epic's assignee"

这样，当有人在 Bug 单中填写了关联 Epic 后，经办人自动填入，无需手动分配。

### 规则 2：状态变更时发送飞书通知

当 Issue 状态发生变更时，自动调用飞书 Webhook 发送通知：

```
触发器：Issue 状态变更时
条件：无
动作：发送 Web 请求 → POST 到飞书 Webhook 地址
```

飞书 Webhook 配置步骤：
1. 在飞书群 → 群设置 → 群机器人 → 添加机器人 → 自定义机器人
2. 获取 Webhook 地址
3. 在 Jira Automation 中添加 Web Request 动作：
   - URL：飞书 Webhook 地址
   - Method：POST
   - Headers：Content-Type: application/json
   - Body：
     ```json
     {
       "msg_type": "text",
       "content": {
         "text": "🔔 {{issue.key}} 状态已变更：{{trigger.issue.fromStatus}} → {{trigger.issue.toStatus}}\n负责人：{{issue.assignee.displayName}}\n链接：{{issue.permalink}}"
       }
     }
     ```

### 规则 3：Issue 被评论时通知给负责人

当有人对 Issue 添加评论时，自动将评论内容转发给负责人：

```
触发器：Issue 被评论时
条件：无
动作：发送 Web 请求 → POST 到飞书 Webhook 地址
```

Body 示例：
```json
{
  "msg_type": "text",
  "content": {
    "text": "💬 {{issue.key}} 收到新评论\n评论人：{{comment.author.displayName}}\n内容：{{comment.body}}\n链接：{{issue.permalink}}"
  }
}
```

自动化规则通过"触发器 → 条件 → 动作"的模式配置，不需要写代码。 Jira Automation 提供了丰富的内置触发器和动作，可以覆盖大多数日常需求。

## 6、Issue 模板

对于频繁创建的同类 Issue（如 Bug 报告），可以预设模板，确保信息完整：

```markdown
## 问题描述
（请描述你遇到的问题）

## 复现步骤
1.
2.
3.

## 期望结果
（请描述你期望的正确行为）

## 环境信息
- 浏览器：
- 操作系统：
- 应用版本：

## 截图
（如有，请附上截图）
```

### 通过 Jira Automation 实现模板

Jira 没有内置的 Issue 模板功能，但可以通过 Automation 实现类似效果——每次创建特定类型的 Issue 时，自动填充 Description 字段：

```
触发器：Issue 创建时
条件：Issue 类型 = Bug
动作：编辑 Issue 字段 → Description =
  "## 问题描述\n（请描述你遇到的问题）\n\n## 复现步骤\n1. \n2. \n3. \n\n## 期望结果\n（请描述你期望的正确行为）\n\n## 环境信息\n- 浏览器：\n- 操作系统：\n- 应用版本：\n\n## 截图\n（如有，请附上截图）"
```

配置步骤：
1. 进入 **Project Settings → Automations**
2. 新建规则，触发器选择"Issue created"
3. 添加条件：Issue Type = Bug（如果是 Story，则改用 Story）
4. 添加动作：Edit Issue → Description → 在模板编辑器中粘贴模板内容

每个 Issue 类型都可以创建对应的自动化规则，创建时会自动填入预设模板，既保证了信息规范，又不需要成员手动复制粘贴。

> **注意**：Automation 设置的模板只填充到 Description 字段。如果需要更复杂的模板（如包含必填字段校验、附件上传引导等），可以考虑使用 **Jira 高级字段（Composite Fields）** 或第三方插件如 **Jira Suite Utilities**。

## 7、总结

Issue 是 Jira 的核心操作单元，工作流定义了它的生命周期。一个好的工作流设计应该：

- **反映团队真实的开发流程**，而不是照搬理论模型
- **状态不宜过多**：5-8 个状态通常足够，太多反而让团队困惑
- **配合自动化**：减少手工操作，让状态流转更自然

下一篇，我们来聊 Scrum 看板——Jira 如何支撑敏捷开发。

每天前进一小步，就是一个新的高度！
