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
    
    this.renderLogin = this.renderLogin.bind(this);
    this.renderMain = this.renderMain.bind(this);
    this.renderCreateOrAttachCard = this.renderCreateOrAttachCard.bind(this);
    this.renderListSelection = this.renderListSelection.bind(this);
    this.renderAttachToCard = this.renderAttachToCard.bind(this);
    
    this.login = this.login.bind(this);
    this.reboot = this.reboot.bind(this);
    
    this.reboot();

    this.getCurrentTicket().then(data => console.log(data))

    this.view.switchTo('loading');
    this.client.invoke('resize', { width: '100%', height: '270px' });
  }

  // REQUEST FUNCTIONS

  getOauthPageUrl() {
    return this.client.get('assetURL:oauth\\.html');
  }

  getCurrentUser() {
    return this.client.request({ url: '/api/v2/users/me.json' });
  }

  getCurrentTicket() {
    return this.client.get('ticket');
  }

  getCurrentPrelloUser() {
    return this.storage.get('prello:user');
  }

  setCurrentPrelloUser(user) {
    this.storage.set('prello:user', user);
  }

  getCurrentPrelloAccessToken() {
    return this.storage.get('prello:accessToken');
  }

  setCurrentPrelloAccessToken(accessToken) {
    this.storage.set('prello:accessToken', accessToken);
  }

  // RENDER FUNCTIONS

  renderLogin() {
    this.getCurrentUser()
    .then(data => {
      this.view.switchTo('login', data.user);
      $('#login').on('click', this.login);
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
      this.renderListSelection();
    })
  }

  renderCreateOrAttachCard(board, list) {
    this.view.switchTo('create-attach-card', {
      board: board,
      list: list
    });

    $('#cancel').on('click', (e) => {
      e.preventDefault();
      this.renderMain();
    });

    $('#create-card').on('click', () => {
      this.view.switchTo('loading');
      this.getCurrentTicket()
      .then(result => result.ticket)
      .then(ticket =>
          this.prello.createCard(list.id, {
            name: ticket.subject,
            desc: ticket.description
          })
      )
      .then(card => {
        this.writeZendeskAttachedComment(card.id);
        return this.saveCardIdInTicket(card.id);
      })
      .then(() => {
        this.client.invoke('notify', 'Prello card created!', 'notice');
        this.renderMain();
      })
      .catch(error => this.renderError(error));
    });

    $('#attach-card').on('click', () => this.renderAttachToCard(board, list));
  }

  renderListSelection() {
    const user = this.getCurrentPrelloUser();
    this.view.switchTo('main', user);

    let userBoards = [];
    let boardLists = [];

    const boardSelector = $('#board-selector');
    const listSelector = $('#list-selector');
    const saveBtn = $('#save-btn');

    const boardSelectorSeeLink = $('#board-selector-see');
    boardSelectorSeeLink.hide();
    boardSelectorSeeLink.on('click', (e) => {
      e.preventDefault();
      window.open(this.prello.getBoardUrl(boardSelector.val()), '_blank');
    });

    saveBtn.on('click', () => {
      this.renderCreateOrAttachCard(
        userBoards.find(b => b.id == boardSelector.val()),
        boardLists.find(l => l.id == listSelector.val())
      )
    });

    // Fill the boards select list
    this.prello.getBoards(
      this.getCurrentPrelloUser().uid
    )
    .then(boards => {
      userBoards = boards;
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
        boardLists = lists;
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

  renderAttachToCard(board, list) {
    this.view.switchTo('attach-card', {
      board: board,
      list: list
    });

    $('#cancel-attach-to-card').on('click', (e) => {
      e.preventDefault();
      this.renderCreateOrAttachCard(board, list);
    });

    const cardSelector = $('#card-selector');
    const saveBtn = $('#save-btn');

    saveBtn.on('click', () => {
      this.view.switchTo('loading');
      this.writeZendeskAttachedComment(cardSelector.val())
      .then(() => this.saveCardIdInTicket(cardSelector.val()))
      .then(() => {
        this.client.invoke('notify', 'Prello card created!', 'notice');
        this.renderMain();
      })
      .catch(error => this.renderError(error));
    });

    // Fill the cards select list
    this.prello.getCards(list.id)
    .then(cards => {
      cards.forEach(card => {
        cardSelector.append(`<option value="${card.id}">${card.name}</option>`);
      });
    })
    .catch(error => this.renderError(error));

    // Handle changes when a card is selected
    cardSelector.change(() => {
      saveBtn.prop('disabled', false);
    });
  }

  renderAttachedTicket(cardId) {
    this.prello.getCardExtended(cardId)
    .then(card => {
      this.view.switchTo('attached-card', card);
      $('#open-card').on('click', () => {
        window.open(this.prello.getCardUrl(card.list.board.id, card.id), '_blank');
      });

      $('#detach-card').on('click', () => {
        this.view.switchTo('loading');
        this.removeCardIdInTicket(card.id)
        .then(() => {
          this.renderMain();
        })
        .catch(error => this.renderError(error));
      });
    })
    .catch(error => this.renderError(error));
  }

  renderError(error) {
    console.log(error);
  }

  // HELPER FUNCTIONS

  reboot() {
    this.prello = new Prello(this.client, this.getCurrentPrelloAccessToken());
    this.prello.getMe().then(
      (response) => {
        this.setCurrentPrelloUser(response.me)
        this.renderMain();
      },
      () => {
        this.getCurrentUser().then(this.renderLogin());
      }
    );
  }

  getCardIdFromTicket() {
    return this.client.get('ticket.tags').then(data => {
      const tags = data['ticket.tags']
      if (tags) {
        let tag = tags.find(tag => tag.startsWith('prello'))
        if (tag) {
          if (tag.includes('#')) {
            return tag.substring('prello#'.length)
          } else {
            return tag.substring('prello'.length)
          }
        }
      } 
      throw new Error('Prello card id not found')
    })
  }

  saveCardIdInTicket(cardId) {
    return this.client.invoke('ticket.tags.add', `prello#${cardId}`)
    .then(() => {
      return this.client.get('ticket.postSaveAction')
    })
  }

  removeCardIdInTicket(cardId) {
    return this.client.invoke('ticket.tags.remove', [`prello#${cardId}`, `prello${cardId}`])
    .then(() => {
      return this.client.get('ticket.postSaveAction')
    })
  }

  writeZendeskAttachedComment(cardId) {
    return this.client.get('ticket.id')
    .then(data => {
      const ticketId = data['ticket.id']
      const comment = `**[Zendesk Prello App]**  
This card (**#${cardId}**) has been attached to a [Zendesk ticket](https://d3v-prello.zendesk.com/agent/tickets/${ticketId}).   
  
*(This message has been automatically generated)*
      `
      return this.prello.createComment(cardId, comment)
    })
  }

  login() {
    this.view.switchTo('loading');
    this.getOauthPageUrl().then((data) => {
      const url = data['assetURL:oauth\\.html'];
      if (url) {
        const receiveMessage = (msg) => {
          if (msg.origin == window.location.origin) {
            this.prello.getZendeskAccessToken(msg.data.token)
            .then(response => {
              this.setCurrentPrelloAccessToken(response.access_token);
              this.reboot();
            });
          }
        }
        window.open(this.prello.getZendeskOAuthUrl(url), '_blank');
        window.addEventListener('message', receiveMessage, false);
      }
    });
  }

}

export default TicketSidebar;
