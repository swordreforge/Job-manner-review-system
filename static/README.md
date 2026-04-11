# 静态资源目录

此目录用于存放静态资源文件，如CSS、JavaScript、图片等。

## 使用说明

使用rust-embed将此目录中的文件嵌入到二进制文件中，实现单文件部署。

## 支持的文件类型

- CSS样式文件
- JavaScript脚本文件
- 图片文件
- 字体文件
- 其他静态资源

## 示例

```rust
use crate::static_assets::get_asset;

let (content, mime_type) = get_asset("css/style.css").unwrap();
```