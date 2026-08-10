import request from "./request";

/**
 * 用户注册
 */
export const register = (data) => {
    return request.post("/user/register", data);
};

/**
 * 用户登录
 */
export const login = (username, password) => {
    return request.post("/user/login", { username, password });
};

/**
 * 分页查询用户列表
 */
export const pageQueryUser = (query) => {
    return request.post("/user/pageQuery", query);
};

/**
 * 查询所有用户列表
 */
export const listAllUser = () => {
    return request.get("/user/listAll");
};

/**
 * 根据ID查询用户
 */
export const getUserById = (id) => {
    return request.get(`/user/getById/${id}`);
};

/**
 * 更新用户信息
 */
export const updateUser = (data) => {
    return request.put("/user/update", data);
};

/**
 * 修改密码（只能改自己的，需校验原密码）
 */
export const updatePassword = (oldPassword, newPassword) =>
    request.put("/user/updatePassword", { oldPassword, newPassword });

/**
 * 删除用户
 */
export const deleteUser = (id) => {
    return request.delete(`/user/deleteById/${id}`);
};

/**
 * 批量删除用户
 */
export const deleteUserBatch = (ids) => {
    return request.delete("/user/deleteBatch", { data: ids });
};
