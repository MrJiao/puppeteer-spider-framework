
class PageFactory {
    page;_browserFactory;

    constructor(browserFactory) {
        this._browserFactory = browserFactory;
    }

    async getPage() {
        if (this.page) {
            return this.page;
        }
        this.page = await this._getFirstPage();
        return this.page;
    }

    async getBrowser(){
        return await this._browserFactory.getBrowser();
    }

    getBrowserFactory(){
        return this._browserFactory;
    }

    async newPage(){
        let _browser = await this._browserFactory.getBrowser();
        const _page = await _browser.newPage();
        await _page.setDefaultNavigationTimeout(0);
        await _page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined,
            });
        });
        return _page;
    }

    async _getFirstPage() {
        let _browser = await this._browserFactory.getBrowser();
        const pages = await _browser.pages();
        let _page = null;
        if(pages.length>0){
            _page=pages[0];
        }else {
            _page = await _browser.newPage();
        }
        await _page.setDefaultNavigationTimeout(0);
        await _page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined,
            });
        });
        // let _cookies = await _page.cookies();
        // if (_cookies && _cookies.length > 0)
        //     await _page.deleteCookie(_cookies);
        return _page;
    }
}
module.exports = PageFactory;