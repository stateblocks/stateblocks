# State Blocks

> Javascript/Typescript functional state container with composability and side effects management.

StateBlocks is inspired by [The Elm Architecture](https://guide.elm-lang.org/architecture/). 
It borrows some naming convention from [Redux](https://redux.js.org/).

## Features

- Pure functional state update
- Well defined side-effect management
- Easy composition
- Management of impure or statefull code through context
- Invocation of actions in UI components in a natural way.  
- Strongly typed

## Getting started

State is updated with **reducers**. 
A reducer is a function returning a new state computed from the current state.
Reducers should be pure functions without side effects. Side effects management is explained later.

Reducers are functions with signature : `(state) => state`

### Creating reducers

Reducers are created by **Actions**. An action take some arguments and returns a reducer.

Actions are functions with signature : `(...args) => (state) => state`
 
[filename](quickstart.test.js ':include :type=code :fragment=actions')

### Creating store

State is held in a **Store**. The store is in charge of applying reducers,
keeping a reference to the evolving state and managing side-effects. You will typically have one Store for your whole applications.

[filename](quickstart.test.js ':include :type=code :fragment=store')


### Using side effects

Reducers can define side-effects while remaining pure functions.
Effects are functions dispatched by the reducer to an **Executor** function. 
The executor is provided to the reducer function by the store.
Effects are executed by the store after reducer execution.

Reducer dispatching side effects have signature : `(state, executor) => state`. 
Executor is a function accepting a single `effect` function argument.

[filename](quickstart.test.js ':include :type=code :fragment=effect')

#### Dispatching updates from side effects

Side effects can trigger state updates by dispatching reducers to a
handler. Side affect are given 3 parameters by the executor :
  - `state` : the current state **after** reducer execution
  - `handler`: a handler accepting reducers
  - `context` : (more on this later)



[filename](quickstart.test.js ':include :type=code :fragment=effect-update')

#### Using effect context


In the previous example, we used the browser API to perform side effects
(`Math.random` and `console.log`). In real real-world applications, you will
certainly rely on network calls or data I/O in your side effects.

Side effects are allowed to perform any imperative, statefull operations. 
To avoid relying on global variables, side effects can depend on context
data. Context can be used to provide effects with statefull objects like
data storage APIs or any impure code. Let's say we have a `dataStorage` instance
available for use in our app with API `{saveValue: (value) => void, loadValue: () = value, ...}` 

[filename](quickstart.test.js ':include :type=code :fragment=effect-context')

> Context can be seen as the impure and mutable state of your application. Effects are used to perform manipulations
involving context without loosing reducers purity.

In bigger applications, you would typically provide context values in your application entry point.

### Composition

Actions can be composed easily.
The `scopeActions` utility function takes an actions map, an wraps it to
create a new action map working on a key-value shaped state

[filename](quickstart.test.js ':include :type=code :fragment=scope-actions')

We can now compose the counter actions to create a double-counter. We will
compose the actions map like the state shape, but this is not required. 
Note that we didn't need to modify the original actions to reuse
them in our double-counter.

[filename](quickstart.test.js ':include :type=code :fragment=double-counters')

Composition also works with arrays of substates. We will create a
store that can work on a list of counters.

[filename](quickstart.test.js ':include :type=code :fragment=array-counters')

#### Context composition

For the double-counter actions to work with side effects we need to provide the required context. Context is propagated
to children actions when using `provideContext`, but there is no way to determine which sub-counter triggered the effect.
The `scopeActionsWithContextBuilder` function let us provide a specific context depending on the current scope. 

[filename](quickstart.test.js ':include :type=code :fragment=context-builder')

## Usage with React




## Summarized

- **Reducers** : pure functions creating new state from the previous state. Reducers can accept an Executor argument to dispatch
side effect functions.
- **Actions** : pure functions creating reducers from parameters
- **Effect** : impure functions used to perform side effects. Effects are dispatched by reducers to an executor
- **Executor** : function receiving effects dispatched by reducers. Effects gathered by the executor are executed after state update by the reducer
- **Store**
    - holds current state value
    - receives and executes reducers
    - call the reducers with the current state and an executor. Saves the new states returned by the reducers
    - executes side effects
    - notify subscribers of states udpates