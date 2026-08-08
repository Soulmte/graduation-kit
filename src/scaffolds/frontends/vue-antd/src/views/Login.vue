<template>
    <div class="auth-screen">
        <div class="auth-card">
            <div class="auth-brand">
                <div class="auth-brand-mark">S</div>
                <div class="auth-brand-title">欢迎登录</div>
            </div>

            <a-form
                :model="form"
                ref="formRef"
                :rules="rules"
                size="large"
                @finish="handleSubmit"
            >
                <a-form-item name="username">
                    <a-input
                        v-model:value="form.username"
                        placeholder="用户名"
                        autocomplete="username"
                    >
                        <template #prefix><user-outlined /></template>
                    </a-input>
                </a-form-item>

                <a-form-item name="password">
                    <a-input-password
                        v-model:value="form.password"
                        placeholder="密码"
                        autocomplete="current-password"
                    >
                        <template #prefix><lock-outlined /></template>
                    </a-input-password>
                </a-form-item>

                <a-form-item name="captcha">
                    <div style="display: flex; gap: 8px">
                        <a-input
                            v-model:value="form.captcha"
                            placeholder="验证码"
                            autocomplete="off"
                            :maxlength="4"
                        >
                            <template #prefix><safety-outlined /></template>
                        </a-input>
                        <captcha ref="captchaRef" />
                    </div>
                </a-form-item>

                <a-form-item>
                    <a-button
                        type="primary"
                        html-type="submit"
                        block
                        :loading="loading"
                        >登录</a-button
                    >
                </a-form-item>

                <div class="auth-footer">
                    还没有账号？<router-link to="/register"
                        >立即注册</router-link
                    >
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
    SafetyOutlined,
} from "@ant-design/icons-vue";
import { useUserStore } from "@/stores/user";
import Captcha from "@/components/Captcha.vue";

const router = useRouter();
const userStore = useUserStore();
const loading = ref(false);
const formRef = ref(null);
const captchaRef = ref(null);
const form = reactive({ username: "", password: "", captcha: "" });
const rules = {
    username: [
        { required: true, message: "请输入用户名", trigger: "blur" },
        { min: 3, max: 50, message: "长度 3-50 个字符", trigger: "blur" },
    ],
    password: [
        { required: true, message: "请输入密码", trigger: "blur" },
        { min: 6, message: "密码至少 6 位", trigger: "blur" },
    ],
    captcha: [{ required: true, message: "请输入验证码", trigger: "blur" }],
};

const handleSubmit = async () => {
    if (!captchaRef.value.verify(form.captcha)) {
        message.error("验证码错误");
        captchaRef.value.refresh();
        form.captcha = "";
        return;
    }
    loading.value = true;
    try {
        const res = await userStore.login(form.username, form.password);
        message.success("登录成功");
        router.push(
            res.data.userInfo.role === "admin"
                ? "/admin/dashboard"
                : "/user/home",
        );
    } catch {
        captchaRef.value.refresh();
        form.captcha = "";
    } finally {
        loading.value = false;
    }
};
</script>
