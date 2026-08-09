using DotnetMysqlBackend.Config;
using DotnetMysqlBackend.Exceptions;
using DotnetMysqlBackend.Models;
using DotnetMysqlBackend.Utils;
using MySql.Data.MySqlClient;
using System.Data.Common;

namespace DotnetMysqlBackend.Services
{
    /// <summary>
    /// 用户服务
    /// </summary>
    public class UserService
    {
        private readonly DatabaseConfig _db;
        private readonly JwtConfig _jwt;

        public UserService(DatabaseConfig db, JwtConfig jwt)
        {
            _db = db;
            _jwt = jwt;
        }

        /// <summary>
        /// 用户注册
        /// </summary>
        public async Task Register(User user)
        {
            await using var conn = _db.GetConnection();
            await conn.OpenAsync();

            var count = await ScalarAsync(conn,
                "SELECT COUNT(*) FROM user WHERE username = @username AND deleted = 0",
                new MySqlParameter("@username", user.Username));

            if (Convert.ToInt64(count) > 0)
                throw new BusinessException(ResultCode.UsernameExist);

            await ExecuteAsync(conn,
                "INSERT INTO user (username, password, nickname, age, gender, phone, email, role, create_time) VALUES (@username, @password, @nickname, @age, @gender, @phone, @email, @role, NOW())",
                new MySqlParameter("@username", user.Username),
                new MySqlParameter("@password", user.Password!),
                new MySqlParameter("@nickname", user.Nickname ?? ""),
                new MySqlParameter("@age", (object?)user.Age ?? DBNull.Value),
                new MySqlParameter("@gender", user.Gender ?? ""),
                new MySqlParameter("@phone", user.Phone ?? ""),
                new MySqlParameter("@email", user.Email ?? ""),
                new MySqlParameter("@role", string.IsNullOrEmpty(user.Role) ? "user" : user.Role));
        }

        /// <summary>
        /// 用户登录
        /// </summary>
        public async Task<object> Login(string username, string password)
        {
            await using var conn = _db.GetConnection();
            await conn.OpenAsync();

            var sql = "SELECT * FROM user WHERE username = @username AND password = @password AND deleted = 0";
            await using var cmd = new MySqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@username", username);
            cmd.Parameters.AddWithValue("@password", password);

            await using var reader = await cmd.ExecuteReaderAsync();
            if (!await reader.ReadAsync())
                throw new BusinessException(ResultCode.LoginError);

            var user = MapUser(reader);
            user.Password = null;

            var token = _jwt.GenerateToken((int)user.Id, user.Username, user.Role);
            return new { token, userInfo = user };
        }

        /// <summary>
        /// 分页查询用户列表（带条件）
        /// </summary>
        public async Task<object> PageQuery(PageQuery query)
        {
            await using var conn = _db.GetConnection();
            await conn.OpenAsync();

            var (where, ps) = BuildUserWhere(query);
            var total = Convert.ToInt64(await ScalarAsync(conn, $"SELECT COUNT(*) FROM user {where}", ps.ToArray()));

            var orderBy = query.OrderBy?.ToLower() switch
            {
                "username" => "username",
                "email" => "email",
                "role" => "role",
                _ => "create_time"
            };
            var dir = query.Order == "asc" ? "ASC" : "DESC";
            var offset = (query.PageNum - 1) * query.PageSize;

            var dataSql = $"SELECT * FROM user {where} ORDER BY {orderBy} {dir} LIMIT @limit OFFSET @offset";
            ps.Add(new MySqlParameter("@limit", query.PageSize));
            ps.Add(new MySqlParameter("@offset", offset));

            var records = await QueryListAsync(conn, dataSql, ps.ToArray(), r => { var u = MapUser(r); u.Password = null; return u; });

            return new { records, total, pageNum = query.PageNum, pageSize = query.PageSize };
        }

        /// <summary>
        /// 查询所有用户列表
        /// </summary>
        public async Task<List<User>> ListAll()
        {
            await using var conn = _db.GetConnection();
            await conn.OpenAsync();
            return await QueryListAsync(conn, "SELECT * FROM user WHERE deleted = 0 ORDER BY create_time DESC", [],
                r => { var u = MapUser(r); u.Password = null; return u; });
        }

        /// <summary>
        /// 根据ID查询用户
        /// </summary>
        public async Task<User> GetById(long id)
        {
            await using var conn = _db.GetConnection();
            await conn.OpenAsync();

            var user = await QueryOneAsync(conn, "SELECT * FROM user WHERE id = @id AND deleted = 0",
                [new MySqlParameter("@id", id)], MapUser);

            if (user == null) throw new BusinessException(ResultCode.NotFound);
            user.Password = null;
            return user;
        }

        /// <summary>
        /// 更新用户信息（不含密码与角色，越权由登录态校验）
        /// </summary>
        public async Task Update(User user, long currentUserId, string currentRole)
        {
            if (currentRole != "admin" && user.Id != currentUserId)
                throw new BusinessException(ResultCode.Forbidden);

            await using var conn = _db.GetConnection();
            await conn.OpenAsync();

            var sql = "UPDATE user SET nickname = @nickname, age = @age, gender = @gender, phone = @phone, email = @email, avatar = @avatar, update_time = NOW() WHERE id = @id AND deleted = 0";
            await ExecuteAsync(conn, sql,
                new MySqlParameter("@nickname", user.Nickname ?? ""),
                new MySqlParameter("@age", (object?)user.Age ?? DBNull.Value),
                new MySqlParameter("@gender", user.Gender ?? ""),
                new MySqlParameter("@phone", user.Phone ?? ""),
                new MySqlParameter("@email", user.Email ?? ""),
                new MySqlParameter("@avatar", user.Avatar ?? ""),
                new MySqlParameter("@id", user.Id));
        }

        /// <summary>
        /// 修改密码（用户ID取自登录态）
        /// </summary>
        public async Task UpdatePassword(long userId, string oldPassword, string newPassword)
        {
            if (string.IsNullOrWhiteSpace(oldPassword) || string.IsNullOrWhiteSpace(newPassword))
                throw new BusinessException(ResultCode.ParamError);
            if (newPassword.Length < 6 || newPassword.Length > 20)
                throw new BusinessException(ResultCode.ParamError, "新密码长度需为6-20位");

            await using var conn = _db.GetConnection();
            await conn.OpenAsync();

            var current = await ScalarAsync(conn,
                "SELECT password FROM user WHERE id = @id AND deleted = 0",
                new MySqlParameter("@id", userId));

            if (current == null) throw new BusinessException(ResultCode.NotFound);
            if (Convert.ToString(current) != oldPassword)
                throw new BusinessException(ResultCode.OldPasswordError);

            await ExecuteAsync(conn,
                "UPDATE user SET password = @password, update_time = NOW() WHERE id = @id AND deleted = 0",
                new MySqlParameter("@password", newPassword),
                new MySqlParameter("@id", userId));
        }

        /// <summary>
        /// 删除用户（逻辑删除）
        /// </summary>
        public async Task DeleteById(long id)
        {
            await using var conn = _db.GetConnection();
            await conn.OpenAsync();
            await ExecuteAsync(conn, "UPDATE user SET deleted = 1 WHERE id = @id", new MySqlParameter("@id", id));
        }

        /// <summary>
        /// 批量删除用户（逻辑删除）
        /// </summary>
        public async Task DeleteBatch(List<long> ids)
        {
            await using var conn = _db.GetConnection();
            await conn.OpenAsync();
            var (placeholders, ps) = BuildInParams(ids);
            await ExecuteAsync(conn, $"UPDATE user SET deleted = 1 WHERE id IN ({placeholders})", ps);
        }

        #region 私有方法

        private static (string where, List<MySqlParameter> ps) BuildUserWhere(PageQuery query)
        {
            var where = "WHERE deleted = 0";
            var ps = new List<MySqlParameter>();
            if (!string.IsNullOrWhiteSpace(query.Username)) { where += " AND username LIKE @username"; ps.Add(new("@username", $"%{query.Username}%")); }
            if (!string.IsNullOrWhiteSpace(query.Email)) { where += " AND email LIKE @email"; ps.Add(new("@email", $"%{query.Email}%")); }
            if (!string.IsNullOrWhiteSpace(query.Role)) { where += " AND role = @role"; ps.Add(new("@role", query.Role)); }
            return (where, ps);
        }

        private static User MapUser(DbDataReader r) => new()
        {
            Id = r.GetInt64(r.GetOrdinal("id")),
            Username = r.GetString(r.GetOrdinal("username")),
            Password = r.IsDBNull(r.GetOrdinal("password")) ? null : r.GetString(r.GetOrdinal("password")),
            Nickname = r.IsDBNull(r.GetOrdinal("nickname")) ? null : r.GetString(r.GetOrdinal("nickname")),
            Age = r.IsDBNull(r.GetOrdinal("age")) ? null : r.GetInt32(r.GetOrdinal("age")),
            Gender = r.IsDBNull(r.GetOrdinal("gender")) ? null : r.GetString(r.GetOrdinal("gender")),
            Phone = r.IsDBNull(r.GetOrdinal("phone")) ? null : r.GetString(r.GetOrdinal("phone")),
            Email = r.IsDBNull(r.GetOrdinal("email")) ? null : r.GetString(r.GetOrdinal("email")),
            Role = r.IsDBNull(r.GetOrdinal("role")) ? "user" : r.GetString(r.GetOrdinal("role")),
            Avatar = r.IsDBNull(r.GetOrdinal("avatar")) ? null : r.GetString(r.GetOrdinal("avatar")),
            CreateTime = r.IsDBNull(r.GetOrdinal("create_time")) ? null : r.GetDateTime(r.GetOrdinal("create_time")),
            UpdateTime = r.IsDBNull(r.GetOrdinal("update_time")) ? null : r.GetDateTime(r.GetOrdinal("update_time"))
        };

        private static async Task<object?> ScalarAsync(MySqlConnection conn, string sql, params MySqlParameter[] ps)
        {
            await using var cmd = new MySqlCommand(sql, conn);
            cmd.Parameters.AddRange(ps);
            return await cmd.ExecuteScalarAsync();
        }

        private static async Task ExecuteAsync(MySqlConnection conn, string sql, params MySqlParameter[] ps)
        {
            await using var cmd = new MySqlCommand(sql, conn);
            cmd.Parameters.AddRange(ps);
            await cmd.ExecuteNonQueryAsync();
        }

        private static async Task<List<T>> QueryListAsync<T>(MySqlConnection conn, string sql, MySqlParameter[] ps, Func<DbDataReader, T> map)
        {
            await using var cmd = new MySqlCommand(sql, conn);
            cmd.Parameters.AddRange(ps);
            var list = new List<T>();
            await using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync()) list.Add(map(reader));
            return list;
        }

        private static async Task<T?> QueryOneAsync<T>(MySqlConnection conn, string sql, MySqlParameter[] ps, Func<DbDataReader, T> map) where T : class
        {
            await using var cmd = new MySqlCommand(sql, conn);
            cmd.Parameters.AddRange(ps);
            await using var reader = await cmd.ExecuteReaderAsync();
            return await reader.ReadAsync() ? map(reader) : null;
        }

        private static (string placeholders, MySqlParameter[] ps) BuildInParams(List<long> ids)
        {
            var placeholders = string.Join(",", ids.Select((_, i) => $"@id{i}"));
            var ps = ids.Select((id, i) => new MySqlParameter($"@id{i}", id)).ToArray();
            return (placeholders, ps);
        }

        #endregion
    }
}
