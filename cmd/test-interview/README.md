# 面试模拟系统测试程序

这是一个最小化的面试模拟系统，用于测试流式AI输出和打字问答交互。

## 功能特点

- ✅ 流式AI输出，模拟打字效果
- ✅ 传统的打字问答交互方式
- ✅ 实时评分和反馈
- ✅ 保存对话历史
- ✅ 支持连续对话

## 使用方法

### 1. 设置环境变量

首先需要设置DeepSeek API密钥：

```bash
export DEEPSEEK_API_KEY=your_api_key_here
```

### 2. 运行程序

使用提供的启动脚本：

```bash
cd cmd/test-interview
./run.sh
```

或者直接使用go命令：

```bash
cd cmd/test-interview
go run main.go
```

### 3. 开始面试

程序启动后，会显示欢迎信息并开始面试：

```
🎤 欢迎使用面试模拟系统
📝 这是一个传统的打字问答面试系统
💡 输入 'quit' 或 'exit' 退出
==================================================

🤔 面试官: 请先做一个简单的自我介绍
👤 你: 
```

### 4. 进行对话

输入你的回答，AI会实时流式输出回复，包括：

- 评分（0-100分）
- 反馈建议
- 下一个问题

示例对话：

```
👤 你: 我是张三，毕业于某某大学计算机专业，有3年Java开发经验...

🤔 面试官: {
  "question": "你在项目中遇到过什么技术难题？是如何解决的？",
  "score": 85,
  "feedback": "回答清晰，但可以更具体地说明项目的成果和影响。"
}

--------------------------------------------------
评分: 85.0
反馈: 回答清晰，但可以更具体地说明项目的成果和影响。

下一个问题: 你在项目中遇到过什么技术难题？是如何解决的？
--------------------------------------------------
```

### 5. 退出面试

输入 `quit` 或 `exit` 退出面试：

```
👤 你: quit

👋 面试结束，感谢参与！
⏱️  面试时长: 2m30s
```

## 技术实现

### 核心组件

1. **InterviewAI**: 面试AI服务
   - 管理API调用
   - 处理流式响应
   - 解析JSON结果

2. **InterviewSession**: 面试会话
   - 保存对话历史
   - 跟踪评分和反馈
   - 记录面试时间

3. **流式输出**:
   - 实时接收AI响应
   - 逐字符显示，模拟打字效果
   - 使用channel实现异步通信

### 流式输出实现

```go
func (ai *InterviewAI) InterviewStream(ctx context.Context, session *InterviewSession, userMessage string) (<-chan string, <-chan error, <-chan InterviewQuestion)
```

返回三个channel：
- `contentChan`: 流式内容输出
- `errChan`: 错误信息
- `questionChan`: 下一个问题

### API调用

使用DeepSeek API的流式聊天接口：

- 端点: `https://api.deepseek.com/v1/chat/completions`
- 模型: `deepseek-chat`
- 流式参数: `stream: true`

## 后续集成

这个测试程序可以作为面试模块的参考，用于集成到主项目中：

1. 将 `InterviewAI` 和 `InterviewSession` 移动到 `internal/logic/interview/`
2. 创建对应的handler处理HTTP请求
3. 实现SSE流式响应
4. 添加数据库持久化

## 注意事项

- 确保已设置 `DEEPSEEK_API_KEY` 环境变量
- 网络连接正常，能够访问DeepSeek API
- API调用可能产生费用，请注意使用量
- 对话历史保存在内存中，程序退出后丢失

## 故障排除

### API密钥未设置

```
❌ 错误: 未设置 DEEPSEEK_API_KEY 环境变量
```

解决方案：
```bash
export DEEPSEEK_API_KEY=your_actual_api_key
```

### API调用失败

```
❌ API错误: status=401, body=Invalid API key
```

解决方案：
- 检查API密钥是否正确
- 确认API密钥有效且未过期

### 网络连接问题

```
❌ http request failed: dial tcp: lookup api.deepseek.com: no such host
```

解决方案：
- 检查网络连接
- 确认DNS解析正常
- 检查防火墙设置