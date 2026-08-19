<template>
    <div style="width: 100%">
        <!-- 顶栏 -->
        <div class="profile-toolbar">
            <div>
                <h2 class="profile-title">个人信息</h2>
                <p class="profile-subtitle">管理你的账户资料和联系方式</p>
            </div>
            <a-space>
                <template v-if="editing">
                    <a-button @click="cancelEdit"
                        ><close-outlined /> 取消</a-button
                    >
                    <a-button
                        type="primary"
                        :loading="loading"
                        @click="handleSubmit"
                        ><save-outlined /> 保存</a-button
                    >
                </template>
                <a-button v-else type="primary" @click="startEdit"
                    ><edit-outlined /> 编辑资料</a-button
                >
            </a-space>
        </div>

        <a-form :model="form" layout="vertical" ref="formRef">
            <!-- 上部：头像 + 概览 -->
            <a-card style="margin-bottom: 16px">
                <div class="profile-header">
                    <avatar-upload
                        v-model:value="avatar"
                        :size="120"
                        :disabled="!editing"
                    />
                    <a-descriptions
                        :column="2"
                        size="small"
                        :colon="false"
                        class="profile-info"
                    >
                        <a-descriptions-item label="用户名">{{
                            userStore.userInfo?.username
                        }}</a-descriptions-item>
                        <a-descriptions-item label="角色">
                            <a-tag
                                :color="
                                    userStore.userInfo?.role === 'admin'
                                        ? 'blue'
                                        : 'default'
                                "
                            >
                                {{
                                    ROLE_MAP[userStore.userInfo?.role] ||
                                    userStore.userInfo?.role
                                }}
                            </a-tag>
                        </a-descriptions-item>
                        <a-descriptions-item label="昵称">
                            <a-input
                                v-if="editing"
                                v-model:value="form.nickname"
                                placeholder="请输入昵称"
                                :maxlength="50"
                                style="width: 160px"
                            />
                            <span v-else>{{
                                userStore.userInfo?.nickname || "-"
                            }}</span>
                        </a-descriptions-item>
                        <a-descriptions-item label="注册时间">{{
                            userStore.userInfo?.createTime || "-"
                        }}</a-descriptions-item>
                    </a-descriptions>
                </div>
            </a-card>

            <!-- 下部：左右两栏 -->
            <div class="profile-grid">
                <a-card title="基本信息">
                    <template v-if="editing">
                        <a-form-item label="年龄" name="age">
                            <a-input-number
                                v-model:value="form.age"
                                :min="1"
                                :max="150"
                                placeholder="年龄"
                                style="width: 100%"
                            />
                        </a-form-item>
                        <a-form-item label="性别" name="gender">
                            <a-select
                                v-model:value="form.gender"
                                placeholder="请选择性别"
                                allow-clear
                                :options="GENDER_OPTIONS"
                            />
                        </a-form-item>
                    </template>
                    <a-descriptions
                        v-else
                        :column="1"
                        size="small"
                        :colon="false"
                    >
                        <a-descriptions-item label="年龄">{{
                            userStore.userInfo?.age ?? "-"
                        }}</a-descriptions-item>
                        <a-descriptions-item label="性别">
                            {{
                                GENDER_OPTIONS.find(
                                    (g) =>
                                        g.value === userStore.userInfo?.gender,
                                )?.label || "-"
                            }}
                        </a-descriptions-item>
                    </a-descriptions>
                </a-card>

                <div class="profile-right">
                    <a-card title="联系方式">
                        <template v-if="editing">
                            <a-form-item
                                label="手机号"
                                name="phone"
                                :rules="[
                                    {
                                        pattern: /^1\d{10}$/,
                                        message: '手机号格式不正确',
                                    },
                                ]"
                            >
                                <a-input
                                    v-model:value="form.phone"
                                    placeholder="请输入手机号"
                                    :maxlength="11"
                                />
                            </a-form-item>
                            <a-form-item
                                label="邮箱"
                                name="email"
                                :rules="[
                                    {
                                        type: 'email',
                                        message: '邮箱格式不正确',
                                    },
                                ]"
                            >
                                <a-input
                                    v-model:value="form.email"
                                    placeholder="请输入邮箱"
                                />
                            </a-form-item>
                        </template>
                        <a-descriptions
                            v-else
                            :column="1"
                            size="small"
                            :colon="false"
                        >
                            <a-descriptions-item label="手机号">{{
                                userStore.userInfo?.phone || "-"
                            }}</a-descriptions-item>
                            <a-descriptions-item label="邮箱">{{
                                userStore.userInfo?.email || "-"
                            }}</a-descriptions-item>
                        </a-descriptions>
                    </a-card>

                    <a-card title="安全设置">
                        <a-descriptions :column="1" size="small" :colon="false">
                            <a-descriptions-item label="密码"
                                >********</a-descriptions-item
                            >
                        </a-descriptions>
                        <a-button
                            style="margin-top: 8px"
                            @click="passwordVisible = true"
                        >
                            修改密码
                        </a-button>
                    </a-card>
                </div>
            </div>
        </a-form>

        <!-- 修改密码弹窗 -->
        <a-modal
            v-model:open="passwordVisible"
            title="修改密码"
            :confirm-loading="passwordLoading"
            ok-text="确定"
            cancel-text="取消"
            @ok="handlePasswordSubmit"
            @cancel="resetPasswordForm"
        >
            <a-form
                ref="passwordFormRef"
                :model="passwordForm"
                :rules="passwordRules"
                layout="vertical"
            >
                <a-form-item label="原密码" name="oldPassword">
                    <a-input-password
                        v-model:value="passwordForm.oldPassword"
                        placeholder="请输入原密码"
                    />
                </a-form-item>
                <a-form-item label="新密码" name="newPassword">
                    <a-input-password
                        v-model:value="passwordForm.newPassword"
                        placeholder="6-20位"
                    />
                </a-form-item>
                <a-form-item label="确认新密码" name="confirmPassword">
                    <a-input-password
                        v-model:value="passwordForm.confirmPassword"
                        placeholder="请再次输入"
                    />
                </a-form-item>
            </a-form>
        </a-modal>
    </div>
</template>

<script setup>
import { reactive, ref } from "vue";
import { message } from "ant-design-vue";
import {
    EditOutlined,
    SaveOutlined,
    CloseOutlined,
} from "@ant-design/icons-vue";
import { updateUser, updatePassword } from "@/api/user";
import { useUserStore } from "@/stores/user";
import AvatarUpload from "@/components/AvatarUpload.vue";

const GENDER_OPTIONS = [
    { value: "male", label: "男" },
    { value: "female", label: "女" },
    { value: "other", label: "其他" },
];
const ROLE_MAP = { admin: "管理员", user: "普通用户" };

const userStore = useUserStore();
const formRef = ref(null);
const editing = ref(false);
const loading = ref(false);
const avatar = ref("");
// 只包含后端 update 接口允许修改的字段，role 与 password 不在此修改
const form = reactive({
    nickname: "",
    age: null,
    gender: undefined,
    phone: "",
    email: "",
});

const startEdit = () => {
    const u = userStore.userInfo || {};
    form.nickname = u.nickname || "";
    form.age = u.age ?? null;
    form.gender = u.gender || undefined;
    form.phone = u.phone || "";
    form.email = u.email || "";
    avatar.value = u.avatar || "";
    editing.value = true;
};

const cancelEdit = () => {
    editing.value = false;
};

const handleSubmit = async () => {
    loading.value = true;
    try {
        const u = userStore.userInfo || {};
        await updateUser({ id: u.id, ...form, avatar: avatar.value });
        message.success("更新成功");
        userStore.updateUserInfo({ ...u, ...form, avatar: avatar.value });
        editing.value = false;
    } finally {
        loading.value = false;
    }
};

// ---- 修改密码 ----
const passwordVisible = ref(false);
const passwordLoading = ref(false);
const passwordFormRef = ref(null);
const passwordForm = reactive({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
});

const passwordRules = {
    oldPassword: [{ required: true, message: "请输入原密码" }],
    newPassword: [
        { required: true, message: "请输入新密码" },
        { min: 6, max: 20, message: "密码长度在6-20位之间" },
    ],
    confirmPassword: [
        { required: true, message: "请再次输入新密码" },
        {
            validator: (_rule, value) =>
                value === passwordForm.newPassword
                    ? Promise.resolve()
                    : Promise.reject(new Error("两次密码输入不一致")),
        },
    ],
};

const resetPasswordForm = () => {
    passwordFormRef.value?.resetFields();
};

const handlePasswordSubmit = async () => {
    await passwordFormRef.value.validate();
    passwordLoading.value = true;
    try {
        await updatePassword(
            passwordForm.oldPassword,
            passwordForm.newPassword,
        );
        message.success("密码修改成功");
        passwordVisible.value = false;
        resetPasswordForm();
    } finally {
        passwordLoading.value = false;
    }
};
</script>

<style scoped>
.profile-toolbar {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 20px;
}
.profile-title {
    font-size: 20px;
    font-weight: 700;
    color: var(--color-text);
    margin: 0;
}
.profile-subtitle {
    font-size: 13px;
    color: var(--color-text-mute);
    margin: 4px 0 0;
}
.profile-header {
    display: flex;
    align-items: center;
    gap: 32px;
}
.profile-info {
    flex: 1;
}
.profile-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    align-items: start;
}
.profile-right {
    display: flex;
    flex-direction: column;
    gap: 16px;
}
@media (max-width: 768px) {
    .profile-header {
        flex-direction: column;
        text-align: center;
    }
    .profile-grid {
        grid-template-columns: 1fr;
    }
}
</style>
