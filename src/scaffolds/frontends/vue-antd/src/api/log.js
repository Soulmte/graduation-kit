import request from "./request";

/**
 * 分页查询操作日志
 */
export const pageQueryLog = (query) => {
    return request.post("/log/pageQuery", query);
};

/**
 * 查询所有操作日志
 */
export const listAllLog = () => {
    return request.get("/log/listAll");
};

/**
 * 根据ID查询操作日志
 */
export const getLogById = (id) => {
    return request.get(`/log/getById/${id}`);
};

/**
 * 删除操作日志
 */
export const deleteLog = (id) => {
    return request.delete(`/log/deleteById/${id}`);
};

/**
 * 批量删除操作日志
 */
export const deleteLogBatch = (ids) => {
    return request.delete("/log/deleteBatch", { data: ids });
};
