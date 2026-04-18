import { State } from '../lib-ref/mbr-state';

const MAX_RECORDS = 20;

function pickItemByIndex<T> (items: T[], itemIndex: number) {
  const item: T | null = items[itemIndex] || null;

  if (item) {
    for (let index = itemIndex ; index < items.length ; ++index) {
      const next = items[index + 1];
      if (next) {
        items[index] = next;
      }
    }
  }

  return item;
}

/*
function pickItem (items: Info[], title: string) {
  const itemIndex = items.findIndex(function (item) { return item.title === title });
  return pickItemByIndex(items, itemIndex);
}
*/

export class StoragePull<T> {
  state: State<T[]>;
  picker: (item: T, compareTo: T) => boolean;

  constructor(key: string, picker: (item: T, compareTo: T) => boolean) {
    this.state = new State<T[]>([], { localStorageKey: key });
    this.picker = picker;
  }

  put(info: T) {
    if (this.checkLast(info)) {
      return info;
    }

    const storage = this;
    const count = this.state.state.length;
    const newList = ([] as T[]).concat(this.state.state);
    const index = newList.findIndex(function (item) { return storage.picker(item, info) });
    const pickedItem = pickItemByIndex(newList, index);

    if (pickedItem) {
      newList[newList.length - 1] = info;
    } else if (count < MAX_RECORDS) {
      newList.push(info);
    } else {
      pickItemByIndex(newList, 0);
      newList[newList.length - 1] = info;
    }

    this.state.set(newList);

    return info;
  }

  get({ clone }: { clone?: boolean } = {}) {
    if (clone) {
      const result: T[] = [];
      return result.concat(this.state.state);
    }

    return this.state.state;
  }

  getLast() {
    return this.state.state[this.state.state.length - 1] || null;
  }

  checkLast(info: T) {
    const last = this.getLast();

    if (last && JSON.stringify(last) === JSON.stringify(info)) {
      return true;
    }

    return false;
  }

  find(callback: (info: T) => boolean) {
    for (let index = this.state.state.length -1 ; index >= 0 ; --index) {
      const item = this.state.state[index];
      if (item && callback(item)) {
        return item;
      }
    }

    return null;
  }
}
