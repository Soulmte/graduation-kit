import request from "./request";

/**
 * 分页查询模型配置
 */
export const pageQueryModelConfig = (query) => {
    return request.post("/modelConfig/pageQuery", query);
};

/**
 * 启用中的配置列表，编排页的模型下拉框用
 */
export const listEnabledModelConfig = () => {
    return request.get("/modelConfig/listEnabled");
};

/**
 * 新增模型配置
 */
export const addModelConfig = (data) => {
    return request.post("/modelConfig/add", data);
};

/**
 * 更新模型配置。apiKey 留空表示沿用原值
 */
export const updateModelConfig = (data) => {
    return request.put("/modelConfig/update", data);
};

/**
 * 设为默认模型
 */
export const setDefaultModelConfig = (id) => {
    return request.put(`/modelConfig/setDefault/${id}`);
};

/**
 * 删除模型配置
 */
export const deleteModelConfig = (id) => {
    return request.delete(`/modelConfig/deleteById/${id}`);
};
