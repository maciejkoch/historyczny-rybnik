// Explicit interpretation of the migrated source genres; a newspaper date alone is not evidence.
export function legacyTemporalContext(ref) {
  if (
    ref.title === 'Sztandar Polski i Gazeta Rybnicka' &&
    ref.excerpt.includes('Dział: Ogłoszenie prasowe.')
  )
    return 'contemporary';
  if (
    ref.excerptType === 'transcription' &&
    [
      'Przewodnik gospodarczy województw kieleckiego, krakowskiego i śląskiego',
      'Księga adresowa polskiego rzemiosła i drobnego przemysłu na Śląsku',
    ].includes(ref.title)
  )
    return 'contemporary';
  return 'unknown';
}
const inside = (d) =>
  d && Number(d.from.slice(0, 4)) >= 1918 && Number((d.to || d.from).slice(0, 4)) <= 1939;
export function legacyPeriod(references) {
  const proofs = [];
  for (const ref of references) {
    const contemporary = legacyTemporalContext(ref) === 'contemporary';
    if (!inside(ref.historicalDate) && !(contemporary && inside(ref.publicationDate))) continue;
    const uncertain =
      /przypuszcz|nie rozstrzyg|nie rozstrzyga|wymaga sprawdzenia|nie ustalono, czy chodzi|nie pozwala rozstrzygnąć/i.test(
        ref.note || '',
      );
    proofs.push({
      referenceId: ref.id,
      uncertain,
      note: inside(ref.historicalDate)
        ? 'Wzmianka datuje opisywany stan na okres międzywojenny.'
        : `Bieżące ogłoszenie lub wpis adresowy opublikowany ${ref.publicationDate.from}; świadczy o działalności w czasie wydania. Daty publikacji i treści pozostają rozdzielone.`,
    });
  }
  const certain = proofs.filter((p) => !p.uncertain);
  return {
    status: certain.length ? 'confirmed' : proofs.length ? 'probable' : 'unverified',
    explanation: certain.length
      ? 'Istnienie w okresie międzywojennym potwierdza datowana wzmianka lub współczesne ogłoszenie/wpis adresowy.'
      : proofs.length
        ? 'Datowany współczesny wpis dotyczy prawdopodobnie tego miejsca, ale identyfikacja podmiotu wymaga potwierdzenia.'
        : 'Kwalifikacja dotychczasowych wzmianek do okresu międzywojennego wymaga oceny; nie oznacza to braku dowodów w materiałach.',
    proofs: certain.length ? certain : proofs,
  };
}
