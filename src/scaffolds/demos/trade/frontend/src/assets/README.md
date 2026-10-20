# 静态资源目录

按用途分二级目录，不要直接堆在 assets/ 下：

- `images/` 位图：png / jpg / webp
- `icons/` 图标与矢量图：svg
- `styles/` 全局样式（部分脚手架已有）

引用统一走 `@/assets/images/xxx.png`，不要写 `../../../assets` 这种相对路径。
