const PRELLO_CONFIG = {
    url: 'http://localhost',
    secure: false
}

class Prello {
    /**
     * Construct an abstraction of the Prello API.
     * 
     * @param {*} zendeskClient Zendesk client from the ZaF
     * @param {*} accessToken Prello access token
     */
    constructor(zendeskClient, accessToken) {
        this.client = zendeskClient;
        this.accessToken = accessToken;
    }

    /**
     * Retrieve the user corresponding to the access token.
     */
    getMe() {
        const settings = {
            url: '/auth/me',
            type: 'GET'
        };
        return this._call(settings)
    }

    /**
     * Retrieve all boards of a user.
     * 
     * @param {*} userId 
     */
    getBoards(userId) {
        const settings = {
            url: `/api/users/${userId}/boards`,
            type: 'GET'
        };
        return this._call(settings)
    }

    /**
     * Return the url of the ui board.
     * 
     * @param {*} boardId 
     */
    getBoardUrl(boardId) {
        return `${PRELLO_CONFIG.url}/boards/${boardId}`
    }

    getCardUrl(boardId, cardId) {
        return `${PRELLO_CONFIG.url}/boards/${boardId}/cards/${cardId}`
    }

    /**
     * Retrieve all lists of a board. 
     * 
     * @param {*} boardId 
     */
    getLists(boardId) {
        const settings = {
            url: `/api/boards/${boardId}/lists`,
            type: 'GET'
        };
        return this._call(settings)
    }

    /**
     * Retrieve all cards of a list.
     * 
     * @param {*} listId 
     */
    getCards(listId) {
        const settings = {
            url: `/api/lists/${listId}/cards`,
            type: 'GET'
        };
        return this._call(settings)
    }

    getCardExtended(cardId) {
        const settings = {
            url: `/api/cards/${cardId}?extended=true`,
            type: 'GET'
        };
        return this._call(settings)      
    }

    /**
     * Create a new card in a list. 
     * Return the created card (useful if you want the id).
     * 
     * @param {*} listId 
     * @param {*} card 
     *  {
     *      name?: string // the name of the card (optional)
     *      desc?: string // the description of the card (optional)
     *  }
     */
    createCard(listId, card) {
        const settings = {
            url: `/api/lists/${listId}/cards`,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(card)
        };
        return this._call(settings)
    }

    /**
     * Update an existing card.
     * Return the updated card.
     * 
     * @param {*} card 
     *  {
     *      id: number // the id of the existing card (required)
     *      name?: string // the name of the card (optional)
     *      desc?: string // the description of the card (optional)
     *  }
     */
    updateCard(card) {
        const settings = {
            url: `/api/cards/${card.id}`,
            type: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(card)
        };
        return this._call(settings)
    }

    assignLabel() {

    }

    /**
     * Retrieve all labels of a board.
     * 
     * @param {*} boardId 
     */
    getLabels(boardId) {
        const settings = {
            url: `/api/boards/${boardId}/labels`,
            type: 'GET'
        };
        return this._call(settings)
    }

    /**
     * Create a new label in a board. 
     * Return the created label (useful if you want the id).
     * 
     * @param {*} boardId 
     * @param {*} label 
     *  {
     *      name?: string // the name of the label (optional)
     *      color?: string // the color of the label (optional)
     *  }
     */
    createLabel(boardId, label) {
        const settings = {
            url: `/api/boards/${boardId}/labels`,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(label)
        };
        return this._call(settings)
    }

    /**
     * Make a call to the Prello API. Return a promise with the data.
     * @see https://developer.zendesk.com/apps/docs/apps-v2/using_sdk#making-cors-requests
     * 
     * @param {*} settings 
     */
    _call(settings) {
        // TODO: replace this with es2016 explosion syntax
        const finalSettings = Object.assign(
            {},
            settings,
            {
                headers: Object.assign(
                    {},
                    settings.headers,
                    {
                        "Authorization": `Bearer ${this.accessToken}`
                    }
                )
            },
            {
                secure: PRELLO_CONFIG.secure,
                url: `${PRELLO_CONFIG.url}${settings.url}`
            }
        );
        return this.client.request(finalSettings)
    }

}

export default Prello;
