const fs = require('./FsComponent');
const urlMatcher = require("./UrlMatcher");
const md5 = require('md5-node');

class CacheComponent {
    storePath;
    constructor(storePath) {
        if(storePath){
            this.storePath = storePath;
        }else {
            this.storePath = './cache';
        }
    }

    setCacheTimeout(cacheTimeout) {
        this._cacheTimeout = cacheTimeout * 1000;
    }

    async loadCache(request, responseHeaderFilter) {
        const url = request.url();
        console.log('useCache:' + url + ' ' + this._getStaticFilePath(url));
        const staticFilePath = this._getStaticFilePath(url);
        const headerFilePath = this._getStaticHeaderFilePath(url);
        const sourceExist = await fs.isExist(staticFilePath);
        const headerExist = await fs.isExist(headerFilePath);
        if (headerExist) {
            let headerStr = await fs.readFile(headerFilePath);
            let headers = {};
            try {
                headers = JSON.parse(headerStr);
            } catch (e) {
                console.error(headerFilePath);
                console.error(headerStr);
                headerStr = headerStr.substr(0, headerStr.length - 1);
                headers = JSON.parse(headerStr);
            }
            if (responseHeaderFilter) {
                responseHeaderFilter(url, headers);
            }
            let body;
            if (sourceExist) {
                body = await fs.readFile(staticFilePath);
            }
            request.respond({
                body: body,
                status: +headers['status'],
                headers: headers
            });
        } else {
            await request.continue();
        }
    }

    async checkLoad(url, _matches, _except) {
        if (url.startsWith('data:')) {
            return false;
        }
        let isLoad = urlMatcher.match(url, _matches, _except);
        if (!isLoad) return false;
        const headerFilePath = this._getStaticHeaderFilePath(url);
        const headerExist = await fs.isExist(headerFilePath);
        if (headerExist) {
            return true;
        }
        return false;
    }

    async checkStore(url, _matches, _except) {
        if (url.startsWith('data:')) {
            return false;
        }
        const headerFilePath = this._getStaticHeaderFilePath(url);
        const headerExist = await fs.isExist(headerFilePath);
        if (headerExist) {
            return false;
        }
        return urlMatcher.match(url, _matches, _except);
    }

    async storeSource(response, cacheHeaderFilter) {
        const url = response.url();
        const status = response.status();
        if (status >= 400) {
            return;
        }
        if (status !== 302) {
            const headers = response.headers();
            if (cacheHeaderFilter) {
                cacheHeaderFilter(url, headers);
            }
            response.buffer().then(async buffer => {
                if(buffer.length>0){
                    console.log('writeFile:' + url + ' ' + this._getStaticFilePath(url));
                    headers['content-length'] = buffer.length;
                    await fs.writeFile(this._getStaticHeaderFilePath(url), JSON.stringify(headers));
                    await fs.writeFile(this._getStaticFilePath(url), buffer);
                }
            }, error => {
                console.error('error:' + url);
            });
        }
    }

    async clearCache() {
        fs.rmdir(this._getStaticFileFolder());
        fs.rmdir(this._getStaticHeaderFolder());
    }

    _getStaticFilePath(url) {
        if (!this._cacheTimeout) {
            return this._getStaticFileFolder() + md5(url);
        }
        return this._getStaticFileFolder()+this._cacheTimeout/1000+'-'+Math.ceil(Date.now() / this._cacheTimeout)+'/'+md5(url);
    }

    _getStaticHeaderFilePath(url) {
        if (!this._cacheTimeout) {
            return this._getStaticHeaderFolder() + md5(url);
        }
        return this._getStaticHeaderFolder() +this._cacheTimeout/1000+'-'+Math.ceil(Date.now() / this._cacheTimeout)+'/'+md5(url);
    }

    _getStaticFileFolder() {
        return this.storePath + 'statics/';
    }

    _getStaticHeaderFolder() {
        return this.storePath + 'headers/';
    }

}

module.exports = CacheComponent;