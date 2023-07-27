import { reducer } from './reducer';

const listeners = [];

let state;
const getState = () => state;

const dispatch = (action) => {
  state = reducer(action, state);
  listeners.forEach((listener) => listener());
};

const subscribe = (listener) => {
  listeners.push(listener);
  return () => listeners.filter((lis) => lis !== listener);
};

export { getState, dispatch, subscribe };
