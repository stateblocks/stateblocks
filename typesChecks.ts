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
