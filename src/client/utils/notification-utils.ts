const IDLE_TIMEOUT = 15 * 60 * 1000;

type Info = { timer: ReturnType<typeof setTimeout> | null};

export const firstMessage = {
  users: {} as Record<string, Info>,

  check(userId: string) {
    let result = false;

    if (!(userId in this.users)) {
      this.users[userId] = { timer: null };
      result = true;
    }

    this.setTimer(userId);

    return result;
  },

  setTimer(userId: string) {
    if (this.users[userId]) {
      if (this.users[userId].timer) {
        clearTimeout(this.users[userId].timer);
      }

      this.users[userId].timer = setTimeout(function () {
        delete firstMessage.users[userId];
      }, IDLE_TIMEOUT);
    }
  }
};
