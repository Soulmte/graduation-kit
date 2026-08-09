<template>
    <a-card title="退款审核">
        <a-alert
            type="info"
            show-icon
            message="同意退款后订单转为已退款，库存会自动回滚；拒绝则订单回到退款前的状态。"
            style="margin-bottom: 16px"
        />

        <div class="toolbar">
            <a-select
                v-model:value="queryStatus"
                placeholder="状态筛选"
                style="width: 140px"
                allow-clear
                @change="onSearch"
            >
                <a-select-option
                    v-for="(v, k) in REFUND_STATUS"
                    :key="k"
                    :value="Number(k)"
                >
                    {{ v.text }}
                </a-select-option>
            </a-select>
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
                <template v-else-if="column.key === 'amount'">
                    <span class="amount">¥{{ record.amount }}</span>
                </template>
                <template v-else-if="column.key === 'status'">
                    <a-tag :color="REFUND_STATUS[record.status]?.color">
                        {{ REFUND_STATUS[record.status]?.text }}
                    </a-tag>
                </template>
                <template v-else-if="column.key === 'op'">
                    <!-- 只有待审核可操作，已处理的记录只读 -->
                    <div v-if="record.status === 0" class="table-actions">
                        <a-button
                            size="small"
                            type="primary"
                            @click="handleAudit(record, 1)"
                        >
                            <template #icon><check-outlined /></template> 同意
                        </a-button>
                        <a-button
                            size="small"
                            class="btn-delete"
                            @click="handleAudit(record, 2)"
                        >
                            <template #icon><close-outlined /></template> 拒绝
                        </a-button>
                    </div>
                    <span v-else class="text-sub">已处理</span>
                </template>
            </template>
        </a-table>

        <a-modal
            v-model:open="auditVisible"
            :title="auditStatus === 1 ? '同意退款' : '拒绝退款'"
            :ok-text="auditStatus === 1 ? '确认同意' : '确认拒绝'"
            :ok-button-props="{ danger: auditStatus === 2 }"
            cancel-text="取消"
            destroy-on-close
            @ok="submitAudit"
        >
            <a-descriptions v-if="current" :column="1" size="small" bordered>
                <a-descriptions-item label="退款单号">
                    {{ current.refundNo }}
                </a-descriptions-item>
                <a-descriptions-item label="订单号">
                    {{ current.orderNo }}
                </a-descriptions-item>
                <a-descriptions-item label="退款金额">
                    ¥{{ current.amount }}
                </a-descriptions-item>
                <a-descriptions-item label="申请理由">
                    {{ current.reason || "买家未填写" }}
                </a-descriptions-item>
            </a-descriptions>
            <a-form layout="vertical" style="margin-top: 16px">
                <a-form-item label="审核备注">
                    <a-textarea
                        v-model:value="auditRemark"
                        :rows="3"
                        :maxlength="255"
                        show-count
                        placeholder="填写处理说明，买家可以看到"
                    />
                </a-form-item>
            </a-form>
        </a-modal>
    </a-card>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { message } from "ant-design-vue";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons-vue";
import {
    pageQueryMerchantRefund,
    auditRefund,
    REFUND_STATUS,
} from "@/api/refund";
import ResizableTitle from "@/components/ResizableTitle.vue";

const baseColumns = [
    { title: "序号", key: "idx", width: 60 },
    { title: "退款单号", dataIndex: "refundNo", key: "refundNo", width: 190 },
    { title: "订单号", dataIndex: "orderNo", key: "orderNo", width: 190 },
    { title: "申请人", dataIndex: "username", key: "username", width: 110 },
    { title: "退款金额", key: "amount", width: 100 },
    { title: "理由", dataIndex: "reason", key: "reason", ellipsis: true },
    { title: "状态", key: "status", width: 100 },
    { title: "申请时间", dataIndex: "createTime", key: "createTime", width: 170 },
    { title: "操作", key: "op", width: 160 },
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
const queryStatus = ref(undefined);

const auditVisible = ref(false);
const auditStatus = ref(1);
const auditRemark = ref("");
const current = ref(null);

const fetchList = async () => {
    loading.value = true;
    try {
        const res = await pageQueryMerchantRefund({
            pageNum: pageNum.value,
            pageSize,
            status: queryStatus.value,
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

const handleAudit = (record, status) => {
    current.value = record;
    auditStatus.value = status;
    auditRemark.value = "";
    auditVisible.value = true;
};

const submitAudit = async () => {
    await auditRefund(current.value.id, auditStatus.value, auditRemark.value);
    message.success(auditStatus.value === 1 ? "已同意退款" : "已拒绝退款");
    auditVisible.value = false;
    fetchList();
};

onMounted(fetchList);
</script>

<style scoped>
.amount {
    color: var(--color-danger, #cf1322);
    font-weight: 600;
}
</style>
