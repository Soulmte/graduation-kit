package com.example.service;

import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

/**
 * 文件服务接口
 */
public interface FileService {
    /**
     * 上传单个文件
     */
    String upload(MultipartFile file);
    
    /**
     * 批量上传文件
     */
    Map<String, Object> uploadBatch(MultipartFile[] files);
    
    /**
     * 删除文件
     */
    void delete(String fileName);
}
