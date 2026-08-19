import request from "./request";

// ==================== 管理端 ====================

/**
 * 分页查询智能体（含草稿）
 */
export const pageQueryAgent = (query) => {
    return request.post("/agent/pageQuery", query);
};

/**
 * 取智能体详情（管理端，草稿也能取）
 */
export const getAgentForEdit = (id) => {
    return request.get(`/agent/getForEdit/${id}`);
};

/**
 * 新增智能体
 */
export const addAgent = (data) => {
    return request.post("/agent/add", data);
};

/**
 * 更新智能体基础信息
 */
export const updateAgent = (data) => {
    return request.put("/agent/update", data);
};

/**
 * 保存画布。结构不合法后端会直接报错
 */
export const saveAgentGraph = (id, graph) => {
    return request.put(`/agent/saveGraph/${id}`, graph);
};

/**
 * 发布智能体
 */
export const publishAgent = (id) => {
    return request.put(`/agent/publish/${id}`);
};

/**
 * 撤回为草稿
 */
export const unpublishAgent = (id) => {
    return request.put(`/agent/unpublish/${id}`);
};

/**
 * 删除智能体
 */
export const deleteAgent = (id) => {
    return request.delete(`/agent/deleteById/${id}`);
};

// ==================== 前台 ====================

/**
 * 前台可用的智能体列表，只出已发布的
 */
export const listPublishedAgent = () => {
    return request.get("/agent/listPublished");
};

/**
 * 前台取智能体详情
 */
export const getPublishedAgent = (id) => {
    return request.get(`/agent/getPublished/${id}`);
};
