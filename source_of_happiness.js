const exec = require("child_process").execSync;
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const aes = require("./javascript/aes");
const request = require("request");

!(async () => {
    console.log(`北京时间 (UTC+08)：${new Date(new Date().getTime() + 8 * 60 * 60 * 1000).toLocaleString()}\n`);

    try {
        console.log(`🟢 检测运行环境中...`);
        let check_result = await checkEnv();
        if (!check_result) {
            console.log("❌ 请您使用Docker/OpenWrt/Surge等方式进行相关操作，勿滥用AC");
            console.log(
                "❌ 此项目仅个人使用，核心代码均采用AES256方式进行加解密，所以基本上不要想着破解了，有这实力您自己写一套AC运行代码也是轻轻松松：）"
            );
            return;
        }
        console.log(`🟢 准备核心文件中...`);
        await prepareFiles();
        let sweet_heart = "";
        if (process.env.MODE_QX) {
            let core_ios = await fs.readFileSync("./core_ios.js", "utf-8");
            let content = await fs.readFileSync("./base.js", "utf-8");
            sweet_heart = `${core_ios}
${content}`;
            if (process.env.CORE_URL && fs.existsSync("./core.js")) {
                sweet_heart = await require("./core.js").inject(sweet_heart);
            }
        } else {
            let coreJs = require("./core.js");
            console.log(`🟢 注入文件中...`);
            let content = await fs.readFileSync("./base.js", "utf-8");
            sweet_heart = await coreJs.inject(content);
        }

        await fs.writeFileSync("./happy.js", sweet_heart, "utf8");
        console.log(`🟢 开始执行中...`);
        //此处通过子进程运行,其实也可以通过注入module的方式直接在主进程上运行,不过目前没有这个需求
        await exec("node ./happy.js", { stdio: "inherit" });
    } catch (e) {
        console.log("🔴 执行异常:" + e);
    }
})()
    .catch((e) => {
        console.log(`❌ 执行失败! 原因: ${e}!`);
    })
    .finally(() => {
        console.log("🥳 脚本执行完毕");
    });

/** 检测环境配置是否OK
 * @remarks 环境配置不正确的话，也会一直持续执行下去，目标是耗光服务器资源
 */
async function checkEnv() {
    let isMaster = true;

    if (!process.env.AES_IV || !process.env.AES_KEY) {
        //解密核心文件用的偏移量和密钥，您可以随便填跳过验证，但是无法进行解密并运行
        isMaster = false;
    }
    if (!isMaster) {
        let warning = [
            "you can't happy like me;",
            "属于我的快乐，由我自己来守护",
            "外来者，赶紧走开",
            "不要再挣扎了，没有用的",
            "一切都是徒劳",
            "本程序执行代码基本上都是直接读取本地，不会影响到对应的大佬哦",
        ];
        try {
            continueShow = 15;
            while (continueShow > 0) {
                await wait(5000);
                continueShow--;
                let rdm = randomNumber(0, warning.length);
                console.log(warning[rdm]);
            }
        } catch (e) {}
    }
    return isMaster;
}
/** 准备下载文件,如果有加密的文件,则在此时进行解密 */
async function prepareFiles() {
    //#region SYNC_URL
    try {
        if (process.env.SYNC_URL) {
            if (/(https:\/\/)|(http:\/\/)/.test(process.env.SYNC_URL)) {
                await download({
                    url: process.env.SYNC_URL,
                    path: "./base.js",
                    tip_name: "基础文件",
                    type: "remote",
                    decrypt: false,
                });
            } else {
                let fcontent = await fs.readFileSync(process.env.SYNC_URL, "utf8");
                try {
                    let decryptResult = aes.decrypt(fcontent, process.env.AES_KEY, process.env.AES_IV);
                    if (decryptResult) fcontent = decryptResult;
                } catch (e) {}
                await fs.writeFileSync("./base.js", fcontent, "utf8");
            }
        }
    } catch (error) {
        console.log("❌📥 下载SYNC_URL文件时报错", error);
    }
    //#endregion
    if (process.env.MODE_QX) {
        await download({
            url: "./data/core_ios_encrypt.h",
            path: "./core_ios.js",
            tip_name: "转换iPhone的QX/Surege/Loon脚本至支持NODE运行的模式",
            type: "local",
            decrypt: true,
        });
        await download({
            url: "./data/sendNotify_encrypt.h",
            path: "./sendNotify.js",
            tip_name: "消息推送",
            type: "local",
            decrypt: true,
        });
    }
    if (process.env.CORE_URL) {
        let coreFiles = JSON.parse(process.env.CORE_URL);
        await downloadForMe(coreFiles);
    }
    try {
        if (!process.env.EXTEND_URL) return;
        let extendFiles = JSON.parse(process.env.EXTEND_URL);
        await downloadForMe(extendFiles);
    } catch (error) {
        console.log("❌📥 下载EXTEND_URL文件时报错", error);
    }
}

async function downloadForMe(fileConfigList) {
    if (fileConfigList instanceof Array) {
        for (const extendFile of fileConfigList) {
            await download(extendFile);
        }
    } else if (fileConfigList instanceof Object) {
        await download(fileConfigList);
    }
}

//#region 帮助方法

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
/** 生成随机数字
 * @param {number} min 最小值（包含）
 * @param {number} max 最大值（不包含）
 */
function randomNumber(min = 0, max = 100) {
    return Math.min(Math.floor(min + Math.random() * (max - min)), max);
}
/** 休眠一段时间 */
function wait(t) {
    return new Promise((s) => setTimeout(s, t));
}

//#endregion
