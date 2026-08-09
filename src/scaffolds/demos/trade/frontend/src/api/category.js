import request from "./request";

/**
 * 列出全部分类，按 sort 升序
 */
export const listAllCategory = () => {
    return request.get("/category/listAll");
};

/**
 * 新增分类（管理员）
 */
export const addCategory = (data) => {
    return request.post("/category/add", data);
};

/**
 * 更新分类（管理员）
 */
export const updateCategory = (data) => {
    return request.put("/category/update", data);
};

/**
 * 删除分类（管理员）。分类下还有商品时后端会拒绝
 */
export const deleteCategory = (id) => {
    return request.delete(`/category/deleteById/${id}`);
};
