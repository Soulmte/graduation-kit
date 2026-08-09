<template>
    <div class="stack-16">
        <div class="stat-grid">
            <a-card>
                <a-statistic
                    title="用户总数"
                    :value="stats.userCount"
                    :value-style="{ color: 'var(--color-success)' }"
                >
                    <template #prefix><user-outlined /></template>
                </a-statistic>
            </a-card>
            <a-card>
                <a-statistic
                    title="公告总数"
                    :value="stats.noticeCount"
                    :value-style="{ color: 'var(--color-primary)' }"
                >
                    <template #prefix><bell-outlined /></template>
                </a-statistic>
            </a-card>
            <a-card>
                <a-statistic
                    title="日志总数"
                    :value="stats.logCount"
                    :value-style="{ color: 'var(--color-danger)' }"
                >
                    <template #prefix><file-text-outlined /></template>
                </a-statistic>
            </a-card>
            <a-card>
                <a-statistic
                    title="今日日志"
                    :value="stats.todayLogCount"
                    :value-style="{ color: 'var(--color-warning)' }"
                >
                    <template #prefix><rise-outlined /></template>
                </a-statistic>
            </a-card>
        </div>

        <div class="chart-grid">
            <a-card><div ref="logChart" style="height: 320px"></div></a-card>
            <a-card><div ref="roleChart" style="height: 320px"></div></a-card>
        </div>
    </div>
</template>

<script setup>
import { reactive, ref, onMounted, onBeforeUnmount, nextTick } from "vue";
import * as echarts from "echarts";
import {
    UserOutlined,
    BellOutlined,
    FileTextOutlined,
    RiseOutlined,
} from "@ant-design/icons-vue";
import { listAllUser } from "@/api/user";
import { listAllNotice } from "@/api/notice";
import { pageQueryLog } from "@/api/log";

const stats = reactive({
    userCount: 0,
    noticeCount: 0,
    logCount: 0,
    todayLogCount: 0,
});
const logChart = ref(null);
const roleChart = ref(null);
let logInst, roleInst;

// 取本地日期（YYYY-MM-DD）
// 不用 toISOString，它返回 UTC 时间，东八区凌晨 0-8 点会被算成前一天
const fmtDate = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
};

// 查某一天的日志总数（只取 total，所以 pageSize 给 1）
const countLogByDate = (dateStr) =>
    pageQueryLog({
        pageNum: 1,
        pageSize: 1,
        startTime: `${dateStr} 00:00:00`,
        endTime: `${dateStr} 23:59:59`,
    }).then((r) => r.data.total || 0);

const fetchData = async () => {
    // 近 7 天的日期（末尾就是今天）
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(fmtDate(d));
    }

    // 基础数据与 7 天日志量全部并发请求，避免串行等待
    const [userRes, noticeRes, logRes, dailyCounts] = await Promise.all([
        listAllUser(),
        listAllNotice(),
        pageQueryLog({ pageNum: 1, pageSize: 1 }),
        Promise.all(days.map(countLogByDate)),
    ]);

    const users = userRes.data || [];
    const notices = noticeRes.data || [];

    stats.userCount = users.length;
    stats.noticeCount = notices.length;
    stats.logCount = logRes.data.total || 0;
    // 今日日志量复用近 7 天数组的最后一项，不重复请求
    stats.todayLogCount = dailyCounts[dailyCounts.length - 1];

    const roleMap = {};
    users.forEach((u) => {
        roleMap[u.role] = (roleMap[u.role] || 0) + 1;
    });
    const roleData = Object.entries(roleMap).map(([name, value]) => ({
        name: name === "admin" ? "管理员" : "普通用户",
        value,
    }));

    const dates = days.map((s) => s.slice(5));
    const counts = dailyCounts;

    await nextTick();
    logInst = echarts.init(logChart.value);
    logInst.setOption({
        title: { text: "近 7 天操作日志趋势" },
        tooltip: { trigger: "axis" },
        xAxis: { type: "category", data: dates },
        yAxis: { type: "value" },
        series: [
            {
                data: counts,
                type: "line",
                smooth: true,
                itemStyle: { color: "#1890ff" },
                areaStyle: { opacity: 0.3 },
            },
        ],
    });

    roleInst = echarts.init(roleChart.value);
    roleInst.setOption({
        title: { text: "用户角色分布" },
        tooltip: { trigger: "item" },
        legend: { bottom: 0 },
        color: ["#1890ff", "#52c41a", "#faad14"],
        series: [{ type: "pie", radius: "60%", data: roleData }],
    });
};

const handleResize = () => {
    logInst?.resize();
    roleInst?.resize();
};

onMounted(() => {
    fetchData().catch(() => {});
    window.addEventListener("resize", handleResize);
});
onBeforeUnmount(() => {
    window.removeEventListener("resize", handleResize);
    logInst?.dispose();
    roleInst?.dispose();
});
</script>

<style scoped>
.stat-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 16px;
}
@media (max-width: 1024px) {
    .stat-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}
@media (max-width: 560px) {
    .stat-grid {
        grid-template-columns: 1fr;
    }
}

.chart-grid {
    display: grid;
    grid-template-columns: 1.4fr 1fr;
    gap: 16px;
}
@media (max-width: 992px) {
    .chart-grid {
        grid-template-columns: 1fr;
    }
}
</style>
