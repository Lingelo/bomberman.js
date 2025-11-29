import { reducer } from './reducer';
import type { GameState, GameAction, Listener, Unsubscribe } from '../types';

const listeners: Listener[] = [];

let state: GameState = reducer({ type: '@@INIT' }, undefined as unknown as GameState);

const getState = (): GameState => state;

const dispatch = (action: GameAction): void => {
  state = reducer(action, state);
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: Listener): Unsubscribe => {
  listeners.push(listener);
  return () => {
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  };
};

export { getState, dispatch, subscribe };
