import { nextRandom } from '../arcade-session';

export type SnakeDirection = 'up' | 'down' | 'left' | 'right';
export type SnakeStatus = 'ready' | 'running' | 'paused' | 'game-over' | 'won';

export interface SnakePoint {
  readonly x: number;
  readonly y: number;
}

export interface SnakeState {
  readonly boardSize: number;
  readonly snake: readonly SnakePoint[];
  readonly food: SnakePoint | null;
  readonly direction: SnakeDirection;
  readonly queuedDirection: SnakeDirection;
  readonly status: SnakeStatus;
  readonly score: number;
  readonly randomSeed: number;
  readonly announcement: string;
}

const DIRECTION_STEP: Readonly<Record<SnakeDirection, SnakePoint>> = Object.freeze({
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
});

const OPPOSITE: Readonly<Record<SnakeDirection, SnakeDirection>> = Object.freeze({
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
});

function samePoint(first: SnakePoint, second: SnakePoint): boolean {
  return first.x === second.x && first.y === second.y;
}

function findFood(
  boardSize: number,
  snake: readonly SnakePoint[],
  seed: number,
): readonly [SnakePoint | null, number] {
  const openCells: SnakePoint[] = [];

  for (let y = 0; y < boardSize; y += 1) {
    for (let x = 0; x < boardSize; x += 1) {
      const cell = { x, y };
      if (!snake.some((segment) => samePoint(segment, cell))) {
        openCells.push(cell);
      }
    }
  }

  if (openCells.length === 0) {
    return [null, seed] as const;
  }

  const [random, nextSeed] = nextRandom(seed);
  return [openCells[Math.floor(random * openCells.length)] ?? openCells[0]!, nextSeed] as const;
}

export function createSnakeState(seed: number, boardSize = 16): SnakeState {
  const safeSize = Math.max(8, Math.floor(boardSize));
  const middle = Math.floor(safeSize / 2);
  const snake: readonly SnakePoint[] = [
    { x: middle + 1, y: middle },
    { x: middle, y: middle },
    { x: middle - 1, y: middle },
  ];
  const [food, randomSeed] = findFood(safeSize, snake, seed);

  return {
    boardSize: safeSize,
    snake,
    food,
    direction: 'right',
    queuedDirection: 'right',
    status: 'ready',
    score: 0,
    randomSeed,
    announcement: 'Snake is ready.',
  };
}

export function startSnake(state: SnakeState): SnakeState {
  if (state.status !== 'ready') {
    return state;
  }
  return { ...state, status: 'running', announcement: 'Game started.' };
}

export function turnSnake(state: SnakeState, direction: SnakeDirection): SnakeState {
  if (
    state.status !== 'running' ||
    state.queuedDirection !== state.direction ||
    OPPOSITE[state.direction] === direction
  ) {
    return state;
  }
  return { ...state, queuedDirection: direction };
}

export function stepSnake(state: SnakeState): SnakeState {
  if (state.status !== 'running') {
    return state;
  }

  const direction = state.queuedDirection;
  const head = state.snake[0]!;
  const delta = DIRECTION_STEP[direction];
  const nextHead = { x: head.x + delta.x, y: head.y + delta.y };
  const ate = state.food !== null && samePoint(nextHead, state.food);
  const bodyToCheck = ate ? state.snake : state.snake.slice(0, -1);
  const hitWall =
    nextHead.x < 0 ||
    nextHead.y < 0 ||
    nextHead.x >= state.boardSize ||
    nextHead.y >= state.boardSize;
  const hitSelf = bodyToCheck.some((segment) => samePoint(segment, nextHead));

  if (hitWall || hitSelf) {
    return {
      ...state,
      direction,
      queuedDirection: direction,
      status: 'game-over',
      announcement: `Game over with ${state.score} ${state.score === 1 ? 'apple' : 'apples'}.`,
    };
  }

  const snake = [nextHead, ...state.snake];
  if (!ate) {
    snake.pop();
    return { ...state, snake, direction, queuedDirection: direction };
  }

  const score = state.score + 1;
  const [food, randomSeed] = findFood(state.boardSize, snake, state.randomSeed);
  const won = food === null;
  return {
    ...state,
    snake,
    food,
    direction,
    queuedDirection: direction,
    status: won ? 'won' : 'running',
    score,
    randomSeed,
    announcement: won ? 'You filled the board!' : `Apple eaten. Score ${score}.`,
  };
}

export function toggleSnakePause(state: SnakeState): SnakeState {
  if (state.status === 'running') {
    return { ...state, status: 'paused', announcement: 'Game paused.' };
  }
  if (state.status === 'paused') {
    return { ...state, status: 'running', announcement: 'Game resumed.' };
  }
  return state;
}
