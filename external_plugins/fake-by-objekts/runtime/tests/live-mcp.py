"""Staging-only protocol integration. Private credentials never enter the report."""
import base64, hashlib, json, os, pathlib, urllib.request

origin=os.environ.get('FAKE_TEST_ORIGIN','https://fake-by-objekts-recovery.peach420fuzz.workers.dev')
if origin!='https://fake-by-objekts-recovery.peach420fuzz.workers.dev':
    raise RuntimeError('This integration test only writes to the isolated recovery environment')
counter=0
def rpc(method,params=None):
    global counter
    counter+=1
    payload={'jsonrpc':'2.0','id':counter,'method':method}
    if params is not None: payload['params']=params
    req=urllib.request.Request(origin+'/mcp',data=json.dumps(payload).encode(),headers={'Content-Type':'application/json','Accept':'application/json, text/event-stream','User-Agent':'FAKE-recovery-integration'})
    result=json.load(urllib.request.urlopen(req,timeout=60))
    if 'error' in result: raise RuntimeError(str(result['error']))
    return result['result']
def call(name,arguments): return rpc('tools/call',{'name':name,'arguments':arguments})
def okay(result):
    if result.get('isError'):raise RuntimeError('Staging tool rejected integration operation: '+str(result.get('content'))[:500])
    return result

geometry_path=pathlib.Path(os.environ['FAKE_GEOMETRY_FILE'])
geometry=geometry_path.read_bytes()
tools=rpc('tools/list')['tools']
assert len(tools)==8
created=okay(call('open_character_studio',{'title':'RECOVERY INTEGRATION — synthetic test only','description':'Fictional adult with wide jaw and long nose','morphologySeed':{'semanticGoals':{'jaw.weight':0.8},'morphs':{'nose.length':0.75},'apparentAgeYears':46}}))
private=created['_meta']['fakePrivate']; project=private['project']
credentials={'projectId':project['projectId'],'projectKey':private['projectKey']}
assert project['state']['identity']['semanticMorphs']['nose.length']==0.75
assert project['state']['identity']['semanticMorphs']['jaw.width']>0.8
request=okay(call('prepare_portrait_request',{**credentials,'expectedVersion':1,'geometryDataUrl':'data:image/webp;base64,'+base64.b64encode(geometry).decode(),'prompt':'Generate one actual photorealistic portrait of the fictional adult in the attached authored geometry. Preserve the broad nose and jaw.'}))['structuredContent']
ticket={'requestId':request['requestId'],'requestToken':request['requestToken']}
read=okay(call('read_portrait_request',ticket))
images=[item for item in read['content'] if item['type']=='image']
assert len(images)==1 and base64.b64decode(images[0]['data'])==geometry
assert read['structuredContent']['imageGenerationPerformed'] is False
wrong=call('read_portrait_request',{**ticket,'requestToken':'0'*64})
assert wrong.get('isError') is True
okay(call('update_character_state',{**credentials,'expectedVersion':1,'patch':{'capture':{'expression':'subtle closed-mouth smile'}},'source':'RECOVERY_INTEGRATION'}))
assert call('read_portrait_request',ticket).get('isError') is True
report={'passed':True,'origin':origin,'toolCount':len(tools),'structuredBriefSeed':'PASS','realGeometryBytes':'PASS','geometrySha256':hashlib.sha256(geometry).hexdigest(),'wrongTokenRejected':'PASS','staleStateRejected':'PASS','imageGenerationPerformed':False}
path=pathlib.Path(os.environ.get('FAKE_INTEGRATION_REPORT','live-mcp-report.json'));path.write_text(json.dumps(report,indent=2));print(json.dumps(report))
private_path=os.environ.get('FAKE_PRIVATE_TEST_CONTEXT')
if private_path:pathlib.Path(private_path).write_text(json.dumps(credentials))
