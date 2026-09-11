import { useTheme } from '@mui/material/styles';
import { Badge, WordmarkRoot, WordmarkText } from './Logo.styles';

/**
 * Verdant's mark: three ledger bars, the tallest of which grows a leaf.
 * Bars inherit `currentColor`; the leaf carries the accent so the mark reads
 * on both the light and dark shells.
 */
export function LogoMark({ size = 32 }: { size?: number }) {
  const theme = useTheme();

  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" role="presentation" focusable="false">
      <g transform="translate(0.5 0)">
        <rect x="4" y="19.5" width="5" height="8.5" rx="2.5" fill="currentColor" opacity="0.42" />
        <rect x="12" y="15" width="5" height="13" rx="2.5" fill="currentColor" opacity="0.7" />
        <rect x="20" y="12" width="5" height="16" rx="2.5" fill="currentColor" />
        <g transform="rotate(-12 22.5 8)">
          <path d="M22.5 2.2 Q 28.4 7.5 22.5 13.4 Q 16.6 7.5 22.5 2.2 Z" fill={theme.app.leaf.fill} />
          <path
            d="M22.5 4.2 L 22.5 12"
            stroke={theme.app.leaf.rib}
            strokeWidth="1.1"
            strokeLinecap="round"
            opacity="0.55"
          />
        </g>
      </g>
    </svg>
  );
}

export function LogoBadge({ size = 34 }: { size?: number }) {
  return (
    <Badge size={size}>
      <LogoMark size={size} />
    </Badge>
  );
}

export function Wordmark() {
  return (
    <WordmarkRoot>
      <LogoBadge />
      <WordmarkText component="span">Verdant</WordmarkText>
    </WordmarkRoot>
  );
}
