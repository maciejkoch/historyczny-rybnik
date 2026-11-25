# Kreator miejsc AI — podział prac

> Plan prac, nie opis wdrożonej funkcji. Szczegóły zachowania i kryteria całości określają [wymagania](wymagania.md); [wstępna architektura](architektura-wstepna.md) opisuje kierunek techniczny i wyniki wcześniejszych prób.

Zadania 1–5 tworzą kompletny ręczny przepływ pracy z miejscem. Zadania 6–10 dodają AI i odbiór całego MVP. W każdym zadaniu należy uwzględnić odpowiednie zabezpieczenia, walidację i testy, także odmowę dostępu i obsługę błędów. Odbiór implementacji jest lokalny; wdrożenie wymaga osobnego zlecenia.

## 1. Lista miejsc i podstawy szkiców

Wejście do kreatora, wyszukiwanie, statusy, tworzenie i otwieranie wspólnych szkiców oraz usuwanie nowych nieopublikowanych szkiców. Dostęp tylko dla administratora, podstawy wersjonowania i lokalne emulatory Firebase.

**Odbiór:** administrator tworzy szkic, znajduje go po ponownym wejściu i może go usunąć; nie może usunąć opublikowanego miejsca.

## 2. Formularz miejsca, wzmianki i mapa

Edycja danych miejsca, tagów, wzmianek i lokalizacji. Automatyczny zapis, stan zapisu, ponawianie po błędzie, wykrywanie konfliktów i ponowne otwieranie szkicu.

**Odbiór:** dane, wzmianki i lokalizacja pozostają w szkicu po zamknięciu i ponownym otwarciu. Błąd zapisu i konflikt są widoczne.

## 3. Materiały i powiązania ze wzmiankami

Dodawanie, edycja i usuwanie zdjęć oraz skanów, wybór grafiki głównej i powiązanie materiałów ze wzmiankami. Prywatne przechowywanie przed publikacją, walidacja plików oraz obsługa ponowień i częściowych błędów.

**Odbiór:** administrator dodaje materiał, wiąże go ze wzmianką i po ponownym otwarciu widzi plik i powiązanie. Materiał szkicu nie jest publicznie dostępny.

## 4. Podgląd karty miejsca

Panel obok formularza, pokazujący zapisany szkic na podstawie istniejącej karty miejsca. Prezentuje dane, wzmianki, materiały i lokalizację oraz pozwala regulować szerokość paneli. Podgląd jest oznaczony jako szkic.

**Odbiór:** zapisane zmiany pojawiają się na karcie. Przy błędzie zapisu podgląd pokazuje ostatnią poprawnie zapisaną wersję, a formularz informuje o błędzie.

## 5. Publikacja i przywracanie

Walidacja pełnego szkicu, publikacja nowego miejsca lub zmian istniejącego wraz z materiałami oraz przywrócenie wersji opublikowanej. Obsługa konfliktów i ponowień.

**Odbiór:** administrator tworzy miejsce ręcznie, publikuje je w emulatorze, zmienia szkic i przywraca wersję opublikowaną. Ręczny proces pracy z miejscem jest kompletny.

## 6. Agent i propozycje zmian na żywo

Agent Genkit zna model miejsca, aktualny szkic i kontekst bieżącej rozmowy. Obejmuje pętlę narzędzi, rzeczywisty postęp pracy, strumieniowanie propozycji do formularza i podglądu, czytelne porównanie zmian, kolejny prompt, akceptację i odrzucenie. Ręczne zmiany są zapisywane przed uruchomieniem agenta; podczas jego pracy formularz jest tylko do odczytu. Akceptacja uwzględnia wersję szkicu.

**Odbiór:** administrator prosi o zmianę opisu i dodanie wzmianki, widzi proponowane wartości, może poprosić o poprawkę i zatwierdzić albo odrzucić wynik. Propozycja nie zmienia szkicu przed zatwierdzeniem.

## 7. Źródła dla agenta: PDF-y i linki

Linki podawane w rozmowie, prywatne przesyłanie dokumentów, lista i usuwanie PDF-ów, odczyt wybranych stron i analiza skanów. Ograniczenia przetwarzania, bezpieczny odczyt URL-i oraz zgłaszanie niedostępnych źródeł. PDF-y pozostają przy miejscu po publikacji i przywróceniu; usunięcie nowego szkicu usuwa jego dokumenty. Historia rozmowy nie jest trwale zapisywana.

**Odbiór:** administrator dodaje PDF i kilka linków; agent korzysta z dostępnych źródeł i zgłasza niedostępne. Po ponownym otwarciu szkicu PDF jest dostępny, a czat pusty.

## 8. Skany z ramką przygotowane przez AI

Agent wybiera stronę i fragment, a kod przygotowuje pełny skan z ramką i miniaturę. Podgląd przed akceptacją, powiązanie materiału ze wzmianką oraz sprzątanie odrzuconych lub porzuconych materiałów tymczasowych.

**Odbiór:** dla wielostronicowego PDF-u administrator prosi o fragment strony i widzi skan z ramką oraz jego powiązanie ze wzmianką przed zatwierdzeniem.

## 9. Wspólne wskazówki dla AI

Edycja, zapis i przywracanie dodatkowych wskazówek administratora na stronie listy miejsc. Wskazówki są wspólne, pokazują czas ostatniej zmiany i działają bez wydania nowej wersji aplikacji. Uzupełniają stałą instrukcję i nie zastępują zabezpieczeń ani walidacji.

**Odbiór:** zmiana wskazówek jest dostępna kolejnemu uruchomieniu agenta, także po ponownym otwarciu strony; można przywrócić wartości domyślne.

## 10. Koszty, limity i odbiór całości

Szacowany koszt oraz stan limitu zadania, z konfigurowalnym domyślnym limitem **1 USD na zadanie**. Pełny scenariusz z rzeczywistym Gemini i reprezentatywnym skanem; sprawdzenie błędów, konfliktów, utraty połączenia i ponownego otwarcia. Weryfikacja całości oraz aktualizacja właściwej dokumentacji.

**Odbiór:** przechodzi lokalny scenariusz od utworzenia szkicu przez źródła, propozycję i akceptację po publikację w emulatorze. Osobno sprawdzono odrzucenie, edycję istniejącego miejsca, przywrócenie oraz usuwanie szkicu.

## Kolejność i zależności

Zadania 1–5 realizujemy w kolejności listy. Zadanie 6 korzysta ze szkicu, edytora i podglądu; zadanie 7 rozszerza agenta o źródła. Zadanie 8 zależy od obsługi materiałów z zadania 3 i dokumentów z zadania 7. Zadanie 9 można realizować równolegle z pracami nad agentem. Zadanie 10 weryfikuje całość. Limity potrzebne do bezpiecznego uruchomienia agenta muszą powstać wraz z nim; zadanie 10 domyka ich prezentację i odbiór.
