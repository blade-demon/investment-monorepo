/**
 * 检查一个值是否为 Promise (Duck Typing check)
 * @param obj 待检查的值
 * @returns 是否为 Promise 的类型守卫
 */
export function isPromise<T = any>(obj: any): obj is Promise<T> {
  return (
    !!obj &&
    (typeof obj === 'object' || typeof obj === 'function') &&
    typeof obj.then === 'function'
  )
}
