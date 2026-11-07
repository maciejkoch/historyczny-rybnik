import json, unicodedata, re
from pathlib import Path
root=Path(__file__).resolve().parents[2]
source=json.loads((root/'agent-context/full-catalog/mvp0-catalog.json').read_text())
church=json.loads((root/'data/places.test-data.json').read_text())[0]
places=[]; report=[]
stamp='2026-11-03T00:00:00Z'
def date(v):return {'from':str(v),'to':None,'approximate':False} if v else None
def slug(v):return re.sub('[^a-z0-9]+','-',unicodedata.normalize('NFKD',v.lower().replace('ł','l')).encode('ascii','ignore').decode()).strip('-')
groups={'Szkoły i edukacja':'education','Świątynie i wyznania':'religion','Kultura i rozrywka':'culture','Urzędy i instytucje':'public','Przemysł':'industry','Handel':'commerce','Rzemiosło i usługi':'commerce','Jedzenie i gościnność':'commerce'}
for item in source['items']:
 if item.get('key')=='antoni':
  places.append(church);report.append({'oldId':item['id'],'id':church['id'],'decision':'existing church retained'});continue
 pid='place_mvp0_'+str(item['id']);refs=[]
 for j,s in enumerate(item['sources']):
  entry=s.get('entry'); excerpt=entry or f"Wzmianka o podmiocie {item['name']}. Dział: {s.get('section') or item['category']}."
  note='; '.join(filter(None,[s.get('note'),('Powiązanie z tym miejscem jest przypuszczalne.' if s.get('matchStatus')=='possible' else None),item.get('historicalPeriod',{}).get('label'),item.get('scopeNote')])) or None
  refs.append({'id':s.get('id') or 'ref_'+str(j+1),'title':s['title'],'url':s.get('url'),'page':str(s['pdfPage'])+' (PDF)' if s.get('pdfPage') else None,'publicationDate':date(s.get('date') or s.get('year')),'historicalDate':None,'accessedAt':stamp,'excerpt':excerpt,'excerptType':s.get('entryType') or ('transcription' if entry else 'summary'),'note':note,'images':[]})
 locs=item['locations'];known=[l for l in locs if l.get('coordinates') and l['status'] in ['verified','street','approximate']]
 loc={'coordinates':None,'precision':'unknown','explanation':'Lokalizacja historyczna nieustalona. Współczesnych adresów kandydackich nie traktujemy jako potwierdzenia posesji.'}
 if len(locs)==1 and len(known)==1:
  l=known[0];lng,lat=l['coordinates'];loc={'coordinates':{'lat':lat,'lng':lng},'precision':'building' if l['status']=='verified' else 'approximate','explanation':' '.join(filter(None,[l.get('note'),l.get('coordinateMethod'),l.get('coordinateSource'),'© OpenStreetMap contributors, ODbL 1.0']))}
 addresses=[]
 for l in locs:
  a=l.get('historicalAddress')
  if a and {'type':'historical','text':a} not in addresses:addresses.append({'type':'historical','text':a})
  if l['status']=='verified' and l.get('modernAddress'):addresses.append({'type':'current','text':l['modernAddress']})
 places.append({'id':pid,'name':item['name'],'slug':slug(item['name'])[:85]+'-'+str(item['id']),'previousSlugs':[],'description':f"{item['name']} — {item['category']}. "+(item.get('scopeNote') or 'Miejsce odnotowane w źródłach zestawionych poniżej.'),'category':groups.get(item['group'],'other'),'aliases':[],'addresses':addresses,'district':item.get('district'),'location':loc,'references':refs,'published':True,'locationVersion':0,'createdAt':stamp,'updatedAt':stamp})
 report.append({'oldId':item['id'],'id':pid,'location':loc['precision'],'imagesDeferred':sum(bool(s.get('image')) for s in item['sources']),'references':len(refs)})
(root/'data/places.catalog.json').write_text(json.dumps(places,ensure_ascii=False,indent=2)+'\n')
(root/'agent-context/full-catalog/mapping.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(len(places),'places prepared; image copies deferred pending rights verification')
