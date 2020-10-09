class _LazyMan {
  queue: any[] = [];
  name: string;
  constructor(name) {
    this.name = name
    this.sayName(name)
    setTimeout(async () => {
      for (let todo of this.queue) {
        await todo()
      }
      // 下面这种写法也可以
      // for await (let todo of this.queue) {
      //   todo()
      // }
    })
  }

  sayName(name) {
    this.queue.push(() => {
      console.log(`Hi! this is ${name}!`)
    })
    return this
  }

  eat(meal) {
    this.queue.push(() => {
      console.log(`eat ${meal}`)
    })
    return this
  }

  _holdOn(time) {
    return () => new Promise(resolve => {
      setTimeout(() => {
        console.log(`Wake up after ${time} second`)
        resolve()
      }, time * 1000)
    })
  }

  sleep(time) {
    this.queue.push(this._holdOn(time))
    return this
  }

  sleepFirst(time) {
    this.queue.unshift(this._holdOn(time))
    return this
  }
}

const LazyMan = (name: string) => new _LazyMan(name);

LazyMan('Hank').sleepFirst(2).eat('dinner').sleep(3).eat('supper');

export { };

// 参考文章：https://github.com/fi3ework/blog/issues/36