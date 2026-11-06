# Zgody i pamięć przeglądarki

Stan implementacji: 6 listopada 2026. Zadanie Projects:
https://github.com/users/maciejkoch/projects/1?pane=issue&itemId=PVTI_lAHOAP5vmM4BqYSzzhGetnA.

## Audyt obecnej aplikacji

- Brak Analytics, reklam, pikseli i zewnętrznych fontów. MapLibre oraz jego worker są bundlowane lokalnie.
- OpenFreeMap dostarcza podkład wektorowy i glify. Styl, fonty interfejsu i kafelki historyczne pochodzą z Hosting; obrazy kart z Firebase Storage. Dostawcy żądań otrzymują adres IP i nagłówki. Te połączenia dostarczają podstawową treść atlasu, bez opcjonalnego śledzenia dodanego przez aplikację.
- Układ paneli: `historyczny-rybnik.panel.v1`, `historyczny-rybnik.details-panel.v1`; warstwy: `historyczny-rybnik.layers.v1`. Są opcjonalne i podlegają kategorii zapamiętywania ustawień. Bez niej zmiany działają w pamięci sesji, bez odczytu/zapisu tych kluczy. Cofnięcie usuwa wszystkie trzy klucze, również pozostawione przez poprzednią wersję.
- Odczyt bieżących pozycji uruchamiał Firebase App Check z reCAPTCHA Enterprise automatycznie. Teraz importy i inicjalizacja są blokowane do zgody na kategorię „Bieżące pozycje — usługi Google”. Bez niej atlas korzysta ze snapshotu SSG. App Check nadal zabezpiecza API; nie zmieniamy reguł ani wymogów backendu.
- App Check korzysta z IndexedDB `firebase-app-check-database` i automatycznie odświeża tokeny. reCAPTCHA może zapisywać `_GRECAPTCHA`. Wycofanie zgody zapisuje odmowę i przeładowuje dokument, usuwając działające skrypty, iframe, żądania i timery SDK. Parametr `privacy=google-off` gwarantuje odmowę także przy problemie zapisu; jest konsumowany przed inicjalizacją usług i usuwany z URL z zachowaniem query i fragmentu. Własne kontrolki pozostają użyteczne. Uprzednio przesłanych danych i cookies w domenach Google nie można cofnąć ani usunąć skryptem tej aplikacji. Można usunąć dane witryn w przeglądarce.
- Frontend nie inicjalizuje Auth i nie ma interfejsu logowania; dodanie logowania, analityki lub nowego SDK wymaga ponownego audytu i podłączenia do odpowiednich zgód.

Decyzja w `historyczny-rybnik.consent.v1` zawiera wersję, dwie kategorie i czas zapisu; ważność 180 dni. Niepoprawne, przyszłe, wygasłe lub obcej wersji wpisy wyłączają opcjonalne funkcje. Brak dostępu do storage pozostawia wybór w bieżącej karcie i pokazuje komunikat. Zmiana zgody w innej karcie odświeża dokument. Nie odczytujemy API przeglądarki podczas SSG.

Nie dodajemy pustych kategorii analityki/marketingu. Informacja dla użytkownika jest prerenderowana pod `/prywatnosc`. Ustawienia są w stopce, pasku nawigacji telefonu i na stronie prywatności. Natywny dialog zapewnia modalność i Escape; otwarcie odtwarza zapisane wartości, a zamknięcie bez zapisu nie zmienia decyzji. Akceptacja i odrzucenie mają ten sam poziom wizualny.

## Sprawdzenia

- `npm run test:privacy`: rzeczywisty serwis z Angular Signals, podstawioną pamięcią i nawigacją; granice kategorii, odmowa, zapis, ponowna wizyta, cofnięcie, wygasłe/uszkodzone dane, zablokowane storage, SSR i zdarzenie zmiany decyzji w innej karcie.
- `npm run build`: pięć tras SSG, statyczna strona prywatności, brak osadzonych skryptów Google w HTML, dotychczasowe kontrole map, kart, 404 i noindex.
- Odbiór przeglądarkowy lokalnego Hosting: pierwsza wizyta → brak skryptów/iframe Google; odmowa → przeładowanie → nadal brak banera i Google; akceptacja → skrypty i iframe reCAPTCHA; przeładowanie → obie kategorie zaznaczone; cofnięcie → przeładowanie i brak skryptów/ramek Google. Osobny zapis tylko ustawień pozostawia Google wyłączone.
- Telefon 390 × 844: dostęp przez ikonę tarczy z etykietą „Ustawienia prywatności”, przewijany dialog, dostępne akcje, brak poziomego przewijania. Sprawdzone Escape oraz powrót fokusu do przycisku otwierającego. Desktop: stopka i otwieranie ustawień.

Powtórzenie odbioru: na czystym profilu otworzyć dev, przejść powyższe scenariusze; w narzędziach przeglądarki sprawdzić klucze pamięci i sieć. Dla ustawień zaznaczyć plan historyczny, przeładować stronę po zgodzie na pamięć, następnie wycofać kategorię i potwierdzić usunięcie kluczy. Test z atrapami nie zastępuje pełnego audytu prawnego ani wszystkich zachowań dostawcy reCAPTCHA.

Źródła techniczne (odczyt 6 listopada 2026):
[Firebase App Check](https://firebase.google.com/docs/app-check/web/recaptcha-enterprise-provider),
[reCAPTCHA i cookie](https://developers.google.com/recaptcha/docs/faq/).


## Język informacji i wymagania prawne

Aktualizacja 6 listopada 2026: treści użytkownika opisują cele, dane, dostawców, okresy oraz skutki decyzji. Identyfikatory kluczy, localStorage, IndexedDB i nazwy SDK pozostają w audycie technicznym powyżej. Na telefonie ustawienia otwiera ikona tarczy z dostępną nazwą i tytułem; nie zmieniono logiki zgód.

- Art. 399 Prawa komunikacji elektronicznej obejmuje zapis/odczyt informacji na urządzeniu, niezależnie od nazwy technologii. Wymaga wcześniejszej zrozumiałej informacji i zgody, z wyjątkami dla transmisji i koniecznego dostarczenia żądanej usługi. Nie każdy zapis w pamięci oznacza obowiązek banera.
- Art. 12 RODO wymaga prostego i zrozumiałego języka. Art. 13 określa informacje o administratorze, celach/podstawach, odbiorcach, retencji, prawach i ewentualnych transferach. Nazwy wewnętrznych kluczy i baz nie są wymaganym elementem banera. Okres 180 dni jest decyzją projektu, nie uniwersalnym terminem ustawowym.
- Raport grupy EROD wskazuje łatwo dostępny link lub ikonę jako możliwe sposoby wycofania zgody; nie narzuca konkretnego symbolu.

Przed uznaniem polityki za kompletną dla wydania produkcyjnego należy zweryfikować podstawy prawne poszczególnych operacji oraz rzeczywiste okresy/kryteria retencji logów i danych dostawców. Należy również ustalić występujące transfery poza EOG i odpowiednie zabezpieczenia. Linki do polityk dostawców nie zastępują własnego obowiązku informacyjnego administratora. Uproszczenie języka nie stanowi potwierdzenia pełnej zgodności prawnej.

Źródła prawne (odczyt 6 listopada 2026):
[Prawo komunikacji elektronicznej, art. 399–400](https://isap.sejm.gov.pl/isap.nsf/download.xsp/WDU20240001221/U/D20241221Lj.pdf),
[RODO, art. 7, 12–13](https://eur-lex.europa.eu/legal-content/PL/TXT/?uri=CELEX:32016R0679),
[EROD, Cookie Banner Taskforce, pkt 31–35](https://www.edpb.europa.eu/system/files/2023-01/edpb_20230118_report_cookie_banner_taskforce_en.pdf).


### Skrócenie do informacji prawnych — 6 listopada 2026

Na zlecenie właściciela usunięto opisy paneli, przeładowania, sposobu publikacji danych i wewnętrznych zabezpieczeń. Treści używają określeń serwis/portal. Pozostawiono administratora, cele i zakres danych, podstawy przetwarzania, odbiorców, okresy/kryteria przechowywania, informację o transferach, dobrowolności i wycofaniu zgód oraz prawach. Art. 6 ust. 1 lit. f wskazuje interes w udostępnieniu i ochronie serwisu; opcjonalne przetwarzanie opiera się na zgodzie.

Właściciel wyraźnie wybrał pozostawienie GitHub Issues jako kanału kontaktu. Zachowano ostrzeżenie, że zgłoszenia są publiczne i nie należy wpisywać danych osobowych.

Dane o retencji dostawców oparto na ich dokumentacji: Google Hosting przechowuje adresy IP przez kilka miesięcy; OpenFreeMap logi błędów przez 7 dni, a adresy zbierane przy incydentach do 30 dni. Nie utożsamiamy 180-dniowej ważności własnej decyzji ze wszystkimi cookies i danymi Google. Konfiguracja konkretnego projektu i umowy z dostawcami nadal wymagają weryfikacji przed potwierdzeniem pełnej zgodności produkcji.

Źródła: [prywatność Firebase](https://firebase.google.com/support/privacy), [retencja Google](https://policies.google.com/technologies/retention?hl=pl), [transfery Google](https://policies.google.com/privacy/frameworks?hl=pl), [prywatność OpenFreeMap](https://openfreemap.org/privacy/).


### Wspólny układ stron — 6 listopada 2026

Nagłówek z logo i oznaczeniem wersji, stopka oraz mobilna nawigacja są współdzielone przez mapę/wyszukiwarkę i stronę prywatności. Ich źródła znajdują się w `src/app/layout/portal-header`, `portal-footer` i `mobile-navigation`. Strona prywatności ma czytelną kolumnę treści oraz te same odstępy i elementy marki co wyszukiwarka; stopka i nawigacja otwierają ten sam dialog ustawień.

Odbiór: porównano strony na telefonie 390×844, przejście Szukaj/Prywatność, otwarcie i zamknięcie ustawień ze stopki oraz zwinięcie/rozwinięcie wyszukiwarki na desktopie. Wspólny nagłówek zachowuje obserwację wysokości i wariant zwiniętego panelu. Build i prerender pięciu tras zaliczone.
