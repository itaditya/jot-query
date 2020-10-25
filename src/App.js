import React, { Suspense, useState } from "react";
import { atom, useAtom } from "jotai";

import { createFetcher } from "./jotquery";

// Basic Usage

function getTodos(params) {
  const { userId } = params;

  const query = userId ? `?userId=${userId}` : "";
  return fetch(
    `https://jsonplaceholder.typicode.com/todos${query}`
  ).then((res) => res.json());
}

// create a fetcher instance.
const [
  useTodos,
  useDispatch,
  paramsAtom,
  currentCacheAtom,
  cacheKeyAtom
] = createFetcher(getTodos, { initialData: [], initialParams: {} });

// use custom hook to get todos and paramsAtom to get or set params.
function TodoControls() {
  const todos = useTodos();
  const [params, setParams] = useAtom(paramsAtom);

  function changeUser(userId) {
    if (userId) {
      setParams({
        ...params,
        userId
      });
    } else {
      setParams({});
    }
  }

  return (
    <div>
      <p>{Math.random()}</p>
      <TodoNums />
      <TodoCompletedNums />
      <TodoCreator />
      <hr />
      <button onClick={() => changeUser()}>All</button>
      <button onClick={() => changeUser(1)}>User 1</button>
      <button onClick={() => changeUser(2)}>User 2</button>
      <hr />
      <pre>{JSON.stringify(todos, null, 2)}</pre>
    </div>
  );
}

function App() {
  const [state, setState] = useState({});

  return (
    <div>
      <button onClick={() => setState({})}>Re-Render</button>
      <hr />
      <Suspense fallback={<p>Loading...</p>}>
        <TodoControls />
      </Suspense>
    </div>
  );
}

// Advanced Usage

// cache atom can be accessed too
function TodoNums() {
  const [cachedTodos] = useAtom(currentCacheAtom);

  const todos = cachedTodos || [];

  return <p>Total Todos- {todos.length}</p>;
}

// create derived atoms out of API cache atom
const completedTodosAtom = atom((get) => {
  const todos = get(currentCacheAtom) || [];
  const completedTodos = todos.filter((todo) => todo.completed);
  return completedTodos;
});

// using custom derived atom in app
function TodoCompletedNums() {
  const [completedTodos] = useAtom(completedTodosAtom);

  return <p>Completed Todos- {completedTodos.length}</p>;
}

// a delayed POST request
function createTodo(body) {
  return new Promise((resolve) => {
    setTimeout(async () => {
      const res = await fetch("https://jsonplaceholder.typicode.com/todos", {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
          "Content-type": "application/json; charset=UTF-8"
        }
      });
      const data = await res.json();
      resolve(data);
    }, 4000);
  });
}

// making mutations and updating cache is your respoonsibility.
function TodoCreator() {
  const [params] = useAtom(paramsAtom);
  const [cachedTodos, setCachedTodos] = useAtom(currentCacheAtom);
  const [cacheKey] = useAtom(cacheKeyAtom);
  const dispatch = useDispatch();
  const [stateText, setText] = useState("");

  function handleInvalidate() {
    // if you don't wanna update cache yourself, just dispatch
    // invalidate action and data is refetched from server
    dispatch({
      type: "invalidate"
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const body = {
      userId: params.userId || 1,
      title: stateText,
      completed: false
    };
    const data = await createTodo(body);
    const newTodos = [data, ...cachedTodos];
    setCachedTodos({
      [cacheKey]: newTodos
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={stateText}
        onChange={(e) => setText(e.target.value)}
      />
      <button type="submit">Add Todo</button>
      <button type="button" onClick={handleInvalidate}>
        Invalidate
      </button>
    </form>
  );
}

export default App;
