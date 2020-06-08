# 特性

1. 失败重试
2. 无callBack,全promise
3. 支持pipe
4. 根据请求content-type自动处理请求体
5. 传入关键词|自定义函数实现对返回体的流式处理
6. 通过配置处理redirect
7. 通过配置statusCode筛选
8.  纯typescript编写
9.  单元测试覆盖80%

# 安装
npm install better-request

# 使用

    import Request from 'better-request'

    // 静态方法
    const body = 'string'|new Buffer()|readStream;
    Request.fetch({url:'http://xxx.xx.com',method:'GET'}, body).then().catch()
    Request.fetchThenPipe({url:'http://xxx.xx.com',method:'GET'}, body, fs.createWriteStream(filePath)).then().catch()

    // 实例对象
    const request = new Request({url:'http://xxx.xx.com',method:'GET'})
    request.fetch(...同上)
    request.fetchThenPipe(...同上)


