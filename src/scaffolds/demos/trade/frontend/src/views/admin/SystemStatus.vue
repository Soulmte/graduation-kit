<template>
    <a-spin :spinning="loading">
        <!-- 状态概览卡片 -->
        <a-row :gutter="[16, 16]" style="margin-bottom: 16px">
            <a-col :xs="12" :sm="6">
                <a-card>
                    <a-statistic
                        title="服务状态"
                        :value="connected ? '运行中' : '已断开'"
                        :value-style="{
                            color: connected ? '#52c41a' : '#ff4d4f',
                            fontSize: '20px',
                        }"
                    >
                        <template #prefix>
                            <check-circle-outlined
                                v-if="connected"
                                style="color: #52c41a"
                            />
                            <close-circle-outlined
                                v-else
                                style="color: #ff4d4f"
                            />
                        </template>
                    </a-statistic>
                </a-card>
            </a-col>
            <a-col :xs="12" :sm="6">
                <a-card>
                    <a-statistic
                        title="数据库"
                        :value="dbOk ? '已连接' : error ? '不可用' : '检测中'"
                        :value-style="{
                            color: dbOk ? '#52c41a' : '#ff4d4f',
                            fontSize: '20px',
                        }"
                    >
                        <template #prefix>
                            <database-outlined
                                :style="{ color: dbOk ? '#52c41a' : '#ff4d4f' }"
                            />
                        </template>
                    </a-statistic>
                </a-card>
            </a-col>
            <a-col :xs="12" :sm="6">
                <a-card>
                    <a-statistic
                        title="响应延迟"
                        :value="latency != null ? `${latency} ms` : '-'"
                        :value-style="{ color: latencyColor, fontSize: '20px' }"
                    >
                        <template #prefix>
                            <thunderbolt-outlined
                                :style="{ color: latencyColor }"
                            />
                        </template>
                    </a-statistic>
                </a-card>
            </a-col>
            <a-col :xs="12" :sm="6">
                <a-card>
                    <a-statistic
                        title="前端框架"
                        value="Antd Vue"
                        :value-style="{ color: '#1890ff', fontSize: '20px' }"
                    >
                        <template #prefix>
                            <desktop-outlined style="color: #1890ff" />
                        </template>
                    </a-statistic>
                </a-card>
            </a-col>
        </a-row>

        <!-- 详细信息 -->
        <a-card title="后端详情">
            <template #extra>
                <a-button :loading="loading" @click="fetchHealth">
                    <template #icon><reload-outlined /></template> 刷新
                </a-button>
            </template>

            <a-descriptions v-if="error" bordered :column="2" size="small">
                <a-descriptions-item label="连接状态">
                    <a-tag color="error"
                        ><close-circle-outlined /> 连接失败</a-tag
                    >
                </a-descriptions-item>
                <a-descriptions-item label="错误信息">{{
                    error
                }}</a-descriptions-item>
                <a-descriptions-item label="响应耗时"
                    >{{ latency }} ms</a-descriptions-item
                >
                <a-descriptions-item label="检查时间">{{
                    checkedAt || "-"
                }}</a-descriptions-item>
            </a-descriptions>

            <a-descriptions
                v-else-if="health"
                bordered
                :column="2"
                size="small"
            >
                <a-descriptions-item label="连接状态">
                    <a-tag color="success"
                        ><check-circle-outlined /> 正常</a-tag
                    >
                </a-descriptions-item>
                <a-descriptions-item label="后端技术栈">
                    <a-tag
                        color="blue"
                        style="font-size: 13px; padding: 2px 10px"
                    >
                        <cloud-server-outlined /> {{ health.service || "未知" }}
                    </a-tag>
                </a-descriptions-item>
                <a-descriptions-item label="数据库状态">
                    <a-tag :color="dbOk ? 'success' : 'error'">
                        {{ dbOk ? "连接正常" : health.database || "异常" }}
                    </a-tag>
                </a-descriptions-item>
                <a-descriptions-item label="API 地址"
                    >/api/health</a-descriptions-item
                >
                <a-descriptions-item label="响应耗时">
                    <span :style="{ color: latencyColor, fontWeight: 600 }"
                        >{{ latency }} ms</span
                    >
                </a-descriptions-item>
                <a-descriptions-item label="上次检查">{{
                    checkedAt || "-"
                }}</a-descriptions-item>
            </a-descriptions>

            <a-empty v-else description='点击"刷新"检查系统状态'>
                <template #image>
                    <cloud-server-outlined
                        style="font-size: 48px; color: #bbb"
                    />
                </template>
            </a-empty>
        </a-card>
    </a-spin>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import {
    ReloadOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    CloudServerOutlined,
    DatabaseOutlined,
    ThunderboltOutlined,
    DesktopOutlined,
} from "@ant-design/icons-vue";
import request from "@/api/request";

const loading = ref(false);
const connected = ref(false);
const health = ref(null);
const error = ref(null);
const latency = ref(null);
const checkedAt = ref(null);

const dbOk = computed(() => health.value?.database === "ok");

const latencyColor = computed(() => {
    if (latency.value == null) return "#999";
    if (latency.value < 100) return "#52c41a";
    if (latency.value < 300) return "#faad14";
    return "#ff4d4f";
});

const fetchHealth = async () => {
    loading.value = true;
    error.value = null;
    const start = Date.now();
    try {
        const res = await request.get("/health");
        latency.value = Date.now() - start;
        health.value = res.data;
        connected.value = true;
        error.value = null;
    } catch (err) {
        latency.value = Date.now() - start;
        error.value = err.message || "连接失败";
        connected.value = false;
        health.value = null;
    } finally {
        checkedAt.value = new Date().toLocaleString();
        loading.value = false;
    }
};

onMounted(fetchHealth);
</script>
