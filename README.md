# LazyMan

本教程会用多种方式来实现一个 `LazyMan`。

先来了解一下什么是 `LazyMan`, `LazyMan`方法可以按照以下方式调用:

```js

LazyMan('Hank');
// 输出:
// Hi! This is Hank!

LazyMan('Hank').sleep(3).eat('dinner')
// 输出:
// Hi! This is Hank!
// //等待3秒..
// Wake up after 3
// Eat dinner~

LazyMan('Hank').eat('dinner').eat('supper')
// 输出:
// Hi This is Hank!
// Eat dinner~
// Eat supper~

LazyMan('Hank').sleepFirst(2).eat('dinner').sleep(3).eat('supper')
// 输出:
// //等待2秒..
// Wake up after 2
// Hi This is Hank!
// Eat dinner~
// //等待3秒..
// Wake up after 2
// Eat supper~

// 以此类推
```

一般思路可以通过 **任务队列** 来解决 `LazyMan` 问题，结合 **Promise** 或者 **async** 还可以更加优雅的实现。

还可另辟蹊径通过 **RxJS** 以及其丰富的操作符来解决 `LazyMan` 问题。

### 1、任务队列实现

这种模式类似 **中间件模式**， 核心是 `next` 方法，每当队列中的一个方法执行完都会调用 `next` 来执行队列中的另外一个方法，直到全部执行完成。

而构造函数中的 `setTimeout` 保证了队列开始执行的时间是在下一个事件循环中，从而确保当前的链式调用中的所有行为能够再调用之前被加载进队列 之中。

```ts
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
```

### 2、任务队列 + `Promise` 实现

使用 `Promise` 来实现很讨巧，可以用 `Promise` 的天然异步来替代 **方法一** 中的 `next` 调用方式

```ts
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
```

### 3、任务队列 + `async` 实现

这种实现方式和 **方法二** 的实现方式差别不大，只不过用 `async` 的方式来实现更加优雅

```ts
class _LazyMan {
  queue: any[] = [];
  name: string;
  constructor(name) {
    this.name = name
    this.queue = [() => this.sayName(name)]
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
```

### 4、RxJS实现

基于 RxJS 的实现方式让人看起来耳目一新，不过需要读者朋友拥有良好的 RxJS 基础。

RxJS 对异步的天然支持以及丰富的操作符让这一切变的非常简单。

在实现 `LazyMan` 中，核心是 `concatAll` 操作符，他会收集所有 observables，并在当前一个完成时订阅下一个。

```ts
import { from, of } from 'rxjs';
import { map, concatAll, delay } from 'rxjs/operators';

class _LazyMan {
  tasks: any[] = [];

  constructor(name: string) {
    this.sayName(name);

    setTimeout(() => {
      from(this.tasks).pipe(
        map(item => {
          if (item.timeout) {
            return of(item).pipe(delay(item.timeout))
          }
          return of(item)
        }),
        concatAll()
      ).subscribe(res => res.fn())
    })
  }

  sayName(name) {
    this.tasks.push({
      fn: () => console.log(`Hi! This is ${name}!`)
    });
  }

  sleep(time: number) {
    this.tasks.push({
      timeout: time * 1000,
      fn: () => console.log(`Wake up after ${time} second`)
    });
    return this;
  }

  eat(some: string) {
    this.tasks.push({
      fn: () => console.log(`Eat ${some}~`)
    });
    return this;
  }

  sleepFirst(time: number) {
    this.tasks.unshift({
      timeout: time * 1000,
      fn: () => console.log(`Wake up after ${time} second`)
    });
    return this;
  }
}

const LazyMan = (name: string) => new _LazyMan(name);

LazyMan('Hank').sleepFirst(2).eat('dinner').sleep(3).eat('supper');
```

### 相关链接

[如何实现一个LazyMan?](https://zhuanlan.zhihu.com/p/22387417)

[LazyMan 有几样写法，你知道么？](https://github.com/fi3ework/blog/issues/36)

[LazyMan 的Rxjs实现方式](https://blog.csdn.net/w178191520/article/details/86299162)