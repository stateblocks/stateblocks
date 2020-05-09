import {Counter, createMockCounterContext} from "./Counter";
import {actionsWithContext} from "../core";
import {Store} from "../store";


test("simple counter with effect", async () => {
    let counterCtx = createMockCounterContext();

    let counterActions = Counter.actions;
    let actions = actionsWithContext(counterCtx, counterActions);

    const store = new Store(Counter.initialState);

    await store.update(actions.increment());
    expect(store.state).toBe(1);

    await store.update(actions.decrement());
    expect(store.state).toBe(0);

    await store.update(actions.decrement());
    expect(store.state).toBe(0);

    await store.update(actions.setValue(42));
    expect(store.state).toBe(42);
    /**
     * The context function has been called with the new value
     */
    expect((counterCtx.onReset as any).mock.calls.length).toBe(1);
    expect((counterCtx.onReset as any).mock.calls[0][0]).toBe(42);

    await store.update(actions.incrementLater(10));
    expect(store.state).toBe(43);

    var promise = store.update(actions.incrementAndLater(100));
    expect(store.state).toBe(44);
    await promise;
    expect(store.state).toBe(45);


});