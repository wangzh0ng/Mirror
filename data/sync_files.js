/* 用于同步并加密文件 */
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const request = require("request");

let quantumultx_task_regex = /\s(https?:\/\/[\d\D]+?),\stag=/;
let gallerys = [
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
let boxjses = [
    {
        url: "https://raw.githubusercontent.com/chavyleung/scripts/master/box/chavy.boxjs.json",
        path: "./chavy/boxjs.json",
        type: "remote",
        tip_name: "chavy_BoxJs",
        decrypt: false,
        proxy: "http://127.0.0.1:7890",
    },
    {
        url: "https://raw.githubusercontent.com/zZPiglet/Task/master/zZPiglet.boxjs.json",
        path: "./zZPiglet/boxjs.json",
        type: "remote",
        tip_name: "zZPiglet_BoxJs",
        decrypt: false,
        proxy: "http://127.0.0.1:7890",
    },
    {
        url: "https://share.r2ray.com/dust/qx.gallery.json",
        path: "./chenzhe/boxjs.json",
        type: "remote",
        tip_name: "chenzhe",
        decrypt: false,
        proxy: "http://127.0.0.1:7890",
    },
];
let singleDownloads = [
    {
        url: "https://raw.githubusercontent.com/songyangzz/QuantumultX/master/elem/elemSign.js",
        path: "./songyangzz/elemSign.js",
        type: "remote",
        tip_name: "elemSign.js",
        decrypt: false,
        proxy: "http://127.0.0.1:7890",
    },
    {
        url: "https://raw.githubusercontent.com/leifengwl/JDRouterPush/main/JDRouterPush.py",
        path: "./leifengwl/JDRouterPush.py",
        type: "remote",
        tip_name: "JDRouterPush.py",
        decrypt: false,
        proxy: "http://127.0.0.1:7890",
    },
    {
        url: "https://gitee.com/pj567/TVMovie/raw/master/source/source.json",
        path: "./tv_source/source.json",
        type: "remote",
        tip_name: "source.json",
        decrypt: false,
        proxy: "http://127.0.0.1:7890",
    },
    {
        url: "https://gitee.com/pj567/TVMovie/raw/master/source/appStatus.json",
        path: "./tv_source/appStatus.json",
        type: "remote",
        tip_name: "appStatus.json",
        decrypt: false,
        proxy: "http://127.0.0.1:7890",
    },
];
let githubApiDownloads = [
    {
        repo: "nianyuguai",
        owner: "longzhuzhu",
        branch: "main",
        path_regex: /.*/,
        proxy: "http://127.0.0.1:7890",
    },
    {
        repo: "monk-coder",
        owner: "dust",
        branch: "dust",
        path_regex: /.*/,
        proxy: "http://127.0.0.1:7890",
    },
    {
        repo: "NobyDa",
        owner: "Script",
        branch: "master",
        path_regex: /.*/,
        proxy: "http://127.0.0.1:7890",
    },

    // https://api.github.com/repos/nianyuguai/longzhuzhu/git/trees/main?recursive=1
];

!(async () => {
    console.log(`北京时间 (UTC+08)：${new Date(new Date().getTime() + 8 * 60 * 60 * 1000).toLocaleString()}\n`);

    console.log("===============从Gallery中获取===============");
    for (const gallery of gallerys) {
        try {
            await getFromGallery(gallery);
        } catch (e) {
            console.log("🔴 执行异常:" + e);
        }
    }
    console.log("===============从BOXJS中获取===============");
    for (const boxjs of boxjses) {
        try {
            await getFromBoxjs(boxjs);
        } catch (e) {
            console.log("🔴 执行异常:" + e);
        }
    }
    console.log("===============从指定链接中获取===============");
    for (const singleDownload of singleDownloads) {
        await download(singleDownload);
    }
    console.log("===============从github指定路径中获取===============");
    for (const githubInfo of githubApiDownloads) {
        await getFromGithubApi(githubInfo);
    }
    // console.log("\n下载完毕,当前目录列表为\n", await collectFiles("./", true));
})()
    .catch((e) => {
        console.log(`❌ 执行失败! 原因: ${e}!`);
    })
    .finally(() => {
        console.log("🥳 脚本执行完毕");
    });

async function getFromGallery(gallery) {
    await download(gallery);
    let galleryConfig = fs.readFileSync(gallery.path, "utf-8");
    let tasks = JSON.parse(galleryConfig).task;
    for (var task of tasks) {
        if (typeof task == "object") task = task.config;
        if (quantumultx_task_regex.test(task)) {
            var link = task.match(quantumultx_task_regex)[1];
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
}
async function getFromBoxjs(boxjs) {
    await download(boxjs);
    var downloadList = [];
    let boxjsConfig = JSON.parse(fs.readFileSync(boxjs.path, "utf-8"));
    if (boxjsConfig.task && boxjsConfig.task.length > 0) {
        for (var task of boxjsConfig.task) {
            if (typeof task == "object") task = task.config;
            if (quantumultx_task_regex.test(task)) {
                var link = task.match(quantumultx_task_regex)[1];
                var fileName = link.substring(link.lastIndexOf("/"));
                var target = boxjs.path.replace("boxjs.json", fileName);
                downloadList.push({
                    url: link,
                    path: target,
                    type: "remote",
                    tip_name: fileName,
                    decrypt: false,
                    proxy: boxjs.proxy,
                });
            }
        }
    }
    if (boxjsConfig.apps && boxjsConfig.apps.length > 0) {
        for (var app of boxjsConfig.apps) {
            if (app.scripts && app.scripts.length > 0) {
                for (var script of app.scripts) {
                    if (typeof script == "object") {
                        script = script.script;
                    }
                    if (!script) continue;
                    var fileName = script.substring(script.lastIndexOf("/"));
                    var target = boxjs.path.replace("boxjs.json", fileName);
                    if (downloadList.filter((it) => it.url == script).length <= 0) {
                        downloadList.push({
                            url: script,
                            path: target,
                            type: "remote",
                            tip_name: fileName,
                            decrypt: false,
                            proxy: boxjs.proxy,
                        });
                    }
                }
            } else if (app.script) {
                var script = app.script;
                var fileName = script.substring(script.lastIndexOf("/"));
                var target = boxjs.path.replace("boxjs.json", fileName);
                if (downloadList.filter((it) => it.url == script).length <= 0) {
                    downloadList.push({
                        url: script,
                        path: target,
                        type: "remote",
                        tip_name: fileName,
                        decrypt: false,
                        proxy: boxjs.proxy,
                    });
                }
            }
        }
    }
    for (var downloadConfig of downloadList) {
        await download(downloadConfig);
    }
}
async function getFromGithubApi(githubInfo) {
    let apiUrl = `https://api.github.com/repos/${githubInfo.repo}/${githubInfo.owner}/git/trees/${githubInfo.branch}?recursive=1`;
    let fcontent = "";
    if (githubInfo.proxy) {
        fcontent = await (() => {
            return new Promise((resolve) => {
                request(
                    {
                        url: apiUrl,
                        method: "GET",
                        proxy: githubInfo.proxy,
                        headers: {
                            "User-Agent":
                                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3100.0 Safari/537.36",
                            // "Accept-Encoding": "gzip", // 使用gzip压缩让数据传输更快
                        },
                    },
                    function (error, response, body) {
                        if (error || !body || response.statusCode != 200) {
                            console.log("下载失败-" + response ? response.statusCode : "未获取状态码");
                            resolve(null);
                        } else {
                            resolve(body);
                        }
                    }
                );
            });
        })();
    } else {
        fcontent = await axios.get(apiUrl).data;
    }
    var jsonObject = jsonParse(fcontent);
    if (jsonObject && jsonObject.tree) {
        for (const tree of jsonObject.tree) {
            let pointPath = `./${githubInfo.repo}_${githubInfo.owner}/${tree.path}`;
            if (tree.type == "tree") {
                var tmp = path.dirname(pointPath);
                if (!fs.existsSync(tmp)) {
                    fs.mkdirSync(tmp);
                    console.log("无目录,已创建");
                }
                continue;
            }
            if (githubInfo.path_regex.test(tree.path)) {
                var downloadInfo = {
                    url: `https://github.com/${githubInfo.repo}/${githubInfo.owner}/raw/${githubInfo.branch}/${tree.path}`,
                    path: pointPath,
                    type: "remote",
                    tip_name: `${tree.path}`,
                    decrypt: false,
                    proxy: "http://127.0.0.1:7890",
                };
                // console.log(downloadInfo);
                await download(downloadInfo);
            }
        }
    }
}

/** 收集文件
 * @param {String} relativePath 路径
 * @param {Boolean} findAll 发现全部
 * @param {Regex} include 匹配的正则
 */
async function collectFiles(relativePath, findAll, include) {
    let fileList = [];
    return listFile(relativePath, fileList, findAll, include);
}
/** 列出文件
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
    // console.log(list);
    return list;
}

/** 下载文件
 * @param {String} url 下载地址
 * @param {String} path 存放路径
 * @param {String} type 资源类型(remote-远程 local-本地)
 * @param {String} tip_name 提示时的文件别名,如果不填则不提示
 * @param {Boolean} decrypt 是否需要进行解密
 * @param {String} proxy 代理路径,不填则不走代理,如http://127.0.0.1:7890
 */
async function download(downloadConfig) {
    let { url, path: filePath, type, tip_name, decrypt, proxy } = downloadConfig;
    let typeDes = type == "local" ? "加载" : "下载";
    let fcontent = "";
    tip_name = tip_name || "";
    if (!url) {
        console.log(`❌📥 【${typeDes}】${tip_name}时链接丢失`);
        return;
    }
    if (!filePath) {
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
                                if (error || !body || response.statusCode != 200) {
                                    console.log("下载失败-" + !!response ? response.statusCode : "未获取状态码");
                                    resolve(null);
                                } else {
                                    // console.log("下载完毕-" + url + "|--" + response.statusCode);
                                    resolve(body);
                                }
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
        var tmp = path.dirname(filePath);
        if (!fs.existsSync(tmp)) {
            fs.mkdirSync(tmp);
        }
        if (decrypt) {
            fcontent = aes.decrypt(fcontent, process.env.AES_KEY, process.env.AES_IV);
            await fs.writeFileSync(filePath, fcontent, "utf8");
            console.log(`📥🔓 【${typeDes}】${tip_name}并解密完毕`);
        } else {
            await fs.writeFileSync(filePath, fcontent, "utf8");
            console.log(`📥 【${typeDes}】${tip_name}完毕`);
        }
    } catch (error) {
        console.log(`❌📥 【${typeDes}】${tip_name}时出错`, error);
    }
}

function jsonParse(str) {
    if (typeof str == "string") {
        try {
            return JSON.parse(str);
        } catch (e) {
            console.log("数据转换失败", e);
            return null;
        }
    }
}
