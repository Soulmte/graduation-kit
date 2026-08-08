using DotnetMysqlBackend.Config;
using DotnetMysqlBackend.Exceptions;
using DotnetMysqlBackend.Models;
using DotnetMysqlBackend.Utils;
using MySql.Data.MySqlClient;
using System.Data.Common;

namespace DotnetMysqlBackend.Services
{
    /// <summary>
    /// 公告服务
    /// </summary>
    public class NoticeService
    {
        private readonly DatabaseConfig _db;

        public NoticeService(DatabaseConfig db)
        {
            _db = db;
        }

        /// <summary>
        /// 创建公告
        /// </summary>
        public async Task Add(Notice notice)
        {
            await using var conn = _db.GetConnection();
            await conn.OpenAsync();
            await ExecuteAsync(conn,
                "INSERT INTO notice (title, content, create_time) VALUES (@title, @content, NOW())",
                new MySqlParameter("@title", notice.Title),
                new MySqlParameter("@content", notice.Content ?? ""));
        }

        /// <summary>
        /// 分页查询公告列表（带条件）
        /// </summary>
        public async Task<object> PageQuery(PageQuery query)
        {
            await using var conn = _db.GetConnection();
            await conn.OpenAsync();

            var (where, ps) = BuildWhere(query);
            var total = Convert.ToInt64(await ScalarAsync(conn, $"SELECT COUNT(*) FROM notice {where}", ps.ToArray()));

            var orderBy = query.OrderBy?.ToLower() switch
            {
                "title" => "title",
                "updatetime" => "update_time",
                _ => "create_time"
            };
            var dir = query.Order == "asc" ? "ASC" : "DESC";
            var offset = (query.PageNum - 1) * query.PageSize;

            var dataSql = $"SELECT * FROM notice {where} ORDER BY {orderBy} {dir} LIMIT @limit OFFSET @offset";
            ps.Add(new MySqlParameter("@limit", query.PageSize));
            ps.Add(new MySqlParameter("@offset", offset));

            var records = await QueryListAsync(conn, dataSql, ps.ToArray(), MapNotice);
            return new { records, total, pageNum = query.PageNum, pageSize = query.PageSize };
        }

        /// <summary>
        /// 查询所有公告列表
        /// </summary>
        public async Task<List<Notice>> ListAll()
        {
            await using var conn = _db.GetConnection();
            await conn.OpenAsync();
            return await QueryListAsync(conn, "SELECT * FROM notice WHERE deleted = 0 ORDER BY create_time DESC", [], MapNotice);
        }

        /// <summary>
        /// 根据ID查询公告
        /// </summary>
        public async Task<Notice> GetById(long id)
        {
            await using var conn = _db.GetConnection();
            await conn.OpenAsync();
            var notice = await QueryOneAsync(conn, "SELECT * FROM notice WHERE id = @id AND deleted = 0",
                [new MySqlParameter("@id", id)], MapNotice);
            if (notice == null) throw new BusinessException(ResultCode.NotFound);
            return notice;
        }

        /// <summary>
        /// 更新公告
        /// </summary>
        public async Task Update(Notice notice)
        {
            await using var conn = _db.GetConnection();
            await conn.OpenAsync();
            await ExecuteAsync(conn,
                "UPDATE notice SET title = @title, content = @content, update_time = NOW() WHERE id = @id AND deleted = 0",
                new MySqlParameter("@title", notice.Title),
                new MySqlParameter("@content", notice.Content ?? ""),
                new MySqlParameter("@id", notice.Id));
        }

        /// <summary>
        /// 删除公告（逻辑删除）
        /// </summary>
        public async Task DeleteById(long id)
        {
            await using var conn = _db.GetConnection();
            await conn.OpenAsync();
            await ExecuteAsync(conn, "UPDATE notice SET deleted = 1 WHERE id = @id", new MySqlParameter("@id", id));
        }

        /// <summary>
        /// 批量删除公告（逻辑删除）
        /// </summary>
        public async Task DeleteBatch(List<long> ids)
        {
            await using var conn = _db.GetConnection();
            await conn.OpenAsync();
            var (placeholders, ps) = BuildInParams(ids);
            await ExecuteAsync(conn, $"UPDATE notice SET deleted = 1 WHERE id IN ({placeholders})", ps);
        }

        #region 私有方法

        private static (string where, List<MySqlParameter> ps) BuildWhere(PageQuery query)
        {
            var where = "WHERE deleted = 0";
            var ps = new List<MySqlParameter>();
            if (!string.IsNullOrWhiteSpace(query.Title)) { where += " AND title LIKE @title"; ps.Add(new("@title", $"%{query.Title}%")); }
            if (!string.IsNullOrWhiteSpace(query.Content)) { where += " AND content LIKE @content"; ps.Add(new("@content", $"%{query.Content}%")); }
            return (where, ps);
        }

        private static Notice MapNotice(DbDataReader r) => new()
        {
            Id = r.GetInt64(r.GetOrdinal("id")),
            Title = r.GetString(r.GetOrdinal("title")),
            Content = r.IsDBNull(r.GetOrdinal("content")) ? null : r.GetString(r.GetOrdinal("content")),
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
            await using var r = await cmd.ExecuteReaderAsync();
            while (await r.ReadAsync()) list.Add(map(r));
            return list;
        }

        private static async Task<T?> QueryOneAsync<T>(MySqlConnection conn, string sql, MySqlParameter[] ps, Func<DbDataReader, T> map) where T : class
        {
            await using var cmd = new MySqlCommand(sql, conn);
            cmd.Parameters.AddRange(ps);
            await using var r = await cmd.ExecuteReaderAsync();
            return await r.ReadAsync() ? map(r) : null;
        }

        private static (string placeholders, MySqlParameter[] ps) BuildInParams(List<long> ids)
        {
            var ph = string.Join(",", ids.Select((_, i) => $"@id{i}"));
            return (ph, ids.Select((id, i) => new MySqlParameter($"@id{i}", id)).ToArray());
        }

        #endregion
    }
}
