import request from "./request";

/**
 * 列出全部服务分类，按 sort 升序
 */
export const listServiceCategory = () => {
    return request.get("/serviceCategory/list");
};

/**
 * 新增服务分类（管理员）
 */
export const addServiceCategory = (data) => {
    return request.post("/serviceCategory/add", data);
};

/**
 * 更新服务分类（管理员）
 */
export const updateServiceCategory = (data) => {
    return request.put("/serviceCategory/update", data);
};

/**
 * 删除服务分类（管理员）。分类下还有服务项时会被后端拦掉
 */
export const deleteServiceCategory = (id) => {
    return request.delete(`/serviceCategory/deleteById/${id}`);
};
