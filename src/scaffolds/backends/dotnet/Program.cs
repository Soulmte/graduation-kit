using System.Text.Json;
using DotnetMysqlBackend.Config;
using DotnetMysqlBackend.Filters;
using DotnetMysqlBackend.Middleware;
using DotnetMysqlBackend.Services;
using DotnetMysqlBackend.Utils;
using Microsoft.Extensions.FileProviders;

var builder = WebApplication.CreateBuilder(args);

// 加载.env文件
DotEnv.Load();
builder.Configuration.AddEnvironmentVariables();

// 注册配置
builder.Services.AddSingleton<DatabaseConfig>();
builder.Services.AddSingleton<JwtConfig>();
builder.Services.AddSingleton<UploadConfig>();

// 注册Service
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<NoticeService>();
builder.Services.AddScoped<OperationLogService>();
builder.Services.AddScoped<FileService>();

// 注册全局过滤器
builder.Services.AddScoped<OperationLogFilter>();

// 配置Controller + JSON序列化
builder.Services.AddControllers(options =>
{
    options.Filters.Add<GlobalExceptionFilter>();
    options.Filters.AddService<OperationLogFilter>();
})
.AddJsonOptions(options =>
{
    options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    options.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
    // 时间格式化: yyyy-MM-dd HH:mm:ss (与其他后端统一)
    options.JsonSerializerOptions.Converters.Add(new DotnetMysqlBackend.Utils.DateTimeConverter());
});

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Swagger（开发环境）
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// 中间件
app.UseCors();
app.UseMiddleware<RequestLoggerMiddleware>();

// 确保上传目录存在
var uploadConfig = app.Services.GetRequiredService<UploadConfig>();
var uploadDir = Path.GetFullPath(uploadConfig.UploadDir);
if (!Directory.Exists(uploadDir))
    Directory.CreateDirectory(uploadDir);

// 静态文件服务（上传文件访问）
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadDir),
    RequestPath = "/uploads"
});

app.MapControllers();

// 健康检查（含数据库连通性）
app.MapGet("/api/health", (DatabaseConfig db) =>
{
    string dbStatus;
    try
    {
        using var conn = db.GetConnection();
        conn.Open();
        using var cmd = new MySql.Data.MySqlClient.MySqlCommand("SELECT 1", conn);
        cmd.ExecuteScalar();
        dbStatus = "ok";
    }
    catch (Exception ex)
    {
        dbStatus = $"error: {ex.Message}";
    }
    return Results.Ok(new
    {
        code = 200,
        message = "操作成功",
        data = new { service = ".NET", database = dbStatus }
    });
});

// 启动
var port = Environment.GetEnvironmentVariable("PORT") ?? "8085";
var dbName = Environment.GetEnvironmentVariable("DB_NAME");

Console.WriteLine("========================================");
Console.WriteLine("  C# .NET + MySQL Backend Server");
Console.WriteLine("========================================");
Console.WriteLine($"  Server:   http://localhost:{port}");
Console.WriteLine($"  Database: {dbName}");
Console.WriteLine($"  Swagger:  http://localhost:{port}/swagger");
Console.WriteLine("========================================");

app.Run($"http://0.0.0.0:{port}");
