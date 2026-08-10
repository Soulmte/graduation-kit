<template>
    <a-card title="我的预约">
        <a-tabs v-model:activeKey="activeTab" @change="onTabChange">
            <a-tab-pane key="all" tab="全部" />
            <a-tab-pane key="0" tab="待确认" />
            <a-tab-pane key="1" tab="已确认" />
            <a-tab-pane key="2" tab="已完成" />
            <a-tab-pane key="3" tab="已取消" />
        </a-tabs>

        <a-spin :spinning="loading">
            <a-empty v-if="!list.length && !loading" description="还没有相关预约">
                <a-button type="primary" @click="router.push('/user/service')">
                    去找服务
                </a-button>
            </a-empty>

            <div v-for="row in list" :key="row.id" class="ap-card">
                <div class="ap-head">
                    <div class="ap-head-left">
                        <span class="ap-no">{{ row.appointmentNo }}</span>
                        <span class="text-sub">{{ row.createTime }}</span>
                    </div>
                    <a-tag :color="APPOINTMENT_STATUS[row.status]?.color">
                        {{ APPOINTMENT_STATUS[row.status]?.text }}
                    </a-tag>
                </div>

                <div class="ap-shop">
                    <shop-outlined /> {{ row.providerName || "服务机构" }}
                </div>

                <div class="ap-body">
                    <a-image
                        :src="row.serviceCover"
                        :width="64"
                        :height="64"
                        :fallback="FALLBACK_IMG"
                        style="object-fit: cover; border-radius: 4px"
                    />
                    <div class="ap-main">
                        <div class="ap-name">{{ row.serviceName }}</div>
                        <div class="ap-time">
                            <clock-circle-outlined />
                            {{ row.slotDate }} {{ row.startTime }} ~ {{ row.endTime }}
                        </div>
                        <div class="text-sub">
                            联系人 {{ row.contactName }} {{ row.contactPhone }}
                        </div>
                    </div>
                    <div class="ap-price">¥{{ row.price }}</div>
                </div>

                <a-alert
                    v-if="row.status === 4 && row.rejectReason"
                    type="error"
                    show-icon
                    :message="`机构拒单：${row.rejectReason}`"
                    style="margin-top: 12px"
                />

                <div class="ap-foot">
                    <span class="text-sub">{{ footHint(row) }}</span>
                    <a-space>
                        <!-- 按钮跟着状态出，避免点了才知道不能操作 -->
                        <a-button
                            v-if="row.status === 0"
                            type="primary"
                            size="small"
                            @click="openRemind(row)"
                        >
                            催一下
                        </a-button>
                        <a-button
                            v-if="row.status === 0 || row.status === 1"
                            size="small"
                            @click="handleCancel(row)"
                        >
                            取消预约
                        </a-button>
                        <a-button
                            v-if="row.status === 2 && !row.reviewed"
                            type="primary"
                            size="small"
                            @click="openReview(row)"
                        >
                            去评价
                        </a-button>
                        <a-button size="small" @click="handleDetail(row)">
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
                :show-total="(t) => `共 ${t} 笔预约`"
                @change="fetchList"
            />
        </div>

        <!-- 催单：内容会追写到备注里，机构接单时能看到 -->
        <a-modal
            v-model:open="remindVisible"
            title="催一下机构"
            ok-text="发送"
            cancel-text="取消"
            :confirm-loading="submitting"
            destroy-on-close
            @ok="submitRemind"
        >
            <a-alert
                type="info"
                show-icon
                message="催单内容会附到备注后面，机构在待处理列表里会看到。"
                style="margin-bottom: 16px"
            />
            <a-form layout="vertical">
                <a-form-item label="催单内容" required>
                    <a-textarea
                        v-model:value="remindText"
                        :rows="3"
                        :maxlength="255"
                        show-count
                        placeholder="比如：明天就要到了，麻烦尽快确认一下"
                    />
                </a-form-item>
            </a-form>
        </a-modal>

        <!-- 评价：只有已完成且未评过的单能进来 -->
        <a-modal
            v-model:open="reviewVisible"
            title="去评价"
            ok-text="提交评价"
            cancel-text="取消"
            :confirm-loading="submitting"
            destroy-on-close
            @ok="submitReview"
        >
            <div class="rv-target">{{ current?.serviceName }}</div>
            <a-form layout="vertical">
                <a-form-item label="打分" required>
                    <a-rate v-model:value="reviewForm.rating" :allow-clear="false" />
                    <span class="rate-tip">{{ RATE_TIPS[reviewForm.rating] }}</span>
                </a-form-item>
                <a-form-item label="说点什么">
                    <a-textarea
                        v-model:value="reviewForm.content"
                        :rows="4"
                        :maxlength="500"
                        show-count
                        placeholder="服务体验如何？写点真实感受给后来的人参考"
                    />
                </a-form-item>
            </a-form>
        </a-modal>

        <!-- 预约详情 -->
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
                <a-descriptions-item label="状态">
                    <a-tag :color="APPOINTMENT_STATUS[current.status]?.color">
                        {{ APPOINTMENT_STATUS[current.status]?.text }}
                    </a-tag>
                </a-descriptions-item>
                <a-descriptions-item label="服务时间" :span="2">
                    {{ current.slotDate }} {{ current.startTime }} ~
                    {{ current.endTime }}
                </a-descriptions-item>
                <a-descriptions-item label="金额">
                    ¥{{ current.price }}
                </a-descriptions-item>
                <a-descriptions-item label="下单时间">
                    {{ current.createTime }}
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
                <a-descriptions-item label="接单时间">
                    {{ current.confirmTime || "-" }}
                </a-descriptions-item>
                <a-descriptions-item label="核销时间">
                    {{ current.finishTime || "-" }}
                </a-descriptions-item>
                <a-descriptions-item label="取消时间" :span="2">
                    {{ current.cancelTime || "-" }}
                </a-descriptions-item>
            </a-descriptions>
        </a-modal>
    </a-card>
</template>

<script setup>
import { reactive, ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { Modal, message } from "ant-design-vue";
import { ShopOutlined, ClockCircleOutlined } from "@ant-design/icons-vue";
import {
    pageQueryMyAppointment,
    cancelMyAppointment,
    remindMyAppointment,
    getAppointmentById,
    APPOINTMENT_STATUS,
} from "@/api/appointment";
import { createMyReview } from "@/api/review";
import "@/styles/user.css";

const router = useRouter();

/** 1px 透明图，封面挂了时占位，不让卡片高度跳变 */
const FALLBACK_IMG =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

const RATE_TIPS = {
    1: "很不满意",
    2: "不太满意",
    3: "一般",
    4: "比较满意",
    5: "非常满意",
};

const loading = ref(false);
const submitting = ref(false);
const list = ref([]);
const total = ref(0);
const pageNum = ref(1);
const pageSize = 5;
const activeTab = ref("all");

const current = ref(null);
const remindVisible = ref(false);
const remindText = ref("");
const reviewVisible = ref(false);
const reviewForm = reactive({ rating: 5, content: "" });
const detailVisible = ref(false);

/** 每种状态给一句人话，比光摆个标签友好 */
const footHint = (row) => {
    switch (row.status) {
        case 0:
            return "等机构接单，接单后不能随意变更时间";
        case 1:
            return "机构已接单，请按时到场";
        case 2:
            return row.reviewed ? "已评价，感谢反馈" : "服务已完成，欢迎给个评价";
        case 3:
            return "预约已取消，名额已释放";
        case 4:
            return "机构未接此单，可以换个时间再约";
        case 5:
            return "未按时到场，该名额不再释放";
        default:
            return "";
    }
};

const fetchList = async () => {
    loading.value = true;
    try {
        const res = await pageQueryMyAppointment({
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

const handleCancel = (row) => {
    Modal.confirm({
        title: "确认取消",
        content: "取消后这个时段的名额会释放给其他人，确定要取消吗？",
        okButtonProps: { danger: true },
        onOk: async () => {
            await cancelMyAppointment(row.id);
            message.success("预约已取消");
            fetchList();
        },
    });
};

const openRemind = (row) => {
    current.value = row;
    remindText.value = "";
    remindVisible.value = true;
};

const submitRemind = async () => {
    if (!remindText.value.trim()) {
        message.warning("请先写下催单内容");
        return;
    }
    submitting.value = true;
    try {
        await remindMyAppointment(current.value.id, remindText.value);
        message.success("已提醒机构");
        remindVisible.value = false;
        fetchList();
    } finally {
        submitting.value = false;
    }
};

const openReview = (row) => {
    current.value = row;
    reviewForm.rating = 5;
    reviewForm.content = "";
    reviewVisible.value = true;
};

const submitReview = async () => {
    if (!reviewForm.rating) {
        message.warning("请先打分");
        return;
    }
    submitting.value = true;
    try {
        await createMyReview({
            appointmentId: current.value.id,
            rating: reviewForm.rating,
            content: reviewForm.content,
        });
        message.success("评价成功");
        reviewVisible.value = false;
        fetchList();
    } finally {
        submitting.value = false;
    }
};

/** 详情重新拉一次，列表里的数据可能已经过期 */
const handleDetail = async (row) => {
    const res = await getAppointmentById(row.id);
    current.value = res.data;
    detailVisible.value = true;
};

onMounted(fetchList);
</script>

<style scoped>
.ap-card {
    border: 1px solid var(--color-border, #f0f0f0);
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 16px;
}
.ap-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
}
.ap-head-left {
    display: flex;
    gap: 12px;
    align-items: baseline;
    flex-wrap: wrap;
}
.ap-no {
    font-weight: 600;
}
.ap-shop {
    margin-bottom: 8px;
    color: var(--color-text-mute, #999);
}
.ap-body {
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 10px 0;
    border-top: 1px solid var(--color-border, #f0f0f0);
}
.ap-main {
    flex: 1;
    min-width: 0;
}
.ap-name {
    font-weight: 500;
    margin-bottom: 4px;
}
.ap-time {
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    gap: 6px;
}
.ap-price {
    color: #cf1322;
    font-size: 18px;
    font-weight: 700;
}
.ap-foot {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--color-border, #f0f0f0);
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
}
.rv-target {
    margin-bottom: 16px;
    padding: 10px 12px;
    border-radius: 6px;
    background: var(--color-bg-hover, #fafafa);
    font-weight: 500;
}
.rate-tip {
    margin-left: 12px;
    color: var(--color-text-mute, #999);
}
.pager {
    margin-top: 16px;
    text-align: center;
}
</style>
