type ListNode<T> = {
  value: T;
  next: ListNode<T> | null;
  prev: ListNode<T> | null;
};

export class List<T> {
  root: ListNode<T> | null = null;
  last: ListNode<T> | null = null;

  add(value: T) {
    const node = { value, next: null, prev: this.last };

    if (this.last) {
      this.last = this.last.next = node;
    } else {
      this.root = this.last = node;
    }

    return value;
  }

  remove(check: (value: T) => boolean) {
    const list = this;

    return this.iterate(function (value, node) {
      if (check(value)) {
        if (list.root === node) {
          list.root = node.next;
        }
        if (list.last === node) {
          list.last = node.prev;
        }
        if (node.prev) {
          node.prev.next = node.next;
        }

        return true;
      }

      return false;
    });
  }

  iterate(callback: (value: T, node: ListNode<T>) => (boolean | void)) {
    let current = this.root;

    while (current) {
      if (callback(current.value, current)) {
        return current.value;
      };

      current = current.next;
    }

    return null;
  }
}
