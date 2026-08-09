import request from "./request";

// ---- 买家端 ----

/**
 * 分页查询上架商品
 * @param {object} query { pageNum, pageSize, name, categoryId, minPrice, maxPrice, orderBy, order }
 */
export const pageQueryProduct = (query) => {
    return request.post("/product/pageQuery", query);
};

/**
 * 查询商品详情，下架商品后端会拒绝
 */
export const getProductById = (id) => {
    return request.get(`/product/getById/${id}`);
};

// ---- 商家端 ----

/**
 * 分页查询自己店的商品，上下架都会返回
 */
export const pageQueryMyProduct = (query) => {
    return request.post("/product/mine/pageQuery", query);
};

/**
 * 新增商品，后端默认置为下架
 */
export const addMyProduct = (data) => {
    return request.post("/product/mine/add", data);
};

/**
 * 更新自己店的商品
 */
export const updateMyProduct = (data) => {
    return request.put("/product/mine/update", data);
};

/**
 * 上下架
 * @param {number} status 0-下架，1-上架
 */
export const changeMyProductStatus = (id, status) => {
    return request.put(`/product/mine/changeStatus/${id}/${status}`);
};

/**
 * 删除自己店的商品
 */
export const deleteMyProduct = (id) => {
    return request.delete(`/product/mine/deleteById/${id}`);
};
