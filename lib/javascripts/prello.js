const IS_DEV = false;

const configs = {
    dev: {
        url: 'http://localhost',
        secure: false
    },
    prod: {
        url: 'https://photon.igpolytech.fr',
        secure: true
    }
};

const PRELLO_CONFIG = IS_DEV ? configs.dev : configs.prod;

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
            url: '/auth/myUser',
            type: 'GET'
        };
        return this._call(settings);
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
        return this._call(settings);
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
        return this._call(settings);
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
        return this._call(settings);
    }

    /**
     * Retrieve an extended version of a card (with board and list).
     * 
     * @param {*} cardId 
     */
    getCardExtended(cardId) {
        const settings = {
            url: `/api/cards/${cardId}?extended=true`,
            type: 'GET'
        };
        return this._call(settings);   
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
        return this._call(settings);
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
        return this._call(settings);
    }

    /**
     * Add a comment on a card.
     * 
     * @param {*} cardId 
     * @param {*} content 
     */
    createComment(cardId, content) {
        const settings = {
            url: `/api/cards/${cardId}/comments`,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ content: content })
        };
        return this._call(settings);
    }

    /**
     * Return the url of board (front-end).
     * 
     * @param {*} boardId 
     */
    getBoardUrl(boardId) {
        return `${PRELLO_CONFIG.url}/boards/${boardId}`;
    }

    /**
     * Return the url of card (front-end).
     * 
     * @param {*} boardId 
     * @param {*} cardId 
     */
    getCardUrl(boardId, cardId) {
        return `${PRELLO_CONFIG.url}/boards/${boardId}/cards/${cardId}`;
    }

    /**
     * Return the url where to get authorization code for Zendesk.
     * 
     * @param {*} redirectUri 
     */
    getZendeskOAuthUrl(redirectUri) {
        const clientId = '9fc19d15-4a3a-4373-8f50-c1b478a8051b';
        return `${PRELLO_CONFIG.url}/auth/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}`;
    }

    /**
     * Return the url where to exchange authorization code to get access token.
     * 
     * @param {*} authorizationCode 
     */
    getZendeskAccessToken(authorizationCode) {
        const settings = {
            url: `/auth/token/zendesk?code=${authorizationCode}`,
            type: 'GET'
        };
        return this._call(settings);       
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
        return this.client.request(finalSettings);
    }

}

export default Prello;
