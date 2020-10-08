class _LazyMan {
  queue: any[] = [];
  name: string;
  constructor(name) {
    this.name = name
    this.queue = [() => this.sayName(name)]
    Promise.resolve().then(() => {
      let sequence = Promise.resolve()
      this.queue.forEach(item => {
        sequence = sequence.then(item)
      })
    })
  }

  sayName(name) {
    return new Promise((resolve) => {
      console.log(`Hi! this is ${name}!`)
      resolve()
    })
  }

  holdOn(time) {
    return () => new Promise(resolve => {
      setTimeout(() => {
        console.log(`Wake up after ${time} second`)
        resolve()
      }, time * 1000)
    })
  }

  sleep(time) {
    this.queue.push(this.holdOn(time))
    return this
  }

  eat(meal) {
    this.queue.push(() => {
      console.log(`eat ${meal}`)
    })
    return this
  }

  sleepFirst(time) {
    this.queue.unshift(this.holdOn(time))
    return this
  }
}

const LazyMan = (name: string) => new _LazyMan(name);

LazyMan('Hank').sleepFirst(2).eat('dinner').sleep(3).eat('supper');

export { };

// 参考文章：https://github.com/fi3ework/blog/issues/36