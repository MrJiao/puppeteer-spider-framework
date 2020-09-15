

## 需求

puppeteer爬取数据时频繁请求一些不会变的资源,带来一定的网络开销,为此做了一个磁盘缓存功能

比如js请求, 不能通过终止请求来解决.

## 功能描述

1. 支持磁盘缓存response header和response body
2. 支持过滤修改缓存数据内容
3. 支持缓存过期
4. 支持通配符指定缓存文件
5. 支持通配符方式指定中断请求

## 用法

1. 通过 Options 配置全局信息
2. 写一个Resolver继承PageResolver
3. 在Resolver内部通过this.config() 配置单个resolver相关信息

```javascript
'use strict';
const PageResolver = require('puppeteer-spider-framework/PageResolver');
const Options = require('puppeteer-spider-framework/Options');

class TestResolver extends PageResolver {

    constructor(options) {
        super(options);
    }

    async load() {
        await this.config()
            .waitTimeout(0)
            .cacheTimeout(1000)
            .useCache(['**.js'])
            .build();

        await this.goto('https://zhuanlan.zhihu.com/p/76237595');

        await this.waitClick2Page('#root > div > main > div > div.ColumnPageHeader-Wrapper > div > div > div > div.ColumnPageHeader-Title > div > a');
        await this.waitForSelector('#root > div > main > div > div.Card.css-1voxft1 > div > div:nth-child(2) > div > h2 > a');
        await this.goto('https://www.baidu.com');
    }
}

(async () => {
    const options = new Options();
    options.setBrowserOptions({
        ignoreDefaultArgs: ['--enable-automation'],
        headless: false,  // 关闭无头模式
        devtools: false // 打开 chromium 的 devtools
    });
    options.setCachePath('./cache');
    const testTask = new TestResolver(options);
    await testTask.load();
})();
```



## 期望标准写法

一个页面一个Resolver, Resolver里面可以设置对这个页面的缓存和各种请求响应的拦截来达到获取数据.Resovler里提供对这个页面的所有操作做成function.

多个Resolver放到一个Task中,Task中来调用resolver提供的function来达到多个页面根据逻辑进行跳转和爬取数据.