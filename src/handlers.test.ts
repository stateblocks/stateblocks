import {handleActionMap} from "./handlers";


test("memoize handleActionMap", () => {

    const actions = {
        increment: () => (state: number) => {
            console.log("executing reducer");
            return state + 1;
        },

        counter: (idx: number, other: string) => ({
            setValue: (value: number) => (state: number) => {
                console.log("executing set value");
                return value;
            }
        })
    }

    var handler = handleActionMap((reducer => {
        reducer(0, null);
        return Promise.resolve();
    }), actions);

    expect(handler.increment() != handler.increment()).toBe(true)
    handler.increment()

    expect(handler.counter(0, "test")).toBe(handler.counter(0, "test"))

    expect(handler.counter(0, "test").setValue(42) != handler.counter(0, "test").setValue(42)).toBe(true)
    handler.counter(0, "test").setValue(42)
    handler.counter(0, "test").setValue(42)


})

