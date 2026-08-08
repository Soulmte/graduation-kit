using DotnetMysqlBackend.Config;
using DotnetMysqlBackend.Exceptions;
using DotnetMysqlBackend.Models;
using DotnetMysqlBackend.Utils;
using MySql.Data.MySqlClient;
using System.Data.Common;

namespace DotnetMysqlBackend.Services
{
    /// <summary>
    /// 操作日志服务
    /// </summary>
    public class OperationLogService
    {
        private readonly DatabaseConfig _db;

        public OperationLogService(DatabaseConfig db)
        {
            _db = db;
        }

        /// <summary>
        /// 分页查询操作日志（带条件）
        /// </summary>
        public async Task<object> PageQuery(PageQuery query)
        {
            await using var conn = _db.GetConnection();
            await conn.OpenAsync();

            var (where, ps) = BuildWhere(query);
            var total = Convert.ToInt64(await ScalarAsync(conn, $"SELECT COUNT(*) FROM operation_log {where}", ps.ToArray()));

            var orderBy = query.OrderBy?.ToLower() switch
            {
                "username" => "username",
                "operation" => "operation",
                "executetime" => "execute_time",
                _ => "create_time"
            };
            var dir = query.Order == "asc" ? "ASC" : "DESC";
            var offset = (query.PageNum - 1) * query.PageSize;

            var dataSql = $"SELECT * FROM operation_log {where} ORDER BY {orderBy} {dir} LIMIT @limit OFFSET @offset";
            ps.Add(new MySqlParameter("@limit", query.PageSize));
            ps.Add(new MySqlParameter("@offset", offset));

            var records = await QueryListAsync(conn, dataSql, ps.ToArray(), MapLog);
            return new { records, total, pageNum = query.PageNum, pageSize = query.PageSize };
        }

        /// <summary>
        /// 查询所有操作日志
        /// </summary>
        public async Task<List<OperationLog>> ListAll()
        {
            await using var conn = _db.GetConnection();
            await conn.OpenAsync();
            return await QueryListAsync(conn, "SELECT * FROM operation_log ORDER BY create_time DESC", [], MapLog);
        }

        /// <summary>
        /// 根据ID查询操作日志
        /// </summary>
        public async Task<OperationLog> GetById(long id)
        {
            await using var conn = _db.GetConnection();
            await conn.OpenAsync();
            var log = await QueryOneAsync(conn, "SELECT * FROM operation_log WHERE id = @id",
                [new MySqlParameter("@id", id)], MapLog);
            if (log == null) throw new BusinessException(ResultCode.NotFound);
            return log;
        }

        /// <summary>
        /// 删除操作日志
        /// </summary>
        public async Task DeleteById(long id)
        {
            await using var conn = _db.GetConnection();
            await conn.OpenAsync();
            await ExecuteAsync(conn, "DELETE FROM operation_log WHERE id = @id", new MySqlParameter("@id", id));
        }

        /// <summary>
        /// 批量删除操作日志
        /// </summary>
        public async Task DeleteBatch(List<long> ids)
        {
            await using var conn = _db.GetConnection();
            await conn.OpenAsync();
            var (placeholders, ps) = BuildInParams(ids);
            await ExecuteAsync(conn, $"DELETE FROM operation_log WHERE id IN ({placeholders})", ps);
        }

        #region 私有方法

        private static (string where, List<MySqlParameter> ps) BuildWhere(PageQuery query)
        {
            var where = "WHERE 1=1";
            var ps = new List<MySqlParameter>();
            if (!string.IsNullOrWhiteSpace(query.Username)) { where += " AND username LIKE @username"; ps.Add(new("@username", $"%{query.Username}%")); }
            if (!string.IsNullOrWhiteSpace(query.Operation)) { where += " AND operation LIKE @operation"; ps.Add(new("@operation", $"%{query.Operation}%")); }
            if (!string.IsNullOrWhiteSpace(query.StartTime)) { where += " AND create_time >= @startTime"; ps.Add(new("@startTime", query.StartTime)); }
            if (!string.IsNullOrWhiteSpace(query.EndTime)) { where += " AND create_time <= @endTime"; ps.Add(new("@endTime", query.EndTime)); }
            return (where, ps);
        }

        private static OperationLog MapLog(DbDataReader r) => new()
        {
            Id = r.GetInt64(r.GetOrdinal("id")),
            Username = r.IsDBNull(r.GetOrdinal("username")) ? null : r.GetString(r.GetOrdinal("username")),
            Operation = r.IsDBNull(r.GetOrdinal("operation")) ? null : r.GetString(r.GetOrdinal("operation")),
            Method = r.IsDBNull(r.GetOrdinal("method")) ? null : r.GetString(r.GetOrdinal("method")),
            Params = r.IsDBNull(r.GetOrdinal("params")) ? null : r.GetString(r.GetOrdinal("params")),
            ExecuteTime = r.IsDBNull(r.GetOrdinal("execute_time")) ? null : r.GetInt64(r.GetOrdinal("execute_time")),
            Ip = r.IsDBNull(r.GetOrdinal("ip")) ? null : r.GetString(r.GetOrdinal("ip")),
            CreateTime = r.IsDBNull(r.GetOrdinal("create_time")) ? null : r.GetDateTime(r.GetOrdinal("create_time"))
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
