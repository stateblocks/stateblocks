/**
 * types and var defined here are used for check only. Everything should compile
 */



export function checkNever(arg: never) {
    throw Error();
}

export function excludeKey<T, U extends string>(arg: T, exclude: Exclude<U, keyof T>): any {
    return null;
}

export function hasKey<T, U extends keyof T>(arg: T, exclude: U): any {
    return null;
}

export function excludeFuncParams<F extends (...args: any) => any, T1, T2, T3>(
    func: F,
    arg1: Exclude<T1, Parameters<F>[0]>,
    arg2?: Exclude<T2, Parameters<F>[1]>,
    arg3?: Exclude<T3, Parameters<F>[2]>
) {

}