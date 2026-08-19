import request from "./request";

// ==================== 前台 ====================

/**
 * 我的会话列表，按最后消息时间倒序
 */
export const listMyConversation = () => {
    return request.get("/conversation/listMine");
};

/**
 * 取会话详情连带全部消息
 */
export const getConversationDetail = (id) => {
    return request.get(`/conversation/getDetail/${id}`);
};

/**
 * 新建会话
 */
export const createConversation = (agentId) => {
    return request.post(`/conversation/create/${agentId}`);
};

/**
 * 重命名会话
 */
export const renameConversation = (id, title) => {
    return request.put(`/conversation/rename/${id}`, { title });
};

/**
 * 删除会话及其下所有消息
 */
export const deleteConversation = (id) => {
    return request.delete(`/conversation/deleteById/${id}`);
};

// ==================== 管理端 ====================

/**
 * 分页查询所有人的会话
 */
export const pageQueryConversation = (query) => {
    return request.post("/conversation/pageQuery", query);
};

/**
 * 管理端看任意会话的完整消息
 */
export const getConversationDetailForAdmin = (id) => {
    return request.get(`/conversation/getDetailForAdmin/${id}`);
};
