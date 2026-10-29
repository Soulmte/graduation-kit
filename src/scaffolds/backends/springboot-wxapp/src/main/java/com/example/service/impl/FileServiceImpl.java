package com.example.service.impl;

import com.example.common.exception.BusinessException;
import com.example.service.FileService;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/**
 * 文件服务实现类
 */
@Slf4j
@Service
public class FileServiceImpl implements FileService {

    @Value("${file.upload.path}")
    private String uploadPath;

    @Value("${file.upload.url-prefix}")
    private String urlPrefix;

    /**
     * 允许上传的文件类型
     */
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
        "jpg",
        "jpeg",
        "png",
        "gif",
        "bmp",
        "webp", // 图片
        "pdf",
        "doc",
        "docx",
        "xls",
        "xlsx",
        "ppt",
        "pptx", // 文档
        "txt",
        "zip",
        "rar",
        "7z" // 其他
    );

    /**
     * 最大文件大小，与application.yml的multipart配置保持一致
     */
    @Value("${file.upload.max-size}")
    private long maxFileSize;

    /**
     * 获取绝对上传路径
     * 相对路径一律基于项目根目录（user.dir）解析
     */
    private String getAbsoluteUploadPath() {
        Path path = Paths.get(uploadPath);
        if (path.isAbsolute()) {
            return uploadPath;
        }
        // 相对路径：基于项目根目录解析后规范化
        return Paths.get(System.getProperty("user.dir"), uploadPath)
            .normalize()
            .toAbsolutePath()
            .toString();
    }

    @Override
    public String upload(MultipartFile file) {
        // 校验文件
        validateFile(file);

        // 生成文件名
        String originalFilename = file.getOriginalFilename();
        String extension = getFileExtension(originalFilename);
        String newFileName = generateFileName(extension);

        // 按日期创建子目录
        String dateDir = LocalDate.now().format(
            DateTimeFormatter.ofPattern("yyyy-MM-dd")
        );
        String relativePath = dateDir + File.separator + newFileName;

        // 获取绝对路径并创建目录
        String absoluteUploadPath = getAbsoluteUploadPath();
        Path uploadDir = Paths.get(absoluteUploadPath, dateDir);
        try {
            Files.createDirectories(uploadDir);
            log.info("上传目录: {}", uploadDir.toAbsolutePath());
        } catch (IOException e) {
            log.error("创建目录失败: {}", uploadDir, e);
            throw new BusinessException("创建目录失败");
        }

        // 保存文件
        Path filePath = uploadDir.resolve(newFileName);
        try {
            file.transferTo(filePath.toFile());
            log.info("文件上传成功: {}", filePath.toAbsolutePath());
        } catch (IOException e) {
            log.error("文件保存失败: {}", filePath, e);
            throw new BusinessException("文件保存失败");
        }

        // 返回访问URL
        return urlPrefix + "/" + relativePath.replace("\\", "/");
    }

    @Override
    public Map<String, Object> uploadBatch(MultipartFile[] files) {
        if (files == null || files.length == 0) {
            throw new BusinessException("请选择要上传的文件");
        }

        List<Map<String, String>> successList = new ArrayList<>();
        List<String> failList = new ArrayList<>();

        for (MultipartFile file : files) {
            try {
                String url = upload(file);
                Map<String, String> fileInfo = new HashMap<>();
                fileInfo.put("fileName", file.getOriginalFilename());
                fileInfo.put("url", url);
                successList.add(fileInfo);
            } catch (Exception e) {
                failList.add(
                    file.getOriginalFilename() + ": " + e.getMessage()
                );
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("success", successList);
        result.put("fail", failList);
        result.put("total", files.length);
        result.put("successCount", successList.size());
        result.put("failCount", failList.size());

        return result;
    }

    @Override
    public void delete(String fileName) {
        if (fileName == null || fileName.isEmpty()) {
            throw new BusinessException("文件名不能为空");
        }

        // 从 URL 中提取相对路径
        String relativePath = fileName.replace(urlPrefix + "/", "");
        String absoluteUploadPath = getAbsoluteUploadPath();
        Path uploadRoot = Paths.get(absoluteUploadPath).normalize().toAbsolutePath();
        Path filePath = uploadRoot.resolve(relativePath).normalize().toAbsolutePath();

        // 防路径穿越：解析后的路径必须仍在上传目录内
        if (!filePath.startsWith(uploadRoot)) {
            throw new BusinessException("非法的文件路径");
        }

        try {
            Files.deleteIfExists(filePath);
            log.info("文件删除成功: {}", filePath);
        } catch (IOException e) {
            log.error("文件删除失败: {}", filePath, e);
            throw new BusinessException("文件删除失败");
        }
    }

    /**
     * 校验文件
     */
    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("文件不能为空");
        }

        // 校验文件大小
        if (file.getSize() > maxFileSize) {
            throw new BusinessException("文件大小不能超过" + (maxFileSize / 1024 / 1024) + "MB");
        }

        // 校验文件类型
        String extension = getFileExtension(file.getOriginalFilename());
        if (!ALLOWED_EXTENSIONS.contains(extension.toLowerCase())) {
            throw new BusinessException("不支持的文件类型: " + extension);
        }
    }

    /**
     * 获取文件扩展名
     */
    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            throw new BusinessException("文件名无效");
        }
        return filename.substring(filename.lastIndexOf(".") + 1);
    }

    /**
     * 生成唯一文件名
     */
    private String generateFileName(String extension) {
        return UUID.randomUUID().toString().replace("-", "") + "." + extension;
    }
}
