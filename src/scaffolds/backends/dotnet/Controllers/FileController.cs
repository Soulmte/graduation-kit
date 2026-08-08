using DotnetMysqlBackend.Filters;
using DotnetMysqlBackend.Middleware;
using DotnetMysqlBackend.Services;
using DotnetMysqlBackend.Utils;
using Microsoft.AspNetCore.Mvc;

namespace DotnetMysqlBackend.Controllers
{
    /// <summary>
    /// 文件上传控制器
    /// </summary>
    [ApiController]
    [Route("api/file")]
    [Auth]
    public class FileController(FileService fileService) : ControllerBase
    {
        /// <summary>
        /// 上传单个文件
        /// </summary>
        [HttpPost("upload")]
        [Log("上传文件", SaveParams = false)]
        public async Task<IActionResult> Upload(IFormFile file)
        {
            return Ok(Result.Success("上传成功", await fileService.Upload(file)));
        }

        /// <summary>
        /// 批量上传文件
        /// </summary>
        [HttpPost("uploadBatch")]
        [Log("批量上传文件", SaveParams = false)]
        public async Task<IActionResult> UploadBatch([FromForm] IFormFileCollection files)
        {
            return Ok(Result.Success("批量上传成功", await fileService.UploadBatch(files)));
        }

        /// <summary>
        /// 删除文件
        /// </summary>
        [HttpDelete("delete")]
        [Log("删除文件")]
        public IActionResult Delete([FromQuery] string fileName)
        {
            fileService.Delete(fileName);
            return Ok(Result.Success("删除成功"));
        }
    }
}
