import os

def resolve_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    except Exception as e:
        print(f"Skipping {filepath}: {e}")
        return

    new_lines = []
    state = 'NORMAL' # NORMAL, IN_HEAD, IN_TAIL
    modified = False

    for line in lines:
        if line.startswith('<<<<<<< HEAD'):
            state = 'IN_HEAD'
            modified = True
            continue
        elif line.startswith('======='):
            if state == 'IN_HEAD':
                state = 'IN_TAIL'
            else:
                new_lines.append(line)
            continue
        elif line.startswith('>>>>>>>'):
            if state == 'IN_TAIL':
                state = 'NORMAL'
            else:
                 new_lines.append(line)
            continue

        if state == 'NORMAL':
            new_lines.append(line)
        elif state == 'IN_HEAD':
            new_lines.append(line)
        elif state == 'IN_TAIL':
            pass # Skip

    if modified:
        print(f"Fixing conflicts in: {filepath}")
        with open(filepath, 'w', encoding='utf-8') as f:
            f.writelines(new_lines)

# Specific files
resolve_file(r'c:\project\cbc\package.json')
resolve_file(r'c:\project\cbc\scripts\verify-all.sh')

# API Directory
print("Scanning API directory...")
for root, dirs, files in os.walk(r'c:\project\cbc\api'):
    if 'node_modules' in dirs:
        dirs.remove('node_modules')
    for file in files:
        resolve_file(os.path.join(root, file))
print("Done.")
