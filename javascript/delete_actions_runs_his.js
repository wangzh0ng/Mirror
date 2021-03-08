const axios = require("axios");

let hadMore = false;
let keepNumber = process.env.KEEP_NUMBER && !isNaN(process.env.KEEP_NUMBER) ? parseInt(process.env.KEEP_NUMBER) : 100;
!(async () => {
    console.log(`北京时间 (UTC+08)：${new Date(new Date().getTime() + 8 * 60 * 60 * 1000).toLocaleString()}\n`);
    try {
        do {
            await del_logs();
        } while (hadMore);
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

async function del_logs() {
    // https://docs.github.com/en/rest/reference/actions#list-workflow-runs-for-a-repository
    let res = await axios.get("https://api.github.com/repos/Nancyhnson478/Mirror/actions/runs?per_page=100", {
        headers: { Accept: "application/vnd.github.v3+json" },
    });
    if (res.status == 200) {
        let data = res.data;
        if (!data || !data.workflow_runs || data.workflow_runs <= 0) return;
        console.log(`共有${data.total_count}条日志`);
        let workflows = data.workflow_runs.reverse();
        let canDelCount = data.total_count - keepNumber;
        if (canDelCount <= 0) {
            hadMore = false;
            console.log(`当前剩余日志小于${keepNumber}条,暂不删除`);
            return;
        }
        if (canDelCount > data.workflow_runs.length) {
            hadMore = true;
            canDelCount = data.workflow_runs.length;
        } else {
            hadMore = false;
        }
        console.log(`预计删除${canDelCount}条日志`);
        for (const workflow of workflows) {
            if (canDelCount <= 0) break;
            canDelCount--;
            console.log(`准备删除 - ${workflow.id}`);
            try {
                // https://docs.github.com/en/rest/reference/actions#delete-workflow-run-logs
                let dres = await axios.delete(
                    `https://api.github.com/repos/Nancyhnson478/Mirror/actions/runs/${workflow.id}`,
                    {
                        headers: {
                            "User-Agent": "request",
                            Accept: "application/vnd.github.v3+json",
                            Authorization: `token ${process.env.GITHUB_TOKEN}`,
                        },
                    }
                );
                console.log(`删除完毕 - ${workflow.id} - ${dres.status}-${dres.statusText}`);
            } catch (aerr) {
                console.log(`删除失败 - ${workflow.id}`);
            }
        }
    } else {
        console.log(`查询失败 - ${res.status}`);
    }
}
