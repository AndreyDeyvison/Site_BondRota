/** Data no formato estrito YYYY-MM-DD exigido pela API. */
export type DataISO = string;

/** Timestamp RFC3339, ex.: "2026-09-10T00:00:00Z". */
export type TimestampRFC3339 = string;

export type Turno = 'MT' | 'VT' | 'NT' | 'IN';

export type Sentido = 'ida' | 'volta';

/** Dias úteis em que o transporte fixo é utilizado (1=Seg … 5=Sex). */
export type DiaSemana = 1 | 2 | 3 | 4 | 5;
