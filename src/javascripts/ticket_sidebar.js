import $ from 'jquery';
import View from 'view';
import Storage from 'storage';
import Prello from 'prello';

class TicketSidebar {
  constructor(client, data) {
    this.client = client;
    this._metadata = data.metadata;
    this._context = data.context;

    this.storage = new Storage(this._metadata.installationId);
    this.view = new View();
    this.prello = new Prello(this.client, this.getCurrentPrelloAccessToken());

    this.renderLogin = this.renderLogin.bind(this)
    this.renderMain = this.renderMain.bind(this)
    this.renderCreateCard = this.renderCreateCard.bind(this)
    this.renderAttachCard = this.renderAttachCard.bind(this)
    this.renderAttachedTicket = this.renderAttachedTicket.bind(this)

    this.prello.getMe().then(
      response => {
        this.renderMain();
      },
      error => {
        this.getCurrentUser().then(this.renderLogin);
      }
    );

    this.view.switchTo('loading');
    this.client.invoke('resize', { width: '100%', height: '250px' });
  }

  // REQUEST FUNCTIONS

  getCurrentUser() {
    return this.client.request({ url: '/api/v2/users/me.json' });
  }

  getCurrentTicket() {
    return this.client.get('ticket');
  }

  getCurrentPrelloUser() {
    return this.storage.set('prello:userId');
  }

  setCurrentPrelloUser(userId) {
    this.storage.set('prello:userId', userId);
  }

  getCurrentPrelloAccessToken() {
    return this.storage.get('prello:accessToken');
  }

  setCurrentPrelloAccessToken(accessToken) {
    this.storage.set('prello:accessToken', accessToken);
  }

  // RENDER FUNCTIONS

  renderLogin(data) {
    this.getCurrentUser()
    .then(data => {
      this.view.switchTo('login', data.user);
      $('#login').addEventListener('click', this.login.bind(this));
    });
  }

  renderMain() {
    // If we have a card id that means the tickets is already attached to a card
    // thus, we render the attached-car view, else we render the view to attach the ticket
    // to a card
    this.getCardIdFromTicket()
    .then(cardId => {
        this.renderAttachedTicket(cardId);
    })
    .catch(() => {
      this.view.switchTo('main');
      $('#create-card').on('click', this.renderCreateCard);
      $('#attach-card').on('click', this.renderAttachCard);
    })
  }

  renderCreateCard() {
    this.view.switchTo('create-card');
    $('#back').on('click', (e) => {
      e.preventDefault();
      this.renderMain();
    });

    const boardSelector = $('#board-selector')
    const listSelector = $('#list-selector')
    const saveBtn = $('#save-btn')

    const boardSelectorSeeLink = $('#board-selector-see')
    boardSelectorSeeLink.hide()
    boardSelectorSeeLink.on('click', (e) => {
      e.preventDefault();
      window.open(this.prello.getBoardUrl(boardSelector.val()), '_blank');
    });

    // Create the card then save it in the ticket
    saveBtn.on('click', () => {
      this.getCurrentTicket()
      .then(result => result.ticket)
      .then(ticket =>
          this.prello.createCard(listSelector.val(), {
            name: ticket.subject,
            desc: ticket.description
          })
      )
      .then(card => this.saveCardIdInTicket(card.id))
      .then(() => {
        this.client.invoke('notify', 'Prello card created!', 'notice');
        this.renderMain();
      })
      .catch(error => this.renderError(error));
    });

    // Fill the boards select list
    this.prello.getBoards(
      this.getCurrentPrelloUser()
    )
    .then(boards => {
      boards.forEach(board => {
        boardSelector.append(`<option value="${board.id}">${board.name}</option>`);
      });
    })
    .catch(error => this.renderError(error));

    // Handle changes when a board is selected
    boardSelector.change(() => {
      boardSelectorSeeLink.show();
      // Update list select  list and confirm button
      const rootOption =  listSelector.find(">:first-child");
      listSelector.empty();
      listSelector.append(rootOption);
      listSelector.prop('disabled', false);
      saveBtn.prop('disabled', true);

      // Fill the lists select list
      this.prello.getLists(boardSelector.val())
      .then(lists => {
        lists.forEach(list => {
          listSelector.append(`<option value="${list.id}">${list.name}</option>`);
        });
      })
      .catch(error => this.renderError(error));
    });

    // Handle changes when a list is selected
    listSelector.change(() => {
      saveBtn.prop('disabled', false);
    });
  }

  renderAttachCard() {
    
  }

  renderAttachedTicket(cardId) {
    this.prello.getCardExtended(cardId)
    .then(card => {
      this.view.switchTo('attached-card', card);
      $('#open-card').on('click', () => {
        window.open(this.prello.getCardUrl(card.list.board.id, card.id), '_blank')
      });
    })
    .catch(error => this.renderError(error));
  }

  renderError(error) {
    console.log(error);
  }

  // HELPER FUNCTIONS

  getCardIdFromTicket() {
    return this.client.get('ticket.tags').then(data => {
      const tags = data['ticket.tags']
      if (tags) {
        const tag = tags.find(tag => tag.startsWith('prello#'))
        if (tag) {
          return tag.substring('prello#'.length)
        }
      } 
      throw new Error('Prello card id not found')
    })
  }

  saveCardIdInTicket(cardId) {
    return this.client.invoke('ticket.tags.add', `prello#${cardId}`)
  }

}

export default TicketSidebar;
