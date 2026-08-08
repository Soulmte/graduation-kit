import request from "./request";

/**
 * 创建公告
 */
export const addNotice = (data) => {
    return request.post("/notice/add", data);
};

/**
 * 分页查询公告列表
 */
export const pageQueryNotice = (query) => {
    return request.post("/notice/pageQuery", query);
};

/**
 * 查询所有公告列表
 */
export const listAllNotice = () => {
    return request.get("/notice/listAll");
};

/**
 * 根据ID查询公告
 */
export const getNoticeById = (id) => {
    return request.get(`/notice/getById/${id}`);
};

/**
 * 更新公告
 */
export const updateNotice = (data) => {
    return request.put("/notice/update", data);
};

/**
 * 删除公告
 */
export const deleteNotice = (id) => {
    return request.delete(`/notice/deleteById/${id}`);
};

/**
 * 批量删除公告
 */
export const deleteNoticeBatch = (ids) => {
    return request.delete("/notice/deleteBatch", { data: ids });
};
