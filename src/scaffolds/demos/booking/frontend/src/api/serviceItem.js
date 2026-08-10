import request from "./request";

// ---- 买家端 ----

/**
 * 分页查询上线服务项
 */
export const pageQueryServiceItem = (query) => {
    return request.post("/serviceItem/pageQuery", query);
};

/**
 * 查询服务项详情，下线的看不到
 */
export const getServiceItemById = (id) => {
    return request.get(`/serviceItem/getById/${id}`);
};

// ---- 机构端 ----

/**
 * 分页查询自己机构的服务项，上下线都出
 */
export const pageQueryMyServiceItem = (query) => {
    return request.post("/serviceItem/mine/pageQuery", query);
};

/**
 * 新增服务项，默认下线，排好班再上线
 */
export const addMyServiceItem = (data) => {
    return request.post("/serviceItem/mine/add", data);
};

/**
 * 更新自己的服务项
 */
export const updateMyServiceItem = (data) => {
    return request.put("/serviceItem/mine/update", data);
};

/**
 * 上下线服务项
 * @param {number} id 服务项ID
 * @param {number} status 0-下线，1-上线
 */
export const changeMyServiceItemStatus = (id, status) => {
    return request.put(`/serviceItem/mine/changeStatus/${id}/${status}`);
};

/**
 * 删除服务项。已被预约过的会被后端拦掉
 */
export const deleteMyServiceItem = (id) => {
    return request.delete(`/serviceItem/mine/deleteById/${id}`);
};

/**
 * 服务项状态字典，与后端 ServiceItem 常量保持一致
 */
export const SERVICE_STATUS = {
    0: { text: "已下线", color: "default" },
    1: { text: "已上线", color: "green" },
};
