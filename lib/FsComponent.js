const fs = require('fs');
const {join, normalize,dirname} = require("path");
class FsComponent {

    readFile(filePath) {
        return new Promise((resolve, reject) => {
            //异步读取文件
            fs.readFile(filePath, function (err, data) {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            })
        })
    };

    /**
     * 写文件，如果路径不存在就会创建文件夹
     * @param filePath 文件路径
     * @param buffer 文件内容
     * @returns {Promise<unknown>}
     */
    writeFile(filePath, buffer) {
        return new Promise((resolve, reject) => {
            fs.access(filePath, function (err) {
                if (!err) {
                    fs.writeFile(filePath, buffer, err => {
                        if (err) {
                            reject(err)
                        } else {
                            resolve();
                        }
                    });
                } else {
                    if (err.code === 'ENOENT') {
                        const dir = dirname(filePath);
                        fs.mkdir(dir, {recursive: true}, (err) => {
                            if (!err) {
                                fs.writeFile(filePath, buffer, err => {
                                    if (err) {
                                        reject(err)
                                    } else {
                                        resolve();
                                    }
                                });
                            } else {
                                reject(err);
                            }
                        });
                    } else {
                        reject(err);
                    }
                }
            });
        });
    }

    isExist(filePath) {
        return new Promise(function (resolve, reject) {
            fs.access(filePath, function (err) {
                if (!err) {
                    resolve(true);
                } else {
                    if (err.code === 'ENOENT') {
                        resolve(false);
                    } else {
                        reject(err);
                    }
                }
            });
        });
    }

    mkdir(filePath) {
        return new Promise(function (resolve, reject) {
            fs.mkdir(filePath, {recursive: true}, (err) => {
                if (!err) {
                    resolve(true);
                } else {
                    reject(err);
                }
            });
        });
    }

    rmdir(directory) {
        function remove(directory) {
            fs.readdirSync(directory).forEach(file => {
                const current = join(directory, file);
                if (fs.lstatSync(current).isDirectory()) {
                    remove(current);
                } else {
                    fs.unlinkSync(current);
                }
            });
            fs.rmdirSync(directory);
        }
        directory = normalize(directory);
        if (!fs.existsSync(directory)) {
            return false;
        }
        remove(directory);
        return true;
    }
}

module.exports = new FsComponent();