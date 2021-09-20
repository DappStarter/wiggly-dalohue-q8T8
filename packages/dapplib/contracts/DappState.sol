// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import "./interfaces/IDappState.sol";
import "./DappLib.sol";
import "./interfaces/IERC1155.sol";
import "./interfaces/IERC1155Receiver.sol";
import "./interfaces/IERC1155MetadataURI.sol";
import "./imports/custom_nft/Address.sol";
import "./imports/custom_nft/Context.sol";
import "./imports/custom_nft/ERC165.sol";
import "./imports/custom_nft/generator/generator.sol";



/********************************************************************************************/
/* This contract is auto-generated based on your choices in DappStarter. You can make       */
/* changes, but be aware that generating a new DappStarter project will require you to      */
/* merge changes. One approach you can take is to make changes in Dapp.sol and have it      */
/* call into this one. You can maintain all your data in this contract and your app logic   */
/* in Dapp.sol. This lets you update and deploy Dapp.sol with revised code and still        */
/* continue using this one.                                                                 */
/********************************************************************************************/

contract DappState is IDappState 
                      ,Context, ERC165, IERC1155, IERC1155MetadataURI

{
    // Allow DappLib(SafeMath) functions to be called for all uint256 types
    // (similar to "prototype" in Javascript)
    using DappLib for uint256; 
    using Address for address;

/*>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> FILE STORAGE: SIA  <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<*/


/*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@*/
/*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ S T A T E @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@*/
/*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@*/

    // Account used to deploy contract
    address private contractOwner;                  

/*>>>>>>>>>>>>>>>>>>>>>>>>>>> ACCESS CONTROL: ADMINISTRATOR ROLE  <<<<<<<<<<<<<<<<<<<<<<<<<<*/
    // Track authorized admins count to prevent lockout
    uint256 private authorizedAdminsCount = 1;                      

    // Admins authorized to manage contract
    mapping(address => uint256) private authorizedAdmins;                      

/*>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> ASSET VALUE TRACKING: TOKEN  <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<*/
    string public name;
    string public symbol;
    uint256 public decimals;
    
    // Token balance for each address
    mapping(address => uint256) balances;              

    // Approval granted to transfer tokens by one address to another address                 
    mapping (address => mapping (address => uint256)) internal allowed; 

    // Tokens currently in circulation (you'll need to update this if you create more tokens)
    uint256 public total;                  

    // Tokens created when contract was deployed                             
    uint256 public initialSupply;         

    // Multiplier to convert to smallest unit                              
    uint256 public UNIT_MULTIPLIER;                                     

/*>>>>>>>>>>>>>>>>>>>>>>>>>>>>> ACCESS CONTROL: CONTRACT ACCESS  <<<<<<<<<<<<<<<<<<<<<<<<<<<*/
    // Contracts authorized to call this one 
    mapping(address => uint256) private authorizedContracts;                  

/*>>>>>>>>>>>>>>>>>>>>>>>>>>> ACCESS CONTROL: CONTRACT RUN STATE  <<<<<<<<<<<<<<<<<<<<<<<<<<*/
    // Contract run state
    bool private contractRunState = true;          
    // Mapping from token ID to account balances
    mapping (uint256 => mapping(address => uint256)) private balances;

    // Mapping from account to operator approvals
    mapping (address => mapping(address => bool)) private operatorApprovals;

    // Mapping from token ID to metadata    
    mapping (uint256 => Generator.MetaData) public metadata;

    // Used as the URI for all token types by relying on ID substitution, e.g. https://token-cdn-domain/{id}.json
    string private uri;

/*>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> FILE STORAGE: SIA  <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<*/
    struct SiaDocument {
        string docId;    

        bytes32 label;

        // Registration timestamp                                          
        uint256 timestamp;  

        // Owner of document                                        
        address owner;    
    }

    // All added documents
    mapping(string => SiaDocument) siaDocs;                            

    uint constant SIA_DOCS_PAGE_SIZE = 50;
    uint256 public siaLastPage = 0;

    // All documents organized by page
    mapping(uint256 => string[]) public siaDocsByPage;         

    // All documents for which an account is the owner
    mapping(address => string[]) public siaDocsByOwner;              
    struct EntityData {
        bool exists;
        bytes32 id;
        address creator;
        bytes32 title;
        uint256 count;
    }

    mapping(bytes32 => EntityData) entities;                // Store some data
    bytes32[] public entityList;                            // Entity lookup

    mapping(address => bytes32[]) public entitiesByCreator; // Entities for which an account is the creator

    mapping(uint256 => bytes32[]) public entitiesByPage;    // Entities organized by page
    uint constant ENTITIES_DOCS_PAGE_SIZE = 50;
    uint256 public entitiesLastPage = 0;



/*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@*/
/*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ C O N S T R U C T O R @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@*/
/*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@*/

    constructor()  
    {
        contractOwner = msg.sender;       

/*>>>>>>>>>>>>>>>>>>>>>>>>>>> ACCESS CONTROL: ADMINISTRATOR ROLE  <<<<<<<<<<<<<<<<<<<<<<<<<<*/
        // Add account that deployed contract as an authorized admin
        authorizedAdmins[msg.sender] = 1;       

/*>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> ASSET VALUE TRACKING: TOKEN  <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<*/
        name = "HP token";             
        symbol = "HPS";           
        decimals = 8;     

        // Multiplier to convert to smallest unit
        UNIT_MULTIPLIER = 10 ** uint256(decimals); 

        uint256 supply = 100000000000000;       

        // Convert supply to smallest unit
        total = supply.mul(UNIT_MULTIPLIER);    
        initialSupply = total;

        // Assign entire initial supply to contract owner
        balances[contractOwner] = total;    

    }

/*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@*/
/*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ E V E N T S @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@*/
/*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@*/


/*>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> ASSET VALUE TRACKING: TOKEN  <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<*/
    // Fired when an account authorizes another account to spend tokens on its behalf
    event Approval          
                            (
                                address indexed owner, 
                                address indexed spender, 
                                uint256 value
                            );

    // Fired when tokens are transferred from one account to another
    event Transfer          
                            (
                                address indexed from, 
                                address indexed to, 
                                uint256 value
                            );

/*>>>>>>>>>>>>>>>>>>>>>>>>>>> ACCESS CONTROL: CONTRACT RUN STATE  <<<<<<<<<<<<<<<<<<<<<<<<<<*/
    // Event fired when status is changed
    event ChangeContractRunState      
                    (
                        bool indexed mode,
                        address indexed account,
                        uint256 timestamp
                    );

/*>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> FILE STORAGE: SIA  <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<*/
    // Event fired when doc is added
    event AddSiaDocument      
                    (
                        string indexed docId,
                        address indexed owner,
                        uint256 timestamp
                    );

/*>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> COLLECTION: ENTITY  <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<*/
    // Event fired when Entity is added
    event EntityAdd
                    (
                        bytes32 indexed id, 
                        address indexed entity, 
                        bytes32 indexed title, 
                        uint256 count
                    );

    // Event fired when Entity is updated
    event EntityUpdate
                    (
                        bytes32 indexed id, 
                        address indexed entity, 
                        bytes32 indexed title, 
                        uint256 count
                    );


/*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@*/
/*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ M O D I F I E R S @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@*/
/*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@*/


/*>>>>>>>>>>>>>>>>>>>>>>>>>>> ACCESS CONTROL: ADMINISTRATOR ROLE  <<<<<<<<<<<<<<<<<<<<<<<<<<*/
    /**
    * @dev Modifier that requires the function caller to be a contract admin
    */
    modifier requireContractAdmin()
    {
        require(isContractAdmin(msg.sender), "Caller is not a contract administrator");
        // Modifiers require an "_" which indicates where the function body will be added
        _;
    }

/*>>>>>>>>>>>>>>>>>>>>>>>>>>>>> ACCESS CONTROL: CONTRACT ACCESS  <<<<<<<<<<<<<<<<<<<<<<<<<<<*/
    /**
    * @dev Modifier that requires the calling contract to be authorized
    */
    modifier requireContractAuthorized()
    {
        require(isContractAuthorized(msg.sender), "Calling contract not authorized");
        // Modifiers require an "_" which indicates where the function body will be added
        _;  
    }

/*>>>>>>>>>>>>>>>>>>>>>>>>>>> ACCESS CONTROL: CONTRACT RUN STATE  <<<<<<<<<<<<<<<<<<<<<<<<<<*/
    /**
    * @dev Modifier that requires the "contractRunState" boolean variable to be "true"
    *      This is used on all state changing functions to pause the contract in 
    *      the event there is an issue that needs to be fixed
    */
    modifier requireContractRunStateActive() 
    {
        require(contractRunState, "Contract is currently not active");
        // Modifiers require an "_" which indicates where the function body will be added
        _; 
    }


/*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@*/
/*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ F U N C T I O N S @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@*/
/*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@*/


/*>>>>>>>>>>>>>>>>>>>>>>>>>>> ACCESS CONTROL: ADMINISTRATOR ROLE  <<<<<<<<<<<<<<<<<<<<<<<<<<*/
    /**
    * @dev Checks if an account is an admin
    *
    * @param account Address of the account to check
    */
    function isContractAdmin
                            (
                                address account
                            ) 
                            public 
                            view
                            returns(bool) 
    {
        return authorizedAdmins[account] == 1;
    }


    /**
    * @dev Adds a contract admin
    *
    * @param account Address of the admin to add
    */
    function addContractAdmin
                            (
                                address account
                            ) 
                            external 
                            requireContractAdmin
    {
        require(account != address(0), "Invalid address");
        require(authorizedAdmins[account] < 1, "Account is already an administrator");

        authorizedAdmins[account] = 1;
        authorizedAdminsCount++;
    }

    /**
    * @dev Removes a previously added admin
    *
    * @param account Address of the admin to remove
    */
    function removeContractAdmin
                            (
                                address account
                            ) 
                            external 
                            requireContractAdmin
    {
        require(account != address(0), "Invalid address");
        require(authorizedAdminsCount >= 2, "Cannot remove last admin");

        delete authorizedAdmins[account];
        authorizedAdminsCount--;
    }

    /**
    * @dev Removes the last admin fully decentralizing the contract
    *
    * @param account Address of the admin to remove
    */
    function removeLastContractAdmin
                            (
                                address account
                            ) 
                            external 
                            requireContractAdmin
    {
        require(account != address(0), "Invalid address");
        require(authorizedAdminsCount == 1, "Not the last admin");

        delete authorizedAdmins[account];
        authorizedAdminsCount--;
    }


/*>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> ASSET VALUE TRACKING: TOKEN  <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<*/
    /**
    * @dev Total supply of tokens
    */
    function totalSupply() 
                            external 
                            view 
                            returns (uint256) 
    {
        return total;
    }

    /**
    * @dev Gets the balance of the calling address.
    *
    * @return An uint256 representing the amount owned by the calling address
    */
    function balance()
                            public 
                            view 
                            returns (uint256) 
    {
        return balanceOf(msg.sender);
    }

    /**
    * @dev Gets the balance of the specified address.
    *
    * @param owner The address to query the balance of
    * @return An uint256 representing the amount owned by the passed address
    */
    function balanceOf
                            (
                                address owner
                            ) 
                            public 
                            view 
                            returns (uint256) 
    {
        return balances[owner];
    }

    /**
    * @dev Transfers token for a specified address
    *
    * @param to The address to transfer to.
    * @param value The amount to be transferred.
    * @return A bool indicating if the transfer was successful.
    */
    function transfer
                            (
                                address to, 
                                uint256 value
                            ) 
                            public 
                            returns (bool) 
    {
        require(to != address(0));
        require(to != msg.sender);
        require(value <= balanceOf(msg.sender));                                         

        balances[msg.sender] = balances[msg.sender].sub(value);
        balances[to] = balances[to].add(value);
        emit Transfer(msg.sender, to, value);
        return true;
    }

    /**
    * @dev Transfers tokens from one address to another
    *
    * @param from address The address which you want to send tokens from
    * @param to address The address which you want to transfer to
    * @param value uint256 the amount of tokens to be transferred
    * @return A bool indicating if the transfer was successful.
    */
    function transferFrom
                            (
                                address from, 
                                address to, 
                                uint256 value
                            ) 
                            public 
                            returns (bool) 
    {
        require(from != address(0));
        require(value <= allowed[from][msg.sender]);
        require(value <= balanceOf(from));                                         
        require(to != address(0));
        require(from != to);

        balances[from] = balances[from].sub(value);
        balances[to] = balances[to].add(value);
        allowed[from][msg.sender] = allowed[from][msg.sender].sub(value);
        emit Transfer(from, to, value);
        return true;
    }

    /**
    * @dev Checks the amount of tokens that an owner allowed to a spender.
    *
    * @param owner address The address which owns the funds.
    * @param spender address The address which will spend the funds.
    * @return A uint256 specifying the amount of tokens still available for the spender.
    */
    function allowance
                            (
                                address owner, 
                                address spender
                            ) 
                            public 
                            view 
                            returns (uint256) 
    {
        return allowed[owner][spender];
    }

    /**
    * @dev Approves the passed address to spend the specified amount of tokens 
    *      on behalf of msg.sender.
    *
    * @param spender The address which will spend the funds.
    * @param value The amount of tokens to be spent.
    * @return A bool indicating success (always returns true)
    */
    function approve
                            (
                                address spender, 
                                uint256 value
                            ) 
                            public 
                            returns (bool) 
    {
        allowed[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }


/*>>>>>>>>>>>>>>>>>>>>>>>>>>>>> ACCESS CONTROL: CONTRACT ACCESS  <<<<<<<<<<<<<<<<<<<<<<<<<<<*/
    /**
    * @dev Authorizes a smart contract to call this contract
    *
    * @param account Address of the calling smart contract
    */
    function authorizeContract
                            (
                                address account
                            ) 
                            public 
                            requireContractAdmin  
    {
        require(account != address(0), "Invalid address");

        authorizedContracts[account] = 1;
    }

    /**
    * @dev Deauthorizes a previously authorized smart contract from calling this contract
    *
    * @param account Address of the calling smart contract
    */
    function deauthorizeContract
                            (
                                address account
                            ) 
                            external 
                            requireContractAdmin
    {
        require(account != address(0), "Invalid address");

        delete authorizedContracts[account];
    }

    /**
    * @dev Checks if a contract is authorized to call this contract
    *
    * @param account Address of the calling smart contract
    */
    function isContractAuthorized
                            (
                                address account
                            ) 
                            public 
                            view
                            returns(bool) 
    {
        return authorizedContracts[account] == 1;
    }

/*>>>>>>>>>>>>>>>>>>>>>>>>>>> ACCESS CONTROL: CONTRACT RUN STATE  <<<<<<<<<<<<<<<<<<<<<<<<<<*/
    /**
    * @dev Get active status of contract
    *
    * @return A bool that is the current active status
    */    
    function isContractRunStateActive()
                        external 
                        view 
                        returns(bool)
    {
        return contractRunState;
    }

    /**
    * @dev Sets contract active status on/off
    *
    * When active status is off, all write transactions except for this one will fail
    */    
    function setContractRunState
                    (
                        bool mode
                    ) 
                    external 
                    // **** WARNING: Adding requireContractRunStateActive modifier will result in contract lockout ****
                    requireContractAdmin  // Administrator Role block is required to ensure only authorized individuals can pause contract
    {
        require(mode != contractRunState, "Run state is already set to the same value");
        contractRunState = mode;

        emit ChangeContractRunState(mode, msg.sender, block.timestamp);
    }
                        
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC165, IERC165) returns (bool) {
        return interfaceId == type(IERC1155).interfaceId
            || interfaceId == type(IERC1155MetadataURI).interfaceId
            || super.supportsInterface(interfaceId);
    }


    /**
     * @dev See {IERC1155MetadataURI-uri}.
     *
     * This implementation returns the same URI for *all* token types. It relies
     * on the token type ID substitution mechanism
     * https://eips.ethereum.org/EIPS/eip-1155#metadata[defined in the EIP].
     *
     * Clients calling this function must replace the `\{id\}` substring with the
     * actual token type ID.
     */
    function getURI() public view virtual override returns (string memory) {
        return uri;
    }

    /**
        @notice Transfers `amount` amount of an `id` from the `from` address to the `to` address specified (with safety call).
        @dev Caller must be approved to manage the tokens being transferred out of the `from` account (see "Approval" section of the standard).
        MUST revert if `to` is the zero address.
        MUST revert if balance of holder for token `id` is lower than the `amount` sent.
        MUST revert on any other error.
        MUST emit the `TransferSingle` event to reflect the balance change (see "Safe Transfer Rules" section of the standard).
        After the above conditions are met, this function MUST check if `to` is a smart contract (e.g. code size > 0). If so, it MUST call `onERC1155Received` on `to` and act appropriately (see "Safe Transfer Rules" section of the standard).
        @param from    Source address
        @param to      Target address
        @param id      ID of the token type
        @param amount   Transfer amount
        @param data    Additional data with no specified format, MUST be sent unaltered in call to `onERC1155Received` on `to`
    */
    function safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    )
        public
        virtual
        override
    {
        require(to != address(0), "ERC1155: transfer to the zero address");
        require(
            from == msgSender() || isApprovedForAll(from, msgSender()),
            "ERC1155: caller is not owner nor approved"
        );

        address operator = msgSender();

        beforeTokenTransfer(operator, from, to, asSingletonArray(id), asSingletonArray(amount), data);

        uint256 fromBalance = balances[id][from];
        require(fromBalance >= amount, "ERC1155: insufficient balance for transfer");
        balances[id][from] = fromBalance - amount;
        balances[id][to] += amount;

        emit TransferSingle(operator, from, to, id, amount);

        doSafeTransferAcceptanceCheck(operator, from, to, id, amount, data);
    }

    /**
        @notice Transfers `amounts` amount(s) of `ids` from the `from` address to the `to` address specified (with safety call).
        @dev Caller must be approved to manage the tokens being transferred out of the `from` account (see "Approval" section of the standard).
        MUST revert if `to` is the zero address.
        MUST revert if length of `ids` is not the same as length of `amounts`.
        MUST revert if any of the balance(s) of the holder(s) for token(s) in `ids` is lower than the respective amount(s) in `amounts` sent to the recipient.
        MUST revert on any other error.
        MUST emit `TransferSingle` or `TransferBatch` event(s) such that all the balance changes are reflected (see "Safe Transfer Rules" section of the standard).
        Balance changes and events MUST follow the ordering of the arrays (_ids[0]/_values[0] before _ids[1]/_values[1], etc).
        After the above conditions for the transfer(s) in the batch are met, this function MUST check if `to` is a smart contract (e.g. code size > 0). If so, it MUST call the relevant `ERC1155TokenReceiver` hook(s) on `to` and act appropriately (see "Safe Transfer Rules" section of the standard).
        @param from    Source address
        @param to      Target address
        @param ids     IDs of each token type (order and length must match _values array)
        @param amounts  Transfer amounts per token type (order and length must match _ids array)
        @param data    Additional data with no specified format, MUST be sent unaltered in call to the `ERC1155TokenReceiver` hook(s) on `to`
    */
        function safeBatchTransferFrom(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    )
        public
        virtual
        override
    {
        require(ids.length == amounts.length, "ERC1155: ids and amounts length mismatch");
        require(to != address(0), "ERC1155: transfer to the zero address");
        require(
            from == msgSender() || isApprovedForAll(from, msgSender()),
            "ERC1155: transfer caller is not owner nor approved"
        );

        address operator = msgSender();

        beforeTokenTransfer(operator, from, to, ids, amounts, data);

        for (uint256 i = 0; i < ids.length; ++i) {
            uint256 id = ids[i];
            uint256 amount = amounts[i];

            uint256 fromBalance = balances[id][from];
            require(fromBalance >= amount, "ERC1155: insufficient balance for transfer");
            balances[id][from] = fromBalance - amount;
            balances[id][to] += amount;
        }

        emit TransferBatch(operator, from, to, ids, amounts);

        doSafeBatchTransferAcceptanceCheck(operator, from, to, ids, amounts, data);
    }

    /**
        @notice Get the balance of an account's Tokens.
        @param account  The address of the token holder
        @param id     ID of the Token
        @return        The _owner's balance of the Token type requested
     */
    function balanceOf(address account, uint256 id) public view virtual override returns (uint256) {
        require(account != address(0), "ERC1155: balance query for the zero address");
        return balances[id][account];
    }


    /**
        @notice Get the balance of multiple account/token pairs
        @param accounts The addresses of the token holders
        @param ids    ID of the Tokens
        @return        The _owner's balance of the Token types requested (i.e. balance for each (owner, id) pair)
     */
    function balanceOfBatch(
        address[] memory accounts,
        uint256[] memory ids
    )
        public
        view
        virtual
        override
        returns (uint256[] memory)
    {
        require(accounts.length == ids.length, "ERC1155: accounts and ids length mismatch");

        uint256[] memory batchBalances = new uint256[](accounts.length);

        for (uint256 i = 0; i < accounts.length; ++i) {
            batchBalances[i] = balanceOf(accounts[i], ids[i]);
        }

        return batchBalances;
    }

    /**
        @notice Enable or disable approval for a third party ("operator") to manage all of the caller's tokens.
        @dev MUST emit the ApprovalForAll event on success.
        @param operator  Address to add to the set of authorized operators
        @param approved  True if the operator is approved, false to revoke approval
    */
    function setApprovalForAll(address operator, bool approved) public virtual override {
        require(msgSender() != operator, "ERC1155: setting approval status for self");

        operatorApprovals[msgSender()][operator] = approved;
        emit ApprovalForAll(msgSender(), operator, approved);
    }

    /**
        @notice Queries the approval status of an operator for a given owner.
        @param account     The owner of the Tokens
        @param operator  Address of authorized operator
        @return           True if the operator is approved, false if not
    */
    function isApprovedForAll(address account, address operator) public view virtual override returns (bool) {
        return operatorApprovals[account][operator];
    }

    /**
     * @dev Sets a new URI for all token types, by relying on the token type ID
     * substitution mechanism
     * https://eips.ethereum.org/EIPS/eip-1155#metadata[defined in the EIP].
     *
     * By this mechanism, any occurrence of the `\{id\}` substring in either the
     * URI or any of the amounts in the JSON file at said URI will be replaced by
     * clients with the token type ID.
     *
     * For example, the `https://token-cdn-domain/\{id\}.json` URI would be
     * interpreted by clients as
     * `https://token-cdn-domain/000000000000000000000000000000000000000000000000000000000004cce0.json`
     * for token type ID 0x4cce0.
     *
     * See {uri}.
     *
     * Because these URIs cannot be meaningfully represented by the {URI} event,
     * this function emits no events.
     */
    function setURI(string memory newuri) external virtual requireContractAdmin {
        uri = newuri;
    }

    /**
     * @dev Creates `amount` tokens of token type `id`, and assigns them to `account`.
     *
     * Emits a {TransferSingle} event.
     *
     * Requirements:
     *
     * - `account` cannot be the zero address.
     * - If `account` refers to a smart contract, it must implement {IERC1155Receiver-onERC1155Received} and return the
     * acceptance magic value.
     */
    function mint(address account, uint256 id, uint256 amount, bytes memory data) public virtual requireContractAdmin {
        require(account != address(0), "ERC1155: mint to the zero address");

        address operator = msgSender();

        beforeTokenTransfer(operator, address(0), account, asSingletonArray(id), asSingletonArray(amount), data);

        balances[id][account] += amount;
        emit TransferSingle(operator, address(0), account, id, amount);

        doSafeTransferAcceptanceCheck(operator, address(0), account, id, amount, data);
    }

    function mintNFT(address account, uint256 id, uint256 amount, Generator.MetaData memory metaData) external virtual requireContractAdmin {
        mint(account, id, amount, "");
        metadata[id] = metaData;
    }

    /**
     * @dev xref:ROOT:erc1155.adoc#batch-operations[Batched] version of {mint}.
     *
     * Requirements:
     *
     * - `ids` and `amounts` must have the same length.
     * - If `to` refers to a smart contract, it must implement {IERC1155Receiver-onERC1155BatchReceived} and return the
     * acceptance magic value.
     */
    function mintBatch(address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data) external virtual requireContractAdmin {
        require(to != address(0), "ERC1155: mint to the zero address");
        require(ids.length == amounts.length, "ERC1155: ids and amounts length mismatch");

        address operator = msgSender();

        beforeTokenTransfer(operator, address(0), to, ids, amounts, data);

        for (uint i = 0; i < ids.length; i++) {
            balances[ids[i]][to] += amounts[i];
        }

        emit TransferBatch(operator, address(0), to, ids, amounts);

        doSafeBatchTransferAcceptanceCheck(operator, address(0), to, ids, amounts, data);
    }

    /**
     * @dev Destroys `amount` tokens of token type `id` from `account`
     *
     * Requirements:
     *
     * - `account` cannot be the zero address.
     * - `account` must have at least `amount` tokens of token type `id`.
     */
    function burn(address account, uint256 id, uint256 amount) external virtual requireContractAdmin {
        require(account != address(0), "ERC1155: burn from the zero address");

        address operator = msgSender();

        beforeTokenTransfer(operator, account, address(0), asSingletonArray(id), asSingletonArray(amount), "");

        uint256 accountBalance = balances[id][account];
        require(accountBalance >= amount, "ERC1155: burn amount exceeds balance");
        balances[id][account] = accountBalance - amount;

        emit TransferSingle(operator, account, address(0), id, amount);
    }

    /**
     * @dev xref:ROOT:erc1155.adoc#batch-operations[Batched] version of {burn}.
     *
     * Requirements:
     *
     * - `ids` and `amounts` must have the same length.
     */
    function burnBatch(address account, uint256[] memory ids, uint256[] memory amounts) external virtual requireContractAdmin {
        require(account != address(0), "ERC1155: burn from the zero address");
        require(ids.length == amounts.length, "ERC1155: ids and amounts length mismatch");

        address operator = msgSender();

        beforeTokenTransfer(operator, account, address(0), ids, amounts, "");

        for (uint i = 0; i < ids.length; i++) {
            uint256 id = ids[i];
            uint256 amount = amounts[i];

            uint256 accountBalance = balances[id][account];
            require(accountBalance >= amount, "ERC1155: burn amount exceeds balance");
            balances[id][account] = accountBalance - amount;
        }

        emit TransferBatch(operator, account, address(0), ids, amounts);
    }

    /**
     * @dev Hook that is called before any token transfer. This includes minting
     * and burning, as well as batched variants.
     *
     * The same hook is called on both single and batched variants. For single
     * transfers, the length of the `id` and `amount` arrays will be 1.
     *
     * Calling conditions (for each `id` and `amount` pair):
     *
     * - When `from` and `to` are both non-zero, `amount` of ``from``'s tokens
     * of token type `id` will be  transferred to `to`.
     * - When `from` is zero, `amount` tokens of token type `id` will be minted
     * for `to`.
     * - when `to` is zero, `amount` of ``from``'s tokens of token type `id`
     * will be burned.
     * - `from` and `to` are never both zero.
     * - `ids` and `amounts` have the same, non-zero length.
     *
     * To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks].
     */
    function beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    )
        internal
        virtual
    { }

    function doSafeTransferAcceptanceCheck(
        address operator,
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    )
        private
    {
        if (to.isContract()) {
            try IERC1155Receiver(to).onERC1155Received(operator, from, id, amount, data) returns (bytes4 response) {
                if (response != IERC1155Receiver(to).onERC1155Received.selector) {
                    revert("ERC1155: ERC1155Receiver rejected tokens");
                }
            } catch Error(string memory reason) {
                revert(reason);
            } catch {
                revert("ERC1155: transfer to non ERC1155Receiver implementer");
            }
        }
    }

    function doSafeBatchTransferAcceptanceCheck(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    )
        private
    {
        if (to.isContract()) {
            try IERC1155Receiver(to).onERC1155BatchReceived(operator, from, ids, amounts, data) returns (bytes4 response) {
                if (response != IERC1155Receiver(to).onERC1155BatchReceived.selector) {
                    revert("ERC1155: ERC1155Receiver rejected tokens");
                }
            } catch Error(string memory reason) {
                revert(reason);
            } catch {
                revert("ERC1155: transfer to non ERC1155Receiver implementer");
            }
        }
    }

    function asSingletonArray(uint256 element) private pure returns (uint256[] memory) {
        uint256[] memory array = new uint256[](1);
        array[0] = element;

        return array;
    }

/*>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> FILE STORAGE: SIA  <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<*/
    /**
    * @dev Adds a new SIA doc
    *
    * @param docId Unique identifier (siahash digest of doc)
    * @param label Short, descriptive label for document
    */
    function addSiaDocument
                        (
                            string calldata docId,
                            bytes32 label
                        ) 
                        external 
    {
        // Prevent empty string for docId
        bytes memory testDocId = bytes(docId);
        require(testDocId.length > 0, "Invalid docId");  

        // Prevent duplicate docIds   
        require(siaDocs[docId].timestamp == 0, "Document already exists");     

        siaDocs[docId] = SiaDocument({
                                    docId: docId,
                                    label: label,
                                    timestamp: block.timestamp,
                                    owner: msg.sender
                               });

        siaDocsByOwner[msg.sender].push(docId);
        if (siaDocsByPage[siaLastPage].length == SIA_DOCS_PAGE_SIZE) {
            siaLastPage++;
        }
        siaDocsByPage[siaLastPage].push(docId);

        emit AddSiaDocument(docId, msg.sender, siaDocs[docId].timestamp);
    }

    /**
    * @dev Gets individual SIA doc by docId
    *
    * @param id DocumentId of doc
    */
    function getSiaDocument
                    (
                        string calldata id
                    )
                    external
                    view
                    returns(
                                string memory docId, 
                                bytes32 label,
                                uint256 timestamp, 
                                address owner
                    )
    {
        SiaDocument memory siaDoc = siaDocs[id];
        docId = siaDoc.docId;
        label = siaDoc.label;
        timestamp = siaDoc.timestamp;
        owner = siaDoc.owner;
    }

    /**
    * @dev Gets docs where account is/was an owner
    *
    * @param account Address of owner
    */
    function getSiaDocumentsByOwner
                            (
                                address account
                            )
                            external
                            view
                            returns(string[] memory)
    {
        require(account != address(0), "Invalid account");

        return siaDocsByOwner[account];
    }

/*>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> COLLECTION: ENTITY  <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<*/

    /**
    * @dev Gets Entities by page
    *
    * @param page Page number you want to retrieve
    * @param resultsPerPage Amount of Entities displayed per page
    */
    function getEntitiesByPage
                                (
                                    uint256 page, 
                                    uint256 resultsPerPage
                                ) 
                                external 
                                view 
                                returns(bytes32[] memory) 
    {

        return DappLib.getItemsByPage(page, resultsPerPage, entityList);
    }

    /**
    * @dev Gets the amount of Entities in the collection
    */
    function getEntityCount
                        (
                        ) 
                        external 
                        view 
                        returns(
                            uint256 entityCount
                        )


    {
         entityCount = entityList.length;
    }    

    /**
    * @dev Gets a single Entity by id
    *
    * @param id Id of an Entity
    */
    function getEntity
                        (
                            bytes32 id
                        ) 
                        external 
                        view 
                        returns(
                            address creator, 
                            bytes32 title, 
                            uint256 count
                        )


    {
         creator = entities[id].creator;
         title = entities[id].title;
         count = entities[id].count;
    }    

    /**
    * @dev Gets all Entities of a specific creator
    *
    * @param account Address of creator's account 
    */
    function getEntitiesByCreator
                        (
                            address account
                        )
                        external
                        view
                        returns(bytes32[] memory)
    {
        require(account != address(0), "Invalid account");

        return entitiesByCreator[account];
    }

    function getMyEntities
                        (
                        )
                        external
                        view
                        returns(bytes32[] memory)
    {

        return entitiesByCreator[msg.sender];
    }

    /**
    * @dev Sets an Entity
    *
    * @param id Unique identifier 
    * @param title Title of Entity
    * @param count Numeric value of Entity
    */
    function setEntity
                        (
                            bytes32 id,
                            bytes32 title,
                            uint256 count   
                        ) 
                        external 
                        requireContractAdmin
    {
        // Prevent empty Id field
        require(id[0] != 0, "entity Id cannot be empty");

        // Add Entity if it does not exist, otherwise update the existing Entity
        if (!entities[id].exists) {
            require(title[0] != 0, "title cannot be empty");

            entityList.push(id);
            entitiesByCreator[msg.sender].push(id);

            if (entitiesByPage[entitiesLastPage].length == ENTITIES_DOCS_PAGE_SIZE) {
                entitiesLastPage++;
            }
            entitiesByPage[entitiesLastPage].push(id);
            emit EntityAdd(id, msg.sender, title, count);
        }else {
            emit EntityUpdate(id, msg.sender, title, count);
        }

        entities[id] = EntityData({
                                exists: true,
                                id: id,
                                creator: msg.sender,
                                title: title,
                                count: count
                            });
    }


//  Example functions that demonstrate how to call into this contract that holds state from
//  another contract. Look in ~/interfaces/IDappState.sol for the interface definitions and
//  in Dapp.sol for the actual calls into this contract.

    /**
    * @dev This is an EXAMPLE function that illustrates how functions in this contract can be
    *      called securely from another contract to READ state data. Using the Contract Access 
    *      block will enable you to make your contract more secure by restricting which external
    *      contracts can call functions in this contract.
    */
    function getContractOwner()
                                external
                                view
                                override
                                returns(address)
    {
        return contractOwner;
    }

    uint256 counter;    // This is an example variable used only to demonstrate calling
                        // a function that writes state from an external contract. It and
                        // "incrementCounter" and "getCounter" functions can (should?) be deleted.
    /**
    * @dev This is an EXAMPLE function that illustrates how functions in this contract can be
    *      called securely from another contract to WRITE state data. Using the Contract Access 
    *      block will enable you to make your contract more secure by restricting which external
    *       contracts can call functions in this contract.
    */
    function incrementCounter
                            (
                                uint256 increment
                            )
                            external
                            override
                            // Enable the modifier below if using the Contract Access feature
                            // requireContractAuthorized
    {
        // NOTE: If another contract is calling this function, then msg.sender will be the address
        //       of the calling contract and NOT the address of the user who initiated the
        //       transaction. It is possible to get the address of the user, but this is 
        //       spoofable and therefore not recommended.
        
        require(increment > 0 && increment < 10, "Invalid increment value");
        counter = counter.add(increment);   // Demonstration of using SafeMath to add to a number
                                            // While verbose, using SafeMath everywhere that you
                                            // add/sub/div/mul will ensure your contract does not
                                            // have weird overflow bugs.
    }

    /**
    * @dev This is an another EXAMPLE function that illustrates how functions in this contract can be
    *      called securely from another contract to READ state data. Using the Contract Access 
    *      block will enable you to make your contract more secure by restricting which external
    *      contracts can call functions in this contract.
    */
    function getCounter()
                                external
                                view
                                override
                                returns(uint256)
    {
        return counter;
    }

}   


