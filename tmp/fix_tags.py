#!/usr/bin/env python3
import re

# 读取types.go文件
with open('internal/types/types.go', 'r') as f:
    content = f.read()

# 替换标签：将validate规则从json标签中分离出来
# 匹配模式：`json:"...validate:..."` -> `json:"..." validate:"..."`
pattern = r'(\`json:"[^"]*"),validate:([^"]*"`)'
replacement = r'\1" validate:\2`'
content = re.sub(pattern, replacement, content)

# 替换oneof标签中的竖线为空格
# 只在validate标签内部替换
pattern = r'(validate="[^"]*)\|([^"]*")'
replacement = r'\1 \2'
content = re.sub(pattern, replacement, content)

# 写回文件
with open('internal/types/types.go', 'w') as f:
    f.write(content)

print("Tags fixed successfully!")