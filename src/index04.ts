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

export { };

// 考察方向：Rxjs
// 参考文章：https://blog.csdn.net/w178191520/article/details/86299162