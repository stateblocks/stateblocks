import {memoize} from "lodash-es";

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

let metaMemo = memoize(memoize);

export function memoizeN<F extends (...args: any[]) => any>(fn: (...args: any[]) => any): F {
    let newVar2 = memoize((arg0: any) => {
        return memoizeN((...args: any[]) => {
            return fn(arg0, ...args)
        })
    });
    let newVar = (...args: Parameters<F>): ReturnType<F> => {
        if (args.length == 0) {
            return metaMemo(fn)()
        }
        if (args.length == 1) {
            return metaMemo(fn)(args[0])
        }
        if (args.length == 2) {
            return newVar2(args[0])(args[1])
        }

        if (args.length > 2) {
            let [first, ...rest] = args;
            return newVar2(first)(...rest)
        }
    };
    return newVar as F
}