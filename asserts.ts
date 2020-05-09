export function assertType(v: any, type: "undefined" | "object" | "boolean" | "number" | "string" | "function" | "symbol" | "bigint") {
    if (typeof v !== type) {
        throw "unexpected type : " + typeof v + ". expected " + type
    }
}


export function assertObject(v: any): v is Object {
    assertType(v, "object");
    return v;
}

export function assertFunction(v: any): v is (...args: any) => any {
    assertType(v, "function");
    return v;
}

export function assertDefined(v: any) {
    if (typeof v === "undefined") {
        throw "undefined value"
    }
}