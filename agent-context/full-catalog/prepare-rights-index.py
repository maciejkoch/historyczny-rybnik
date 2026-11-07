import json,hashlib,shutil,subprocess
from pathlib import Path
r=Path('/private/tmp/rybnik-full-catalog');legacy=Path('/Users/maciejkoch/PRV projects/Project-1/public');src=json.loads((r/'agent-context/full-catalog/mvp0-catalog.json').read_text());catalog=json.loads((r/'data/places.catalog.json').read_text());byid={p['id']:p for p in catalog};idx=r/'data/source-rights.json'
index=json.loads(idx.read_text()) if idx.exists() else {'schemaVersion':1,'policy':'Public domain only; verify exact edition, never infer rights from repository or title.','sources':{}}
if not idx.exists(): raise RuntimeError('Create and review data/source-rights.json before processing any material')
assets=r/'.local/reviewed-assets';assets.mkdir(parents=True,exist_ok=True)
changed=set();counts={'approvedReferences':0,'deferredReferences':0}
for item in src['items']:
 pid='place_sw_antoni' if item.get('key')=='antoni' else 'place_mvp0_'+str(item['id'])
 p=byid[pid]
 for s in item['sources']:
  if not s.get('image'):continue
  edition=s['url'].split('/Content/')[1].split('/')[0];key='sbc-edition-'+edition
  entry=index['sources'][key] # consult index BEFORE touching material
  material={'placeId':pid,'referenceId':s['id'],'legacyPath':s['image']}
  if material not in entry['materials']: entry['materials'].append(material)
  if entry['status']!='public-domain':counts['deferredReferences']+=1;continue
  ref=next(q for q in p['references'] if q['id']==s['id']);original=legacy/s['image'];digest=hashlib.sha256(original.read_bytes()).hexdigest();name=f'{pid}-{s["id"]}-{digest[:12]}.jpg';thumb=name[:-4]+'-thumb.jpg';shutil.copyfile(original,assets/name)
  subprocess.run(['sips','-Z','480',str(original),'--out',str(assets/thumb)],check=True,stdout=subprocess.DEVNULL)
  image={'storagePath':f'public/places/{pid}/{s["id"]}/{name}','thumbnailPath':f'public/places/{pid}/{s["id"]}/{thumb}','alt':item.get('imageAlt') or f'Wycinek źródła: {s["title"]}, strona PDF {s.get("pdfPage")}', 'credit':'Śląska Biblioteka Cyfrowa; '+s['title'],'rights':'Domena publiczna — oznaczenie Prawa w karcie konkretnego wydania ŚBC.','sha256':digest,'thumbnailSha256':hashlib.sha256((assets/thumb).read_bytes()).hexdigest(),'provenance':{'title':s['title'],'sourcePageUrl':entry['evidenceUrl'],'originalCollectionUrl':entry['evidenceUrl'],'originalImageUrl':'https://maciejkoch-project-1.web.app/'+s['image'],'originalSha256':digest,'author':'Autor wycinka nieustalony; wydanie oznaczone przez ŚBC jako domena publiczna','dateNote':f'Wydanie {s.get("date") or s.get("year")}; wycinek przygotowany w MVP.0.','license':'Domena publiczna (public domain)','licenseUrl':'https://creativecommons.org/publicdomain/mark/1.0/','copyrighted':False,'rightsCheckedAt':'2026-11-07','transformations':'Przeniesienie istniejącego wycinka JPEG z MVP.0 bez retuszu; miniatura do 480 px. originalSha256 opisuje wejściowy wycinek MVP.0, nie pełny PDF.'}}
  ref['images']=[image];changed.add(pid);counts['approvedReferences']+=1
idx.write_text(json.dumps(index,ensure_ascii=False,indent=2)+'\n');(r/'data/places.catalog.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n');(r/'.local/places.assets-approved.json').write_text(json.dumps([p for p in catalog if p['id'] in changed],ensure_ascii=False));print(counts,'places:',len(changed))
