import { createHash } from 'node:crypto';
import { materialMatchesMention } from './chronology.mjs';
const uid = (prefix, value) =>
  prefix + createHash('sha256').update(value).digest('hex').slice(0, 32);
// Explicit v2 -> v3 conversion. No runtime fallback: ambiguous facts and visual dating stay unverified.
export function restructureWorkspace(old) {
  const documents = structuredClone(old.materials);
  const byId = new Map(documents.map((d) => [d.id, d]));
  const visuals = new Map();
  for (const d of documents)
    for (const f of d.files.filter(
      (f) => /\.(png|jpe?g|webp)$/i.test(f.path) && f.role !== 'thumbnail',
    )) {
      const key = f.sha256;
      const contemporary = d.temporalContext === 'contemporary';
      const photo = d.kind === 'photo' || d.kind === 'map';
      let dating = photo ? d.historicalDate : contemporary ? d.publicationDate : null;
      // Exact, documented postcard identity from the existing collection record.
      if (
        d.id === 'mat_b783242f538d6997f75a318a' ||
        (photo && d.url?.includes('Antoniuskirche._1919_'))
      )
        dating = { from: '1919', to: null, approximate: false };
      const classification =
        contemporary && dating
          ? 'historical'
          : photo
            ? dating
              ? Number(dating.from.slice(0, 4)) > 1939
                ? 'outside-period'
                : 'historical'
              : 'unidentified'
            : 'source-copy';
      const images = d.publicationImages.filter((i) => i.sha256 === key);
      const v = visuals.get(key) || {
        id: uid('vis_', key),
        updatedAt: d.updatedAt,
        title: d.title,
        kind: photo ? (d.kind === 'map' ? 'map' : 'photo') : 'scan',
        sourceDocumentIds: [],
        originalDate: dating || d.publicationDate,
        depictedDate: photo ? dating : null,
        datingNote: dating
          ? 'Datowanie z dokumentu źródłowego; data utworzenia pliku skanu nie zmienia daty oryginału.'
          : 'Brak zweryfikowanego datowania obrazu. Data artykułu nie datuje ilustracji.',
        classification,
        rights: {
          ...d.rights,
          publicationApproved:
            classification === 'historical' && images.length > 0 && d.rights.publicationApproved,
        },
        files: [],
        publicationImages: images,
      };
      if (classification === 'historical' && v.classification !== 'historical')
        Object.assign(v, {
          classification,
          originalDate: dating || d.publicationDate,
          depictedDate: photo ? dating : null,
          datingNote: 'Datowanie oryginału ustalone na podstawie wskazanego dokumentu.',
        });
      if (!v.sourceDocumentIds.includes(d.id)) v.sourceDocumentIds.push(d.id);
      for (const file of d.files.filter(
        (file) =>
          file.path === f.path || (file.role === 'thumbnail' && file.derivedFrom === f.path),
      ))
        if (!v.files.some((prior) => prior.path === file.path && prior.role === file.role))
          v.files.push(file);
      visuals.set(key, v);
    }
  const materials = [...visuals.values()],
    mentions = [];
  const out = {
    ...structuredClone(old),
    config: { ...old.config, schemaVersion: 3 },
    documents,
    materials,
    mentions,
  };
  const evidence = (e) => ({ documentId: e.materialId, locator: e.locator, note: e.note });
  for (const p of [...out.places, ...out['out-of-period']]) {
    const ids = [];
    for (const f of p.findings)
      for (const [index, e] of f.evidence.entries()) {
        const d = byId.get(e.materialId);
        const documentedDate =
          d.historicalDate || (d.temporalContext === 'contemporary' ? d.publicationDate : null);
        const verified = f.status === 'confirmed' && Boolean(documentedDate);
        const m = {
          id: uid('men_', p.id + '|' + f.id + '|' + index),
          updatedAt: p.updatedAt,
          placeId: p.id,
          text: f.text,
          documentedDate,
          verification: verified
            ? 'verified'
            : f.status === 'conflicting'
              ? 'conflicting'
              : 'draft',
          verificationNote: verified
            ? 'Zachowano wcześniejszą potwierdzoną ocenę źródła i konkretne datowanie.'
            : 'Przeniesiono wcześniejsze ustalenie bez nadawania mu nowego potwierdzenia. Wymaga oceny treści, datowania lub tożsamości.',
          verifiedAt: verified ? p.updatedAt : null,
          evidence: [evidence(e)],
          materialIds: [],
        };
        m.materialIds = materials
          .filter((v) => v.sourceDocumentIds.includes(d.id) && materialMatchesMention(v, m))
          .map((v) => v.id);
        mentions.push(m);
        ids.push(m.id);
      }
    p.mentionIds = ids;
    delete p.findings;
    delete p.materialIds;
    delete p.period.evidence;
    const periodProof = mentions.some(
      (m) =>
        m.placeId === p.id &&
        m.verification === 'verified' &&
        +m.documentedDate.from.slice(0, 4) <= 1939 &&
        +(m.documentedDate.to || m.documentedDate.from).slice(0, 4) >= 1918,
    );
    if (p.period.status === 'confirmed' && !periodProof) {
      p.period.status = 'probable';
      p.period.explanation =
        'Dotychczasowa kwalifikacja wymaga datowanej, zweryfikowanej wzmianki. ' +
        p.period.explanation;
    }
  }
  for (const c of out.candidates) c.evidence = c.evidence.map(evidence);
  for (const r of out.research)
    for (const c of r.changes) if (c.collection === 'materials') c.collection = 'documents';
  for (const d of out.documents) {
    d.parentDocumentId = d.parentMaterialId;
    delete d.parentMaterialId;
  }
  for (const d of [...out.documents, ...out.materials]) {
    if ('evidenceMaterialId' in d.rights) {
      d.rights.evidenceDocumentId = d.rights.evidenceMaterialId;
      delete d.rights.evidenceMaterialId;
    }
  }
  for (const p of [...out.places, ...out['out-of-period']])
    for (const r of p.relatedPlaces) {
      r.documentId = r.materialId;
      delete r.materialId;
    }
  return out;
}
