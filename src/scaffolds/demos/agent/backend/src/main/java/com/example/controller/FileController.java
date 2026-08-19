package com.example.controller;

import com.example.common.annotation.Log;
import com.example.common.result.Result;
import com.example.service.FileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

/**
 * 文件上传控制器
 */
@RestController
@RequestMapping("/api/file")
public class FileController {
    
    @Autowired
    private FileService fileService;
    
    /**
     * 上传单个文件
     */
    @PostMapping("/upload")
    @Log(value = "上传文件", saveParams = false)
    public Result<Map<String, String>> upload(@RequestParam("file") MultipartFile file) {
        String url = fileService.upload(file);
        Map<String, String> data = new HashMap<>();
        data.put("url", url);
        data.put("fileName", file.getOriginalFilename());
        return Result.success("上传成功", data);
    }
    
    /**
     * 上传多个文件
     */
    @PostMapping("/uploadBatch")
    @Log(value = "批量上传文件", saveParams = false)
    public Result<Map<String, Object>> uploadBatch(@RequestParam("files") MultipartFile[] files) {
        Map<String, Object> data = fileService.uploadBatch(files);
        return Result.success("批量上传成功", data);
    }
    
    /**
     * 删除文件
     */
    @DeleteMapping("/delete")
    @Log("删除文件")
    public Result<Void> delete(@RequestParam("fileName") String fileName) {
        fileService.delete(fileName);
        return Result.success("删除成功");
    }
}
