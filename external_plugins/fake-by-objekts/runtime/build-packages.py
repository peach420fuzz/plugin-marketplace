"""Build client packages from one canonical plugin source; exclude runtime internals."""
import hashlib,json,pathlib,zipfile
root=pathlib.Path(__file__).resolve().parent.parent
manifest=json.loads((root/'plugin.json').read_text());version=manifest['version']
output=root/'releases'/version;output.mkdir(parents=True,exist_ok=True)
skills={str(p.relative_to(root)):p.read_bytes() for p in (root/'skills').rglob('*') if p.is_file()}
assets={str(p.relative_to(root)):p.read_bytes() for p in (root/'assets').rglob('*') if p.is_file()}
canonical={name:(root/name).read_bytes() for name in ['plugin.json','mcp.json','.mcp.json','.codex-plugin/plugin.json','README.md']}
canonical.update(skills);canonical.update(assets)
encoded=lambda value:(json.dumps(value,ensure_ascii=False,indent=2)+'\n').encode()
# The existing OpenAI Portal package predates the portable multi-host package.
# Preserve its actual package name, MCP key and endpoint when revising it.
openai_manifest={**manifest,'name':'fake-by-objekts-chatgpt'}
openai_compat=json.loads(canonical['.codex-plugin/plugin.json'])
openai_compat['name']=openai_manifest['name']
openai_server={'type':'streamable-http','url':'https://fake.objekts.ai/mcp/chatgpt'}
openai_files={**canonical,'plugin.json':encoded(openai_manifest),'.codex-plugin/plugin.json':encoded(openai_compat),'mcp.json':encoded({'$schema':'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json','mcpServers':{'fake-by-objekts-chatgpt':openai_server}}),'.mcp.json':encoded({'mcpServers':{'fake-by-objekts-chatgpt':openai_server}})}
claude={'name':manifest['name'],'version':version,'description':manifest['description'],'author':manifest['author'],'homepage':manifest['homepage'],'keywords':manifest['keywords'],'mcpServers':'./.mcp.json'}
gemini={'name':manifest['name'],'version':version,'description':manifest['description'],'contextFileName':'GEMINI.md','mcpServers':{'fake-by-objekts':{'httpUrl':'https://fake.objekts.ai/mcp','timeout':30000}}}
context=('# FAKE by objekts\n\nRead skills/character-authoring/SKILL.md before character authoring. Use the live MCP at https://fake.objekts.ai/mcp. Image generation requires a tool supplied by the current host. Do not promise ChatGPT image generation in another client. Preserve Character State, locks and explicit Master selection.\n').encode()
claude_files={**skills,'.claude-plugin/plugin.json':encoded(claude),'.mcp.json':(root/'.mcp.json').read_bytes(),'README.md':(root/'README.md').read_bytes()}
gemini_files={**skills,'gemini-extension.json':encoded(gemini),'GEMINI.md':context}
public={**canonical,**claude_files,**gemini_files,'server.json':encoded({'$schema':'https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json','name':'ai.objekts.mcp/fake','title':'FAKE by objekts','description':manifest['description'],'version':version,'websiteUrl':'https://fake.objekts.ai/about','remotes':[{'type':'streamable-http','url':'https://fake.objekts.ai/mcp'}]})}
receipts=[]
for kind,files in [('openai',openai_files),('claude',claude_files),('gemini',gemini_files),('agent',canonical),('public',public)]:
    path=output/f'fake-by-objekts-{kind}-{version}.zip'
    with zipfile.ZipFile(path,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as archive:
        for name,data in sorted(files.items()):
            assert not name.startswith('/') and '..' not in pathlib.PurePosixPath(name).parts
            info=zipfile.ZipInfo(name,(2026,10,26,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o100644<<16;archive.writestr(info,data)
    with zipfile.ZipFile(path) as archive:
        assert archive.testzip() is None
        for name in archive.namelist():
            if name.endswith('.json'):json.loads(archive.read(name))
        assert archive.read('skills/character-authoring/SKILL.md')==skills['skills/character-authoring/SKILL.md']
        assert not any('/runtime/' in name for name in archive.namelist())
    receipts.append({'platform':kind,'file':path.name,'bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'status':'PACKAGE_VALIDATED__CLIENT_INSTALL_NOT_ASSERTED'})
(output/'manifest.json').write_bytes(encoded({'product':'FAKE by objekts','version':version,'mcp':'https://fake.objekts.ai/mcp','packages':receipts,'publicReview':'NOT_SUBMITTED','nativeGeneration':'Requires a compatible host; package creation does not prove client installation or generation.'}))
print(json.dumps(receipts,indent=2))
