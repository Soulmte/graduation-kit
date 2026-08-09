using DotnetMysqlBackend.Filters;
using DotnetMysqlBackend.Middleware;
using DotnetMysqlBackend.Models;
using DotnetMysqlBackend.Services;
using DotnetMysqlBackend.Utils;
using Microsoft.AspNetCore.Mvc;

namespace DotnetMysqlBackend.Controllers
{
    /// <summary>
    /// 公告控制器
    /// </summary>
    [ApiController]
    [Route("api/notice")]
    [Auth]
    public class NoticeController(NoticeService noticeService) : ControllerBase
    {
        /// <summary>
        /// 创建公告
        /// </summary>
        [HttpPost("add")]
        [Admin]
        [Log("创建公告")]
        public async Task<IActionResult> Add([FromBody] Notice notice)
        {
            await noticeService.Add(notice);
            return Ok(Result.Success("创建成功"));
        }

        /// <summary>
        /// 分页查询公告列表（带条件）
        /// </summary>
        [HttpPost("pageQuery")]
        [Log("分页查询公告")]
        public async Task<IActionResult> PageQuery([FromBody] PageQuery query)
        {
            return Ok(Result.Success(await noticeService.PageQuery(query)));
        }

        /// <summary>
        /// 查询所有公告列表
        /// </summary>
        [HttpGet("listAll")]
        [Log("查询公告列表")]
        public async Task<IActionResult> ListAll()
        {
            return Ok(Result.Success(await noticeService.ListAll()));
        }

        /// <summary>
        /// 根据ID查询公告
        /// </summary>
        [HttpGet("getById/{id}")]
        [Log("查询公告详情")]
        public async Task<IActionResult> GetById(long id)
        {
            return Ok(Result.Success(await noticeService.GetById(id)));
        }

        /// <summary>
        /// 更新公告
        /// </summary>
        [HttpPut("update")]
        [Admin]
        [Log("更新公告")]
        public async Task<IActionResult> Update([FromBody] Notice notice)
        {
            await noticeService.Update(notice);
            return Ok(Result.Success("更新成功"));
        }

        /// <summary>
        /// 删除公告
        /// </summary>
        [HttpDelete("deleteById/{id}")]
        [Admin]
        [Log("删除公告")]
        public async Task<IActionResult> DeleteById(long id)
        {
            await noticeService.DeleteById(id);
            return Ok(Result.Success("删除成功"));
        }

        /// <summary>
        /// 批量删除公告
        /// </summary>
        [HttpDelete("deleteBatch")]
        [Admin]
        [Log("批量删除公告")]
        public async Task<IActionResult> DeleteBatch([FromBody] List<long> ids)
        {
            await noticeService.DeleteBatch(ids);
            return Ok(Result.Success("批量删除成功"));
        }
    }
}
