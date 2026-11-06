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
- Telefon 390 × 844: dostęp przez przycisk Prywatność, przewijany dialog, dostępne akcje, brak poziomego przewijania. Sprawdzone Escape oraz powrót fokusu do przycisku otwierającego. Desktop: stopka i otwieranie ustawień.

Powtórzenie odbioru: na czystym profilu otworzyć dev, przejść powyższe scenariusze; w narzędziach przeglądarki sprawdzić klucze pamięci i sieć. Dla ustawień zaznaczyć plan historyczny, przeładować stronę po zgodzie na pamięć, następnie wycofać kategorię i potwierdzić usunięcie kluczy. Test z atrapami nie zastępuje pełnego audytu prawnego ani wszystkich zachowań dostawcy reCAPTCHA.

Źródła techniczne (odczyt 6 listopada 2026):
[Firebase App Check](https://firebase.google.com/docs/app-check/web/recaptcha-enterprise-provider),
[reCAPTCHA i cookie](https://developers.google.com/recaptcha/docs/faq/).
