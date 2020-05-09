import {SampleStorage, sleep} from "./samples/utils";
import {
    Effect,
    Executor,
} from "./core";
import {Store} from "./store";
import {
    actionsWithActionsContextPart,
    actionsWithContext,
    actionsWithContextBuilderPart,
    actionsWithContextPart, chainActions, scopeActions, scopeActionsWithCtxBuilder
} from "./actions";
import {handleActionMap} from "./handlers";
import {memoizeN} from "./memo";


test("add context to scoped action", async () => {

    type ContextType = { ctxActions: (arg: string) => void };

    let subActions = {
        setValue: (count: number) => (state: number, executor: Executor<number, ContextType>): number => {
            executor((state, handler, ctx) => {
                ctx.ctxActions("run effect");
            });
            return state + count;
        }
    };

    let actions = {scope: scopeActions<{ scope: number }>("scope")(subActions)};


    let mockCallback = jest.fn(arg => {
        console.log(arg)
    });

    let counterContext = {
        ctxActions: (arg: string) => mockCallback(arg)
    };

    var actionsWithContext1 = actionsWithContext(counterContext, actions);

    var store = new Store({"scope": 0});
    await store.update(actionsWithContext1.scope.setValue(3));
    expect(store.state).toEqual({"scope": 3});
    expect(mockCallback.mock.calls.length).toBe(1);
    expect(mockCallback.mock.calls[0][0]).toBe("run effect");

});


type TestContext = { test: number };


let testActions = {
    simpleAction1: (arg: number) => (state: number, executor: Executor<number>) => {
        return state + arg;
    },

    simpleAction2: (arg: number) => (state: number, executor: Executor<number>) => {
        return state + arg;
    },

    subActionsMap: {
        foo: (arg: number) => (state: number, executor: Executor<number>) => {
            return state + arg;
        },

        paf: (arg: number) => (state: number, executor: Executor<number>) => {
            return state + arg;
        },
    },

    subActionsFunction: (shift: number) => ({
        foo: (arg: number) => (state: number, executor: Executor<number>) => {
            return state + arg + shift;
        },
        paf: (arg: number) => (state: number, executor: Executor<number>) => {
            return state + arg + shift;
        },
    }),


};

function createNoopExecutor<S>() {
    return (effect: Effect<S, void>) => {

    };
}

test("chain actions", () => {

    let actions1 = {
        ...testActions,
        test6: (shift: number) => ({
            foo: (arg: number) => (state: number, executor: Executor<number>) => {
                return state + arg + shift;
            },
        })
    };


    let actions2 = {
        simpleAction1: (arg: number) => (state: number, executor: Executor<number>) => {
            return state + arg;
        },

        test3: (arg: number) => (state: number, executor: Executor<number>) => {
            return state + arg;
        },
        subActionsMap: {
            foo: (arg: number) => (state: number, executor: Executor<number>) => {
                return state + arg;
            },

            boum: (arg: number) => (state: number, executor: Executor<number>) => {
                return state + arg;
            },
        },

        subActionsFunction: (shift: number) => ({
            foo: (arg: number) => (state: number, executor: Executor<number>) => {
                return state + arg + shift;
            },
        })
    };

    const executor = createNoopExecutor<number>();

    let state: number = null;

    state = chainActions(actions1, actions2).simpleAction1(1)(0, executor);
    expect(state).toBe(2);

    state = chainActions(actions1, actions2).simpleAction2(1)(0, executor);
    expect(state).toBe(1);

    state = chainActions(actions1, actions2).test3(1)(0, executor);
    expect(state).toBe(1);

    state = chainActions(actions1, actions2).subActionsMap.foo(1)(0, executor);
    expect(state).toBe(2);

    state = chainActions(actions1, actions2).subActionsMap.paf(1)(0, executor);
    expect(state).toBe(1);

    state = chainActions(actions1, actions2).subActionsMap.boum(1)(0, executor);
    expect(state).toBe(1);

    state = chainActions(actions1, actions2).subActionsFunction(1).foo(1)(0, executor);
    expect(state).toBe(4);

    state = chainActions(actions1, actions2).subActionsFunction(1).paf(1)(0, executor);
    expect(state).toBe(2);

    state = chainActions(actions1, actions2).test6(1).foo(1)(0, executor);
    expect(state).toBe(2);

});

test("scope actions map", () => {
    type State = { scope: number };
    let actions = scopeActions<State>("scope")(testActions);

    const executor = createNoopExecutor<State>();

    let initialState = {scope: 0};
    let state: State = null;

    state = actions.simpleAction1(1)(initialState, executor);
    expect(state).toEqual({scope: 1});

    state = actions.subActionsMap.foo(1)(initialState, executor);
    expect(state).toEqual({scope: 1});

    state = actions.subActionsFunction(1).foo(1)(initialState, executor);
    expect(state).toEqual({scope: 2});

});

test("scope actions map creator", () => {
    type State = { scope: number };
    let actions = scopeActions<State>("scope")(testActions.subActionsFunction);

    const executor = createNoopExecutor<State>();

    let initialState = {scope: 0};
    let state: State = null;

    state = actions(1).foo(1)(initialState, executor);
    expect(state).toEqual({scope: 2});

});

test("scope action", () => {
    type State = { scope: number };
    let actions = scopeActions<State>("scope")(testActions.simpleAction1);

    const executor = createNoopExecutor<State>();

    let initialState = {scope: 0};
    let state: State = null;

    state = actions(1)(initialState, executor);
    expect(state).toEqual({scope: 1});

});

test("scope actions with variable scope", () => {
    type State = { scope: number };
    let actions = scopeActions<State>()(testActions);

    const executor = createNoopExecutor<State>();

    let initialState = {scope: 0};
    let state: State = null;

    state = actions("scope").simpleAction1(1)(initialState, executor);
    expect(state).toEqual({scope: 1});

    state = actions("scope").subActionsMap.foo(1)(initialState, executor);
    expect(state).toEqual({scope: 1});

    state = actions("scope").subActionsFunction(1).foo(1)(initialState, executor);
    expect(state).toEqual({scope: 2});
});

test("scope actions with array state", () => {
    type State = number[];
    let actions = scopeActions<State>()(testActions);

    const executor = createNoopExecutor<State>();

    let initialState = [0];
    let state: State = null;

    state = actions(0).simpleAction1(1)(initialState, executor);
    expect(state).toEqual([1]);

    state = actions(0).subActionsMap.foo(1)(initialState, executor);
    expect(state).toEqual([1]);

    state = actions(0).subActionsFunction(1).foo(1)(initialState, executor);
    expect(state).toEqual([2]);
});


test("use context builder in scoped action", async () => {

    type ContextType = { ctxActions: (arg: string) => void };

    let subActions = {
        setValue: (count: number) => (state: number, executor: Executor<number, ContextType>): number => {
            executor((state, handler, ctx) => {
                ctx.ctxActions("run effect");
            });
            return state + count;
        }
    };

    let mockCallback = jest.fn(arg => {
        console.log(arg)
    });

    var actionsWithContext1 = scopeActionsWithCtxBuilder<number[], void, ContextType>((key, state, handler, ctx: void) => ({
        ctxActions: (arg: string) => {
            mockCallback(arg + " from " + key)
        }
    }))(subActions);

    var store = new Store([0, 0]);
    await store.update(actionsWithContext1(0).setValue(3));
    expect(store.state).toEqual([3, 0]);
    expect(mockCallback.mock.calls.length).toBe(1);
    expect(mockCallback.mock.calls[0][0]).toBe("run effect from 0");

    await store.update(actionsWithContext1(1).setValue(2));
    expect(store.state).toEqual([3, 2]);
    expect(mockCallback.mock.calls.length).toBe(2);
    expect(mockCallback.mock.calls[1][0]).toBe("run effect from 1");

});

test("use handler with scope actions", async () => {
    type State = { scope: number };
    let actions = scopeActions<State>("scope")(testActions);

    const executor = createNoopExecutor<State>();

    let initialState = {scope: 0};
    let state: State = null;

    let store: Store<{ scope: number }>;
    store = new Store(initialState);
    await handleActionMap(store.update, actions).simpleAction1(1);
    expect(store.state).toEqual({scope: 1});


    store = new Store(initialState);
    await handleActionMap(store.update, actions).subActionsMap.foo(1);
    expect(store.state).toEqual({scope: 1});


    store = new Store(initialState);
    await handleActionMap(store.update, actions).subActionsFunction(1).foo(1);
    expect(store.state).toEqual({scope: 2});

});

test("scope actions with action in effect", async () => {
    type State = { scope: number };
    let newVar = {
        actionWithEffect: () => (state: number, executor: Executor<number>) => {
            executor(async (state, handler) => {
                await sleep(10);
                return handler(newVar.increment())
            });
            return state + 1;
        },

        increment: () => (state: number, executor: Executor<number>) => {
            return state + 1;
        },

    };
    let actions = scopeActions<State>("scope")(newVar);

    let initialState = {scope: 0};

    var store = new Store(initialState);

    store.update(actions.increment());
    expect(store.state).toEqual({scope: 1});

    var promise = store.update(actions.actionWithEffect());
    expect(store.state).toEqual({scope: 2});
    await promise;
    expect(store.state).toEqual({scope: 3});

});


test("provide context parts", async () => {

    type State = number;

    type Context = {
        bim(): any,
        bam(): any,
        pouf(): any
    }


    const actions = {
        test: () => (state: State, executor: Executor<State, Context>): State => {
            executor((state, handler, ctx) => {
                ctx.bim();
                ctx.bam();
                ctx.pouf();
            });
            return state + 1;
        },

        subActions: {
            test2: () => (state: State, executor: Executor<State, Context>): State => {
                executor((state, handler, ctx) => {
                    ctx.bim();
                    ctx.bam();
                    ctx.pouf();
                });
                return state + 1;
            },
        },

        subActionsFn: (shift: number) => ({
            test2: () => (state: State, executor: Executor<State, Context>): State => {
                executor((state, handler, ctx) => {
                    ctx.bim();
                    ctx.bam();
                    ctx.pouf();
                });
                return state + shift;
            }
        }),

    };


    let bam = jest.fn(() => {
    });
    let pouf = jest.fn(() => {
    });
    let bim = jest.fn(() => {
    });

    let ctxPart1 = {
        bam: bam,
    };

    const ctxActions = {
        bim: () => (state: State, executor: Executor<State, Context>) => {
            bim();
            return state;
        }
    };

    const actionsWithContextPart1 = actionsWithContextPart(ctxPart1, actionsWithContextBuilderPart((ctxParent: typeof ctxPart1) => ({
        pouf: () => {
            ctxParent.bam();
            pouf();
        }
    }), actionsWithActionsContextPart(ctxActions, actions)));

    let store = new Store(0);
    await store.update(actionsWithContextPart1.test());
    expect(store.state).toBe(1);
    expect(bim.mock.calls.length).toBe(1);
    expect(bam.mock.calls.length).toBe(2);
    expect(pouf.mock.calls.length).toBe(1);
    await store.update(actionsWithContextPart1.subActions.test2());
    expect(store.state).toBe(2);
    await store.update(actionsWithContextPart1.subActionsFn(2).test2());
    expect(store.state).toBe(4);

});


//TODO : choose and fix
xtest("don't fire state update in synchronous effect", async () => {
    let store = new Store(0);
    const listener = jest.fn((state: number) => {
        console.log("state update fired", state);
    });
    store.onChange(listener);

    await store.update((state, executor) => {
        executor((state, handle, ctx) => {
            handle((state) => state + 1)
        });
        return state + 1;
    });

    expect(listener.mock.calls.length).toBe(1);

    let promise = store.update((state, executor) => {
        executor(async (state, handle, ctx) => {
            await sleep(10);
            handle((state) => state + 1)
        });
        return state + 1;
    });
    expect(listener.mock.calls.length).toBe(2);
    await promise;
    expect(listener.mock.calls.length).toBe(3);


});


test("await effects that return promises", async () => {
    let storage = new SampleStorage();
    let store = new Store(0);
    let promise = store.update((state, executor) => {
        executor(() => storage.put("path", "data"));
        return state + 1;
    });
    expect(Object.keys(storage.data).length).toBe(0);
    await promise;
    expect(Object.keys(storage.data).length).toBe(1);
});


test("effects in effects should throw", async () => {
    let store = new Store(0);
    let promise = store.update((state, effects) => {
        effects(async () => {
            await sleep(100);
            effects(() => {
                console.log("executing effect in effect");
            });
        });
        return state + 1;
    });

    let error: any;
    await promise.catch((e) => {
        error = e;
    });
    expect(error).toBeDefined()
});

test("await scoped effects", async () => {
    let storage = new SampleStorage();
    let store = new Store({scope: 0});
    const action = () => (state: number, executor: Executor<number>) => {
        executor(() => storage.put("path", "data"));
        return state + 1;
    };

    let scopedAction = scopeActions<{ scope: number }>("scope")(action);

    let promise = store.update(scopedAction());
    expect(store.state).toEqual({scope: 1});
    expect(Object.keys(storage.data).length).toBe(0);
    await promise;
    expect(Object.keys(storage.data).length).toBe(1);

});

test("handle reducer in effect", async () => {
    let store = new Store(0);

    function checkState(value: number) {
        expect(store.state).toEqual(value);
    }

    let interval: NodeJS.Timeout;
    const effect: Effect<number, void> = async (state, handler, ctx) => {
        interval = setInterval(() => {
            let newState: number = null;
            handler(state => {
                newState = state + 1;
                return newState;
            });
            checkState(newState);
        }, 10);
    };

    await store.update((state, executor) => {
        executor(effect);
        return state + 1;
    });
    checkState(1);
    await sleep(100);
    clearInterval(interval);
});