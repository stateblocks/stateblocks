import {memoize2, metaMemoVarArgs, memoizeVarArgs} from "./memo";


test("memoize2", () => {

    let fn0 = jest.fn((a: number, b: number) => {
        return a + b;
    })

    let fnMemoized = memoize2(fn0)
    fnMemoized(1, 2)
    fnMemoized(1, 2)
    expect(fn0.mock.calls.length).toBe(1)
    fnMemoized(1, 3)
    fnMemoized(1, 3)
    expect(fn0.mock.calls.length).toBe(2)
    fnMemoized(2, 3)
    fnMemoized(2, 3)
    expect(fn0.mock.calls.length).toBe(3)

    let fnMemoized2 = memoize2(fn0);
    fnMemoized2(2, 3)
    fnMemoized2(2, 3)
    expect(fn0.mock.calls.length).toBe(4)


})


test("memoizeVarArgs", () => {

    let fn0 = jest.fn((a: number, b: number, c: number, d: number) => {
        return a + b + c + d;
    })

    let fnMemoized = memoizeVarArgs(fn0)
    fnMemoized(1, 2, 3, 4)
    fnMemoized(1, 2, 3, 4)
    expect(fn0.mock.calls.length).toBe(1)
    fnMemoized(2, 2, 3, 4)
    fnMemoized(2, 2, 3, 4)
    expect(fn0.mock.calls.length).toBe(2)
    fnMemoized(1, 3, 3, 4)
    fnMemoized(1, 3, 3, 4)
    expect(fn0.mock.calls.length).toBe(3)
    fnMemoized(1, 3, 4, 4)
    fnMemoized(1, 3, 4, 4)
    expect(fn0.mock.calls.length).toBe(4)
    fnMemoized(1, 3, 4, 5)
    fnMemoized(1, 3, 4, 5)
    expect(fn0.mock.calls.length).toBe(5)

    // check that memoizing again creates a new function
    let fnMemoized2 = memoizeVarArgs(fn0);
    expect(fnMemoized != fnMemoized2).toBe(true)
    fnMemoized2(1, 2, 3, 4)
    fnMemoized2(1, 2, 3, 4)
    expect(fn0.mock.calls.length).toBe(6)


})


test("memoizeVarArgs", () => {

    let fn0 = jest.fn((a: number, b: number, c: number, d: number) => {
        return a + b + c + d;
    })

    let fnMemoized = metaMemoVarArgs(fn0)
    fnMemoized(1, 2, 3, 4)
    fnMemoized(1, 2, 3, 4)
    expect(fn0.mock.calls.length).toBe(1)
    fnMemoized(2, 2, 3, 4)
    fnMemoized(2, 2, 3, 4)
    expect(fn0.mock.calls.length).toBe(2)
    fnMemoized(1, 3, 3, 4)
    fnMemoized(1, 3, 3, 4)
    expect(fn0.mock.calls.length).toBe(3)
    fnMemoized(1, 3, 4, 4)
    fnMemoized(1, 3, 4, 4)
    expect(fn0.mock.calls.length).toBe(4)
    fnMemoized(1, 3, 4, 5)
    fnMemoized(1, 3, 4, 5)
    expect(fn0.mock.calls.length).toBe(5)

    let fnMemoized2 = metaMemoVarArgs(fn0);
    fnMemoized2(1, 2, 3, 4)
    fnMemoized2(1, 2, 3, 4)
    expect(fn0.mock.calls.length).toBe(6)

})