import {SampleStorage, sleep} from "./samples/utils";
import {
    ActionMapWithCtx,
    Effect,
    Executor,
    Reducer,
} from "./core";
import {Store} from "./store";
import {
    actionsWithActionsContextPart,
    actionsWithContextValue,
    actionsWithContextBuilderPart,
    actionsWithContextPart,
    provideContext,
    chainActions,
    composeActions,
    scopeActions,
    scopeActionsWithCtxBuilder
} from "./actions";
import {handleActionMap} from "./handlers";
import {contextWithActionsPart} from "./context";


test("simple actions with context", async () => {

    type Context = {
        bar(): any,
        baz(): any,
    }

    let bar = jest.fn();
    let baz = jest.fn();


    let actions = {
        foo: () => (state: number, executor: Executor<number, Context>): number => {
            executor(((state1, handler, ctx) => {
                ctx.bar()
            }))
            return state + 1;
        }
    }

    let actions1 = actionsWithContextValue({bar, baz}, actions)

    let store: Store<number>;
    store = new Store(0);
    await store.update(actions1.foo());
    expect(store.state).toBe(1);
    expect(bar.mock.calls.length).toBe(1);


    let actions2: ActionMapWithCtx<typeof actions, { baz: () => void }> = actionsWithContextPart({bar}, actions)
    let actions3: ActionMapWithCtx<typeof actions, {}> = actionsWithContextPart({baz}, actions2)

    store = new Store(0);
    await store.update(actions3.foo());
    expect(store.state).toBe(1);
    expect(bar.mock.calls.length).toBe(2);

})


test("complex actions with context", async () => {

    type State = number;

    type Context = {
        foo(): any,
        bar(): any,
        baz(): any
    }


    const actions = {
        test: () => (state: State, executor: Executor<State, Context>): State => {
            executor((state, handler, ctx) => {
                ctx.foo();
                ctx.bar();
                ctx.baz();
            });
            return state + 1;
        },

        subActions: {
            test2: () => (state: State, executor: Executor<State, Context>): State => {
                executor((state, handler, ctx) => {
                    ctx.foo();
                    ctx.bar();
                    ctx.baz();
                });
                return state + 1;
            },
        },

        subActionsFn: (shift: number) => ({
            test3: () => (state: State, executor: Executor<State, Context>): State => {
                executor((state, handler, ctx) => {
                    ctx.foo();
                    ctx.bar();
                    ctx.baz();
                });
                return state + shift;
            }
        }),

    };


    let foo = jest.fn();
    let bar = jest.fn();
    let baz = jest.fn();

    let barCtx = {bar};

    let fullCtx = {
        foo,
        bar,
        baz,
    }

    const fooActionCtx = {
        foo: () => (state: State, executor: Executor<State, Context>) => {
            foo();
            return state;
        }
    };

    const fullActionCtx = {
        foo: () => (state: State, executor: Executor<State, Context>) => {
            foo();
            return state;
        },
        bar: () => (state: State, executor: Executor<State, Context>) => {
            bar();
            return state;
        },
        baz: () => (state: State, executor: Executor<State, Context>) => {
            baz();
            return state;
        }
    };

    const bazCtxBuilder = (ctxParent: typeof barCtx) => ({
        baz: () => {
            ctxParent.bar();
            baz();
        }
    });

    let mockExecutor: any = () => {

    }

    // Typing test : Provide partial context
    actionsWithContextPart(barCtx, actions).test()(1, mockExecutor as Executor<State, { foo: () => void, baz: () => void }>)

    // Typing test : Provide full context
    actionsWithContextPart(fullCtx, actions).test()(1, mockExecutor as Executor<State>)

    // Typing test : Provide partial context with builder
    actionsWithContextBuilderPart((ctxParent: Pick<Context, "foo" | "bar">) => ({
        baz,
    }), actions).test()(1, mockExecutor as Executor<State, { foo: () => void, bar: () => void }>)

    // Typing test : Provide partial context with builder
    actionsWithContextBuilderPart(() => ({
        foo,
        bar,
    }), actions).test()(1, mockExecutor as Executor<State, { baz: () => void }>)

    // Typing test : Provide full context with builder
    actionsWithContextBuilderPart(() => ({
        foo,
        bar,
        baz,
    }), actions).test()(1, mockExecutor as Executor<State>)

    // Typing test : Provide partial context with actions
    actionsWithActionsContextPart(fooActionCtx, actions).test()(1, mockExecutor as Executor<State, { bar: () => void, baz: () => void }>)

    // Typing test : Provide full context with actions
    actionsWithActionsContextPart(fullActionCtx, actions).test()(1, mockExecutor as Executor<State>)


    const actions4: ActionMapWithCtx<typeof actions, { bar: () => void, baz: () => void }> = actionsWithActionsContextPart(fooActionCtx, actions);
    const actions5: ActionMapWithCtx<typeof actions, { bar: () => void }> = actionsWithContextBuilderPart(bazCtxBuilder, actions4);
    const actions6: ActionMapWithCtx<typeof actions, {}> = actionsWithContextPart(barCtx, actions5);

    let store = new Store(0);
    await store.update(actions6.test());
    expect(store.state).toBe(1);
    expect(foo.mock.calls.length).toBe(1);
    expect(bar.mock.calls.length).toBe(2);
    expect(baz.mock.calls.length).toBe(1);
    await store.update(actions6.subActions.test2());
    expect(store.state).toBe(2);
    await store.update(actions6.subActionsFn(2).test3());
    expect(store.state).toBe(4);

})

test("complex actions with context universal", async () => {

    type State = number;

    type Foo = {
        foo(): any,
    }

    type Bar = {
        bar(): any,
    }

    type Baz = {
        baz(): any
    }

    type Context = Foo & Bar & Baz


    const actions = {
        test: () => (state: State, executor: Executor<State, Context>): State => {
            executor((state, handler, ctx) => {
                ctx.foo();
                ctx.bar();
                ctx.baz();
            });
            return state + 1;
        },

        subActions: {
            test2: () => (state: State, executor: Executor<State, Context>): State => {
                executor((state, handler, ctx) => {
                    ctx.foo();
                    ctx.bar();
                    ctx.baz();
                });
                return state + 1;
            },
        },

        subActionsFn: (shift: number) => ({
            test3: () => (state: State, executor: Executor<State, Context>): State => {
                executor((state, handler, ctx) => {
                    ctx.foo();
                    ctx.bar();
                    ctx.baz();
                });
                return state + shift;
            }
        }),

    };

    function createActions() {

        let foo = jest.fn();
        let bar = jest.fn();
        let baz = jest.fn();

        let barCtx = {bar};


        /**
         * This action map will web available in context.
         */
        const fooActionCtx = {
            foo: () => (state: State, executor: Executor<State, Bar & { extra: string }>) => {
                foo();
                // Ensure that side effects in actions context are executed
                executor((state, handler, ctx) => {
                    ctx.bar()
                })
                // Test that this reducer is correctly applied
                return state + 1;
            }
        };


        const bazCtxBuilder = (ctxParent: Bar) => ({
            baz: () => {
                ctxParent.bar();
                baz();
            }
        });


        const actionsWithFoo = provideContext(contextWithActionsPart(fooActionCtx), actions);
        const actionsWithFooBaz = provideContext(bazCtxBuilder, actionsWithFoo);
        const actionsWithFullContext = provideContext(barCtx, actionsWithFooBaz);

        return {actionsWithFullContext, foo, bar, baz}
    }

    let {actionsWithFullContext, bar, baz, foo} = createActions();

    let store = new Store(0);
    await store.update(actionsWithFullContext.test());
    expect(store.state).toBe(2);
    expect(foo.mock.calls.length).toBe(1);
    expect(bar.mock.calls.length).toBe(3); // called directly, in foo actions context and in bar context builder
    expect(baz.mock.calls.length).toBe(1);
    await store.update(actionsWithFullContext.subActions.test2());
    expect(foo.mock.calls.length).toBe(2);
    expect(bar.mock.calls.length).toBe(6); // called directly, in foo actions context and in bar context builder
    expect(baz.mock.calls.length).toBe(2);
    expect(store.state).toBe(4);
    await store.update(actionsWithFullContext.subActionsFn(2).test3());
    expect(foo.mock.calls.length).toBe(3);
    expect(bar.mock.calls.length).toBe(9); // called directly, in foo actions context and in bar context builder
    expect(baz.mock.calls.length).toBe(3);
    expect(store.state).toBe(7);


})


test("types : actions with context universal", () => {

    type A = { a: string }
    type B = { b: number }
    type C = { c: () => void }

    type Context = A & B & C

    const actions = {
        increment: () => (state: number, executor: Executor<number, Context>) => state + 1
    }

    const cImpl = {
        c: () => {
        }
    };

    provideContext(() => cImpl, actions)
        .increment()(0, null as Executor<number, A & B>)

    const contextActions = ({
        c: () => (state: number, exec: Executor<number, A & B>) => state
    })
    provideContext(contextActions, actions)
        .increment()(0, null as Executor<number, A & B>)

    const ctxBuilder = contextWithActionsPart(contextActions);
    provideContext(ctxBuilder, actions)
        .increment()(0, null as Executor<number, A & B>)

    /**
     * Provide context part builder with input arg
     */
    let newActions1 = provideContext((arg: { input: string }) => ({
        a: "test",
    }), actions)

    let action1: Reducer<number, { input: string, b: number }> = newActions1.increment()

    /**
     * Provide full context builder without arg
     */
    let newActions2 = provideContext(() => ({
        a: "test",
        b: 1,
        c: () => {
        }
    }), actions)


    let action2: Reducer<number> = newActions2.increment()

    /**
     * Provide full context builder with arg
     */
    let newActions3 = provideContext((ctxParent: { d: number }) => ({
        a: "test",
        b: 1,
    }), actions)
    let action3: Reducer<number, { d: number } & C> = newActions3.increment()

    /**
     * Provide full context object
     */
    let newActions4 = provideContext({
        a: "test",
        b: 1,
    }, actions)
    let action4: Reducer<number, C> = newActions4.increment()

    /**
     * Provide part context object
     */
    let newActions5 = provideContext({
        a: "test",
    }, actions)
    let action5: Reducer<number, { b: number }> = newActions5.increment()

})


test("add context to scoped action", async () => {

    type ContextType = {
        foo: (arg: string) => void,
    };

    let subActions = {
        addValue: (count: number) => (state: number, executor: Executor<number, ContextType>): number => {
            executor((state, handler, ctx) => {
                ctx.foo("run effect");
            });
            return state + count;
        }
    };

    let actions = {scope: scopeActions<{ scope: number }>("scope")(subActions)};

    let mockCallback = jest.fn();

    let counterContext = {
        foo: mockCallback
    };


    var actionsWithContext1 = actionsWithContextValue(counterContext, actions);

    var store = new Store({"scope": 0});
    await store.update(actionsWithContext1.scope.addValue(3));
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

        bar: (arg: number) => (state: number, executor: Executor<number>) => {
            return state + arg;
        },
    },

    subActionsFunction: (shift: number) => ({
        foo: (arg: number) => (state: number, executor: Executor<number>) => {
            return state + arg + shift;
        },
        bar: (arg: number) => (state: number, executor: Executor<number>) => {
            return state + arg + shift;
        },
    }),


};

function createNoopExecutor<S>() {
    return (effect: Effect<S>) => {

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

            baz: (arg: number) => (state: number, executor: Executor<number>) => {
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

    state = chainActions(actions1, actions2).subActionsMap.bar(1)(0, executor);
    expect(state).toBe(1);

    state = chainActions(actions1, actions2).subActionsMap.baz(1)(0, executor);
    expect(state).toBe(1);

    state = chainActions(actions1, actions2).subActionsFunction(1).foo(1)(0, executor);
    expect(state).toBe(4);

    state = chainActions(actions1, actions2).subActionsFunction(1).bar(1)(0, executor);
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

test("scope action with compose", () => {
    type State = { top: number, bottom: number };
    let actions = composeActions({
        top: testActions,
        bottom: testActions,
    })

    const executor = createNoopExecutor<State>();

    let initialState = {top: 0, bottom: 0};
    let state: State = null;
    state = actions.top.simpleAction1(1)(initialState, executor);
    expect(state).toEqual({top: 1, bottom: 0});

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

    type ContextType = { foo: (arg: string) => void };

    let subActions = {
        setValue: (count: number) => (state: number, executor: Executor<number, ContextType>): number => {
            executor((state, handler, ctx) => {
                ctx.foo("run effect");
            });
            return state + count;
        }
    };

    let mockCallback = jest.fn();

    var actionsWithContext1 = scopeActionsWithCtxBuilder<number[], {}, ContextType>((key, state, handler, ctx) => ({
        foo: (arg: string) => {
            mockCallback(arg + " from " + key)
        }
    }))(subActions);

    // var actionsWithContext1 = scopeActions<number[]>()(subActions, (key, state, handler, ctx) => ({
    //     foo: (arg: string) => {
    //         mockCallback(arg + " from " + key)
    //     }
    // }))

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

test("use context builder in scoped action 2", async () => {

    type ContextType = { foo: (arg: string) => void };

    let subActions = {
        setValue: (count: number) => (state: number, executor: Executor<number, ContextType>): number => {
            executor((state, handler, ctx) => {
                ctx.foo("run effect");
            });
            return state + count;
        }
    };

    let mockCallback = jest.fn();

    var actionsWithContext1 = scopeActions<number[]>()(subActions, (key, state, handler, ctx) => ({
        foo: (arg: string) => {
            mockCallback(arg + " from " + key)
        },
    }))

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
    let subActions = {
        actionWithEffect: () => (state: number, executor: Executor<number>) => {
            executor(async (state, handler) => {
                await sleep(10);
                return handler(subActions.increment())
            });
            return state + 1;
        },

        increment: () => (state: number, executor: Executor<number>) => {
            return state + 1;
        },

    };
    let actions = scopeActions<State>("scope")(subActions);

    let initialState = {scope: 0};

    var store = new Store(initialState);

    store.update(actions.increment());
    expect(store.state).toEqual({scope: 1});

    var promise = store.update(actions.actionWithEffect());
    expect(store.state).toEqual({scope: 2});
    await promise;
    expect(store.state).toEqual({scope: 3});

});


//TODO : choose and fix
xtest("don't fire state update in synchronous effect", async () => {
    let store = new Store(0);
    const listener = jest.fn();
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
    let forbiddenEffect = jest.fn();
    let promise = store.update((state, effects) => {
        effects(async () => {
            await sleep(100);
            effects(forbiddenEffect);
        });
        return state + 1;
    });

    let error: any;
    await promise.catch((e) => {
        error = e;
    });
    expect(error).toBeDefined()
    expect(forbiddenEffect.mock.calls.length).toBe(0);
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
    const effect: Effect<number> = async (state, handler, ctx) => {
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