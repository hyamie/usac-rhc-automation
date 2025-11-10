import json

# Read the workflow
with open('workflows/workflow_final_update.json', 'r', encoding='utf-8') as f:
    workflow = json.load(f)

# Keep only essential fields for update
clean_workflow = {
    'name': workflow['name'],
    'nodes': workflow['nodes'],
    'connections': workflow['connections'],
    'settings': workflow.get('settings', {}),
    'staticData': workflow.get('staticData')
}

# Save the clean workflow
with open('workflows/workflow_clean_update.json', 'w', encoding='utf-8') as f:
    json.dump(clean_workflow, f, indent=2)

print('[OK] Clean workflow saved')
print(f'[OK] Nodes count: {len(clean_workflow["nodes"])}')
