<template>
    <div class="auth-screen">
        <div class="auth-card" style="width: 480px">
            <div class="auth-brand">
                <div class="auth-brand-mark">S</div>
                <div class="auth-brand-title">注册账号</div>
            </div>

            <a-form
                :model="form"
                :rules="rules"
                ref="formRef"
                size="large"
                layout="vertical"
                @finish="handleSubmit"
            >
                <a-form-item name="username">
                    <a-input
                        v-model:value="form.username"
                        placeholder="用户名 (登录使用)"
                        autocomplete="username"
                    >
                        <template #prefix><user-outlined /></template>
                    </a-input>
                </a-form-item>

                <a-form-item name="password">
                    <a-input-password
                        v-model:value="form.password"
                        placeholder="密码"
                        autocomplete="new-password"
                    >
                        <template #prefix><lock-outlined /></template>
                    </a-input-password>
                </a-form-item>

                <a-form-item name="confirm">
                    <a-input-password
                        v-model:value="form.confirm"
                        placeholder="确认密码"
                        autocomplete="new-password"
                    >
                        <template #prefix><lock-outlined /></template>
                    </a-input-password>
                </a-form-item>

                <a-form-item name="nickname">
                    <a-input
                        v-model:value="form.nickname"
                        placeholder="昵称 (选填)"
                        :maxlength="50"
                    >
                        <template #prefix><idcard-outlined /></template>
                    </a-input>
                </a-form-item>

                <div
                    style="
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 0 12px;
                    "
                >
                    <a-form-item name="age">
                        <a-input-number
                            v-model:value="form.age"
                            :min="1"
                            :max="150"
                            placeholder="年龄 (选填)"
                            style="width: 100%"
                        />
                    </a-form-item>
                    <a-form-item name="gender">
                        <a-select
                            v-model:value="form.gender"
                            placeholder="性别 (选填)"
                            allow-clear
                            :options="GENDER_OPTIONS"
                        />
                    </a-form-item>
                </div>

                <a-form-item name="phone">
                    <a-input
                        v-model:value="form.phone"
                        placeholder="手机号 (选填)"
                        :maxlength="11"
                    >
                        <template #prefix><phone-outlined /></template>
                    </a-input>
                </a-form-item>

                <a-form-item name="email">
                    <a-input
                        v-model:value="form.email"
                        placeholder="邮箱 (选填)"
                    >
                        <template #prefix><mail-outlined /></template>
                    </a-input>
                </a-form-item>

                <a-form-item>
                    <a-button
                        type="primary"
                        html-type="submit"
                        block
                        :loading="loading"
                        >注册</a-button
                    >
                </a-form-item>

                <div class="auth-footer">
                    已有账号？<router-link to="/login">立即登录</router-link>
                </div>
            </a-form>
        </div>
    </div>
</template>

<script setup>
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { message } from "ant-design-vue";
import {
    UserOutlined,
    LockOutlined,
    MailOutlined,
    IdcardOutlined,
    PhoneOutlined,
} from "@ant-design/icons-vue";
import { register } from "@/api/user";

const GENDER_OPTIONS = [
    { value: "male", label: "男" },
    { value: "female", label: "女" },
    { value: "other", label: "其他" },
];

const router = useRouter();
const loading = ref(false);
const formRef = ref(null);
const form = reactive({
    username: "",
    password: "",
    confirm: "",
    nickname: "",
    age: null,
    gender: undefined,
    phone: "",
    email: "",
});
const rules = {
    username: [
        { required: true, message: "请输入用户名", trigger: "blur" },
        { min: 3, max: 50, message: "长度 3-50 个字符", trigger: "blur" },
        {
            pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/,
            message: "用户名需以字母开头，只能包含字母数字下划线",
            trigger: "blur",
        },
    ],
    password: [
        { required: true, message: "请输入密码", trigger: "blur" },
        { min: 6, max: 32, message: "密码长度 6-32 位", trigger: "blur" },
    ],
    confirm: [
        { required: true, message: "请确认密码", trigger: "blur" },
        {
            validator: (_rule, value) => {
                if (!value) return Promise.resolve();
                return value === form.password
                    ? Promise.resolve()
                    : Promise.reject(new Error("两次密码不一致"));
            },
            trigger: "blur",
        },
    ],
    phone: [
        {
            pattern: /^1[3-9]\d{9}$/,
            message: "请输入有效的 11 位手机号",
            trigger: "blur",
        },
    ],
    email: [{ type: "email", message: "邮箱格式不正确", trigger: "blur" }],
};

const handleSubmit = async () => {
    await formRef.value.validate();
    loading.value = true;
    try {
        // 不传 confirm 给后端（仅前端用于两次密码校验）
        const payload = { ...form };
        delete payload.confirm;
        await register(payload);
        message.success("注册成功，请登录");
        router.push("/login");
    } finally {
        loading.value = false;
    }
};
</script>
