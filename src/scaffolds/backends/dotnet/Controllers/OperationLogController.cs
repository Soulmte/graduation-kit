using DotnetMysqlBackend.Filters;
using DotnetMysqlBackend.Middleware;
using DotnetMysqlBackend.Models;
using DotnetMysqlBackend.Services;
using DotnetMysqlBackend.Utils;
using Microsoft.AspNetCore.Mvc;

namespace DotnetMysqlBackend.Controllers
{
    /// <summary>
    /// 操作日志控制器
    /// </summary>
    [ApiController]
    [Route("api/log")]
    [Auth]
    [Admin]
    public class OperationLogController(OperationLogService logService) : ControllerBase
    {
        /// <summary>
        /// 分页查询操作日志（带条件）
        /// </summary>
        [HttpPost("pageQuery")]
        [Log("分页查询操作日志")]
        public async Task<IActionResult> PageQuery([FromBody] PageQuery query)
        {
            return Ok(Result.Success(await logService.PageQuery(query)));
        }

        /// <summary>
        /// 查询所有操作日志
        /// </summary>
        [HttpGet("listAll")]
        public async Task<IActionResult> ListAll()
        {
            return Ok(Result.Success(await logService.ListAll()));
        }

        /// <summary>
        /// 根据ID查询操作日志
        /// </summary>
        [HttpGet("getById/{id}")]
        public async Task<IActionResult> GetById(long id)
        {
            return Ok(Result.Success(await logService.GetById(id)));
        }

        /// <summary>
        /// 删除操作日志
        /// </summary>
        [HttpDelete("deleteById/{id}")]
        [Log("删除操作日志")]
        public async Task<IActionResult> DeleteById(long id)
        {
            await logService.DeleteById(id);
            return Ok(Result.Success("删除成功"));
        }

        /// <summary>
        /// 批量删除操作日志
        /// </summary>
        [HttpDelete("deleteBatch")]
        [Log("批量删除操作日志")]
        public async Task<IActionResult> DeleteBatch([FromBody] List<long> ids)
        {
            await logService.DeleteBatch(ids);
            return Ok(Result.Success("批量删除成功"));
        }
    }
}
