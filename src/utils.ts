

export function mapValues<T extends {}, U>(object: T, fn: (arg: T[keyof T], key:string) => U): { [key in keyof T]: U } {
    let output:any = {}
    for(let key in object){
        output[key] = fn(object[key], key)
    }
    return output;
}