<template>
    <a-card title="预约总览">
        <a-alert
            type="info"
            show-icon
            message="平台方只做查看与核对，接单、核销、拒单都由机构在机构端操作。"
            style="margin-bottom: 16px"
        />

        <div class="toolbar">
            <a-input-search
                v-model:value="queryNo"
                placeholder="搜索预约单号"
                style="width: 220px"
                allow-clear
                @search="onSearch"
            />
            <a-select
                v-model:value="queryStatus"
                placeholder="状态筛选"
                style="width: 140px"
                allow-clear
                @change="onSearch"
            >
                <a-select-option
                    v-for="(v, k) in APPOINTMENT_STATUS"
                    :key="k"
                    :value="Number(k)"
                >
                    {{ v.text }}
                </a-select-option>
            </a-select>
            <a-range-picker
                v-model:value="queryDate"
                value-format="YYYY-MM-DD"
                :placeholder="['服务日期起', '服务日期止']"
                style="width: 260px"
                @change="onSearch"
            />
        </div>

        <a-table
            :loading="loading"
            :columns="columns"
            :data-source="list"
            row-key="id"
            :components="tableComponents"
            :pagination="{
                current: pageNum,
                pageSize,
                total,
                onChange: (p) => {
                    pageNum = p;
                    fetchList();
                },
                showTotal: (t) => `共 ${t} 条`,
            }"
        >
            <template #bodyCell="{ column, record, index }">
                <template v-if="column.key === 'idx'">
                    {{ (pageNum - 1) * pageSize + index + 1 }}
                </template>
                <template v-else-if="column.key === 'slot'">
                    {{ record.slotDate }} {{ record.startTime }} ~ {{ record.endTime }}
                </template>
                <template v-else-if="column.key === 'price'">
                    ¥{{ record.price }}
                </template>
                <template v-else-if="column.key === 'status'">
                    <a-tag :color="APPOINTMENT_STATUS[record.status]?.color">
                        {{ APPOINTMENT_STATUS[record.status]?.text }}
                    </a-tag>
                </template>
                <template v-else-if="column.key === 'op'">
                    <a-button size="small" @click="handleDetail(record)">
                        <template #icon><eye-outlined /></template> 详情
                    </a-button>
                </template>
            </template>
        </a-table>

        <a-modal
            v-model:open="detailVisible"
            title="预约详情"
            :width="640"
            :footer="null"
            destroy-on-close
        >
            <a-descriptions v-if="current" :column="2" bordered size="small">
                <a-descriptions-item label="预约单号" :span="2">
                    {{ current.appointmentNo }}
                </a-descriptions-item>
                <a-descriptions-item label="服务项" :span="2">
                    {{ current.serviceName }}
                </a-descriptions-item>
                <a-descriptions-item label="服务机构">
                    {{ current.providerName || "-" }}
                </a-descriptions-item>
                <a-descriptions-item label="预约人">
                    {{ current.username || "-" }}
                </a-descriptions-item>
                <a-descriptions-item label="状态">
                    <a-tag :color="APPOINTMENT_STATUS[current.status]?.color">
                        {{ APPOINTMENT_STATUS[current.status]?.text }}
                    </a-tag>
                </a-descriptions-item>
                <a-descriptions-item label="金额">
                    ¥{{ current.price }}
                </a-descriptions-item>
                <a-descriptions-item label="服务时间" :span="2">
                    {{ current.slotDate }} {{ current.startTime }} ~
                    {{ current.endTime }}
                </a-descriptions-item>
                <a-descriptions-item label="联系人">
                    {{ current.contactName }}
                </a-descriptions-item>
                <a-descriptions-item label="联系电话">
                    {{ current.contactPhone }}
                </a-descriptions-item>
                <a-descriptions-item label="备注" :span="2">
                    {{ current.remark || "无" }}
                </a-descriptions-item>
                <a-descriptions-item v-if="current.rejectReason" label="拒单理由" :span="2">
                    {{ current.rejectReason }}
                </a-descriptions-item>
                <a-descriptions-item label="下单时间">
                    {{ current.createTime }}
                </a-descriptions-item>
                <a-descriptions-item label="接单时间">
                    {{ current.confirmTime || "-" }}
                </a-descriptions-item>
                <a-descriptions-item label="核销时间">
                    {{ current.finishTime || "-" }}
                </a-descriptions-item>
                <a-descriptions-item label="取消时间">
                    {{ current.cancelTime || "-" }}
                </a-descriptions-item>
            </a-descriptions>
        </a-modal>
    </a-card>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { EyeOutlined } from "@ant-design/icons-vue";
import {
    pageQueryAllAppointment,
    getAppointmentById,
    APPOINTMENT_STATUS,
} from "@/api/appointment";
import ResizableTitle from "@/components/ResizableTitle.vue";

const baseColumns = [
    { title: "序号", key: "idx", width: 60 },
    {
        title: "预约单号",
        dataIndex: "appointmentNo",
        key: "appointmentNo",
        width: 170,
    },
    { title: "服务项", dataIndex: "serviceName", key: "serviceName", ellipsis: true },
    { title: "机构", dataIndex: "providerName", key: "providerName", width: 150 },
    { title: "预约人", dataIndex: "username", key: "username", width: 120 },
    { title: "服务时间", key: "slot", width: 200 },
    { title: "金额", key: "price", width: 100 },
    { title: "状态", key: "status", width: 100 },
    { title: "下单时间", dataIndex: "createTime", key: "createTime", width: 170 },
    { title: "操作", key: "op", width: 100 },
];

const reactiveCols = ref(baseColumns.map((c) => ({ ...c })));
const handleColumnResize = (index) => (w) => {
    reactiveCols.value[index] = { ...reactiveCols.value[index], width: w };
};
const columns = computed(() =>
    reactiveCols.value.map((col, i) => ({
        ...col,
        customHeaderCell: () => ({
            width: col.width,
            onResize: handleColumnResize(i),
        }),
    })),
);
const tableComponents = { header: { cell: ResizableTitle } };

const loading = ref(false);
const list = ref([]);
const total = ref(0);
const pageNum = ref(1);
const pageSize = 10;
const queryNo = ref("");
const queryStatus = ref(undefined);
const queryDate = ref(null);

const detailVisible = ref(false);
const current = ref(null);

const fetchList = async () => {
    loading.value = true;
    try {
        const res = await pageQueryAllAppointment({
            pageNum: pageNum.value,
            pageSize,
            appointmentNo: queryNo.value || undefined,
            status: queryStatus.value,
            dateFrom: queryDate.value?.[0] || undefined,
            dateTo: queryDate.value?.[1] || undefined,
        });
        list.value = res.data.records;
        total.value = res.data.total;
    } finally {
        loading.value = false;
    }
};

const onSearch = () => {
    pageNum.value = 1;
    fetchList();
};

const handleDetail = async (record) => {
    const res = await getAppointmentById(record.id);
    current.value = res.data;
    detailVisible.value = true;
};

onMounted(fetchList);
</script>
