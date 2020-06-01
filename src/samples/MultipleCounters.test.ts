import {StoreWithActions} from "../store";
import {App} from "./MultipleCounters";


test("memoize handlers", () => {
    let store = new StoreWithActions(App.initialState, App.actions);
    // action map builders are memoized
    expect(store.handle.counterActions(0)).toBe(store.handle.counterActions(0));
    expect(store.handle.counterActions(0).decrement).toBe(store.handle.counterActions(0).decrement);

    // reducer creators are not memoized
    expect(store.handle.counterActions(0).decrement() != store.handle.counterActions(0).decrement()).toBe(true);
    expect(store.handle.counterActions(0).setValue(42) != store.handle.counterActions(0).setValue(42)).toBe(true);

    store.handle.counterActions(0).setValue(42)
    store.handle.counterActions(0).setValue(42)

    // store.update(App.actions.counterActions(0).setValue(42))
    // store.update(App.actions.counterActions(0).setValue(42))
});