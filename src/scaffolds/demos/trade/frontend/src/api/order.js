import request from "./request";

// ---- 买家端 ----

/**
 * 创建订单。两种来源二选一：
 *   购物车结算：{ cartItemIds: [1,2], receiverName, receiverPhone, receiverAddr, remark }
 *   直接购买：  { productId, quantity, receiverName, receiverPhone, receiverAddr, remark }
 * 金额由后端按商品现价算，前端不用传
 */
export const createOrder = (data) => {
    return request.post("/order/mine/create", data);
};

/**
 * 分页查询我的订单
 */
export const pageQueryMyOrder = (query) => {
    return request.post("/order/mine/pageQuery", query);
};

/**
 * 支付订单（模拟支付）
 */
export const payOrder = (id) => {
    return request.put(`/order/mine/pay/${id}`);
};

/**
 * 取消订单，仅待支付可取消
 */
export const cancelOrder = (id) => {
    return request.put(`/order/mine/cancel/${id}`);
};

/**
 * 确认收货，仅待收货可确认
 */
export const confirmOrder = (id) => {
    return request.put(`/order/mine/confirm/${id}`);
};

// ---- 商家端 ----

/**
 * 分页查询自己店的订单
 */
export const pageQueryMerchantOrder = (query) => {
    return request.post("/order/merchant/pageQuery", query);
};

/**
 * 发货，仅待发货可发货
 */
export const shipOrder = (id) => {
    return request.put("/order/merchant/ship", { id });
};

// ---- 管理端 ----

/**
 * 分页查询全部订单
 */
export const pageQueryAllOrder = (query) => {
    return request.post("/order/admin/pageQuery", query);
};

// ---- 三端共用 ----

/**
 * 订单详情（含明细）
 */
export const getOrderById = (id) => {
    return request.get(`/order/getById/${id}`);
};

/**
 * 订单状态字典。与后端 Orders 的常量保持一致
 */
export const ORDER_STATUS = {
    0: { text: "待支付", color: "orange" },
    1: { text: "待发货", color: "blue" },
    2: { text: "待收货", color: "cyan" },
    3: { text: "已完成", color: "green" },
    4: { text: "已取消", color: "default" },
    5: { text: "退款中", color: "gold" },
    6: { text: "已退款", color: "red" },
};
