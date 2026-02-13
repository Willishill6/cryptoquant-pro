"""
Build inline.html - 将所有资源内联到单个HTML文件
正确处理manus-runtime注入的代码和script标签闭合问题
"""
import os
import re

base_dir = os.path.dirname(os.path.abspath(__file__))
dist_dir = os.path.join(base_dir, 'dist', 'public')
assets_dir = os.path.join(dist_dir, 'assets')

# 读取index.html
with open(os.path.join(dist_dir, 'index.html'), 'r') as f:
    html = f.read()

# 移除manus-runtime注入的script (从<script id="manus-runtime">到对应的</script>)
# 这段代码是运行时注入的，不应该包含在inline.html中
manus_start = html.find('<script id="manus-runtime">')
if manus_start != -1:
    manus_end = html.find('</script>', manus_start) + len('</script>')
    html = html[:manus_start] + html[manus_end:]
    print(f"  Removed manus-runtime script ({manus_end - manus_start} bytes)")

# 还有一个额外的<script>标签可能是manus注入的
# 查找body中除了module script之外的其他script标签
# 移除 <script>...</script> 紧跟在manus-runtime后面的
extra_script = re.search(r'<script>\s*\(function\(\)\{[^<]*\}\)\(\);\s*</script>', html)
if extra_script:
    html = html[:extra_script.start()] + html[extra_script.end():]
    print(f"  Removed extra injected script")

# 读取CSS文件
css_files = [f for f in os.listdir(assets_dir) if f.endswith('.css')]
css_content = ''
for css_file in css_files:
    with open(os.path.join(assets_dir, css_file), 'r') as f:
        css_content += f.read()

# 读取主JS文件
main_js_file = next(f for f in os.listdir(assets_dir) if f.startswith('index-') and f.endswith('.js'))
with open(os.path.join(assets_dir, main_js_file), 'r') as f:
    main_js = f.read()

# 关键修复：将JS中的 </script> 和 </style> 转义
# 使用标准的HTML内联JS转义方式：将 </ 替换为 <\/
main_js = main_js.replace('</script', '<\\/script')
main_js = main_js.replace('</style', '<\\/style')
css_content = css_content.replace('</style', '<\\/style')

# 替换CSS link为内联style
css_link_match = re.search(r'<link rel="stylesheet" crossorigin href="/assets/[^"]+\.css">', html)
if css_link_match:
    html = html[:css_link_match.start()] + f'<style>{css_content}</style>' + html[css_link_match.end():]
    print(f"  Replaced CSS link with inline style")

# 替换主JS script为内联script
js_script_match = re.search(r'<script type="module" crossorigin src="/assets/[^"]+\.js"></script>', html)
if js_script_match:
    html = html[:js_script_match.start()] + f'<script type="module">{main_js}</script>' + html[js_script_match.end():]
    print(f"  Replaced JS script with inline module")

# 移除analytics script
analytics_match = re.search(r'<script[^>]*src="%VITE_ANALYTICS_ENDPOINT%/umami"[^>]*></script>', html)
if analytics_match:
    html = html[:analytics_match.start()] + html[analytics_match.end():]
    print(f"  Removed analytics script")

# 写入inline.html
output_path = os.path.join(dist_dir, 'inline.html')
with open(output_path, 'w') as f:
    f.write(html)

file_size = os.path.getsize(output_path)
print(f"✅ inline.html generated: {file_size / 1024 / 1024:.2f} MB")
print(f"   Location: {output_path}")
print(f"   CSS files inlined: {len(css_files)}")
print(f"   Main JS inlined: {main_js_file}")
print(f"   Script tag escaping applied")
