<template>
    <a-spin :spinning="loading">
        <a-breadcrumb style="margin-bottom: 16px">
            <a-breadcrumb-item>
                <router-link to="/user/service">找服务</router-link>
            </a-breadcrumb-item>
            <a-breadcrumb-item>{{ item?.name || "服务详情" }}</a-breadcrumb-item>
        </a-breadcrumb>

        <a-card v-if="item" :bordered="false">
            <a-row :gutter="24">
                <a-col :xs="24" :md="10">
                    <div class="cover-box">
                        <img v-if="item.cover" :src="item.cover" :alt="item.name" />
                        <div v-else class="cover-empty">暂无图片</div>
                    </div>
                </a-col>
                <a-col :xs="24" :md="14">
                    <h2 class="s-name">{{ item.name }}</h2>
                    <div class="s-price-box">
                        <span class="s-label">价格</span>
                        <span class="s-price">¥{{ item.price }}</span>
                        <span class="s-unit">/ 次</span>
                    </div>
                    <div class="s-line">
                        <span class="s-label">单次时长</span>
                        <span>{{ item.duration }} 分钟</span>
                        <a-divider type="vertical" />
                        <span class="s-label">累计预约</span>
                        <span>{{ item.booked || 0 }} 次</span>
                    </div>
                    <div class="s-line">
                        <span class="s-label">评分</span>
                        <template v-if="item.avgRating">
                            <a-rate
                                :value="Number(item.avgRating)"
                                disabled
                                allow-half
                                style="font-size: 14px"
                            />
                            <span class="s-rating">{{ item.avgRating }}</span>
                        </template>
                        <span v-else>暂无评价</span>
                    </div>
                    <div class="s-line">
                        <span class="s-label">分类</span>
                        <a-tag v-if="item.categoryName" color="blue">
                            {{ item.categoryName }}
                        </a-tag>
                        <span v-else>未分类</span>
                    </div>
                    <div class="s-line">
                        <span class="s-label">服务机构</span>
                        <span>{{ item.providerName || "-" }}</span>
                    </div>

                    <a-divider style="margin: 16px 0" />

                    <div class="s-label" style="margin-bottom: 8px">选择预约时段</div>
                    <a-alert
                        v-if="!slotDates.length"
                        type="warning"
                        show-icon
                        message="机构还没有排出可约的时段"
                        description="可以先收藏这个页面，等机构排班后再来预约。"
                    />
                    <template v-else>
                        <a-radio-group
                            v-model:value="activeDate"
                            button-style="solid"
                            size="small"
                            class="date-group"
                        >
                            <a-radio-button
                                v-for="d in slotDates"
                                :key="d"
                                :value="d"
                            >
                                {{ dateLabel(d) }}
                            </a-radio-button>
                        </a-radio-group>

                        <div class="slot-grid">
                            <div
                                v-for="s in slotsOfActiveDate"
                                :key="s.id"
                                class="slot-chip"
                                :class="{ active: pickedSlotId === s.id }"
                                role="button"
                                tabindex="0"
                                @click="pickedSlotId = s.id"
                                @keydown.enter="pickedSlotId = s.id"
                                @keydown.space.prevent="pickedSlotId = s.id"
                            >
                                <div class="slot-time">
                                    {{ s.startTime }} ~ {{ s.endTime }}
                                </div>
                                <div class="slot-remain">余 {{ s.remain }} 位</div>
                            </div>
                        </div>
                    </template>

                    <a-button
                        type="primary"
                        size="large"
                        style="margin-top: 20px"
                        :disabled="!pickedSlotId"
                        @click="handleOpenBook"
                    >
                        <template #icon><calendar-outlined /></template>
                        {{ pickedSlotId ? "立即预约" : "请先选择时段" }}
                    </a-button>
                </a-col>
            </a-row>

            <a-divider />

            <h3 class="detail-title">服务详情</h3>
            <div
                v-if="item.description"
                class="detail-html"
                v-html="item.description"
            ></div>
            <a-empty v-else description="机构还没有填写详情" />

            <a-divider />

            <h3 class="detail-title">用户评价（{{ reviewTotal }}）</h3>
            <a-empty v-if="!reviews.length" description="还没有人评价过" />
            <a-list v-else :data-source="reviews" item-layout="vertical">
                <template #renderItem="{ item: rv }">
                    <a-list-item>
                        <a-list-item-meta>
                            <template #avatar>
                                <a-avatar :src="rv.avatar">
                                    <template #icon><user-outlined /></template>
                                </a-avatar>
                            </template>
                            <template #title>
                                <span class="rv-name">{{ rv.username }}</span>
                                <a-rate
                                    :value="rv.rating"
                                    disabled
                                    :count="5"
                                    style="font-size: 12px; margin-left: 8px"
                                />
                            </template>
                            <template #description>
                                <span class="rv-time">{{ rv.createTime }}</span>
                            </template>
                        </a-list-item-meta>
                        <div class="rv-content">{{ rv.content || "该用户没有留下文字" }}</div>
                        <div v-if="rv.reply" class="rv-reply">
                            <strong>机构回复：</strong>{{ rv.reply }}
                        </div>
                    </a-list-item>
                </template>
            </a-list>
            <div v-if="reviewTotal > reviewPageSize" class="pager">
                <a-pagination
                    v-model:current="reviewPageNum"
                    :page-size="reviewPageSize"
                    :total="reviewTotal"
                    simple
                    @change="fetchReviews"
                />
            </div>
        </a-card>

        <!-- 预约弹窗：只提交时段ID与联系方式，价格由后端算 -->
        <a-modal
            v-model:open="bookVisible"
            title="确认预约"
            :width="480"
            ok-text="提交预约"
            cancel-text="取消"
            :confirm-loading="booking"
            destroy-on-close
            @ok="handleBook"
        >
            <a-descriptions :column="1" bordered size="small" style="margin-bottom: 12px">
                <a-descriptions-item label="服务项">
                    {{ item?.name }}
                </a-descriptions-item>
                <a-descriptions-item label="服务时间">
                    {{ pickedSlot?.slotDate }} {{ pickedSlot?.startTime }} ~
                    {{ pickedSlot?.endTime }}
                </a-descriptions-item>
                <a-descriptions-item label="金额">
                    ¥{{ item?.price }}
                </a-descriptions-item>
            </a-descriptions>
            <a-form :model="bookForm" ref="bookFormRef" layout="vertical">
                <a-form-item
                    label="联系人姓名"
                    name="contactName"
                    :rules="[{ required: true, message: '请填写联系人姓名' }]"
                >
                    <a-input v-model:value="bookForm.contactName" :maxlength="50" />
                </a-form-item>
                <a-form-item
                    label="联系电话"
                    name="contactPhone"
                    :rules="[
                        { required: true, message: '请填写联系电话' },
                        { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' },
                    ]"
                >
                    <a-input v-model:value="bookForm.contactPhone" :maxlength="11" />
                </a-form-item>
                <a-form-item label="备注" name="remark">
                    <a-textarea
                        v-model:value="bookForm.remark"
                        placeholder="有特殊要求可以写在这里，机构接单时会看到"
                        :rows="3"
                        :maxlength="255"
                        show-count
                    />
                </a-form-item>
            </a-form>
        </a-modal>
    </a-spin>
</template>

<script setup>
import { computed, reactive, ref, watch, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { message } from "ant-design-vue";
import dayjs from "dayjs";
import { CalendarOutlined, UserOutlined } from "@ant-design/icons-vue";
import { getServiceItemById } from "@/api/serviceItem";
import { listBookableSlot } from "@/api/timeSlot";
import { createAppointment } from "@/api/appointment";
import { pageQueryReview } from "@/api/review";
import { useUserStore } from "@/stores/user";
import "@/styles/user.css";

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const loading = ref(false);
const booking = ref(false);
const item = ref(null);
const slots = ref([]);
const activeDate = ref(null);
const pickedSlotId = ref(null);

const reviews = ref([]);
const reviewTotal = ref(0);
const reviewPageNum = ref(1);
const reviewPageSize = 5;

const bookVisible = ref(false);
const bookFormRef = ref(null);
const bookForm = reactive({ contactName: "", contactPhone: "", remark: "" });

/** 后端返回的时段已按日期、时间排序，这里只去重出日期选项 */
const slotDates = computed(() => [
    ...new Set(slots.value.map((s) => s.slotDate)),
]);

const slotsOfActiveDate = computed(() =>
    slots.value.filter((s) => s.slotDate === activeDate.value),
);

const pickedSlot = computed(() =>
    slots.value.find((s) => s.id === pickedSlotId.value),
);

/** 今天与明天给个友好称呼，其余显示月日加星期 */
const dateLabel = (d) => {
    const day = dayjs(d);
    const today = dayjs().startOf("day");
    const diff = day.startOf("day").diff(today, "day");
    if (diff === 0) return "今天";
    if (diff === 1) return "明天";
    return day.format("MM-DD ddd");
};

// 切日期时清空已选时段，避免提交了看不见的那个
watch(activeDate, () => {
    pickedSlotId.value = null;
});

const fetchDetail = async () => {
    loading.value = true;
    try {
        const res = await getServiceItemById(route.params.id);
        item.value = res.data;
    } finally {
        loading.value = false;
    }
};

const fetchSlots = async () => {
    const res = await listBookableSlot(route.params.id);
    slots.value = res.data || [];
    activeDate.value = slotDates.value[0] || null;
};

const fetchReviews = async () => {
    const res = await pageQueryReview({
        pageNum: reviewPageNum.value,
        pageSize: reviewPageSize,
        serviceItemId: route.params.id,
    });
    reviews.value = res.data.records || [];
    reviewTotal.value = res.data.total || 0;
};

/** 未登录时先去登录，登录后带 redirect 回到当前页 */
const requireLogin = () => {
    if (!userStore.token) {
        message.warning("请先登录");
        router.push({ path: "/login", query: { redirect: route.fullPath } });
        return false;
    }
    return true;
};

const handleOpenBook = () => {
    if (!requireLogin()) return;
    // 预填登录人的信息，绝大多数情况就是给自己约
    bookForm.contactName =
        userStore.userInfo?.nickname || userStore.userInfo?.username || "";
    bookForm.contactPhone = userStore.userInfo?.phone || "";
    bookForm.remark = "";
    bookVisible.value = true;
};

const handleBook = async () => {
    await bookFormRef.value.validate();
    booking.value = true;
    try {
        await createAppointment({
            timeSlotId: pickedSlotId.value,
            contactName: bookForm.contactName,
            contactPhone: bookForm.contactPhone,
            remark: bookForm.remark,
        });
        message.success("预约提交成功，等机构接单");
        bookVisible.value = false;
        router.push("/user/appointment");
    } finally {
        booking.value = false;
        // 不管成功还是被人抢先，重拉一次时段余额才是准的
        pickedSlotId.value = null;
        fetchSlots();
    }
};

onMounted(async () => {
    await fetchDetail();
    await Promise.all([fetchSlots(), fetchReviews()]);
});
</script>

<style scoped>
.cover-box {
    width: 100%;
    height: 340px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    border-radius: 8px;
    background: var(--color-bg-hover, #fafafa);
}
.cover-box img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
.cover-empty {
    color: var(--color-text-mute, #999);
}
.s-name {
    margin: 0 0 16px;
    font-size: 22px;
    font-weight: 600;
}
.s-price-box {
    padding: 12px 16px;
    border-radius: 8px;
    background: var(--color-bg-hover, #fafafa);
    margin-bottom: 16px;
}
.s-price {
    color: #cf1322;
    font-size: 28px;
    font-weight: 700;
}
.s-unit {
    color: var(--color-text-mute, #999);
    margin-left: 4px;
}
.s-line {
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
}
.s-label {
    color: var(--color-text-mute, #999);
    min-width: 60px;
}
.s-rating {
    color: #fa8c16;
    font-weight: 600;
}
.date-group {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
}
.slot-grid {
    margin-top: 12px;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 8px;
}
.slot-chip {
    padding: 8px 10px;
    border: 1px solid var(--color-border, #d9d9d9);
    border-radius: 6px;
    cursor: pointer;
    text-align: center;
    transition: all 0.2s;
}
.slot-chip:hover,
.slot-chip:focus-visible {
    border-color: #1677ff;
}
.slot-chip.active {
    border-color: #1677ff;
    background: rgba(22, 119, 255, 0.08);
}
.slot-time {
    font-weight: 500;
}
.slot-remain {
    font-size: 12px;
    color: var(--color-text-mute, #999);
}
.detail-title {
    margin-bottom: 12px;
    font-size: 16px;
    font-weight: 600;
}
.rv-name {
    font-weight: 500;
}
.rv-time {
    font-size: 12px;
}
.rv-content {
    margin: 8px 0 0;
}
.rv-reply {
    margin-top: 8px;
    padding: 8px 12px;
    border-radius: 6px;
    background: var(--color-bg-hover, #fafafa);
    font-size: 13px;
}
.pager {
    margin-top: 16px;
    text-align: center;
}
</style>
