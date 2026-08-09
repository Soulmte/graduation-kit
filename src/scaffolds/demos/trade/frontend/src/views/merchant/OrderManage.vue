<template>
    <a-card title="订单管理">
        <div class="toolbar">
            <a-input-search
                v-model:value="queryOrderNo"
                placeholder="搜索订单号"
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
                    v-for="(v, k) in ORDER_STATUS"
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
                <template v-else-if="column.key === 'totalAmount'">
                    <span class="amount">¥{{ record.totalAmount }}</span>
                </template>
                <template v-else-if="column.key === 'status'">
                    <a-tag :color="ORDER_STATUS[record.status]?.color">
                        {{ ORDER_STATUS[record.status]?.text }}
                    </a-tag>
                </template>
                <template v-else-if="column.key === 'receiver'">
                    <div>{{ record.receiverName }}</div>
                    <div class="text-sub">{{ record.receiverPhone }}</div>
                </template>
                <template v-else-if="column.key === 'op'">
                    <div class="table-actions">
                        <!-- 只有待发货能发货，其余状态不给按钮，避免无效请求 -->
                        <a-button
                            v-if="record.status === 1"
                            size="small"
                            type="primary"
                            @click="handleShip(record)"
                        >
                            <template #icon><car-outlined /></template> 发货
                        </a-button>
                        <a-button size="small" @click="handleDetail(record)">
                            详情
                        </a-button>
                    </div>
                </template>
            </template>

            <!-- 明细已随列表回填，展开即可看，不用再请求 -->
            <template #expandedRowRender="{ record }">
                <a-table
                    :columns="itemColumns"
                    :data-source="record.items || []"
                    row-key="id"
                    size="small"
                    :pagination="false"
                >
                    <template #bodyCell="{ column, record: item }">
                        <template v-if="column.key === 'productCover'">
                            <a-image
                                :src="item.productCover"
                                :width="40"
                                :height="40"
                                style="object-fit: cover; border-radius: 4px"
                            />
                        </template>
                        <template v-else-if="column.key === 'price'">
                            ¥{{ item.price }}
                        </template>
                        <template v-else-if="column.key === 'subtotal'">
                            ¥{{ item.subtotal }}
                        </template>
                    </template>
                </a-table>
            </template>
        </a-table>

        <a-modal
            v-model:open="detailVisible"
            title="订单详情"
            :width="640"
            :footer="null"
            destroy-on-close
        >
            <a-descriptions v-if="current" :column="2" bordered size="small">
                <a-descriptions-item label="订单号" :span="2">
                    {{ current.orderNo }}
                </a-descriptions-item>
                <a-descriptions-item label="下单人">
                    {{ current.username }}
                </a-descriptions-item>
                <a-descriptions-item label="订单状态">
                    <a-tag :color="ORDER_STATUS[current.status]?.color">
                        {{ ORDER_STATUS[current.status]?.text }}
                    </a-tag>
                </a-descriptions-item>
                <a-descriptions-item label="订单金额">
                    ¥{{ current.totalAmount }}
                </a-descriptions-item>
                <a-descriptions-item label="下单时间">
                    {{ current.createTime }}
                </a-descriptions-item>
                <a-descriptions-item label="收货人">
                    {{ current.receiverName }} {{ current.receiverPhone }}
                </a-descriptions-item>
                <a-descriptions-item label="收货地址" :span="2">
                    {{ current.receiverAddr }}
                </a-descriptions-item>
                <a-descriptions-item label="买家备注" :span="2">
                    {{ current.remark || "无" }}
                </a-descriptions-item>
                <a-descriptions-item label="支付时间">
                    {{ current.payTime || "-" }}
                </a-descriptions-item>
                <a-descriptions-item label="发货时间">
                    {{ current.shipTime || "-" }}
                </a-descriptions-item>
            </a-descriptions>
        </a-modal>
    </a-card>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { Modal, message } from "ant-design-vue";
import { CarOutlined } from "@ant-design/icons-vue";
import {
    pageQueryMerchantOrder,
    shipOrder,
    getOrderById,
    ORDER_STATUS,
} from "@/api/order";
import ResizableTitle from "@/components/ResizableTitle.vue";

const baseColumns = [
    { title: "序号", key: "idx", width: 60 },
    { title: "订单号", dataIndex: "orderNo", key: "orderNo", width: 190 },
    { title: "下单人", dataIndex: "username", key: "username", width: 110 },
    { title: "金额", key: "totalAmount", width: 100 },
    { title: "状态", key: "status", width: 100 },
    { title: "收货人", key: "receiver", width: 140 },
    { title: "下单时间", dataIndex: "createTime", key: "createTime", width: 170 },
    { title: "操作", key: "op", width: 150 },
];

const itemColumns = [
    { title: "封面", key: "productCover", width: 60 },
    { title: "商品", dataIndex: "productName", key: "productName" },
    { title: "单价", key: "price", width: 90 },
    { title: "数量", dataIndex: "quantity", key: "quantity", width: 70 },
    { title: "小计", key: "subtotal", width: 90 },
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
const queryOrderNo = ref("");
const queryStatus = ref(undefined);

const detailVisible = ref(false);
const current = ref(null);

const fetchList = async () => {
    loading.value = true;
    try {
        const res = await pageQueryMerchantOrder({
            pageNum: pageNum.value,
            pageSize,
            orderNo: queryOrderNo.value || undefined,
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

const handleShip = (record) => {
    Modal.confirm({
        title: "确认发货",
        content: `确定为订单 ${record.orderNo} 发货吗？发货后买家可确认收货。`,
        onOk: async () => {
            await shipOrder(record.id);
            message.success("发货成功");
            fetchList();
        },
    });
};

const handleDetail = async (record) => {
    const res = await getOrderById(record.id);
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
