import os, re
def process_file(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    content = re.sub(r'href="\.\./index\.html(#.*?)?"', r'href="../\1"', content)
    content = re.sub(r'href="index\.html(#.*?)?"', r'href="/\1"', content)
    content = re.sub(r'href="([^"]+)\.html(#.*?)?"', r'href="\1\2"', content)
    
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

for root, dirs, files in os.walk("."):
    for file in files:
        if file.endswith(".html"):
            process_file(os.path.join(root, file))
