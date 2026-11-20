import { Array, Match, Option, Predicate, pipe } from 'effect'

/** Whether a keyboard event key is a single printable character (not a named key like "Enter" or "ArrowDown"). */
export const isPrintableKey = (key: string): boolean => key.length === 1

export const wrapIndex = (index: number, length: number): number =>
  ((index % length) + length) % length

export const findFirstEnabledIndex =
  (
    itemCount: number,
    focusedIndex: number,
    isDisabled: (index: number) => boolean,
    wrapAround = true,
  ) =>
  (startIndex: number, direction: 1 | -1): number => {
    const stepCount = wrapAround
      ? itemCount
      : direction === 1
        ? Math.max(0, itemCount - startIndex)
        : Math.max(0, startIndex + 1)
    return stepCount === 0
      ? focusedIndex
      : pipe(
          Array.makeBy(stepCount, step =>
            wrapAround
              ? wrapIndex(startIndex + step * direction, itemCount)
              : startIndex + step * direction,
          ),
          Array.findFirst(Predicate.not(isDisabled)),
          Option.getOrElse(() => focusedIndex),
        )
  }

export const keyToIndex = (
  nextKey: string,
  previousKey: string,
  itemCount: number,
  focusedIndex: number,
  isDisabled: (index: number) => boolean,
  wrapAround = true,
): ((key: string) => number) => {
  const find = findFirstEnabledIndex(
    itemCount,
    focusedIndex,
    isDisabled,
    wrapAround,
  )

  return (key: string): number =>
    Match.value(key).pipe(
      Match.when(nextKey, () => find(focusedIndex + 1, 1)),
      Match.when(previousKey, () => find(focusedIndex - 1, -1)),
      Match.whenOr('Home', 'PageUp', () => find(0, 1)),
      Match.whenOr('End', 'PageDown', () => find(itemCount - 1, -1)),
      Match.orElse(() => focusedIndex),
    )
}
