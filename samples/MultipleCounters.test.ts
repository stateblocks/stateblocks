import {StoreWithActions} from "../store";
import {App} from "./MultipleCounters";


test("memoize handlers", () => {
    let store = new StoreWithActions(App.initialState, App.actions);
    expect(store.handle.counterActions(0)).toBe(store.handle.counterActions(0));
    expect(store.handle.counterActions(0).decrement).toBe(store.handle.counterActions(0).decrement);
});