// Interface fixtures only. These positions and descriptions do not form a historical catalogue.
export interface DemoPlace {
  readonly id: string;
  readonly number: number;
  readonly name: string;
  readonly coordinates: readonly [number, number];
  readonly description: string;
}
export const DEMO_PLACES: readonly DemoPlace[] = [
  { id: 'demo-rynek', number: 1, name: 'Punkt przy Rynku', coordinates: [18.5417, 50.0961], description: 'Przykładowa karta w centrum miasta. Służy do sprawdzenia wyboru punktu i działania panelu.' },
  { id: 'demo-park', number: 2, name: 'Punkt przy parku', coordinates: [18.5462, 50.0950], description: 'Druga przykładowa karta pozwala sprawdzić przechodzenie między punktami bez tworzenia mapy od nowa.' },
  { id: 'demo-polnoc', number: 3, name: 'Punkt na północ od centrum', coordinates: [18.5443, 50.1031], description: 'Przykładowa pozycja do porównania współczesnej mapy z planem historycznym. Nie potwierdza historycznej funkcji miejsca.' },
];
