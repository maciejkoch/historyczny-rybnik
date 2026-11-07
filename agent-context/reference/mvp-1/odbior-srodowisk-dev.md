# Odbiór środowisk dev — 7 listopada 2026

Zadanie: https://github.com/users/maciejkoch/projects/1?pane=issue&itemId=295616960
PR: https://github.com/maciejkoch/historyczny-rybnik/pull/10

Utworzono witryny historyczny-rybnik-dev-1, -2 i -3 w istniejącym projekcie historyczny-rybnik. Każda ma osobny kanał live. Google Auth i reCAPTCHA Enterprise dopuszczają wszystkie trzy domeny web.app; CORS Functions places-dev dopuszcza ich pełne origin. Nie zmieniano bazy, danych, reguł ani produkcyjnego Hostingu. Integracyjny Hosting dev nie był publikowany.

Sprawdzenia:

- `npm test`: kontrakty, 5 testów zgód i 15 backendu — zaliczone.
- Build: 5 tras SSG, 404, noindex, prywatność i 15057 kafelków — zaliczone.
- Każdy adres: HTTPS 200, nagłówek noindex/nofollow, nieznana trasa 404.
- Google accounts:createAuthUri dla każdego origin: wygenerowano URI OAuth, bez błędu niedopuszczonej domeny.
- Przeglądarka na każdym adresie: mapa, punkt bazyliki, zgoda Google i brak błędów konsoli. Po zgodzie znika komunikat o snapshotcie, bez komunikatu awarii odczytu.
- Rezerwacja dev-1 utworzona przez compare-and-swap pustej referencji; ponowna rezerwacja odrzucona. Próba zwolnienia przez inne ID zadania odrzucona. Blokada pozostaje na czas review.
- Pole Środowisko odczytane po utworzeniu; rezerwacja dev-1 i status In progress potwierdzone bezpośrednio po node ID.

Ograniczenie odbioru: nie wykonano pełnego interaktywnego logowania do konta Google. Obecny frontend nie udostępnia jeszcze interfejsu logowania fazy 4. Zweryfikowano konfigurację domen i inicjalizację OAuth, a nie sesję zalogowanego użytkownika. Kryterium zadania dotyczące pełnego logowania pozostaje do odbioru.

Weryfikacja dokumentacji: README i CONTRIBUTING nie wymagają zmiany — funkcje i zasady kodu pozostają takie same. Zaktualizowano AGENTS, TECHNICAL, opis środowisk i spis skryptów. Projektowe skille odczytują bieżący proces z tych źródeł; nie wymagają powielenia procedury.
