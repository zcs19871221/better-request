# 使用方法

参见源代码 ex 目录例子

执行例子文件前，先启动 ex/server.js

    ex/abort.js 使用abort
    ex/directRequest.js 直接调用直接返回消息
    ex/moreControl.js 引入底层模块实现对发送线程更多控制
    ex/post.js 发送请求体
    ex/redirect.js 实现重定向
    ex/reUseRequest.js 复用发送对象
    ex/reuseSocket.js 线程池复用
    ex/globalAgent.js 不设置agent 默认有一个全局代理

# 优点

1. 单元测试覆盖率整体 85.25(源代码安装后执行 npm run report)
   ![](https://raw.githubusercontent.com/zcs19871221/better-request/master/unittest.png)

2. 使用 vscode 可查看 jsdoc 的智能提示，包含 api，参数类型，例子

3. 调用灵活
4. 参数配置可复用
