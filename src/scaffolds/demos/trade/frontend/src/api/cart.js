import request from "./request";

/**
 * 列出我的购物车。价格与库存是后端实时从商品表读的，不是加车时的快照
 */
export const listMyCart = () => {
    return request.get("/cart/listMine");
};

/**
 * 加入购物车。已在车里则后端叠加数量
 */
export const addToCart = (productId, quantity = 1) => {
    return request.post("/cart/add", { productId, quantity });
};

/**
 * 修改购物车数量
 */
export const updateCartQuantity = (id, quantity) => {
    return request.put("/cart/update", { id, quantity });
};

/**
 * 移除一个条目
 */
export const deleteCartItem = (id) => {
    return request.delete(`/cart/deleteById/${id}`);
};

/**
 * 批量移除
 */
export const deleteCartBatch = (ids) => {
    return request.delete("/cart/deleteBatch", { data: ids });
};

/**
 * 清空购物车
 */
export const clearCart = () => {
    return request.delete("/cart/clear");
};
