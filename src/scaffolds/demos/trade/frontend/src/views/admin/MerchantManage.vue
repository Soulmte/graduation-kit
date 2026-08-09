<template>
    <a-card title="店铺审核">
        <a-alert
            type="info"
            show-icon
            message="审核通过后，店主账号会自动获得商家角色；封禁则退回普通用户。"
            style="margin-bottom: 16px"
        />

        <div class="toolbar">
            <a-input-search
                v-model:value="queryShopName"
                placeholder="搜索店铺名称"
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
                    v-for="(v, k) in MERCHANT_STATUS"
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
                <template v-else-if="column.key === 'shop'">
                    <div class="shop-cell">
                        <a-avatar :src="record.logo" :size="40">
                            <template #icon><shop-outlined /></template>
                        </a-avatar>
                        <div>
                            <div class="shop-name">{{ record.shopName }}</div>
                            <div class="text-sub">
                                店主：{{ record.username || "-" }}
                            </div>
                        </div>
                    </div>
                </template>
                <template v-else-if="column.key === 'status'">
                    <a-tag :color="MERCHANT_STATUS[record.status]?.color">
                        {{ MERCHANT_STATUS[record.status]?.text }}
                    </a-tag>
                </template>
                <template v-else-if="column.key === 'op'">
                    <div class="table-actions">
                        <a-button
                            v-if="record.status !== 1"
                            size="small"
                            type="primary"
                            @click="handleAudit(record, 1)"
                        >
                            <template #icon><check-outlined /></template>
                            {{ record.status === 0 ? "通过" : "解封" }}
                        </a-button>
                        <a-button
                            v-if="record.status !== 2"
                            size="small"
                            class="btn-delete"
                            @click="handleAudit(record, 2)"
                        >
                            <template #icon><stop-outlined /></template> 封禁
                        </a-button>
                    </div>
                </template>
            </template>

            <template #expandedRowRender="{ record }">
                <a-descriptions :column="2" size="small" bordered>
                    <a-descriptions-item label="联系电话">
                        {{ record.contactPhone || "-" }}
                    </a-descriptions-item>
                    <a-descriptions-item label="申请时间">
                        {{ record.createTime }}
                    </a-descriptions-item>
                    <a-descriptions-item label="店铺简介" :span="2">
                        {{ record.description || "商家未填写" }}
                    </a-descriptions-item>
                </a-descriptions>
            </template>
        </a-table>
    </a-card>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { Modal, message } from "ant-design-vue";
import {
    ShopOutlined,
    CheckOutlined,
    StopOutlined,
} from "@ant-design/icons-vue";
import { pageQueryMerchant, auditMerchant } from "@/api/merchant";
import ResizableTitle from "@/components/ResizableTitle.vue";

/** 店铺状态字典，与后端 Merchant 常量一致 */
const MERCHANT_STATUS = {
    0: { text: "待审核", color: "orange" },
    1: { text: "正常营业", color: "green" },
    2: { text: "已封禁", color: "red" },
};

const baseColumns = [
    { title: "序号", key: "idx", width: 60 },
    { title: "店铺", key: "shop", width: 220 },
    {
        title: "联系电话",
        dataIndex: "contactPhone",
        key: "contactPhone",
        width: 130,
    },
    {
        title: "简介",
        dataIndex: "description",
        key: "description",
        ellipsis: true,
    },
    { title: "状态", key: "status", width: 100 },
    { title: "申请时间", dataIndex: "createTime", key: "createTime", width: 170 },
    { title: "操作", key: "op", width: 170 },
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
const queryShopName = ref("");
const queryStatus = ref(undefined);

const fetchList = async () => {
    loading.value = true;
    try {
        const res = await pageQueryMerchant({
            pageNum: pageNum.value,
            pageSize,
            shopName: queryShopName.value || undefined,
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
    const isPass = status === 1;
    Modal.confirm({
        title: isPass ? "确认通过" : "确认封禁",
        content: isPass
            ? `通过后「${record.shopName}」即可上架商品，店主账号将获得商家角色。`
            : `封禁后「${record.shopName}」无法继续经营，店主角色会退回普通用户。`,
        okButtonProps: { danger: !isPass },
        onOk: async () => {
            await auditMerchant(record.id, status);
            message.success("处理成功");
            fetchList();
        },
    });
};

onMounted(fetchList);
</script>

<style scoped>
.shop-cell {
    display: flex;
    gap: 10px;
    align-items: center;
}
.shop-name {
    font-weight: 500;
}
</style>
