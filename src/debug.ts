import {isEqual} from "lodash-es";

export function explainDiff<T>(a: T, b: T, path: any[] = []) {

    if(a == b){
        return;
    }

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
        } else {
            if (a.length == 0 && (b as unknown as any[]).length == 0) {
                console.log(path.join(".") + " empty array");
            }
        }
    }
    for (let key in a) {
        if (a[key] !== b[key]) {
            const subPath = [...path, key];
            console.log(subPath.join(".") + " is different");
            explainDiff(a[key], b[key], subPath);
            return;
        }
    }
    for(let key in b){
        if(!(key in a)){
            const subPath = [...path, key];
            console.log(subPath.join(".") + " is absent in object a");
            return;
        }
    }

    console.warn(path.join(".") + " are equal objects but not the same reference");


}

export function checkChanged<T>(oldState: T, newState: T): boolean {
    if (oldState !== newState) {
        if (isEqual(oldState, newState)) {
            console.warn("objects are different but content is equal");
            explainDiff(oldState, newState);
            return true;
        } else {
            return true;
        }
    }
    return false;
}