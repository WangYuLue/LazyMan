class _LazyMan {
  queue: any[] = [];
  constructor(name: string) {
    this.sayName(name);

    setTimeout(() => {
      this.next();
    })
  }

  next() {
    const fn = this.queue.shift();
    fn && fn();
  }

  _holdOn(time) {
    return () => {
      setTimeout(() => {
        console.log(`Wake up after ${time} second`)
        this.next()
      }, time * 1000)
    }
  }

  sayName(name) {
    const fn = () => {
      console.log(`Hi! This is ${name}!`);
      this.next();
    }
    this.queue.push(fn);
  }

  sleep(time: number) {
    this.queue.push(this._holdOn(time));
    return this;
  }

  eat(some: string) {
    const fn = () => {
      console.log(`Eat ${some}~`);
      this.next();
    }
    this.queue.push(fn);
    return this;
  }

  sleepFirst(time: number) {
    this.queue.unshift(this._holdOn(time));
    return this;
  }
}

const LazyMan = (name: string) => new _LazyMan(name);

LazyMan('Hank').sleepFirst(2).eat('dinner').sleep(3).eat('supper');

export { };

// 考察方向：JavaScript流程控制，事件循环
// 参考文章：https://zhuanlan.zhihu.com/p/22387417