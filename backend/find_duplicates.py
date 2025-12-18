import ast
import os
import hashlib

def get_function_source(node):
    """Reconstructs the source code of a function node, normalizing it."""
    # This is a simplified normalization. For exact matches, source code comparison is usually enough.
    # We can use ast.unparse if available (Python 3.9+) or just rely on the structure.
    # Since we want "exactly equal", we can try to compare the AST dump or the source segment if we had it.
    # But ast nodes don't have source attached easily without reading the file.
    # So we will store the file content and slice it.
    return ast.dump(node, include_attributes=False)

def find_duplicates(root_dir):
    functions = {}
    
    for dirpath, dirnames, filenames in os.walk(root_dir):
        if 'migrations' in dirpath:
            continue
            
        for filename in filenames:
            if not filename.endswith('.py'):
                continue
                
            filepath = os.path.join(dirpath, filename)
            
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                tree = ast.parse(content, filename=filepath)
                
                for node in ast.walk(tree):
                    if isinstance(node, ast.FunctionDef):
                        # Strict match (Name + Body)
                        strict_hash = hashlib.md5(ast.dump(node).encode('utf-8')).hexdigest()
                        
                        # Body match (Just logic)
                        # We dump the body list by wrapping it in a Module or just dumping items.
                        # ast.dump expects a node.
                        body_dump = "".join(ast.dump(n) for n in node.body)
                        body_hash = hashlib.md5(body_dump.encode('utf-8')).hexdigest()
                        
                        if strict_hash in functions:
                            functions[strict_hash]['locs'].append((filepath, node.name, node.lineno))
                        else:
                            functions[strict_hash] = {'type': 'strict', 'locs': [(filepath, node.name, node.lineno)], 'body_hash': body_hash}
                            
            except Exception as e:
                print(f"Error processing {filepath}: {e}")

    print(f"Scanned {len(functions)} unique strict function signatures.")
    
    # Check for strict duplicates
    found_any = False
    for func_hash, data in functions.items():
        if len(data['locs']) > 1:
            found_any = True
            print(f"STRICT Duplicate found (Same Name & Body): {data['locs'][0][1]}")
            for path, name, lineno in data['locs']:
                print(f"  - {path}:{lineno}")
            print("-" * 40)
            
    # Check for body duplicates (ignoring name)
    body_map = {}
    for func_hash, data in functions.items():
        b_hash = data['body_hash']
        if b_hash not in body_map:
            body_map[b_hash] = []
        body_map[b_hash].extend(data['locs'])
        
    for b_hash, locs in body_map.items():
        if len(locs) > 1:
            # Filter out if they are already reported as strict duplicates
            # If all have same name, they were likely reported above.
            names = set(l[1] for l in locs)
            if len(names) == 1 and found_any: 
                 # This is a heuristic, if we found strict duplicates they are included here.
                 # But let's print them as "Body Duplicate" if they have different names or if we want to be thorough.
                 pass
            
            # If names are different, it's definitely interesting.
            if len(names) > 1:
                found_any = True
                print(f"BODY Duplicate found (Identical Logic, Different Names): {', '.join(names)}")
                for path, name, lineno in locs:
                    print(f"  - {path}:{lineno} ({name})")
                print("-" * 40)
            elif not any(l for l in locs if l in [x for sub in functions.values() for x in sub['locs'] if len(sub['locs']) > 1]):
                 # If they have same name but weren't caught by strict hash (unlikely if body is same and name is same)
                 # Wait, strict hash includes name. So if body is same and name is same, strict hash is same.
                 # So this block is for "Same Body, Same Name" which is already covered by strict.
                 # So we only care about len(names) > 1.
                 pass

if __name__ == "__main__":
    find_duplicates('/home/isco/Escritorio/workspace/proyecto-integrado/backend')
