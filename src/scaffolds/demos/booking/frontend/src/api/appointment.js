import request from "./request";

// ---- 买家端 ----

/**
 * 创建预约。只传时段ID与联系方式，
 * 服务项、机构、日期时间、价格全由后端从时段反查并写快照
 * { timeSlotId, contactName, contactPhone, remark }
 */
export const createAppointment = (data) => {
    return request.post("/appointment/mine/create", data);
};

/**
 * 分页查询我的预约
 */
export const pageQueryMyAppointment = (query) => {
    return request.post("/appointment/mine/pageQuery", query);
};

/**
 * 取消预约。待确认与已确认都能取消，服务已开始则不允许
 */
export const cancelMyAppointment = (id) => {
    return request.put(`/appointment/mine/cancel/${id}`);
};

/**
 * 催单，仅待确认的预约需要
 */
export const remindMyAppointment = (id, remark) => {
    return request.put(`/appointment/mine/remind/${id}`, null, {
        params: { remark },
    });
};

// ---- 机构端 ----

/**
 * 分页查询自己机构的预约
 */
export const pageQueryProviderAppointment = (query) => {
    return request.post("/appointment/provider/pageQuery", query);
};

/**
 * 接单：待确认 → 已确认
 */
export const confirmAppointment = (id) => {
    return request.put(`/appointment/provider/confirm/${id}`);
};

/**
 * 拒单：待确认 → 已拒绝，名额会释放，必须写理由
 */
export const rejectAppointment = (id, rejectReason) => {
    return request.post("/appointment/provider/reject", { id, rejectReason });
};

/**
 * 核销：已确认 → 已完成，之后用户才能评价
 */
export const finishAppointment = (id) => {
    return request.put(`/appointment/provider/finish/${id}`);
};

/**
 * 标记失约：已确认且时间已过 → 已失约，名额不释放
 */
export const noShowAppointment = (id) => {
    return request.put(`/appointment/provider/noShow/${id}`);
};

// ---- 管理端 ----

/**
 * 分页查询全部预约
 */
export const pageQueryAllAppointment = (query) => {
    return request.post("/appointment/admin/pageQuery", query);
};

// ---- 三端共用 ----

/**
 * 预约详情。买家看自己的，机构看自己机构的，管理员不限
 */
export const getAppointmentById = (id) => {
    return request.get(`/appointment/getById/${id}`);
};

/**
 * 预约状态字典。与后端 Appointment 的常量保持一致
 */
export const APPOINTMENT_STATUS = {
    0: { text: "待确认", color: "orange" },
    1: { text: "已确认", color: "blue" },
    2: { text: "已完成", color: "green" },
    3: { text: "已取消", color: "default" },
    4: { text: "已拒绝", color: "red" },
    5: { text: "已失约", color: "purple" },
};
