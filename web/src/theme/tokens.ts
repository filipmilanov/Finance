/**
 * The single source of truth for Verdant's visual identity.
 *
 * Nothing here is MUI-specific — `createAppTheme` maps these onto an MUI theme,
 * and styled components read them back off `theme.app`. Change a colour here and
 * it changes everywhere.
 */

export type AppTokens = {
  /** Page background, below every card. */
  canvas: string;
  /** Translucent canvas for the sticky header. */
  canvasVeil: string;
  /** The recessed surface: filter bars, table footers, hover rows. */
  sunken: string;
  /** The highest surface: dialogs. */
  floating: string;

  lineStrong: string;

  textFaint: string;

  brand: {
    main: string;
    hover: string;
    /** A pale tint of the brand, for active nav and income chips. */
    wash: string;
    contrast: string;
  };

  leaf: { fill: string; rib: string };

  /**
   * Money in and money out each carry two steps: `text` meets WCAG 4.5:1 for
   * amounts, `fill` is the chart mark, which only needs 3:1 against the surface
   * but must clear the colourblind separation check against its partner.
   */
  earn: { text: string; fill: string; wash: string };
  spend: { text: string; fill: string; wash: string };

  radius: { field: number; raised: number; floating: number };

  shadow: { raised: string; floating: string };

  /** Focus ring, applied on :focus-visible only. */
  ring: string;
};

export const FONT_DISPLAY = "'Fraunces', 'Iowan Old Style', Georgia, serif";
export const FONT_UI = "'Instrument Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const RADIUS = { field: 9, raised: 14, floating: 20 };

export const lightTokens: AppTokens = {
  canvas: '#f4f8f4',
  canvasVeil: 'rgba(244, 248, 244, 0.86)',
  sunken: '#eaf1e9',
  floating: '#ffffff',

  lineStrong: '#c2d4bf',
  textFaint: '#83988c',

  brand: {
    main: '#0e6b45',
    hover: '#0a5537',
    wash: '#e4f2ea',
    contrast: '#ffffff',
  },

  leaf: { fill: '#7be0ac', rib: '#0e6b45' },

  // Validated as a categorical pair against a light surface:
  // ΔE 12.3 protan / 29.3 tritan / 25.5 normal — all checks pass.
  earn: { text: '#0e6b45', fill: '#0e6b45', wash: '#e4f2ea' },
  spend: { text: '#9a5a12', fill: '#c9761a', wash: '#f7ecdf' },

  radius: RADIUS,

  shadow: {
    raised: '0 1px 2px rgba(12, 58, 38, 0.05), 0 3px 10px -3px rgba(12, 58, 38, 0.07)',
    floating: '0 2px 6px rgba(12, 58, 38, 0.06), 0 18px 40px -12px rgba(12, 58, 38, 0.22)',
  },

  ring: '0 0 0 3px rgba(14, 107, 69, 0.28)',
};

export const darkTokens: AppTokens = {
  canvas: '#060f0b',
  canvasVeil: 'rgba(6, 15, 11, 0.86)',
  sunken: '#101f18',
  floating: '#14251c',

  lineStrong: '#2a4736',
  textFaint: '#6d8579',

  brand: {
    main: '#35c98a',
    hover: '#4ad79a',
    wash: '#122b20',
    contrast: '#04140d',
  },

  leaf: { fill: '#9ff3c6', rib: '#06301f' },

  // Dark is re-stepped, not flipped: the light fills sit outside the dark
  // lightness band (L 0.48–0.67). These pass at ΔE 8.7 protan / 22.2 tritan.
  earn: { text: '#35c98a', fill: '#0f9e7a', wash: '#122b20' },
  spend: { text: '#d19a45', fill: '#bd8430', wash: '#2b2011' },

  radius: RADIUS,

  shadow: {
    raised: '0 1px 2px rgba(0, 0, 0, 0.4), 0 3px 12px -4px rgba(0, 0, 0, 0.5)',
    floating: '0 2px 8px rgba(0, 0, 0, 0.5), 0 20px 44px -14px rgba(0, 0, 0, 0.7)',
  },

  ring: '0 0 0 3px rgba(53, 201, 138, 0.32)',
};
