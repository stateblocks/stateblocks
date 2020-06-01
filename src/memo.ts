import {memoize} from "lodash-es";

/**
 * Memoizer for functions with two arguments.
 * @param fn
 */
export function memoize2(fn: (arg1: any, arg2: any) => any) {
    const curried = memoize((arg1: any) => {
        return memoize((arg2: any) => {
            return fn(arg1, arg2);
        });
    });
    return (arg1: any, arg2: any) => {
        return curried(arg1)(arg2)
    }

}


/**
 * Vararg memoizer.
 * @param fn
 */
export function memoizeVarArgs<F extends (...args: any[]) => any>(fn: F): F {
    let curryAndMemo = memoize((arg0: any) => {
        return memoizeVarArgs((...rest: any[]) => {
            return fn(arg0, ...rest)
        })
    });
    let memoizedOneArg:F = null;
    let memoized = (...args: Parameters<F>): ReturnType<F> => {
        if (args.length == 0) {
            if(memoizedOneArg == null){
                memoizedOneArg = memoize(fn)
            }
            return memoizedOneArg()
        }
        if (args.length == 1) {
            if(memoizedOneArg == null){
                memoizedOneArg = memoize(fn)
            }
            return memoizedOneArg(args[0])
        }
        if (args.length == 2) {
            return curryAndMemo(args[0])(args[1])
        }

        if (args.length > 2) {
            let [first, ...rest] = args;
            return curryAndMemo(first)(...rest)
        }
    };
    return memoized as F
}


const metaMemo = memoize(memoize);

/**
 * Vararg memoizer.
 * Warning : If called multiple times, the previously cached results of memoized function will be returned.
 * This could lead to unexpected resulults.
 * @param fn
 * @deprecated
 */
export function metaMemoVarArgs<F extends (...args: any[]) => any>(fn: F): F {
    let curryAndMemo = memoize((arg0: any) => {
        return metaMemoVarArgs((...args: any[]) => {
            return fn(arg0, ...args)
        })
    });
    let memoized = (...args: Parameters<F>): ReturnType<F> => {
        if (args.length == 0) {
            return metaMemo(fn)()
        }
        if (args.length == 1) {
            return metaMemo(fn)(args[0])
        }
        if (args.length == 2) {
            return curryAndMemo(args[0])(args[1])
        }

        if (args.length > 2) {
            let [first, ...rest] = args;
            return curryAndMemo(first)(...rest)
        }
    };
    return memoized as F
}