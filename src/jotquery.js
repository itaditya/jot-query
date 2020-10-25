import { useEffect, useMemo } from "react";
import { atom, useAtom } from "jotai";

function createFetcher(
  fetcher,
  { initialData, initialParams, config = {} } = {}
) {
  const paramsAtom = atom(initialParams);

  const configAtom = atom({
    stale: true,
    ...config
  });

  const cacheKeyAtom = atom((get) => {
    const params = get(paramsAtom);
    const key = JSON.stringify(params);
    return key;
  });

  const initialKey = JSON.stringify(initialParams);

  const cacheAtom = atom({
    [initialKey]: initialData
  });

  const currentCacheAtom = atom(
    (get) => {
      const cache = get(cacheAtom);
      const cacheKey = get(cacheKeyAtom);

      return cache[cacheKey];
    },
    (get, set, args) => {
      const cache = get(cacheAtom);
      set(cacheAtom, {
        ...cache,
        ...args
      });
    }
  );

  const updaterAtom = atom(null, async (get, set, action = {}) => {
    if (action.type === "fetchData") {
      const config = get(configAtom);
      const params = get(paramsAtom);
      const cache = get(cacheAtom);
      const cacheKey = get(cacheKeyAtom);

      const isCacheMiss = !cache[cacheKey];
      if (config.stale || isCacheMiss) {
        const newData = await fetcher(params);

        if (isCacheMiss) {
          set(cacheAtom, {
            ...cache,
            [cacheKey]: newData
          });
        }

        if (config.stale) {
          set(cacheAtom, {
            [cacheKey]: newData
          });
        }

        set(configAtom, {
          ...config,
          stale: false
        });
      }
    }
    if (action.type === "invalidate") {
      const config = get(configAtom);
      set(configAtom, {
        ...config,
        stale: true
      });
    }
    if (action.type === "resetCache") {
      set(cacheAtom, initialData);
    }
  });

  function useDispatch() {
    const [_a, dispatch] = useAtom(updaterAtom);

    return dispatch;
  }

  function useFetcher() {
    const [cache] = useAtom(cacheAtom);
    const [cacheKey] = useAtom(cacheKeyAtom);
    const dispatch = useDispatch();

    useEffect(() => {
      dispatch({
        type: "fetchData"
      });
    }, [dispatch, cacheKey]);

    const currentData = useMemo(() => cache[cacheKey], [cache, cacheKey]);

    return currentData;
  }

  return [useFetcher, useDispatch, paramsAtom, currentCacheAtom, cacheKeyAtom];
}

export { createFetcher };
