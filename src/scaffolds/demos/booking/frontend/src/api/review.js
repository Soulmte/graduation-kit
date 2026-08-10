import request from "./request";

/**
 * 分页查评价。服务详情页传 { serviceItemId, pageNum, pageSize }
 */
export const pageQueryReview = (query) => {
    return request.post("/review/pageQuery", query);
};

/**
 * 发表评价。只有自己已完成且没评过的单能评
 * { appointmentId, rating, content }
 */
export const createMyReview = (data) => {
    return request.post("/review/mine/create", data);
};

/**
 * 机构端分页查自己收到的评价
 */
export const pageQueryProviderReview = (query) => {
    return request.post("/review/provider/pageQuery", query);
};

/**
 * 机构回复评价
 */
export const replyReview = (id, reply) => {
    return request.post("/review/provider/reply", { id, reply });
};

/**
 * 管理员删除违规评价
 */
export const deleteReview = (id) => {
    return request.delete(`/review/admin/deleteById/${id}`);
};
