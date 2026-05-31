/**
 * ResolvedEntityLink — like EntityLink but fetches the entity's real name from
 * the API and displays it once loaded.  Falls back to the supplied `fallback`
 * label (or a generic "Type #id" string) while the request is in flight or if
 * it fails.  Uses staleTime: Infinity so each id is only fetched once per
 * session regardless of how many times the component is mounted.
 */
import { useQuery } from '@tanstack/react-query';
import { api } from '../api.js';
import { EntityLink } from './EntityLink.js';

type ResolvableType = 'item' | 'npc' | 'spell' | 'faction';

interface Props {
  type: ResolvableType;
  id: number;
  /** Shown while loading or on error.  Defaults to e.g. "Item #12345". */
  fallback?: string;
  className?: string;
}

function defaultFallback(type: ResolvableType, id: number): string {
  return `${type.charAt(0).toUpperCase() + type.slice(1)} #${id}`;
}

function useName(type: ResolvableType, id: number): string | undefined {
  const { data: item }    = useQuery({ queryKey: ['item',    id], queryFn: () => api.item(id),    staleTime: Infinity, enabled: type === 'item'    });
  const { data: npc }     = useQuery({ queryKey: ['npc',     id], queryFn: () => api.npc(id),     staleTime: Infinity, enabled: type === 'npc'     });
  const { data: spell }   = useQuery({ queryKey: ['spell',   id], queryFn: () => api.spell(id),   staleTime: Infinity, enabled: type === 'spell'   });
  const { data: faction } = useQuery({ queryKey: ['faction', id], queryFn: () => api.faction(id), staleTime: Infinity, enabled: type === 'faction' });

  if (type === 'item')    return item?.item?.name as string | undefined;
  if (type === 'npc')     return npc?.npc?.name  as string | undefined;
  if (type === 'spell')   return spell?.spell?.name as string | undefined;
  if (type === 'faction') return faction?.faction?.name;
  return undefined;
}

export function ResolvedEntityLink({ type, id, fallback, className }: Props) {
  const name = useName(type, id);
  return (
    <EntityLink
      type={type}
      id={id}
      name={name ?? fallback ?? defaultFallback(type, id)}
      className={className}
    />
  );
}
