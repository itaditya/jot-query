import React, { Suspense, useState } from "react";
import { atom, useAtom } from "jotai";

import { createFetcher } from "./jotquery";

const [useTodos, paramsAtom, currentCacheAtom] = createFetcher(
  (params) => {
    const { userId } = params;

    const query = userId ? `?userId=${userId}` : "";
    return fetch(
      `https://jsonplaceholder.typicode.com/todos${query}`
    ).then((res) => res.json());
  },
  {
    initialData: [],
    initialParams: {}
  }
);

const completedTodosAtom = atom((get) => {
  const todos = get(currentCacheAtom) || [];
  const completedTodos = todos.filter((todo) => todo.completed);
  return completedTodos;
});

function TodoControls() {
  const [params, setParams] = useAtom(paramsAtom);
  const [todos, dispatch] = useTodos();

  function invalidate() {
    dispatch({
      type: "invalidateCache"
    });
  }

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
      <button onClick={() => changeUser()}>All</button>
      <button onClick={() => changeUser(1)}>User 1</button>
      <button onClick={() => changeUser(2)}>User 2</button>
      <button onClick={invalidate}>Invalidate</button>
      <hr />
      <p>{Math.random()}</p>
      <TodoNums />
      <TodoCompletedNums />
      <pre>{JSON.stringify(todos, null, 2)}</pre>
    </div>
  );
}

function TodoNums() {
  const [cachedTodos] = useAtom(currentCacheAtom);

  const todos = cachedTodos || [];

  return <p>Total Todos- {todos.length}</p>;
}

function TodoCompletedNums() {
  const [completedTodos] = useAtom(completedTodosAtom);

  return <p>Completed Todos- {completedTodos.length}</p>;
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

export default App;
