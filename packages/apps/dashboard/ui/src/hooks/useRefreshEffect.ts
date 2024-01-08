import { DependencyList, EffectCallback, useEffect } from 'react';
import useSWR from 'swr';
import { FAST_INTERVAL, SLOW_INTERVAL } from 'src/constants';

type BlockEffectCallback = (blockNumber: number) => ReturnType<EffectCallback>;

const EMPTY_ARRAY: any[] = [];

export function useFastRefreshEffect(
  effect: BlockEffectCallback,
  deps?: DependencyList
) {
  // TODO: Handle multiple networks
  const chainId = 1;
  const { data = 0 } = useSWR(
    chainId && [FAST_INTERVAL, 'blockNumber', chainId]
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(effect.bind(null, data), [data, ...(deps || EMPTY_ARRAY)]);
}

export function useSlowRefreshEffect(
  effect: BlockEffectCallback,
  deps?: DependencyList
) {
  // TODO: Handle multiple networks
  const chainId = 1;
  const { data = 0 } = useSWR(
    chainId && [SLOW_INTERVAL, 'blockNumber', chainId]
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(effect.bind(null, data), [data, ...(deps || EMPTY_ARRAY)]);
}
