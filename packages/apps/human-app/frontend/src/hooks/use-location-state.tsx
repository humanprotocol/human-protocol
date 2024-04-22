/* eslint-disable @typescript-eslint/no-unsafe-member-access -- that's ok because we validate this members with zod */
import { useEffect, useState } from 'react';
import type { Location } from 'react-router-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import type { z } from 'zod';
import { routerPaths } from '@/router/router-paths';

interface UseLocationStateProps<T> {
  schema: z.ZodSchema<T>;
  locationStorage?: keyof Location;
  keyInStorage?: string;
  onErrorRedirectPath?: string;
}

export function useLocationState<T>({
  keyInStorage,
  onErrorRedirectPath = routerPaths.homePage,
  locationStorage = 'state',
  schema,
}: UseLocationStateProps<T>) {
  const location = useLocation();
  const navigate = useNavigate();
  const [fieldFromState, setFieldFromState] = useState<T>();

  useEffect(() => {
    try {
      const storage = (
        keyInStorage
          ? location[locationStorage]?.[keyInStorage]
          : location[locationStorage]
      ) as unknown;

      const validFiled = schema.parse(storage);
      setFieldFromState(validFiled);
    } catch {
      navigate(onErrorRedirectPath, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- call this effect once
  }, []);

  return {
    field: fieldFromState,
  };
}
