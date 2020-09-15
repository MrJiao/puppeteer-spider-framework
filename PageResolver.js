const urlMatcher = require("./lib/UrlMatcher");

class PageResolver {
    page;
    _browserFactory;
    _pageFactory;
    _waitTimeout = 1000 * 30;

    constructor(options) {
        this._browserFactory = options.buildBrowserFactory();
        this._cacheStatics = options.buildCacheComponent();
        this._pageFactory = this._browserFactory.getPageFactory();
    }

    async getBrowser() {
        return await this._browserFactory.getBrowser();
    }

    getBrowserFactory() {
        return this._browserFactory;
    }

    async getPage() {
        if (this.page) {
            return this.page;
        }
        this.page = await this._pageFactory.getPage();
        return this.page;
    }

    async newPage() {
        this.page = await this._pageFactory.newPage();
        await this.page.bringToFront();
        return this.page;
    }

    setPage(page) {
        this.page = page;
    }

    async waitType(selector, _data) {
        const page = await this.getPage();
        await page.waitForSelector(selector, {timeout: this._waitTimeout});
        await page.type(selector, _data);
    }

    async waitClick(selector) {
        const page = await this.getPage();
        await page.waitForSelector(selector);
        await page.click(selector, {timeout: this._waitTimeout});
    }

    /**
     * 点击触发新tab
     * @param selector
     * @returns {Promise<Page>} 新的page
     */
    async waitClickNewPage(selector) {
        const page = await this.getPage();
        const browser = await this.getBrowser();
        await page.waitForSelector(selector); // 等待并获取点击跳转的goto元素
        const link = await page.$(selector);
        const newPagePromise = new Promise(x => browser.once('targetcreated', target => x(target.page())));
        await link.click(); // 点击跳转
        return await newPagePromise; // newPage就是a链接打开窗口的Page对象
    }

    /**
     * 点击触发刷新当前页
     * @param selector
     * @returns {Promise<void>}
     */
    async waitClick2Page(selector) {
        const page = await this.getPage();
        await page.waitForSelector(selector);
        await Promise.all([
            page.waitForNavigation({timeout: this._waitTimeout}),
            page.click(selector, {timeout: this._waitTimeout})
        ]);
    }

    async waitForSelector(selector) {
        const _page = await this.getPage();
        await _page.waitForSelector(selector, {timeout: this._waitTimeout});
    }

    async goto(url) {
        const page = await this.getPage();
        await page.goto(url);
    }

    config() {
        return new ConfigBuilder(this);
    }

    async $(selector) {
        const page = await this.getPage();
        return await page.$(selector);
    }

    async evaluate(pageFunction, ...args) {
        const page = await this.getPage();
        return page.evaluate(pageFunction, args);
    }

    async _removeRequestResponseListener() {
        const page = await this.getPage();
        if (page.lastRequestCallback) {
            await page.removeListener('request', page.lastRequestCallback);
        }
        if (page.lastResponseCallback) {
            await page.removeListener('response', page.lastResponseCallback);
        }
        page.lastRequestCallback = null;
        page.lastResponseCallback = null;
    }

    async clear() {
        const _chromePage = await this.getPage();
        this._removeRequestResponseListener();
        await _chromePage.on('request', request => {
            request.continue();
        });
    }
}

class ConfigBuilder {

    constructor(pageResolver) {
        this.pageResolver = pageResolver;
    }

    useStaticCache(cacheSource, _except) {
        const statics = ['**.js', '**.js?*', '**.ttf?*', '**.ttf', '**.css?*', '**.woff?*', '**.woff2?*', '**.png', '**.jpg', '**.jpge', '**.woff', '**.woff2', '**.css', '**.svg', '**.ico', '**.gif'];
        if (cacheSource) {
            statics.push(cacheSource);
        }
        this.useCache(statics, _except);
        return this;
    }

    useCache(_matches, _except) {
        this._cacheMatches = _matches;
        this._cacheExcept = _except;
        return this;
    }

    /**
     * 默认超时时间，单位秒
     * @param waitTimeout
     */
    waitTimeout(waitTimeout) {
        this.pageResolver._waitTimeout = waitTimeout * 1000;
        return this;
    }

    /**
     *
     * @param cacheTimeout 缓存时间，单位秒
     */
    cacheTimeout(cacheTimeout) {
        this._cacheTimeout = cacheTimeout;
        return this;
    }

    /**
     * 用来设置缓存到磁盘的响应头的
     * @param cacheHeaderFilter
     * @returns {ConfigBuilder}
     */
    cacheHeaderFilter(cacheHeaderFilter) {
        this._cacheHeaderFilter = cacheHeaderFilter;
        return this;
    }

    /**
     * 用来修改从缓存中获取的响应头,只有被缓存的数据才有效
     * @param cacheHeaderFilter
     * @returns {ConfigBuilder}
     */
    responseHeaderFilter(responseHeaderFilter) {
        this._responseHeaderFilter = responseHeaderFilter;
        return this;
    }

    /**
     * 响应过滤器，开/关缓存都有效，开启缓存时，response是缓存中的数据
     * @param responseFilter
     * @returns {ConfigBuilder}
     */
    responseFilter(responseFilter) {
        this._responseFilter = responseFilter;
        return this;
    }


    abortStaticSource(abortSource, _except) {
        const statics = ['**.css?*', '**.ttf?*', '**.woff?*', '**.woff2?*', '**.gif?*', '**.png', '**.jpg', '**.jpge', '**.woff', '**.woff2', '**.css', '**.svg', '**.ico', '**.gif', '**.ttf'];
        if (abortSource) {
            statics.push(abortSource);
        }
        this.abortSource(statics, _except);
        return this;
    }

    /**
     * @param {Array} abortMatches
     */
    abortSource(abortMatches, _except) {
        this._abortMatches = abortMatches;
        this._abortExcept = _except;
        return this;
    }

    async build() {
        const _chromePage = await this.pageResolver.getPage();

        await this.pageResolver._removeRequestResponseListener();
        if (this._cacheMatches || this._abortMatches) {
            this.pageResolver._cacheStatics.setCacheTimeout(this._cacheTimeout);
            await _chromePage.setRequestInterception(true);
            _chromePage.lastRequestCallback = async request => {
                if (urlMatcher.match(request.url(), this._abortMatches, this._abortExcept)) {
                    await request.abort();
                } else if (await this.pageResolver._cacheStatics.checkLoad(request.url(), this._cacheMatches, this._cacheExcept)) {
                    await this.pageResolver._cacheStatics.loadCache(request, this._responseHeaderFilter);
                } else {
                    await request.continue();
                }
            };
            _chromePage.on('request', _chromePage.lastRequestCallback);
        }
        if (this._cacheMatches) {
            _chromePage.lastResponseCallback = async response => {
                const url = response.url();
                if (await this.pageResolver._cacheStatics.checkStore(url, this._cacheMatches, this._cacheExcept)) {
                    await this.pageResolver._cacheStatics.storeSource(response, this._cacheHeaderFilter);
                }
                if (this._responseFilter) {
                    this._responseFilter(url, response);
                }
            };
        }else{
            _chromePage.lastResponseCallback = async response => {
                const url = response.url();
                if (this._responseFilter) {
                    this._responseFilter(url, response);
                }
            };
        }
        _chromePage.on('response', _chromePage.lastResponseCallback);
    }
}

module.exports = PageResolver;