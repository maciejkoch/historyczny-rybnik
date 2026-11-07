# Domena — Hostido i Firebase Hosting

Data rozpoczęcia konfiguracji: 4 listopada 2026.

- Domena: `historyczny.rybnik.pl`, zarejestrowana w Hostido.
- Projekt i witryna Firebase Hosting: `historyczny-rybnik`.
- Domenę dodano w Firebase Hosting; status na tym etapie: `Needs setup`.
- Właściciel wyraził zgodę na przełączenie Hostido z „Przekierowanie na serwery DNS” na „Zarządzanie strefą DNS” i zapis poniższych rekordów.
- Hostido aktywował strefę. Rekord A domeny głównej zmieniono z domyślnego `185.110.51.41` na `199.36.158.100`; dodano TXT `hosting-site=historyczny-rybnik`. TTL obu rekordów wynosi 3600 s. Pozostałe rekordy, w tym pocztowe, pozostawiono bez zmian.

## Rekordy wskazane przez kreator Firebase

| Typ | Nazwa | Wartość |
| --- | --- | --- |
| A | `historyczny.rybnik.pl` | `199.36.158.100` |
| TXT | `historyczny.rybnik.pl` | `hosting-site=historyczny-rybnik` |

Serwery nazw Hostido widoczne w panelu: `ns1.hostido.net.pl`, `ns2.hostido.net.pl`, `ns3.hostido.net.pl`. Nie należy usuwać rekordu TXT po aktywacji — potwierdza powiązanie domeny z witryną.

## Weryfikacja

Przed zmianą trybu lokalny resolver oraz Google Public DNS zwracały `NXDOMAIN`; nie było możliwe potwierdzenie publicznych rekordów. Po aktywacji strefy zapisano rekordy i potwierdzono ich poprawną odpowiedź na wszystkich trzech serwerach nazw Hostido oraz w Google Public DNS (`8.8.8.8`) i Cloudflare (`1.1.1.1`). Uruchomiono weryfikację w Firebase. Ostatni odczyt kreatora nadal wskazywał oczekiwanie na wykrycie rekordów (`Records not yet detected`); docelowy stan to `Connected`, z poprawnym HTTPS.

Firebase pokazuje „Waiting for your first release”: konfiguracja domeny nie oznacza wdrożenia gotowej aplikacji.

[Zarządzanie Hosting](https://console.firebase.google.com/project/historyczny-rybnik/hosting/sites/historyczny-rybnik) · [Dokumentacja domen Firebase](https://firebase.google.com/docs/hosting/custom-domain).


## Stan po kontroli HTTPS

Rekord A i TXT odpowiadają poprawnie w publicznym DNS. Nie znaleziono rekordu AAAA ani CAA na nazwie domeny. Firebase nadal pokazuje `Records not yet detected` / `Needs setup`; certyfikat dla tej domeny nie jest jeszcze gotowy. Test `curl` z normalną weryfikacją TLS zwrócił błąd niedopasowania nazwy certyfikatu do `historyczny.rybnik.pl`. Nie omijano weryfikacji TLS.

Konfiguracja rekordów po stronie Hostido jest wykonana; pozostaje wykrycie ich przez Firebase i automatyczne wystawienie certyfikatu. Według dokumentacji Firebase proces może potrwać do 24 godzin od skierowania DNS. Ponowna kontrola: status `Connected` w konsoli i poprawne wywołanie HTTPS. Nie wdrożono jeszcze aplikacji ani strony zastępczej.
