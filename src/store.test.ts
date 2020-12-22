import {Store} from "./store";


test("throw in action", async () => {
    let store = new Store(0);
    let promise = store.update((state, executor) => {
        throw new Error("test");
    })
    return expect(promise).rejects.toThrow()
})

test("throw in effect", async () => {
    let store = new Store(0);

    let promise = store.update((state, executor) => {
        executor(() => {
            throw new Error("test");
        })
        return 2;
    })
    return expect(promise).rejects.toThrow()
})

test("reject in effect", async () => {
    let store = new Store(0);

    let promise = store.update((state, executor) => {
        executor((state, handler, ctx) => {
            return Promise.reject("test");
        })
        return 2;
    })
    await expect(promise).rejects.toBe("test")
})

test("throw in action in effect", async () => {
    let store = new Store(0);

    let promise = store.update((state, executor) => {
        executor((state, handler, ctx) => {
            return handler(() => {
                throw "test"
            })
        })
        return 2;
    })
    await expect(promise).rejects.toBe("test")
})