/* 用于同步并加密文件 */
const fs = require("fs");
var path = require("path");
const axios = require("axios");
const request = require("request");

!(async () => {
    console.log(`北京时间 (UTC+08)：${new Date(new Date().getTime() + 8 * 60 * 60 * 1000).toLocaleString()}\n`);
    var gallerys = [
        {
            url: "https://raw.githubusercontent.com/yangtingxiao/QuantumultX/master/box/yangtingxiao.gallery.json",
            path: "./yangtingxiao/gallery.json",
            type: "remote",
            tip_name: "yangtingxiao_Gallery",
            decrypt: false,
            proxy: "http://127.0.0.1:7890",
        },
        {
            url: "https://jdsharedresourcescdn.azureedge.net/jdresource/lxk0301_gallery.json",
            path: "./jd_scripts/gallery.json",
            type: "remote",
            tip_name: "lxk0301_Gallery",
            decrypt: false,
            proxy: "http://127.0.0.1:7890",
        },
    ];

    let regex = /\s(https?:\/\/[\d\D]+?),\stag=/;
    for (const gallery of gallerys) {
        try {
            await download(gallery);
            let galleryConfig = fs.readFileSync(gallery.path, "utf-8");
            // console.log(galleryConfig)
            let tasks = JSON.parse(galleryConfig).task;
            for (var task of tasks) {
                if (typeof task == "object") task = task.config;
                if (regex.test(task)) {
                    var link = task.match(regex)[1];
                    var fileName = link.substring(link.lastIndexOf("/"));
                    var target = gallery.path.replace("gallery.json", fileName);
                    await download({
                        url: link,
                        path: target,
                        type: "remote",
                        tip_name: fileName,
                        decrypt: false,
                        proxy: gallery.proxy,
                    });
                }
            }
        } catch (e) {
            console.log("🔴 执行异常:" + e);
        }
    }
})()
    .catch((e) => {
        console.log(`❌ 执行失败! 原因: ${e}!`);
    })
    .finally(() => {
        console.log("🥳 脚本执行完毕");
    });
/**
 * 收集文件
 * @param {String} relativePath 路径
 * @param {Regex} include 匹配的正则
 */
async function collectFiles(relativePath, include) {
    let fileList = [];
    return listFile(relativePath, fileList, false, include);
}
/**
 * 列出文件
 * @param {String} dir 路径
 * @param {Array} list 传参
 * @param {Boolean} findAll 发现全部
 * @param {Regex} include 匹配的正则
 */
function listFile(dir, list = [], findAll = false, include = null) {
    var arr = fs.readdirSync(dir);
    arr.forEach(function (item) {
        var fullpath = path.join(dir, item);
        var stats = fs.statSync(fullpath);
        if (findAll && stats.isDirectory()) {
            listFile(fullpath, list);
        } else {
            if (!include || include.test(fullpath)) list.push(fullpath);
        }
    });
    console.log(list);
    return list;
}

/**
 * 下载文件
 * @param {String} url 下载地址
 * @param {String} path 存放路径
 * @param {String} type 资源类型(remote-远程 local-本地)
 * @param {String} tip_name 提示时的文件别名,如果不填则不提示
 * @param {Boolean} decrypt 是否需要进行解密
 * @param {String} proxy 代理路径,不填则不走代理,如http://127.0.0.1:7890
 */
async function download(downloadConfig) {
    let { url, path, type, tip_name, decrypt, proxy } = downloadConfig;
    let typeDes = type == "local" ? "加载" : "下载";
    let fcontent = "";
    tip_name = tip_name || "";
    if (!url) {
        console.log(`❌📥 【${typeDes}】${tip_name}时链接丢失`);
        return;
    }
    if (!path) {
        console.log(`❌📥 【${typeDes}】${tip_name}时存放路径丢失`);
        return;
    }
    try {
        if (type == "local") {
            fcontent = await fs.readFileSync(url, "utf-8");
        } else {
            if (proxy) {
                fcontent = await (() => {
                    return new Promise((resolve) => {
                        request(
                            {
                                url: url,
                                method: "GET",
                                proxy: proxy,
                                headers: {
                                    "User-Agent":
                                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3100.0 Safari/537.36",
                                    // "Accept-Encoding": "gzip", // 使用gzip压缩让数据传输更快
                                },
                            },
                            function (error, response, body) {
                                resolve(body);
                            }
                        );
                    });
                })();
            } else {
                fcontent = await axios.get(url).data;
            }
        }
        if (!fcontent) {
            console.log(`❌📥 【${typeDes}】${tip_name}时未获取到对应数据`);
            return;
        }

        if (decrypt) {
            fcontent = aes.decrypt(fcontent, process.env.AES_KEY, process.env.AES_IV);
            await fs.writeFileSync(path, fcontent, "utf8");
            console.log(`📥🔓 【${typeDes}】${tip_name}并解密完毕`);
        } else {
            await fs.writeFileSync(path, fcontent, "utf8");
            console.log(`📥 【${typeDes}】${tip_name}完毕`);
        }
    } catch (error) {
        console.log(`❌📥 【${typeDes}】${tip_name}时出错`, error);
    }
}
