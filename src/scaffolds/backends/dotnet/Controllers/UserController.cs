using DotnetMysqlBackend.Filters;
using DotnetMysqlBackend.Middleware;
using DotnetMysqlBackend.Models;
using DotnetMysqlBackend.Services;
using DotnetMysqlBackend.Utils;
using Microsoft.AspNetCore.Mvc;

namespace DotnetMysqlBackend.Controllers
{
    /// <summary>
    /// 用户控制器
    /// </summary>
    [ApiController]
    [Route("api/user")]
    public class UserController(UserService userService) : ControllerBase
    {
        /// <summary>
        /// 用户注册
        /// </summary>
        [HttpPost("register")]
        [Log("用户注册")]
        public async Task<IActionResult> Register([FromBody] User user)
        {
            await userService.Register(user);
            return Ok(Result.Success("注册成功"));
        }

        /// <summary>
        /// 用户登录
        /// </summary>
        [HttpPost("login")]
        [Log("用户登录", SaveParams = false)]
        public async Task<IActionResult> Login([FromBody] User user)
        {
            var data = await userService.Login(user.Username, user.Password!);
            return Ok(Result.Success("登录成功", data));
        }

        /// <summary>
        /// 分页查询用户列表（带条件）
        /// </summary>
        [HttpPost("pageQuery")]
        [Auth]
        [Log("分页查询用户")]
        public async Task<IActionResult> PageQuery([FromBody] PageQuery query)
        {
            return Ok(Result.Success(await userService.PageQuery(query)));
        }

        /// <summary>
        /// 查询所有用户列表
        /// </summary>
        [HttpGet("listAll")]
        [Auth]
        [Log("查询用户列表")]
        public async Task<IActionResult> ListAll()
        {
            return Ok(Result.Success(await userService.ListAll()));
        }

        /// <summary>
        /// 根据ID查询用户
        /// </summary>
        [HttpGet("getById/{id}")]
        [Auth]
        [Log("查询用户详情")]
        public async Task<IActionResult> GetById(long id)
        {
            return Ok(Result.Success(await userService.GetById(id)));
        }

        /// <summary>
        /// 更新用户信息
        /// </summary>
        [HttpPut("update")]
        [Auth]
        [Log("更新用户信息")]
        public async Task<IActionResult> Update([FromBody] User user)
        {
            await userService.Update(user);
            return Ok(Result.Success("更新成功"));
        }

        /// <summary>
        /// 删除用户
        /// </summary>
        [HttpDelete("deleteById/{id}")]
        [Auth]
        [Log("删除用户")]
        public async Task<IActionResult> DeleteById(long id)
        {
            await userService.DeleteById(id);
            return Ok(Result.Success("删除成功"));
        }

        /// <summary>
        /// 批量删除用户
        /// </summary>
        [HttpDelete("deleteBatch")]
        [Auth]
        [Log("批量删除用户")]
        public async Task<IActionResult> DeleteBatch([FromBody] List<long> ids)
        {
            await userService.DeleteBatch(ids);
            return Ok(Result.Success("批量删除成功"));
        }
    }
}
