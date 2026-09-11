import { useEffect, useRef, type ReactNode } from 'react';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import { AlertSlot, DialogBody, DialogHead, EmptyAction, EmptyRoot, EmptyTitle } from './ui.styles';

export { AlertSlot };

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint: string;
  action?: ReactNode;
}) {
  return (
    <EmptyRoot>
      <EmptyTitle>{title}</EmptyTitle>
      <Typography variant="body2">{hint}</Typography>
      {action && <EmptyAction>{action}</EmptyAction>}
    </EmptyRoot>
  );
}

export function Loading({ label = 'Loading' }: { label?: string }) {
  return (
    <Stack spacing={3} aria-busy="true" aria-label={label}>
      <Skeleton variant="rounded" height={96} />
      <Skeleton variant="rounded" height={220} />
    </Stack>
  );
}

/** The add/edit form shell. MUI's Dialog handles focus trapping and Escape. */
export function FormDialog({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    // MUI parks focus on the dialog itself. Move it to the field the user is
    // most likely to type in, falling back to the first field in the form.
    const id = window.setTimeout(() => {
      const body = bodyRef.current;
      if (!body) return;
      const target =
        body.querySelector<HTMLElement>('[data-autofocus]') ??
        body.querySelector<HTMLElement>('input, textarea');
      target?.focus();
    }, 0);
    return () => window.clearTimeout(id);
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogHead>
        {title}
        <IconButton onClick={onClose} aria-label="Close" size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogHead>
      <DialogBody ref={bodyRef}>{children}</DialogBody>
    </Dialog>
  );
}
