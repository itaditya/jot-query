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

  const currentCacheAtom = atom((get) => {
    const cache = get(cacheAtom);
    const cacheKey = get(cacheKeyAtom);

    return cache[cacheKey];
  });

  const updaterAtom = atom(null, async (get, set, action = {}) => {
    if (action.type === "fetchData") {
      const config = get(configAtom);
      const params = get(paramsAtom);
      const cacheKey = get(cacheKeyAtom);
      const cache = get(cacheAtom);

      const isCacheMiss = !cache[cacheKey];
      if (config.stale || isCacheMiss) {
        const newData = await fetcher(params);
        set(cacheAtom, {
          ...cache,
          [cacheKey]: newData
        });
        set(configAtom, {
          ...config,
          stale: false
        });
      }
    }
    if (action.type === "invalidateCache") {
      set(configAtom, {
        stale: true
      });
      set(cacheAtom, {});
    }
  });

  function useFetcher() {
    const [cache] = useAtom(cacheAtom);
    const [config] = useAtom(configAtom);
    const [cacheKey] = useAtom(cacheKeyAtom);
    const [_a, dspatch] = useAtom(updaterAtom);

    useEffect(() => {
      dspatch({
        type: "fetchData"
      });
    }, [config.stale, dspatch, cacheKey]);

    const currentData = useMemo(() => cache[cacheKey], [cache, cacheKey]);

    return [currentData, dspatch];
  }

  return [useFetcher, paramsAtom, currentCacheAtom, updaterAtom];
}

export { createFetcher };
