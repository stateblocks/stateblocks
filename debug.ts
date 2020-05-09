import {isEqual} from "lodash-es";

export function explainDiff<T>(a: T, b: T, path: any[] = []) {

    if (typeof a != typeof b) {
        console.log(path.join(".") + " types different");
        return;
    }
    if (typeof a == "string") {
        if (a != b) {
            console.log("different string : " + a + " != " + b)
            return;
        }
    }
    if (Array.isArray(a)) {
        if (a.length != (b as unknown as any[]).length) {
            console.log(path.join(".") + " different array size");
            return;
        }
    }
    for (let key in a) {
        if (a[key] !== b[key]) {
            const subPath = [...path, key];
            console.log(subPath.join(".") + " is different");
            explainDiff(a[key], b[key], subPath);
        }
    }

}

export function checkChanged<T>(oldState: T, newState: T): T {
    if (oldState !== newState) {
        if (isEqual(oldState, newState)) {
            console.warn("objects are different but content is equal");
            return oldState;
        } else {
            return newState;
        }
    }
}