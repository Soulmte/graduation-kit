<template>
    <a-card title="预约管理">
        <a-alert
            type="info"
            show-icon
            message="预约流转：待确认 → 已确认 → 已完成"
            description="拒单会把名额释放给别人；标记失约要等服务时间过了才能点，名额不释放。"
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
                v-model:value="queryRange"
                value-format="YYYY-MM-DD"
                style="width: 250px"
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
                    <div>{{ record.slotDate }}</div>
                    <div class="text-sub">
                        {{ record.startTime }} ~ {{ record.endTime }}
                    </div>
                </template>
                <template v-else-if="column.key === 'price'">
                    <span class="amount">¥{{ record.price }}</span>
                </template>
                <template v-else-if="column.key === 'status'">
                    <a-tag :color="APPOINTMENT_STATUS[record.status]?.color">
                        {{ APPOINTMENT_STATUS[record.status]?.text }}
                    </a-tag>
                </template>
                <template v-else-if="column.key === 'contact'">
                    <div>{{ record.contactName }}</div>
                    <div class="text-sub">{{ record.contactPhone }}</div>
                </template>
                <template v-else-if="column.key === 'op'">
                    <div class="table-actions">
                        <!-- 按钮只在对应状态下出现，避免点了才知道不允许 -->
                        <a-button
                            v-if="record.status === 0"
                            size="small"
                            type="primary"
                            @click="handleConfirm(record)"
                        >
                            <template #icon><check-outlined /></template> 接单
                        </a-button>
                        <a-button
                            v-if="record.status === 0"
                            size="small"
                            class="btn-delete"
                            @click="handleOpenReject(record)"
                        >
                            <template #icon><close-outlined /></template> 拒单
                        </a-button>
                        <a-button
                            v-if="record.status === 1"
                            size="small"
                            type="primary"
                            @click="handleFinish(record)"
                        >
                            <template #icon><check-outlined /></template> 核销
                        </a-button>
                        <a-button
                            v-if="record.status === 1"
                            size="small"
                            @click="handleNoShow(record)"
                        >
                            标记失约
                        </a-button>
                        <a-button size="small" @click="handleDetail(record)">
                            详情
                        </a-button>
                    </div>
                </template>
            </template>
        </a-table>

        <!-- 拒单弹窗，理由必填 -->
        <a-modal
            v-model:open="rejectVisible"
            title="拒单"
            :width="480"
            ok-text="确认拒单"
            cancel-text="取消"
            :confirm-loading="rejecting"
            destroy-on-close
            @ok="handleReject"
        >
            <a-alert
                type="warning"
                show-icon
                message="拒单后名额会释放给其他用户，操作不可撤销"
                style="margin-bottom: 12px"
            />
            <a-form :model="rejectForm" ref="rejectFormRef" layout="vertical">
                <a-form-item
                    label="拒单理由"
                    name="rejectReason"
                    :rules="[{ required: true, message: '请填写拒单理由' }]"
                >
                    <a-textarea
                        v-model:value="rejectForm.rejectReason"
                        placeholder="用户会在预约详情里看到这条理由"
                        :rows="3"
                        :maxlength="255"
                        show-count
                    />
                </a-form-item>
            </a-form>
        </a-modal>

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
                <a-descriptions-item label="服务项">
                    {{ current.serviceName }}
                </a-descriptions-item>
                <a-descriptions-item label="预约状态">
                    <a-tag :color="APPOINTMENT_STATUS[current.status]?.color">
                        {{ APPOINTMENT_STATUS[current.status]?.text }}
                    </a-tag>
                </a-descriptions-item>
                <a-descriptions-item label="服务日期">
                    {{ current.slotDate }}
                </a-descriptions-item>
                <a-descriptions-item label="服务时段">
                    {{ current.startTime }} ~ {{ current.endTime }}
                </a-descriptions-item>
                <a-descriptions-item label="预约人">
                    {{ current.username }}
                </a-descriptions-item>
                <a-descriptions-item label="金额">
                    ¥{{ current.price }}
                </a-descriptions-item>
                <a-descriptions-item label="联系人" :span="2">
                    {{ current.contactName }} {{ current.contactPhone }}
                </a-descriptions-item>
                <a-descriptions-item label="用户备注" :span="2">
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
import { reactive, ref, onMounted, computed } from "vue";
import { Modal, message } from "ant-design-vue";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons-vue";
import {
    pageQueryProviderAppointment,
    confirmAppointment,
    rejectAppointment,
    finishAppointment,
    noShowAppointment,
    getAppointmentById,
    APPOINTMENT_STATUS,
} from "@/api/appointment";
import ResizableTitle from "@/components/ResizableTitle.vue";

const baseColumns = [
    { title: "序号", key: "idx", width: 60 },
    { title: "预约单号", dataIndex: "appointmentNo", key: "appointmentNo", width: 190 },
    { title: "服务项", dataIndex: "serviceName", key: "serviceName", ellipsis: true },
    { title: "服务时间", key: "slot", width: 130 },
    { title: "金额", key: "price", width: 90 },
    { title: "状态", key: "status", width: 100 },
    { title: "联系人", key: "contact", width: 130 },
    { title: "操作", key: "op", width: 230 },
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
const queryRange = ref([]);

const detailVisible = ref(false);
const current = ref(null);

const rejectVisible = ref(false);
const rejecting = ref(false);
const rejectTarget = ref(null);
const rejectFormRef = ref(null);
const rejectForm = reactive({ rejectReason: "" });

const fetchList = async () => {
    loading.value = true;
    try {
        const [dateFrom, dateTo] = queryRange.value || [];
        const res = await pageQueryProviderAppointment({
            pageNum: pageNum.value,
            pageSize,
            appointmentNo: queryNo.value || undefined,
            status: queryStatus.value,
            dateFrom: dateFrom || undefined,
            dateTo: dateTo || undefined,
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

const handleConfirm = (record) => {
    Modal.confirm({
        title: "确认接单",
        content: `确定接下 ${record.contactName} 在 ${record.slotDate} ${record.startTime} 的预约吗？`,
        onOk: async () => {
            await confirmAppointment(record.id);
            message.success("已接单");
            fetchList();
        },
    });
};

const handleOpenReject = (record) => {
    rejectTarget.value = record;
    rejectForm.rejectReason = "";
    rejectVisible.value = true;
};

const handleReject = async () => {
    await rejectFormRef.value.validate();
    rejecting.value = true;
    try {
        await rejectAppointment(rejectTarget.value.id, rejectForm.rejectReason);
        message.success("已拒单");
        rejectVisible.value = false;
        fetchList();
    } finally {
        rejecting.value = false;
    }
};

const handleFinish = (record) => {
    Modal.confirm({
        title: "确认核销",
        content: "核销表示用户已到店并完成服务，之后用户就能评价了。确定核销吗？",
        onOk: async () => {
            await finishAppointment(record.id);
            message.success("核销成功");
            fetchList();
        },
    });
};

const handleNoShow = (record) => {
    Modal.confirm({
        title: "标记失约",
        content: "标记失约后名额不会释放，且用户无法评价。确定标记吗？",
        okButtonProps: { danger: true },
        onOk: async () => {
            await noShowAppointment(record.id);
            message.success("已标记失约");
            fetchList();
        },
    });
};

const handleDetail = async (record) => {
    const res = await getAppointmentById(record.id);
    current.value = res.data;
    detailVisible.value = true;
};

onMounted(fetchList);
</script>

<style scoped>
.amount {
    color: var(--color-danger, #cf1322);
    font-weight: 600;
}
</style>
