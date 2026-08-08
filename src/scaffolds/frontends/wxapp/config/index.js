/**
 * 应用配置
 * 切换后端只需改端口
 * 8080(Spring Boot) / 8081(Express) / 8082(Flask)
 */

// 真机调试地址：小程序真机连不上 localhost，改成电脑的局域网 IP
// Windows 用 ipconfig 查 IPv4，形如 192.168.1.100
const LAN_HOST = "localhost";

const BASE_URL = `http://${LAN_HOST}:8080/api`;

// 上传文件访问地址（对应后端的 uploads 目录）
const UPLOAD_BASE = `http://${LAN_HOST}:8080/uploads`;

module.exports = {
  BASE_URL,
  UPLOAD_BASE,
};
