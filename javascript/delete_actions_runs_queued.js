const axios = require("axios");

!(async () => {
    console.log(`北京时间 (UTC+08)：${new Date(new Date().getTime() + 8 * 60 * 60 * 1000).toLocaleString()}\n`);
    try {
        await del_runs();
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

async function del_runs() {
    // https://docs.github.com/en/rest/reference/actions#list-workflow-runs-for-a-repository
    let res = await axios.get("https://api.github.com/repos/Nancyhnson478/Mirror/actions/runs?per_page=100&status=queued", {
        headers: { Accept: "application/vnd.github.v3+json" },
    });
    if (res.status == 200) {
        let data = res.data;
        if (!data || !data.workflow_runs || data.workflow_runs <= 0) return;
        console.log(`共有${data.total_count}个queued状态的工作流`);
        let workflows = data.workflow_runs.reverse();
        for (const workflow of workflows) {
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
