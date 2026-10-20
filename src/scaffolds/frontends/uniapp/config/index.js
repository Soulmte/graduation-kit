/**
 * 应用配置
 * 根据运行环境切换后端地址
 * 切换后端只需改端口（以 backend/ 实际端口为准）
 */

// 真机调试地址：小程序真机连不上 localhost，改成电脑的局域网 IP
// Windows 用 ipconfig 查 IPv4，形如 192.168.1.100
const LAN_HOST = "localhost";

const DEV_BASE_URL = `http://${LAN_HOST}:8080/api`;

// 生产环境后端地址（按实际部署修改）
const PROD_BASE_URL = "https://your-domain.com/api";

// H5 直接访问后端（后端已开 CORS）。
// 不要改用 /api 代理：项目根的 api/ 源码目录会与 /api 前缀冲突，
// 浏览器把 @/api/xxx 请求成 /api/xxx.js 时会被代理拦截。
let BASE_URL = DEV_BASE_URL;

// 上传文件访问地址（对应后端的 uploads 目录）
let UPLOAD_BASE = `http://${LAN_HOST}:8080/uploads`;

// 生产环境
if (process.env.NODE_ENV === "production") {
		BASE_URL = PROD_BASE_URL;
		UPLOAD_BASE = PROD_BASE_URL.replace("/api", "/uploads");
}

export default {
	BASE_URL,
	UPLOAD_BASE,
};
