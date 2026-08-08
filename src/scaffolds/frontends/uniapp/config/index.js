/**
 * 应用配置
 * 根据运行环境切换后端地址
 * 切换后端只需改端口：8080(Spring Boot) / 8081(Express) / 8082(Flask)
 */

// 真机调试地址：小程序真机连不上 localhost，改成电脑的局域网 IP
// Windows 用 ipconfig 查 IPv4，形如 192.168.1.100
const LAN_HOST = "localhost";

const DEV_BASE_URL = `http://${LAN_HOST}:8080/api`;

// 生产环境后端地址（按实际部署修改）
const PROD_BASE_URL = "https://your-domain.com/api";

// H5 开发走 devServer 代理（见 manifest.json 的 h5.devServer.proxy）
let BASE_URL = DEV_BASE_URL;

// 上传文件访问地址（对应后端的 uploads 目录）
let UPLOAD_BASE = `http://${LAN_HOST}:8080/uploads`;

// #ifdef H5
BASE_URL = "/api";
UPLOAD_BASE = "/uploads";
// #endif

// 生产环境
if (process.env.NODE_ENV === "production") {
	// #ifndef H5
	BASE_URL = PROD_BASE_URL;
	UPLOAD_BASE = PROD_BASE_URL.replace("/api", "/uploads");
	// #endif
}

export default {
	BASE_URL,
	UPLOAD_BASE,
};
