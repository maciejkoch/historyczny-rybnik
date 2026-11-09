# Delegowanie badań do Luny — 9 listopada 2026

Zadanie: [research na Lunie](https://github.com/users/maciejkoch/projects/1?pane=issue&itemId=298200946), `PVTI_lAHOAP5vmM4BqYSzzhHGL3I`. Branch `codex/research-luna`, baza `main` `201722790ed2b453f3ea3cd8e0b2b817fb8bb6cb`.

## Mechanizm

[Skill](../../.agents/skills/rybnik-research-places/SKILL.md) poleca delegowanie do jednego `gpt-6-luna`, reasoning `high`, `fork_turns="none"`. Model główny synchronizuje warsztat i sprawdza dowody przed potwierdzaniem wzmianek/praw oraz zapisaniem relacji historycznych obrazów. Podczas pracy badacza nie zapisuje równolegle do warsztatu. Nie dodano globalnej konfiguracji, API ani zależności.

Podstawa możliwości delegacji: [oficjalna dokumentacja OpenAI](https://learn.chatgpt.com/docs/agent-configuration/subagents), odczyt 9 listopada 2026. Model można wskazać przy delegacji; instrukcje projektowe/skilla mogą zlecać uruchomienie subagenta.

## Sprawdzenia

- `quick_validate.py .agents/skills/rybnik-research-places`: PASS.
- `git diff --check`: PASS. Lokalne odnośniki w zmienionych dokumentach: PASS.
- Natywne `spawn_agent` przyjęło żądanie `gpt-6-luna`, `high`, bez historii; subagent `luna_research_check` dostarczył wynik. Odpowiedź narzędzia nie zawiera odrębnego pola z identyfikatorem modelu obsługującego odpowiedź; nie wykonywano niezależnej inspekcji backendu.
- Odbiór behawioralny tylko do odczytu na trzech fikcyjnych wejściach: ogłoszenie fryzjera z 12 maja 1938, s. 4; artykuł z 2008 wspominający fryzjera o tym samym nazwisku w 1935, s. 2; zdjęcie budynku z 2023. Nie użyto prawdziwych danych ani źródeł.
- Badacz zachował robocze statusy i brak `verifiedAt`, rozdzielił datę publikacji 2008 od faktu 1935, nie scalił niepewnej tożsamości. Skan dawnej gazety rozpoznał jako `historical`; zdjęcie 2023 jako `outside-period` dla dawnych wzmianek. Prawa pozostały `unknown`, bez zgody publikacji.
- Pierwsze przejście ujawniło błędne rozwiązanie ścieżki resources względem warsztatu oraz zbyt ogólną propozycję datowania skanu. Doprecyzowano root ścieżek i obowiązek podawania dat obu końców proponowanej relacji. Ponowne przejście PASS: odczyt właściwego `resources/README.md`; dokładny dzień skanu tylko przy potwierdzeniu numeru i strony, sam rok nie dopuszcza relacji ze wzmianką dzienną. Zapis relacji pozostaje po stronie modelu głównego po weryfikacji.
- Kontrola instrukcji dla niedostępnej Luny/delegacji: jawne zgłoszenie ograniczenia i brak cichego przejścia na droższy model. To kontrola treści, bez wymuszania awarii narzędzia lub zmiany konfiguracji klienta.

## Granice odbioru i dokumentacja

Nie wykonywano rzeczywistej kampanii badawczej, walidacji prywatnego zbioru, pull/push, importu, publikacji ani deploymentu. Test nie mierzy pełnego kosztu ani jakości badań w sieci. Nie deklarujemy konkretnej oszczędności ani zaliczenia pełnej ścieżki synchronizacji; jej narzędzia pozostały bez zmian. Środowisko nieprzypisane — zmiana instrukcji bez podglądu aplikacji.

Zaktualizowano TECHNICAL, README `.agents`, README warsztatu oraz ten zapis. README główny, CONTRIBUTING, SECURITY i spis `scripts/README.md` sprawdzono: zmiana ich treści nie była potrzebna. Nie zmieniono poleceń npm ani skryptów, kontraktów, modelu danych i zasad bezpieczeństwa. Build aplikacji i testy backendu nie są wymagane dla tej zmiany instrukcji.
