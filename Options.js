const BrowserFactory = require("./lib/BrowserFactory");
const CacheStatics = require("./lib/CacheComponent");

class Options{

    setCachePath(cachePath){
        this.cachePath = cachePath;
    }

    setBrowserOptions(browserOptions){
        this.browserOptions = browserOptions;
    }

    browserFactory;
    buildBrowserFactory(){
        if(!this.browserFactory){
            this.browserFactory=new BrowserFactory(this.browserOptions);
        }
        return  this.browserFactory;
    }
    cacheStatics;
    buildCacheComponent(){
        if(!this.cacheStatics){
            this.cacheStatics = new CacheStatics(this.cachePath);
        }
        return this.cacheStatics;
    }

}

module.exports = Options;