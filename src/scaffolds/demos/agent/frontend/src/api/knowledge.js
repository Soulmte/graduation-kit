import request from "./request";

/**
 * 分页查询知识条目
 */
export const pageQueryKnowledge = (query) => {
    return request.post("/knowledge/pageQuery", query);
};

/**
 * 根据ID查询知识条目
 */
export const getKnowledgeById = (id) => {
    return request.get(`/knowledge/getById/${id}`);
};

/**
 * 新增知识条目。agentId 留空表示全局共享
 */
export const addKnowledge = (data) => {
    return request.post("/knowledge/add", data);
};

/**
 * 更新知识条目
 */
export const updateKnowledge = (data) => {
    return request.put("/knowledge/update", data);
};

/**
 * 删除知识条目
 */
export const deleteKnowledge = (id) => {
    return request.delete(`/knowledge/deleteById/${id}`);
};

/**
 * 批量删除知识条目
 */
export const deleteKnowledgeBatch = (ids) => {
    return request.delete("/knowledge/deleteBatch", { data: ids });
};

/**
 * 试检索：看某个问题会召回哪几条。调编排时用来定位问题
 */
export const testRetrieveKnowledge = (agentId, question, topK) => {
    return request.get("/knowledge/testRetrieve", {
        params: { agentId, question, topK },
    });
};
