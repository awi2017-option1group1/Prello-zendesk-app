const URL = 'http://localhost'
const AUTH_URL = 
    `${URL}/auth/oauth`;
    // 'https://photon.igpolytech.fr/auth';

class PrelloAuth {

    /**
     * Construct a new OAuth2 helper
     * 
     * @param {*} data an object of this form:
     * {
     *  clientId: string, // required, your client id
     *  baseUrl: string, // required, 
     * }
     */
    constructor(data) {
        this._clientId = clientId;
        this._authorizationCodeCallback = authorizationCodeCallback;

        this._modal = null;
        this._state = null;  

        this._reset();

        window.addEventListener('message', (event) => {
            if (event.origin !== URL) {
                return;
            }

            const data = event.data;
            switch (data.type) {
                case 'authorization_code':
                    this._processAuthorizationCode(data)
                    break;

                default:
                    break;
            }
        });

        this.login = this.login.bind(this);
        this._processAuthorizationCode = this._processAuthorizationCode.bind(this);
        this._reset = this._reset.bind(this);
        this._openModal = this._openModal.bind(this);
        this._timestamp = this._timestamp.bind(this);
        this._getAuthorizationCodeUrl = this._getAuthorizationCodeUrl.bind(this);
    }

    login() {
        if (!this._modal) {
            this._openModal();
        }
        this._modal.focus();
    }

    _processAuthorizationCode(data) {
        this._modal.close();
        if (!data.code || !data.state) {
            this._authorizationCodeCallback(
                'Missing data',
                false
            )
        } else if (data.state != this._state) {
            this._authorizationCodeCallback(
                'States not match',
                false
            )
        } else {
            this._authorizationCodeCallback(
                false,
                data
            )
        }
        this._reset();
    }

    _reset() {
        this._modal = null;
        this._state = null;       
    }

    _getAuthorizationCodeUrl() {
        this._state = this._timestamp();
        return `${AUTH_URL}/authorize?response_type=code&client_id=${this._clientId}&redirect_uri=${AUTH_URL}/done&state=${this._state}`;
    }

    _openModal() {
        this._modal = window.open(
          this._getAuthorizationCodeUrl(),
          'Prello - Login',
          'width=500,height=500,dialog=yes'
        );
        this._modal.onclose = () => {
            this._reset();
        };
    }

    _timestamp() {
        return Number(new Date());
    }

    retrieveAccessToken() {

    }

}

export default PrelloAuth;
