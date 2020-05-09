import {createTwoCounters} from "./DoubleCounter";
import {Store} from "../store";


test("compose two counters", async () => {
    let {initialState, actions} = createTwoCounters();

    var store = new Store(initialState);


    let actionHandler = store.update;

    await actionHandler(actions.top.increment());
    expect(store.state.top).toBe(1);

    await actionHandler(actions.top.incrementLater(100));
    expect(store.state.top).toBe(2);

    await actionHandler(actions.reset());
    expect(store.state).toEqual(initialState);

});

