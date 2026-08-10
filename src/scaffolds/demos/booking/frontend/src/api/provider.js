import request from "./request";

/**
 * 申请入驻，提交后等管理员审核
 */
export const applyProvider = (data) => {
    return request.post("/provider/apply", data);
};

/**
 * 查询我的机构，没申请过时 data 为 null
 */
export const getMyProvider = () => {
    return request.get("/provider/mine");
};

/**
 * 修改我的机构资料
 */
export const updateMyProvider = (data) => {
    return request.put("/provider/mine/update", data);
};

/**
 * 分页查询机构列表（管理员）
 */
export const pageQueryProvider = (query) => {
    return request.post("/provider/pageQuery", query);
};

/**
 * 审核或封禁机构（管理员）
 * @param {number} id 机构ID
 * @param {number} status 1-通过，2-封禁
 */
export const auditProvider = (id, status) => {
    return request.post("/provider/audit", { id, status });
};

/**
 * 机构状态字典，与后端 Provider 常量保持一致
 */
export const PROVIDER_STATUS = {
    0: { text: "待审核", color: "orange" },
    1: { text: "正常", color: "green" },
    2: { text: "已封禁", color: "red" },
};
