'use strict';
const PageResolver = require('../PageResolver');
const Options = require('../Options');

class TestResolver extends PageResolver {

    constructor(options) {
        super(options);
    }

    async load() {
        await this.config()
            .waitTimeout(0)
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
    const testTask = new TestResolver(options);
    await testTask.load();
})();