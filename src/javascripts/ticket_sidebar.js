import View from 'view';
import Storage from 'storage';

class TicketSidebar {
  constructor(client, data) {
    this.client = client;
    this._metadata = data.metadata;
    this._context = data.context;

    this.storage = new Storage(this._metadata.installationId);
    this.view = new View();

    this.getCurrentUser().then(this.renderMain.bind(this));

    this.view.switchTo('loading');
  }

  openModal() {
    return window.open(
      'https://photon.igpolytech.fr/auth/login',
      'Login Popup',
      'width=500,height=500'
    );
  }

  getCurrentUser() {
    return this.client.request({ url: '/api/v2/users/me.json' });
  }

  renderMain(data) {
    this.view.switchTo('main', data.user);
    document.querySelector('#login').addEventListener('click', this.openModal.bind(this));
  }
}

export default TicketSidebar;
