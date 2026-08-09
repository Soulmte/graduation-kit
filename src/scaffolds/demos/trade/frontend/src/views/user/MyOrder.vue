<template>
    <a-card title="我的订单">
        <a-tabs v-model:activeKey="activeTab" @change="onTabChange">
            <a-tab-pane key="all" tab="全部" />
            <a-tab-pane key="0" tab="待支付" />
            <a-tab-pane key="1" tab="待发货" />
            <a-tab-pane key="2" tab="待收货" />
            <a-tab-pane key="3" tab="已完成" />
            <a-tab-pane key="5" tab="退款中" />
        </a-tabs>

        <a-spin :spinning="loading">
            <a-empty v-if="!list.length && !loading" description="还没有相关订单">
                <a-button type="primary" @click="router.push('/user/mall')">
                    去商城看看
                </a-button>
            </a-empty>

            <div v-for="order in list" :key="order.id" class="order-card">
                <div class="order-head">
                    <div class="order-head-left">
                        <span class="order-no">{{ order.orderNo }}</span>
                        <span class="text-sub">{{ order.createTime }}</span>
                    </div>
                    <a-tag :color="ORDER_STATUS[order.status]?.color">
                        {{ ORDER_STATUS[order.status]?.text }}
                    </a-tag>
                </div>

                <div class="order-shop">
                    <shop-outlined /> {{ order.shopName || "店铺" }}
                </div>

                <div
                    v-for="item in order.items || []"
                    :key="item.id"
                    class="order-item"
                    @click="goDetail(item.productId)"
                >
                    <a-image
                        :src="item.productCover"
                        :width="56"
                        :height="56"
                        style="object-fit: cover; border-radius: 4px"
                        @click.stop
                    />
                    <div class="order-item-main">
                        <div class="order-item-name">{{ item.productName }}</div>
                        <div class="text-sub">
                            ¥{{ item.price }} × {{ item.quantity }}
                        </div>
                    </div>
                    <div class="order-item-sub">¥{{ item.subtotal }}</div>
                </div>

                <div class="order-foot">
                    <div class="order-total">
                        共
                        <span class="strong">{{ totalCount(order) }}</span>
                        件，实付
                        <span class="price">¥{{ order.totalAmount }}</span>
                    </div>
                    <a-space>
                        <!-- 按钮按状态出，不给无效操作留入口 -->
                        <template v-if="order.status === 0">
                            <a-button
                                type="primary"
                                size="small"
                                @click="handlePay(order)"
                            >
                                立即支付
                            </a-button>
                            <a-button size="small" @click="handleCancel(order)">
                                取消订单
                            </a-button>
                        </template>
                        <a-button
                            v-if="order.status === 2"
                            type="primary"
                            size="small"
                            @click="handleConfirm(order)"
                        >
                            确认收货
                        </a-button>
                        <a-button
                            v-if="order.status === 1 || order.status === 2"
                            size="small"
                            @click="handleRefund(order)"
                        >
                            申请退款
                        </a-button>
                        <a-button size="small" @click="handleDetail(order)">
                            查看详情
                        </a-button>
                    </a-space>
                </div>
            </div>
        </a-spin>

        <div v-if="total > pageSize" class="pager">
            <a-pagination
                v-model:current="pageNum"
                :page-size="pageSize"
                :total="total"
                :show-total="(t) => `共 ${t} 笔订单`"
                @change="fetchList"
            />
        </div>

        <!-- 申请退款 -->
        <a-modal
            v-model:open="refundVisible"
            title="申请退款"
            ok-text="提交申请"
            cancel-text="取消"
            destroy-on-close
            @ok="submitRefund"
        >
            <a-alert
                type="info"
                show-icon
                message="退款金额为订单实付金额，由商家审核处理。"
                style="margin-bottom: 16px"
            />
            <a-form layout="vertical">
                <a-form-item label="退款理由" required>
                    <a-textarea
                        v-model:value="refundReason"
                        :rows="3"
                        :maxlength="255"
                        show-count
                        placeholder="说明一下退款原因，商家会看到"
                    />
                </a-form-item>
            </a-form>
        </a-modal>

        <!-- 订单详情 -->
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
                <a-descriptions-item label="店铺">
                    {{ current.shopName }}
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
                <a-descriptions-item label="备注" :span="2">
                    {{ current.remark || "无" }}
                </a-descriptions-item>
                <a-descriptions-item label="支付时间">
                    {{ current.payTime || "-" }}
                </a-descriptions-item>
                <a-descriptions-item label="发货时间">
                    {{ current.shipTime || "-" }}
                </a-descriptions-item>
                <a-descriptions-item label="完成时间">
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
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { Modal, message } from "ant-design-vue";
import { ShopOutlined } from "@ant-design/icons-vue";
import {
    pageQueryMyOrder,
    payOrder,
    cancelOrder,
    confirmOrder,
    getOrderById,
    ORDER_STATUS,
} from "@/api/order";
import { applyRefund } from "@/api/refund";
import "@/styles/user.css";

const router = useRouter();

const loading = ref(false);
const list = ref([]);
const total = ref(0);
const pageNum = ref(1);
const pageSize = 5;
const activeTab = ref("all");

const refundVisible = ref(false);
const refundReason = ref("");
const detailVisible = ref(false);
const current = ref(null);

const totalCount = (order) =>
    (order.items || []).reduce((acc, it) => acc + Number(it.quantity || 0), 0);

const fetchList = async () => {
    loading.value = true;
    try {
        const res = await pageQueryMyOrder({
            pageNum: pageNum.value,
            pageSize,
            status: activeTab.value === "all" ? undefined : Number(activeTab.value),
        });
        list.value = res.data.records;
        total.value = res.data.total;
    } finally {
        loading.value = false;
    }
};

const onTabChange = () => {
    pageNum.value = 1;
    fetchList();
};

const handlePay = (order) => {
    Modal.confirm({
        title: "确认支付",
        content: `即将支付 ¥${order.totalAmount}，这是演示环境的模拟支付。`,
        onOk: async () => {
            await payOrder(order.id);
            message.success("支付成功");
            fetchList();
        },
    });
};

const handleCancel = (order) => {
    Modal.confirm({
        title: "确认取消",
        content: "取消后库存会退回，确定要取消这笔订单吗？",
        okButtonProps: { danger: true },
        onOk: async () => {
            await cancelOrder(order.id);
            message.success("订单已取消");
            fetchList();
        },
    });
};

const handleConfirm = (order) => {
    Modal.confirm({
        title: "确认收货",
        content: "确认收货后订单完成，将无法再申请退款。",
        onOk: async () => {
            await confirmOrder(order.id);
            message.success("已确认收货");
            fetchList();
        },
    });
};

const handleRefund = (order) => {
    current.value = order;
    refundReason.value = "";
    refundVisible.value = true;
};

const submitRefund = async () => {
    if (!refundReason.value.trim()) {
        message.warning("请填写退款理由");
        return;
    }
    await applyRefund(current.value.id, refundReason.value);
    message.success("退款申请已提交，等待商家审核");
    refundVisible.value = false;
    fetchList();
};

const handleDetail = async (order) => {
    const res = await getOrderById(order.id);
    current.value = res.data;
    detailVisible.value = true;
};

const goDetail = (productId) => {
    if (productId) router.push(`/user/product/${productId}`);
};

onMounted(fetchList);
</script>

<style scoped>
.order-card {
    border: 1px solid var(--color-border, #f0f0f0);
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 16px;
}
.order-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
}
.order-head-left {
    display: flex;
    gap: 12px;
    align-items: baseline;
    flex-wrap: wrap;
}
.order-no {
    font-weight: 600;
}
.order-shop {
    margin-bottom: 8px;
    color: var(--color-text-mute, #999);
}
.order-item {
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 10px 0;
    border-top: 1px solid var(--color-border, #f0f0f0);
    cursor: pointer;
}
.order-item-main {
    flex: 1;
    min-width: 0;
}
.order-item-name {
    font-weight: 500;
    margin-bottom: 4px;
}
.order-item-sub {
    color: #cf1322;
    font-weight: 600;
}
.order-foot {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--color-border, #f0f0f0);
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
}
.price {
    color: #cf1322;
    font-size: 18px;
    font-weight: 700;
}
.strong {
    font-weight: 600;
}
.pager {
    margin-top: 16px;
    text-align: center;
}
</style>
