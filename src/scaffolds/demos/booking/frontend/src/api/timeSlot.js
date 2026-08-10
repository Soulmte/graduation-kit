import request from "./request";

// ---- 买家端 ----

/**
 * 查某个服务项的可约时段。返回的都是开放中、未过期、还有名额的
 * @param {number} serviceItemId 服务项ID
 * @param {string} [from] 起始日期 yyyy-MM-dd，默认今天
 * @param {string} [to] 结束日期 yyyy-MM-dd，默认起始日期后 30 天
 */
export const listBookableSlot = (serviceItemId, from, to) => {
    return request.get("/timeSlot/listBookable", {
        params: { serviceItemId, from, to },
    });
};

// ---- 机构端 ----

/**
 * 分页查询自己机构的排班，关闭与过期的也出
 */
export const pageQueryMySlot = (query) => {
    return request.post("/timeSlot/mine/pageQuery", query);
};

/**
 * 按日期区间批量生成排班，返回实际新建的条数。
 * 已存在的时段会跳过，可以反复点来补齐新日子
 */
export const generateMySlot = (data) => {
    return request.post("/timeSlot/mine/generate", data);
};

/**
 * 开关单个时段
 * @param {number} id 时段ID
 * @param {number} status 0-关闭，1-开放
 */
export const changeMySlotStatus = (id, status) => {
    return request.put(`/timeSlot/mine/changeStatus/${id}/${status}`);
};

/**
 * 删除时段。已有人预约的会被后端拦掉
 */
export const deleteMySlot = (id) => {
    return request.delete(`/timeSlot/mine/deleteById/${id}`);
};

/**
 * 时段状态字典，与后端 TimeSlot 常量保持一致
 */
export const SLOT_STATUS = {
    0: { text: "已关闭", color: "default" },
    1: { text: "开放中", color: "green" },
};
