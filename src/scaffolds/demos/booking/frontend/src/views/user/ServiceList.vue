<template>
    <div class="svc">
        <div class="svc-side">
            <div class="side-title">服务分类</div>
            <a-menu
                mode="inline"
                :selected-keys="[String(categoryId ?? 'all')]"
                @click="({ key }) => onCategory(key)"
            >
                <a-menu-item key="all">全部分类</a-menu-item>
                <a-menu-item v-for="cat in categories" :key="String(cat.id)">
                    {{ cat.name }}
                </a-menu-item>
            </a-menu>
        </div>

        <div class="svc-main">
            <a-card :bordered="false" class="filter-card">
                <div class="filter-row">
                    <a-input-search
                        v-model:value="name"
                        placeholder="搜索服务名称"
                        style="width: 240px"
                        allow-clear
                        @search="onSearch"
                    />
                    <a-space>
                        <a-input-number
                            v-model:value="minPrice"
                            placeholder="最低价"
                            :min="0"
                            :precision="2"
                            style="width: 110px"
                        />
                        <span class="sep">-</span>
                        <a-input-number
                            v-model:value="maxPrice"
                            placeholder="最高价"
                            :min="0"
                            :precision="2"
                            style="width: 110px"
                        />
                        <a-button @click="onSearch">筛选</a-button>
                        <a-button @click="onReset">重置</a-button>
                    </a-space>
                </div>
                <div class="filter-row">
                    <a-radio-group
                        v-model:value="sortKey"
                        button-style="solid"
                        size="small"
                        @change="onSearch"
                    >
                        <a-radio-button value="new">最新</a-radio-button>
                        <a-radio-button value="booked">人气优先</a-radio-button>
                        <a-radio-button value="priceAsc">价格从低到高</a-radio-button>
                        <a-radio-button value="priceDesc">价格从高到低</a-radio-button>
                        <a-radio-button value="durationAsc">耗时最短</a-radio-button>
                    </a-radio-group>
                </div>
            </a-card>

            <a-spin :spinning="loading">
                <a-empty v-if="!list.length && !loading" description="没有找到服务" />
                <a-row v-else :gutter="[16, 16]">
                    <a-col
                        v-for="item in list"
                        :key="item.id"
                        :xs="24"
                        :sm="12"
                        :md="8"
                        :lg="6"
                    >
                        <a-card hoverable class="svc-card" @click="goDetail(item.id)">
                            <template #cover>
                                <div class="cover-box">
                                    <img
                                        v-if="item.cover"
                                        :src="item.cover"
                                        :alt="item.name"
                                    />
                                    <div v-else class="cover-empty">暂无图片</div>
                                </div>
                            </template>
                            <div class="svc-name">{{ item.name }}</div>
                            <div class="svc-meta">
                                <span class="price">¥{{ item.price }}</span>
                                <span class="duration">{{ item.duration }} 分钟</span>
                            </div>
                            <div class="svc-sub">
                                <a-tag v-if="item.categoryName" color="blue">
                                    {{ item.categoryName }}
                                </a-tag>
                                <span class="rating">
                                    <template v-if="item.avgRating">
                                        <star-filled class="star" />
                                        {{ item.avgRating }}
                                    </template>
                                    <template v-else>暂无评价</template>
                                </span>
                            </div>
                            <div class="svc-sub">
                                <span class="provider">{{ item.providerName }}</span>
                                <span class="booked">已约 {{ item.booked || 0 }}</span>
                            </div>
                        </a-card>
                    </a-col>
                </a-row>
            </a-spin>

            <div class="pager">
                <a-pagination
                    v-model:current="pageNum"
                    :page-size="pageSize"
                    :total="total"
                    :show-total="(t) => `共 ${t} 个服务`"
                    hide-on-single-page
                    @change="fetchList"
                />
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { StarFilled } from "@ant-design/icons-vue";
import { pageQueryServiceItem } from "@/api/serviceItem";
import { listServiceCategory } from "@/api/serviceCategory";
import "@/styles/user.css";

const router = useRouter();

const loading = ref(false);
const list = ref([]);
const total = ref(0);
const pageNum = ref(1);
const pageSize = 12;

const categories = ref([]);
const categoryId = ref(null);
const name = ref("");
const minPrice = ref(null);
const maxPrice = ref(null);
const sortKey = ref("new");

/** 前端的排序选项映射成后端的 orderBy/order 两个参数 */
const SORT_MAP = {
    new: { orderBy: "createTime", order: "desc" },
    booked: { orderBy: "booked", order: "desc" },
    priceAsc: { orderBy: "price", order: "asc" },
    priceDesc: { orderBy: "price", order: "desc" },
    durationAsc: { orderBy: "duration", order: "asc" },
};

const fetchList = async () => {
    loading.value = true;
    try {
        const sort = SORT_MAP[sortKey.value];
        const res = await pageQueryServiceItem({
            pageNum: pageNum.value,
            pageSize,
            name: name.value || undefined,
            categoryId: categoryId.value ?? undefined,
            minPrice: minPrice.value ?? undefined,
            maxPrice: maxPrice.value ?? undefined,
            orderBy: sort.orderBy,
            order: sort.order,
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

const onReset = () => {
    name.value = "";
    minPrice.value = null;
    maxPrice.value = null;
    categoryId.value = null;
    sortKey.value = "new";
    onSearch();
};

const onCategory = (key) => {
    categoryId.value = key === "all" ? null : Number(key);
    onSearch();
};

const goDetail = (id) => {
    router.push(`/user/service/${id}`);
};

onMounted(async () => {
    const res = await listServiceCategory();
    categories.value = res.data || [];
    fetchList();
});
</script>

<style scoped>
.svc {
    display: flex;
    gap: 16px;
    align-items: flex-start;
}
.svc-side {
    width: 180px;
    flex-shrink: 0;
    background: var(--color-bg-container, #fff);
    border-radius: 8px;
    padding: 12px 0;
}
.side-title {
    padding: 0 16px 8px;
    font-weight: 600;
}
.svc-main {
    flex: 1;
    min-width: 0;
}
.filter-card {
    margin-bottom: 16px;
}
.filter-row {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
    justify-content: space-between;
}
.filter-row + .filter-row {
    margin-top: 12px;
}
.sep {
    color: var(--color-text-mute, #999);
}
.cover-box {
    height: 180px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background: var(--color-bg-hover, #fafafa);
}
.cover-box img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
.cover-empty {
    color: var(--color-text-mute, #999);
    font-size: 13px;
}
.svc-name {
    font-weight: 500;
    margin-bottom: 8px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    min-height: 44px;
}
.svc-meta {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
}
.price {
    color: #cf1322;
    font-size: 18px;
    font-weight: 600;
}
.duration,
.rating,
.provider,
.booked {
    color: var(--color-text-mute, #999);
    font-size: 12px;
}
.star {
    color: #fadb14;
}
.svc-sub {
    margin-top: 8px;
    display: flex;
    align-items: center;
    justify-content: space-between;
}
.pager {
    margin-top: 20px;
    text-align: center;
}
@media (max-width: 768px) {
    .svc {
        flex-direction: column;
    }
    .svc-side {
        width: 100%;
    }
}
</style>
