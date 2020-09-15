const puppeteer = require('puppeteer');
const PageFactory = require('./PageFactory');

class BrowserFactory {
    _browser;pageFactory;browserOptions;

    constructor(browserOptions) {
        this.browserOptions = browserOptions;
    }

//初始化浏览器
    async getBrowser() {
        if (this._browser) {
            return this._browser;
        }
        this._browser = await this._createBrowser();
        return this._browser;
    }

    async refreshBrowser() {
        if (this._browser) {
            await this._browser.close();
        }
        this._browser = await this._createBrowser();
        return this._browser;
    }

    async _createBrowser() {
        if(this.browserOptions){
            return await puppeteer.launch(this.browserOptions);
        }else{
            return await puppeteer.launch();
        }
    }

    getPageFactory(){
        if(!this.pageFactory){
            this.pageFactory=new PageFactory(this);
        }
        return this.pageFactory;
    }
}

module.exports = BrowserFactory;