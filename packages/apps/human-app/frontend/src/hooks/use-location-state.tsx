import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { z } from 'zod';
import { routerPaths } from '@/router/router-paths';

interface UseLocationStateProps<T> {
  field: string;
  onErrorRedirectPath?: string;
  schema: z.ZodSchema<T>;
}

export function useLocationState<T>({
  field,
  onErrorRedirectPath = routerPaths.homePage,
  schema,
}: UseLocationStateProps<T>) {
  const location = useLocation();
  const navigate = useNavigate();
  const [fieldFromState, setFieldFromState] = useState<T>();

  useEffect(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- fine
      const validFiled = schema.parse(location.state?.[field]);
      setFieldFromState(validFiled);
    } catch (error) {
      navigate(onErrorRedirectPath, { replace: true });
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps -- call this effect once
  }, []);

  return {
    field: fieldFromState,
  };
}
