export function createPendingQueue<T>() {
  const items: T[] = []
  return {
    push(item: T) {
      items.push(item)
    },
    take(): T[] {
      return items.splice(0)
    },
    size() {
      return items.length
    },
  }
}
