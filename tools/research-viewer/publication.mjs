// An approval applies only to the explicitly registered public variants, never a whole PDF/page.
export function publicationNotice(material, file = null) {
  const r = material.rights;
  const approved =
    r.publicationApproved &&
    (!file ||
      material.publicationImages.some((i) => [i.sha256, i.thumbnailSha256].includes(file.sha256)));
  if (approved)
    return {
      approved: true,
      tone: 'success',
      text: file
        ? 'Ten wariant obrazu jest zatwierdzony do publikacji na podstawie oświadczenia przekazującego.'
        : 'Zatwierdzono wybrane warianty obrazów na podstawie oświadczenia przekazującego.',
    };
  if (r.status === 'unknown')
    return {
      approved: false,
      tone: 'warning',
      text: 'Prawa nieustalone — tylko do użytku wewnętrznego. Nie publikować.',
    };
  if (r.status === 'restricted')
    return {
      approved: false,
      tone: 'error',
      text: 'Prawa ograniczone — publikacja niedopuszczona. Kopia do użytku wewnętrznego.',
    };
  if (!approved)
    return {
      approved: false,
      tone: 'warning',
      text: `${r.status === 'public-domain' ? 'Domena publiczna' : 'Licencja'} — ${file ? 'ten obraz nie jest zatwierdzony do publikacji' : 'publikacja niezatwierdzona'}. Kopia do użytku wewnętrznego.`,
    };
}
