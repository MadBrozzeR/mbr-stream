import { ActionList } from './action-list';
import { Modal } from './modal';
import { UserInfo } from './user-name';
import { newComponent } from '/@client/splux-host';

export const UserModal = newComponent(`${Modal.tag}.user_modal`, function () {
  const host = this.host;
  const modal = Modal.call(this, this, {});
  const list = modal.content.dom(ActionList, {});

  return {
    open(user: UserInfo) {
      modal.show();
      modal.setTitle(user.name);
      list.set([
        {
          text: 'request clips',
          action() {
            modal.loader(host.send({
              action: 'get-clips',
              payload: { broadcaster: user.id },
            })).then(function (response) {
              list.set(response.map(function (item) {
                return {
                  text: (item.is_featured ? '* ' : '') + item.title,
                  action() {
                    modal.loader(host.send({
                      action: 'show-clip',
                      payload: { id: item.id, duration: item.duration * 1000 },
                    })).then(function () {
                      modal.close();
                    });
                  },
                };
              }));
            });
          },
        },
      ]);
    }
  };
});
