import { defineStore } from "pinia";
import { ref } from "vue";
import { login as loginApi } from "@/api/user";

export const useUserStore = defineStore("user", () => {
    const token = ref(localStorage.getItem("token") || "");
    const userInfo = ref(
        JSON.parse(localStorage.getItem("userInfo") || "null"),
    );

    // 登录
    const login = async (username, password) => {
        const res = await loginApi(username, password);
        token.value = res.data.token;
        userInfo.value = res.data.userInfo;
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("userInfo", JSON.stringify(res.data.userInfo));

        return res;
    };

    // 更新本地用户信息（修改资料后同步，避免页面直接操作 localStorage）
    const updateUserInfo = (info) => {
        userInfo.value = info;
        localStorage.setItem("userInfo", JSON.stringify(info));
    };

    // 登出
    const logout = () => {
        token.value = "";
        userInfo.value = null;
        localStorage.removeItem("token");
        localStorage.removeItem("userInfo");
    };

    return {
        token,
        userInfo,
        login,
        updateUserInfo,
        logout,
    };
});
