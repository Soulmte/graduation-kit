import request from "./request";

/**
 * 申请开店
 */
export const applyMerchant = (data) => {
    return request.post("/merchant/apply", data);
};

/**
 * 查询我的店铺，没申请过时 data 为 null
 */
export const getMyMerchant = () => {
    return request.get("/merchant/mine");
};

/**
 * 修改我的店铺资料
 */
export const updateMyMerchant = (data) => {
    return request.put("/merchant/updateMine", data);
};

/**
 * 查询店铺详情（买家用）
 */
export const getMerchantById = (id) => {
    return request.get(`/merchant/getById/${id}`);
};

/**
 * 分页查询店铺列表（管理员）
 */
export const pageQueryMerchant = (query) => {
    return request.post("/merchant/pageQuery", query);
};

/**
 * 审核或封禁店铺（管理员）
 * @param {number} id 店铺ID
 * @param {number} status 1-通过，2-封禁
 */
export const auditMerchant = (id, status) => {
    return request.put("/merchant/audit", { id, status });
};
