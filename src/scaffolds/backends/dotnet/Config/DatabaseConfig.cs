using MySql.Data.MySqlClient;

namespace DotnetMysqlBackend.Config
{
    /// <summary>
    /// 数据库配置
    /// </summary>
    public class DatabaseConfig
    {
        private readonly string _connectionString;

        public DatabaseConfig(IConfiguration configuration)
        {
            var host = configuration["DB_HOST"];
            var port = configuration["DB_PORT"];
            var user = configuration["DB_USER"];
            var password = configuration["DB_PASSWORD"];
            var database = configuration["DB_NAME"];

            _connectionString = $"Server={host};Port={port};Database={database};User={user};Password={password};CharSet=utf8mb4;";
        }

        public MySqlConnection GetConnection()
        {
            return new MySqlConnection(_connectionString);
        }
    }
}
