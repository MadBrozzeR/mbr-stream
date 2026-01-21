type ListNode<T> = {
  value: T;
  next: ListNode<T> | null;
};

export class List<T> {
  root: ListNode<T> | null = null;
  last: ListNode<T> | null = null;

  add(value: T) {
    const node = { value, next: null };

    if (this.last) {
      this.last = this.last.next = node;
    } else {
      this.root = this.last = node;
    }

    return value;
  }

  remove(check: (value: T) => boolean) {
    const list = this;

    this.iterate(function (_, node) {
      // TODO First element cannot be removed this way
      if (node.next && check(node.next.value)) {
        node.next = node.next.next;
        if (!node.next) {
          list.last = node;
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
