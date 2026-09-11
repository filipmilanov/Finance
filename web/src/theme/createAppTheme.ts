import { createTheme, type Theme } from '@mui/material/styles';
import { darkTokens, FONT_DISPLAY, FONT_UI, lightTokens, type AppTokens } from './tokens';

declare module '@mui/material/styles' {
  interface Theme {
    /** Verdant's own tokens, for anything MUI's palette has no slot for. */
    app: AppTokens;
  }
  interface ThemeOptions {
    app?: AppTokens;
  }
}

export type ThemeMode = 'light' | 'dark';

/** MUI wants exactly 25 elevation steps; Verdant only ever uses two. */
function buildShadows(tokens: AppTokens): Theme['shadows'] {
  const shadows = new Array(25).fill(tokens.shadow.raised);
  shadows[0] = 'none';
  for (let i = 8; i < 25; i += 1) shadows[i] = tokens.shadow.floating;
  return shadows as unknown as Theme['shadows'];
}

export function createAppTheme(mode: ThemeMode): Theme {
  const app = mode === 'dark' ? darkTokens : lightTokens;

  const text = mode === 'dark'
    ? { primary: '#e6f1e9', secondary: '#93aa9d', disabled: app.textFaint }
    : { primary: '#11201a', secondary: '#56685f', disabled: app.textFaint };

  const divider = mode === 'dark' ? '#1d3327' : '#d8e4d6';
  const paper = mode === 'dark' ? '#0d1a14' : '#ffffff';

  return createTheme({
    app,

    palette: {
      mode,
      primary: {
        main: app.brand.main,
        dark: app.brand.hover,
        light: app.brand.wash,
        contrastText: app.brand.contrast,
      },
      success: { main: app.earn.text },
      warning: { main: app.spend.text },
      error: { main: mode === 'dark' ? '#f0836a' : '#b4432f' },
      background: { default: app.canvas, paper },
      text,
      divider,
    },

    shape: { borderRadius: app.radius.field },

    shadows: buildShadows(app),

    typography: {
      fontFamily: FONT_UI,
      fontSize: 15,
      // Fraunces carries headings and figures; Instrument Sans does the rest.
      h1: { fontFamily: FONT_DISPLAY, fontWeight: 500, letterSpacing: '-0.028em', lineHeight: 1.1 },
      h2: { fontFamily: FONT_DISPLAY, fontWeight: 500, letterSpacing: '-0.026em', lineHeight: 1.12 },
      h3: { fontFamily: FONT_DISPLAY, fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1.2 },
      h4: { fontFamily: FONT_DISPLAY, fontWeight: 500, letterSpacing: '-0.018em', lineHeight: 1.25 },
      h5: { fontFamily: FONT_DISPLAY, fontWeight: 500, letterSpacing: '-0.018em' },
      h6: { fontFamily: FONT_DISPLAY, fontWeight: 500, fontSize: '1.06rem', letterSpacing: '-0.018em' },
      body1: { lineHeight: 1.55 },
      body2: { lineHeight: 1.55 },
      button: { textTransform: 'none', fontWeight: 500 },
    },

    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: { WebkitFontSmoothing: 'antialiased' },
          // Honour the OS setting rather than animating regardless.
          '@media (prefers-reduced-motion: reduce)': {
            '*, *::before, *::after': {
              animationDuration: '0.01ms !important',
              transitionDuration: '0.01ms !important',
            },
          },
        },
      },

      MuiPaper: {
        styleOverrides: {
          // MUI tints dark-mode paper with a gradient; Verdant sets its own.
          root: { backgroundImage: 'none' },
          rounded: { borderRadius: app.radius.raised },
        },
      },

      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            borderRadius: app.radius.raised,
            border: `1px solid ${divider}`,
            boxShadow: app.shadow.raised,
          },
        },
      },

      MuiButton: {
        defaultProps: { disableElevation: true, disableRipple: true },
        styleOverrides: {
          root: {
            borderRadius: app.radius.field,
            padding: '9px 16px',
            // Only transform and colour animate — never `all`.
            transition:
              'transform 0.18s cubic-bezier(0.22,1,0.36,1), background-color 0.18s ease, border-color 0.18s ease, color 0.18s ease',
            '&:active': { transform: 'translateY(1px)' },
            '&:focus-visible': { boxShadow: app.ring },
          },
          outlined: {
            borderColor: app.lineStrong,
            color: text.primary,
            '&:hover': {
              backgroundColor: app.sunken,
              borderColor: app.brand.main,
              color: app.brand.main,
            },
          },
          text: {
            color: text.secondary,
            '&:hover': { backgroundColor: app.sunken, color: text.primary },
          },
        },
      },

      MuiIconButton: {
        defaultProps: { disableRipple: true },
        styleOverrides: {
          root: {
            borderRadius: app.radius.field,
            transition: 'transform 0.18s cubic-bezier(0.22,1,0.36,1), color 0.18s ease, border-color 0.18s ease',
            '&:active': { transform: 'scale(0.94)' },
            '&:focus-visible': { boxShadow: app.ring },
          },
        },
      },

      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: app.radius.field,
            backgroundColor: app.canvas,
            '& .MuiOutlinedInput-notchedOutline': { borderColor: app.lineStrong },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: app.brand.main },
            '&.Mui-focused': { backgroundColor: paper },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderWidth: 1,
              borderColor: app.brand.main,
            },
          },
          input: { padding: '10px 12px' },
        },
      },

      MuiInputLabel: {
        styleOverrides: {
          root: { fontSize: '0.82rem', fontWeight: 500, color: text.secondary },
        },
      },

      MuiChip: {
        styleOverrides: {
          root: {
            height: 24,
            borderRadius: 999,
            fontSize: '0.8rem',
            backgroundColor: app.sunken,
            border: `1px solid ${divider}`,
            color: text.secondary,
          },
        },
      },

      MuiTableCell: {
        styleOverrides: {
          root: { borderBottomColor: divider, padding: '12px' },
          head: {
            fontSize: '0.8rem',
            fontWeight: 500,
            color: text.secondary,
            padding: '0 12px 8px',
            whiteSpace: 'nowrap',
          },
        },
      },

      MuiTableRow: {
        styleOverrides: {
          root: { transition: 'background-color 0.14s ease' },
        },
      },

      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: app.radius.floating,
            backgroundColor: app.floating,
            border: `1px solid ${divider}`,
            boxShadow: app.shadow.floating,
          },
        },
      },

      MuiAlert: {
        styleOverrides: {
          root: { borderRadius: app.radius.field, border: '1px solid' },
        },
      },

      MuiLink: {
        defaultProps: { underline: 'hover' },
        styleOverrides: { root: { color: app.brand.main } },
      },

      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: app.floating,
            color: text.primary,
            border: `1px solid ${divider}`,
            boxShadow: app.shadow.floating,
            fontSize: '0.8rem',
          },
        },
      },
    },
  });
}
