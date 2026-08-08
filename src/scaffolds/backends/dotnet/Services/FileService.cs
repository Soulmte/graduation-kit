using DotnetMysqlBackend.Config;
using DotnetMysqlBackend.Exceptions;

namespace DotnetMysqlBackend.Services
{
    /// <summary>
    /// 文件服务
    /// </summary>
    public class FileService
    {
        private readonly UploadConfig _config;

        private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
        {
            ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp",
            ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
            ".txt", ".zip", ".rar", ".7z"
        };

        public FileService(UploadConfig config)
        {
            _config = config;
        }

        /// <summary>
        /// 上传单个文件
        /// </summary>
        public async Task<object> Upload(IFormFile file)
        {
            Validate(file);
            var url = await Save(file);
            return new { url, fileName = file.FileName };
        }

        /// <summary>
        /// 批量上传文件
        /// </summary>
        public async Task<object> UploadBatch(IFormFileCollection files)
        {
            if (files == null || files.Count == 0)
                throw new BusinessException("请选择要上传的文件");

            var success = new List<object>();
            var fail = new List<string>();

            foreach (var file in files)
            {
                try
                {
                    Validate(file);
                    var url = await Save(file);
                    success.Add(new { fileName = file.FileName, url });
                }
                catch (Exception ex)
                {
                    fail.Add($"{file.FileName}: {ex.Message}");
                }
            }

            return new { success, fail, total = files.Count, successCount = success.Count, failCount = fail.Count };
        }

        /// <summary>
        /// 删除文件
        /// </summary>
        public void Delete(string fileName)
        {
            if (string.IsNullOrWhiteSpace(fileName))
                throw new BusinessException("文件名不能为空");

            var relativePath = fileName.Replace("/uploads/", "").Replace("\\", "/");
            var basePath = Path.GetFullPath(_config.UploadDir);
            var absolutePath = Path.GetFullPath(Path.Combine(basePath, relativePath));

            if (!absolutePath.StartsWith(basePath + Path.DirectorySeparatorChar) && absolutePath != basePath)
                throw new BusinessException("非法的文件路径");

            if (File.Exists(absolutePath))
                File.Delete(absolutePath);
        }

        #region 私有方法

        /// <summary>
        /// 校验文件
        /// </summary>
        private void Validate(IFormFile file)
        {
            if (file == null || file.Length == 0)
                throw new BusinessException("文件不能为空");
            if (file.Length > _config.MaxFileSize)
                throw new BusinessException("文件大小不能超过10MB");
            var ext = Path.GetExtension(file.FileName);
            if (string.IsNullOrEmpty(ext) || !AllowedExtensions.Contains(ext))
                throw new BusinessException($"不支持的文件类型: {ext}");
        }

        /// <summary>
        /// 保存文件到磁盘
        /// </summary>
        private async Task<string> Save(IFormFile file)
        {
            var ext = Path.GetExtension(file.FileName);
            var newName = $"{Guid.NewGuid():N}{ext}";
            var dateDir = DateTime.Now.ToString("yyyy-MM-dd");
            var dir = Path.GetFullPath(Path.Combine(_config.UploadDir, dateDir));

            if (!Directory.Exists(dir))
                Directory.CreateDirectory(dir);

            var path = Path.Combine(dir, newName);
            await using var stream = new FileStream(path, FileMode.Create);
            await file.CopyToAsync(stream);

            return $"/uploads/{dateDir}/{newName}";
        }

        #endregion
    }
}
