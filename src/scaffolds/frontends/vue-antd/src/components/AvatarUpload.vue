<template>
    <div
        class="avatar-upload-wrap"
        :class="{ disabled }"
        :style="{ width: size + 'px', height: size + 'px' }"
    >
        <a-upload
            name="file"
            :show-upload-list="false"
            :before-upload="beforeUpload"
            :custom-request="customRequest"
            :disabled="disabled"
            class="avatar-upload"
        >
            <img v-if="value" :src="value" alt="avatar" class="avatar-img" />
            <div v-else class="avatar-placeholder">
                <loading-outlined v-if="loading" />
                <plus-outlined v-else />
                <div class="avatar-text">上传头像</div>
            </div>
        </a-upload>
    </div>
</template>

<script setup>
import { ref } from "vue";
import { message } from "ant-design-vue";
import { PlusOutlined, LoadingOutlined } from "@ant-design/icons-vue";
import { uploadFile } from "@/api/file";

defineProps({
    value: { type: String, default: "" },
    size: { type: Number, default: 100 },
    disabled: { type: Boolean, default: false },
});
const emit = defineEmits(["update:value"]);

const loading = ref(false);

const beforeUpload = (file) => {
    const ok = ["image/jpeg", "image/png", "image/gif", "image/webp"].includes(
        file.type,
    );
    if (!ok) {
        message.error("仅支持 JPG / PNG / GIF / WEBP");
        return false;
    }
    if (file.size / 1024 / 1024 >= 2) {
        message.error("图片不能超过 2 MB");
        return false;
    }
    return true;
};

const customRequest = async ({ file, onSuccess, onError }) => {
    loading.value = true;
    try {
        const res = await uploadFile(file);
        const url = res?.data?.url;
        if (url) {
            emit("update:value", url);
            message.success("头像上传成功");
            onSuccess(res, file);
        } else {
            throw new Error("服务端未返回 URL");
        }
    } catch (err) {
        message.error("头像上传失败");
        onError(err);
    } finally {
        loading.value = false;
    }
};
</script>

<style scoped>
.avatar-upload-wrap {
    display: inline-block;
    flex-shrink: 0;
}
.avatar-upload-wrap.disabled {
    pointer-events: none;
}
.avatar-upload :deep(.ant-upload) {
    width: 100% !important;
    height: 100% !important;
    border-radius: 50% !important;
    overflow: hidden;
    padding: 0 !important;
    border: 2px dashed var(--color-border) !important;
    display: flex !important;
    align-items: center;
    justify-content: center;
    background: var(--color-bg-hover);
    transition: border-color 0.2s;
}
.avatar-upload :deep(.ant-upload):hover {
    border-color: var(--color-primary) !important;
}
.avatar-img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
}
.avatar-placeholder {
    text-align: center;
    color: var(--color-text-mute);
    font-size: 14px;
}
.avatar-text {
    margin-top: 4px;
    font-size: 12px;
}
</style>
