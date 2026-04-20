with open('src/pages/CreatePool.tsx', 'r', encoding='utf-8') as f:
    content = f.read()
    
open_braces = 0
close_braces = 0
for char in content:
    if char == '{':
        open_braces += 1
    elif char == '}':
        close_braces += 1
        
print(f"Open: {open_braces}, Close: {close_braces}")
