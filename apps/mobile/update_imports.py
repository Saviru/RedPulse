import os

def replace_in_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content.replace('@/apps/mobile/app/lib/', '@/apps/mobile/src/lib/')
    new_content = new_content.replace('@/apps/mobile/app/store/', '@/apps/mobile/src/store/')
    
    if content != new_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

def walk_and_replace(root_dir):
    for root, dirs, files in os.walk(root_dir):
        for file in files:
            if file.endswith(('.ts', '.tsx')):
                replace_in_file(os.path.join(root, file))

if __name__ == "__main__":
    walk_and_replace('apps/mobile')
