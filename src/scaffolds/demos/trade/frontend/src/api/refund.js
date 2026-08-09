import request from "./request";

// ---- 买家端 ----

/**
 * 申请退款。金额由后端取订单总额，前端不用传
 */
export const applyRefund = (orderId, reason) => {
    return request.post("/refund/mine/apply", { orderId, reason });
};

/**
 * 分页查询我的退款申请
 */
export const pageQueryMyRefund = (query) => {
    return request.post("/refund/mine/pageQuery", query);
};

// ---- 商家端 ----

/**
 * 分页查询自己店的退款申请，待审核的排前面
 */
export const pageQueryMerchantRefund = (query) => {
    return request.post("/refund/merchant/pageQuery", query);
};

/**
 * 审核退款
 * @param {number} status 1-同意，2-拒绝
 */
export const auditRefund = (id, status, auditRemark) => {
    return request.put("/refund/merchant/audit", { id, status, auditRemark });
};

// ---- 管理端 ----

/**
 * 分页查询全部退款申请
 */
export const pageQueryAllRefund = (query) => {
    return request.post("/refund/admin/pageQuery", query);
};

/**
 * 退款状态字典。与后端 Refund 的常量保持一致
 */
export const REFUND_STATUS = {
    0: { text: "待审核", color: "orange" },
    1: { text: "已同意", color: "green" },
    2: { text: "已拒绝", color: "red" },
};
