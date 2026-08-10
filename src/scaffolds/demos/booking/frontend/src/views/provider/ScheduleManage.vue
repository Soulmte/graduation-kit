<template>
    <a-card title="排班管理">
        <template #extra>
            <a-button type="primary" @click="handleOpenGenerate">
                <template #icon><plus-outlined /></template> 批量生成排班
            </a-button>
        </template>

        <a-alert
            type="info"
            show-icon
            message="排班按服务时长自动切片"
            description="给一个日期区间和每天的营业时段，系统会按服务时长切出若干时段。已存在的时段会跳过，所以可以反复点来补齐新日子。"
            style="margin-bottom: 16px"
        />

        <div class="toolbar">
            <a-select
                v-model:value="queryServiceItemId"
                placeholder="按服务项筛选"
                style="width: 200px"
                allow-clear
                @change="onSearch"
            >
                <a-select-option
                    v-for="item in services"
                    :key="item.id"
                    :value="item.id"
                >
                    {{ item.name }}
                </a-select-option>
            </a-select>
            <a-range-picker
                v-model:value="queryRange"
                value-format="YYYY-MM-DD"
                style="width: 250px"
                @change="onSearch"
            />
            <a-select
                v-model:value="queryStatus"
                placeholder="状态筛选"
                style="width: 120px"
                allow-clear
                @change="onSearch"
            >
                <a-select-option :value="0">已关闭</a-select-option>
                <a-select-option :value="1">开放中</a-select-option>
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
                onChange: (p) => { pageNum = p; fetchList(); },
                showTotal: (t) => `共 ${t} 条`,
            }"
        >
            <template #bodyCell="{ column, record, index }">
                <template v-if="column.key === 'idx'">
                    {{ (pageNum - 1) * pageSize + index + 1 }}
                </template>
                <template v-else-if="column.key === 'time'">
                    {{ record.startTime }} ~ {{ record.endTime }}
                </template>
                <template v-else-if="column.key === 'seat'">
                    <a-progress
                        :percent="seatPercent(record)"
                        :format="() => `${record.bookedCount}/${record.capacity}`"
                        size="small"
                        :status="record.bookedCount >= record.capacity ? 'exception' : 'normal'"
                    />
                </template>
                <template v-else-if="column.key === 'status'">
                    <a-tag v-if="record.expired" color="default">已过期</a-tag>
                    <a-switch
                        v-else
                        :checked="record.status === 1"
                        checked-children="开放"
                        un-checked-children="关闭"
                        :loading="record._toggling"
                        @change="(v) => handleToggleStatus(record, v)"
                    />
                </template>
                <template v-else-if="column.key === 'op'">
                    <a-button
                        size="small"
                        class="btn-delete"
                        :disabled="record.bookedCount > 0"
                        @click="handleDelete(record.id)"
                    >
                        <template #icon><delete-outlined /></template> 删除
                    </a-button>
                </template>
            </template>
        </a-table>

        <!-- 批量生成弹窗 -->
        <a-modal
            v-model:open="modalVisible"
            title="批量生成排班"
            :width="520"
            ok-text="生成"
            cancel-text="取消"
            :confirm-loading="generating"
            destroy-on-close
            @ok="handleGenerate"
        >
            <a-form :model="form" ref="formRef" layout="vertical">
                <a-form-item
                    label="服务项"
                    name="serviceItemId"
                    :rules="[{ required: true, message: '请选择服务项' }]"
                >
                    <a-select
                        v-model:value="form.serviceItemId"
                        placeholder="选择要排班的服务项"
                    >
                        <a-select-option
                            v-for="item in services"
                            :key="item.id"
                            :value="item.id"
                        >
                            {{ item.name }}（{{ item.duration }} 分钟）
                        </a-select-option>
                    </a-select>
                </a-form-item>
                <a-form-item
                    label="日期区间"
                    name="dateRange"
                    :rules="[{ required: true, message: '请选择日期区间' }]"
                    extra="一次最多生成 30 天"
                >
                    <a-range-picker
                        v-model:value="form.dateRange"
                        value-format="YYYY-MM-DD"
                        style="width: 100%"
                    />
                </a-form-item>
                <a-row :gutter="16">
                    <a-col :span="12">
                        <a-form-item
                            label="每天营业开始"
                            name="openTime"
                            :rules="[{ required: true, message: '请选择开始时间' }]"
                        >
                            <a-time-picker
                                v-model:value="form.openTime"
                                format="HH:mm"
                                value-format="HH:mm"
                                :minute-step="15"
                                style="width: 100%"
                            />
                        </a-form-item>
                    </a-col>
                    <a-col :span="12">
                        <a-form-item
                            label="每天营业结束"
                            name="closeTime"
                            :rules="[{ required: true, message: '请选择结束时间' }]"
                        >
                            <a-time-picker
                                v-model:value="form.closeTime"
                                format="HH:mm"
                                value-format="HH:mm"
                                :minute-step="15"
                                style="width: 100%"
                            />
                        </a-form-item>
                    </a-col>
                </a-row>
                <a-form-item
                    label="每个时段名额"
                    name="capacity"
                    :rules="[{ required: true, message: '请输入名额' }]"
                    extra="同一时段能同时接待几个人，理发一般填 1，场馆可以填多个"
                >
                    <a-input-number
                        v-model:value="form.capacity"
                        :min="1"
                        :max="999"
                        :precision="0"
                        style="width: 100%"
                    />
                </a-form-item>
            </a-form>
        </a-modal>
    </a-card>
</template>

<script setup>
import { reactive, ref, onMounted, computed } from "vue";
import { Modal, message } from "ant-design-vue";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons-vue";
import {
    pageQueryMySlot,
    generateMySlot,
    changeMySlotStatus,
    deleteMySlot,
} from "@/api/timeSlot";
import { pageQueryMyServiceItem } from "@/api/serviceItem";
import ResizableTitle from "@/components/ResizableTitle.vue";

const baseColumns = [
    { title: "序号", key: "idx", width: 60 },
    { title: "服务项", dataIndex: "serviceName", key: "serviceName", ellipsis: true },
    { title: "日期", dataIndex: "slotDate", key: "slotDate", width: 120 },
    { title: "时段", key: "time", width: 130 },
    { title: "名额", key: "seat", width: 140 },
    { title: "状态", key: "status", width: 110 },
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
const queryServiceItemId = ref(undefined);
const queryRange = ref([]);
const queryStatus = ref(undefined);
const services = ref([]);

const modalVisible = ref(false);
const generating = ref(false);
const formRef = ref(null);
const form = reactive({
    serviceItemId: undefined,
    dateRange: [],
    openTime: "09:00",
    closeTime: "18:00",
    capacity: 1,
});

const seatPercent = (record) => {
    if (!record.capacity) return 0;
    return Math.round((record.bookedCount / record.capacity) * 100);
};

const fetchList = async () => {
    loading.value = true;
    try {
        const [dateFrom, dateTo] = queryRange.value || [];
        const res = await pageQueryMySlot({
            pageNum: pageNum.value,
            pageSize,
            serviceItemId: queryServiceItemId.value || undefined,
            dateFrom: dateFrom || undefined,
            dateTo: dateTo || undefined,
            status: queryStatus.value !== undefined ? queryStatus.value : undefined,
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

const handleOpenGenerate = () => {
    if (!services.value.length) {
        message.warning("请先在服务项管理里创建服务项");
        return;
    }
    modalVisible.value = true;
};

const handleGenerate = async () => {
    await formRef.value.validate();
    generating.value = true;
    try {
        const [startDate, endDate] = form.dateRange;
        const res = await generateMySlot({
            serviceItemId: form.serviceItemId,
            startDate,
            endDate,
            openTime: form.openTime,
            closeTime: form.closeTime,
            capacity: form.capacity,
        });
        message.success(`共生成 ${res.data} 个时段`);
        modalVisible.value = false;
        onSearch();
    } finally {
        generating.value = false;
    }
};

const handleToggleStatus = async (record, checked) => {
    const newStatus = checked ? 1 : 0;
    record._toggling = true;
    try {
        await changeMySlotStatus(record.id, newStatus);
        record.status = newStatus;
        message.success(checked ? "已开放" : "已关闭");
    } finally {
        record._toggling = false;
    }
};

const handleDelete = (id) => {
    Modal.confirm({
        title: "确认删除",
        content: "删除后这个时段不再对外开放，确定删除吗？",
        okButtonProps: { danger: true },
        onOk: async () => {
            await deleteMySlot(id);
            message.success("删除成功");
            fetchList();
        },
    });
};

// 排班和筛选都要用服务项下拉，一次拉够 200 条够 demo 用
onMounted(async () => {
    const res = await pageQueryMyServiceItem({ pageNum: 1, pageSize: 200 });
    services.value = res.data.records || [];
    fetchList();
});
</script>
