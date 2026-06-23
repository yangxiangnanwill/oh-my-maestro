import os, sys

out_dir = "D:/WorkSpace/VsCode/oh-my-maestro/.workflow/scratch/20260620-brainstorm-maestro-ide/system-architect"
src_path = os.path.join(out_dir, "_analysis_content.txt")
dst_path = os.path.join(out_dir, "analysis.md")

with open(src_path, "r", encoding="utf-8") as f:
    content = f.read()

with open(dst_path, "w", encoding="utf-8") as f:
    f.write(content)

print(f"analysis.md written: {os.path.getsize(dst_path)} bytes")
