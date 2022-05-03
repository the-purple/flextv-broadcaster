import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import debounce from 'lodash/debounce';
import { StatefulService } from '../services/core';
import { createBinding, TBindings } from './shared/inputs';
import { useForm } from './shared/inputs/Form';
import { FormInstance } from 'antd/lib/form/hooks/useForm';

/**
 * Creates a reactive state for a React component based on Vuex store
 */
export function useVuex<TReturnValue>(selector: () => TReturnValue, deep = true): TReturnValue {
  const [state, setState] = useState(selector);
  useEffect(() => {
    const unsubscribe = StatefulService.store.watch(
      () => selector(),
      newState => {
        setState(newState);
      },
      { deep },
    );
    return () => {
      unsubscribe();
    };
  }, []);

  return state;
}

/**
 * Watch a value in Vuex. A few caveats:
 * - This intentionally does not call your watch function on first
 *   render. This is specifically for tying behavior to when the
 *   watched value changes.
 * - Your selector should return a simple value, not an object. This
 *   is because (like React deps) the values are compared with simple
 *   === equality, and will not do a proper object comparison.
 * @param selector A function that returns a value to watch
 * @param watchFn A function that runs when the value changes
 */
export function useWatchVuex<TSelectorValue>(
  selector: () => TSelectorValue,
  watchFn: (newVal: TSelectorValue, oldVal: TSelectorValue) => void,
) {
  const selectorVal = useVuex(selector);
  const oldVal = useRef(selectorVal);

  useEffect(() => {
    if (selectorVal !== oldVal.current) {
      watchFn(selectorVal, oldVal.current);
      oldVal.current = selectorVal;
    }
  }, [selectorVal]);
}

/**
 * onCreate shortcut
 * Helpful if you need to calculate an immutable initial state for a component
 */
export function useOnCreate<TReturnValue>(cb: () => TReturnValue) {
  return useState(cb)[0];
}

/**
 * onDestroy shortcut
 */
export function useOnDestroy(cb: () => void) {
  useEffect(() => cb, []);
}

/**
 * Create a debounced version of the function
 */
export function useDebounce<T extends (...args: any[]) => any>(ms = 0, cb: T) {
  return useCallback(debounce(cb, ms), []);
}

/**
 * Init state with an async callback
 * TODO investigate if we can just use a library for the async code https://github.com/slorber/react-async-hook
 */
export function useAsyncState<TStateType>(
  defaultState: TStateType | (() => TStateType),
  asyncCb?: (initialState: TStateType) => Promise<TStateType>,
): [TStateType, (newState: TStateType) => unknown, Promise<TStateType | null> | undefined] {
  // define a state
  const [state, setState] = useState(defaultState);

  let isDestroyed = false;

  // create and save the promise if provided
  const [promise] = useState(() => {
    if (asyncCb) {
      return asyncCb(state).then(newState => {
        // do not update the state if the component has been destroyed
        if (isDestroyed) return null;
        setState(newState);
        return newState;
      });
    }
  });

  useOnDestroy(() => {
    isDestroyed = true;
  });

  return [state, setState, promise];
}

/**
 * Create the state object and return helper methods
 */
export function useFormState<T extends object>(initializer: T | (() => T)): TUseFormStateResult<T> {
  const [s, setStateRaw] = useState<T>(initializer);

  // create a reference to the last actual state
  const stateRef = useRef(s);

  // use isDestroyed flag to prevent updating state on destroyed components
  const isDestroyedRef = useRef(false);
  useOnDestroy(() => {
    isDestroyedRef.current = true;
  });

  // create a reference to AntForm
  const form = useForm();

  function setState(newState: T) {
    if (isDestroyedRef.current) return;
    // keep the reference in sync when we update the state
    stateRef.current = newState;
    setStateRaw(newState);
  }

  // create a function for state patching
  function updateState(patch: Partial<T>) {
    setState({ ...stateRef.current, ...patch });
  }

  function setItem<TDict extends keyof T, TKey extends keyof T[TDict]>(
    dictionaryName: TDict,
    key: TKey,
    value: T[TDict][TKey],
  ): void {
    setState({
      ...stateRef.current,
      [dictionaryName]: { ...stateRef.current[dictionaryName], [key]: value },
    });
  }

  return {
    s,
    setState,
    updateState,
    setItem,
    bind: createBinding(() => stateRef.current, setState),
    stateRef,
    form,
  };
}

type TUseFormStateResult<TState extends object> = {
  s: TState;
  setState: (p: TState) => unknown;
  updateState: (p: Partial<TState>) => unknown;
  setItem: <TDict extends keyof TState, TKey extends keyof TState[TDict]>(
    dictionaryName: TDict,
    key: TKey,
    value: TState[TDict][TKey],
  ) => unknown;
  bind: TBindings<TState>;
  stateRef: { current: TState };
  form: FormInstance<TState>;
};

/**
 * Returns a function for force updating of the component
 * Use it only for frequently used components for optimization purposes
 *
 * Current implementation from
 * https://github.com/ant-design/ant-design/blob/master/components/_util/hooks/useForceUpdate.ts
 */
export function useForceUpdate() {
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);
  return forceUpdate;
}

/**
 * Sets a function that guarantees a re-render and fresh state on every tick of the delay
 */
export function useRenderInterval(callback: () => void, delay: number, condition = true) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (condition) {
      const timeout = window.setTimeout(() => {
        callback();
        setTick(tick + 1);
      }, delay);

      return () => clearTimeout(timeout);
    }
  }, [tick, condition]);
}

/**
 * Useful for firing off an async request when the component mounts, but
 * the result will be automatically discarded if the component unmounts
 * before the request finishes. React throws a warning when doing state
 * updates for unmounted components, and this prevents that.
 * @param executor Function that returns a promise
 * @param handler Function that takes a promise that is canceled on unmount
 */
export function usePromise<TPromiseResult>(
  executor: () => Promise<TPromiseResult>,
  handler: (promise: Promise<TPromiseResult>) => void,
) {
  useEffect(() => {
    let unmounted = false;

    handler(
      new Promise((resolve, reject) => {
        executor()
          .then(r => {
            if (unmounted) return;

            resolve(r);
          })
          .catch(e => {
            if (unmounted) return;

            reject(e);
          });
      }),
    );

    return () => {
      unmounted = true;
    };
  }, []);
}
