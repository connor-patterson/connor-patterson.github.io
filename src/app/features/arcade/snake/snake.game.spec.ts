import { describe, expect, it } from 'vitest';

import { createSnakeState, startSnake, stepSnake, toggleSnakePause, turnSnake } from './snake.game';

describe('Snake rules', () => {
  it('creates the same food position for the same seed', () => {
    expect(createSnakeState(42).food).toEqual(createSnakeState(42).food);
    expect(createSnakeState(42).food).not.toEqual(createSnakeState(43).food);
  });

  it('moves one cell in the current direction', () => {
    const running = startSnake(createSnakeState(5, 10));
    const moved = stepSnake(running);

    expect(moved.snake[0]).toEqual({ x: running.snake[0]!.x + 1, y: running.snake[0]!.y });
    expect(moved.snake).toHaveLength(running.snake.length);
  });

  it('does not reverse directly into itself', () => {
    const running = startSnake(createSnakeState(5));
    expect(turnSnake(running, 'left')).toBe(running);
  });

  it('grows and scores when the snake eats an apple', () => {
    const running = startSnake(createSnakeState(5, 10));
    const head = running.snake[0]!;
    const ate = stepSnake({ ...running, food: { x: head.x + 1, y: head.y } });

    expect(ate.score).toBe(1);
    expect(ate.snake).toHaveLength(4);
    expect(ate.food).not.toBeNull();
  });

  it('ends the game when the snake reaches a wall', () => {
    const running = startSnake(createSnakeState(5, 8));
    const atEdge = {
      ...running,
      snake: [
        { x: 7, y: 4 },
        { x: 6, y: 4 },
        { x: 5, y: 4 },
      ],
    };

    expect(stepSnake(atEdge).status).toBe('game-over');
  });

  it('pauses without moving and resumes cleanly', () => {
    const running = startSnake(createSnakeState(5));
    const paused = toggleSnakePause(running);

    expect(stepSnake(paused)).toBe(paused);
    expect(toggleSnakePause(paused).status).toBe('running');
  });
});
