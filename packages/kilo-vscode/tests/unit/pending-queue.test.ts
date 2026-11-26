import { describe, expect, it } from "bun:test"
import { createPendingQueue } from "../../src/kilo-provider/pending-queue"

describe("createPendingQueue", () => {
  it("flushes queued items in order and then stays empty", () => {
    const queue = createPendingQueue<string>()
    queue.push("first")
    queue.push("second")
    expect(queue.size()).toBe(2)
    expect(queue.take()).toEqual(["first", "second"])
    expect(queue.take()).toEqual([])
    expect(queue.size()).toBe(0)
  })

  it("keeps items pushed between takes", () => {
    const queue = createPendingQueue<number>()
    queue.push(1)
    expect(queue.take()).toEqual([1])
    queue.push(2)
    queue.push(3)
    expect(queue.take()).toEqual([2, 3])
  })
})
