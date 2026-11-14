# Skille projektu

`skills/` zawiera procedury tworzenia oraz rozpoczynania, wznawiania i kończenia zadań GitHub Projects. Pozostają w tej lokalizacji, aby Codex mógł je odkrywać. [Użycie i ograniczenia](../agent-context/github-projects/skille-github-projects.md). Obowiązujące zasady są w głównych dokumentach repozytorium.

`rybnik-research-places` kontynuuje badania historyczne Rybnika w prywatnym warsztacie data/places, rozszerza sieć źródeł, rejestruje materiały i kandydatów oraz raportuje zmiany. Nie publikuje automatycznie wyników.

Badanie domyślnie zbiera i opracowuje źródła przez jednego subagenta `gpt-6-luna` (`high`), z krótkim kontekstem bez historii rozmowy. Model główny sprawdza ustalenia i prawa oraz wykonuje synchronizację. Wywołanie pozostaje takie samo: `Użyj $rybnik-research-places do badania wskazanego tematu`. Wymagane jest narzędzie delegacji z dostępną Luną; jego brak jest zgłaszany bez automatycznej zmiany modelu. Szczegóły i podział odpowiedzialności: [skill badawczy](skills/rybnik-research-places/SKILL.md).

Skille startu i zakończenia zlecają wieloźródłowe rozpoznanie do odczytu, jeśli delegowanie jest dostępne i dozwolone, podagentowi `gpt-6-luna`; agent główny wykonuje operacje i świeże kontrole. Przy prostym zadaniu lub niedostępnej delegacji działa samodzielnie.
