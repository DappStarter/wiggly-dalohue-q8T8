'use strict';
const Blockchain = require('./blockchain');
const dappConfig = require('./dapp-config.json');
const ClipboardJS = require('clipboard');
const BN = require('bn.js'); // Required for injected code
const manifest = require('../manifest.json');


module.exports = class DappLib {

    /*>>>>>>>>>>>>>>>>>>>>>>>>>>> ACCESS CONTROL: ADMINISTRATOR ROLE  <<<<<<<<<<<<<<<<<<<<<<<<<<*/

    static async isContractAdmin(data) {

        let result = await Blockchain.get({
                config: DappLib.getConfig(),
                contract: DappLib.DAPP_STATE_CONTRACT,
                params: {
                    from: null
                }
            },
            'isContractAdmin',
            data.account
        );
        return {
            type: DappLib.DAPP_RESULT_BOOLEAN,
            label: 'Is Contract Admin',
            result: result.callData,
            hint: null
        }
    }

    static async addContractAdmin(data) {

        let result = await Blockchain.post({
                config: DappLib.getConfig(),
                contract: DappLib.DAPP_STATE_CONTRACT,
                params: {
                    from: null
                }
            },
            'addContractAdmin',
            data.account
        );
        return {
            type: DappLib.DAPP_RESULT_TX_HASH,
            label: 'Transaction Hash',
            result: DappLib.getTransactionHash(result.callData),
            hint: `Verify ${DappLib.formatAccount(data.account)} is an administrator by using "Is Contract Admin."`
        }
    }

    static async removeContractAdmin(data) {

        let result = await Blockchain.post({
                config: DappLib.getConfig(),
                contract: DappLib.DAPP_STATE_CONTRACT,
                params: {
                    from: null
                }
            },
            'removeContractAdmin',
            data.account
        );
        return {
            type: DappLib.DAPP_RESULT_TX_HASH,
            label: 'Transaction Hash',
            result: DappLib.getTransactionHash(result.callData),
            hint: `Verify ${DappLib.formatAccount(data.account)} is no longer an administrator by using "Is Contract Admin."`
        }
    }

    static async removeLastContractAdmin(data) {

        let result = await Blockchain.post({
                config: DappLib.getConfig(),
                contract: DappLib.DAPP_STATE_CONTRACT,
                params: {
                    from: null
                }
            },
            'removeLastContractAdmin',
            data.account
        );
        return {
            type: DappLib.DAPP_RESULT_TX_HASH,
            label: 'Transaction Hash',
            result: DappLib.getTransactionHash(result.callData),
            hint: `Verify that all functions that require an administrator no longer work."`
        }
    }

  /*>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> ASSET VALUE TRACKING: TOKEN  <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<*/

  static async _decimals(data) {
    let result = await Blockchain.get(
      {
        config: DappLib.getConfig(),
        contract: DappLib.DAPP_STATE_CONTRACT,
        params: {
          from: data.from,
        },
      },
      "decimals"
    );
    return result.callData;
  }

  static async _toSmallestUnit(amount, data) {
    let decimals = await DappLib._decimals(data);
    let units = new BN(10).pow(new BN(decimals));
    return new BN(amount).mul(units);
  }

  static async _fromSmallestUnit(amount, data) {
    let decimals = await DappLib._decimals(data);
    let units = new BN(10).pow(new BN(decimals));
    return new BN(amount).div(units);
  }

  static async totalSupply(data) {
    let result = await Blockchain.get(
      {
        config: DappLib.getConfig(),
        contract: DappLib.DAPP_STATE_CONTRACT,
        params: {
          from: data.from,
        },
      },
      "totalSupply"
    );
    let supply = result.callData;
    return {
      type: DappLib.DAPP_RESULT_BIG_NUMBER,
      label: "Total Supply",
      result: new BN(supply),
      unitResult: await DappLib._fromSmallestUnit(supply, data),
      hint: null,
    };
  }

  static async balance(data) {
    let result = await Blockchain.get(
      {
        config: DappLib.getConfig(),
        contract: DappLib.DAPP_STATE_CONTRACT,
        params: {
          from: data.from,
        },
      },
      "balance"
    );
    let balance = result.callData;
    return {
      type: DappLib.DAPP_RESULT_BIG_NUMBER,
      label: "Account Balance for " + DappLib.formatAccount(result.callAccount),
      result: new BN(balance),
      unitResult: await DappLib._fromSmallestUnit(balance, data),
      hint: null,
    };
  }

  static async balanceOf(data) {
    let result = await Blockchain.get(
      {
        config: DappLib.getConfig(),
        contract: DappLib.DAPP_STATE_CONTRACT,
        params: {
          from: data.from,
        },
      },
      "balanceOf",
      data.account
    );
    let balance = result.callData;
    return {
      type: DappLib.DAPP_RESULT_BIG_NUMBER,
      label: DappLib.formatAccount(result.callAccount) + " Account Balance",
      result: new BN(balance),
      unitResult: await DappLib._fromSmallestUnit(balance, data),
      hint: null,
    };
  }

  static async transfer(data) {
    let decimals = await DappLib._decimals(data);
    let units = new BN(10).pow(new BN(decimals));
    let amount = new BN(data.amount).mul(units);
    let result = await Blockchain.post(
      {
        config: DappLib.getConfig(),
        contract: DappLib.DAPP_STATE_CONTRACT,
        params: {
          from: data.from,
        },
      },
      "transfer",
      data.to,
      amount
    );
    return {
      type: DappLib.DAPP_RESULT_TX_HASH,
      label: "Transaction Hash",
      result: DappLib.getTransactionHash(result.callData),
      hint: `Verify transfer by using "Balance for Account" to check the balance of ${DappLib.formatAccount(
        data.to
      )}.`,
    };
  }

  static async allowance(data) {
    let result = await Blockchain.get(
      {
        config: DappLib.getConfig(),
        contract: DappLib.DAPP_STATE_CONTRACT,
        params: {
          from: data.from,
        },
      },
      "allowance",
      data.sourceAccount,
      data.targetAccount
    );
    let balance = result.callData;
    return {
      type: DappLib.DAPP_RESULT_BIG_NUMBER,
      label: DappLib.formatAccount(result.callAccount) + " Allowance",
      result: new BN(balance),
      unitResult: await DappLib._fromSmallestUnit(balance, data),
      hint: null,
    };
  }

  static async approve(data) {
    let result = await Blockchain.post(
      {
        config: DappLib.getConfig(),
        contract: DappLib.DAPP_STATE_CONTRACT,
        params: {
          from: data.from,
        },
      },
      "approve",
      data.targetAccount,
      data.transferAmount
    );
    return {
      type: DappLib.DAPP_RESULT_BOOLEAN,
      label: "Is transaction approved",
      result: result.callData,
      hint: null,
    };
  }

  static async transferFrom(data) {
    let result = await Blockchain.post(
      {
        config: DappLib.getConfig(),
        contract: DappLib.DAPP_STATE_CONTRACT,
        params: {
          from: data.authorized,
        },
      },
      "transferFrom",
      data.from,
      data.to,
      data.amount
    );
    return {
      type: DappLib.DAPP_RESULT_TX_HASH,
      label: "Transaction Hash",
      result: DappLib.getTransactionHash(result.callData),
      hint: `Verify transfer by using "Balance for Account" to check the balance of ${DappLib.formatAccount(
        data.to
      )}.`,
    };
  }

  static async onApproval(callback) {
    let params = {};
    DappLib.addEventHandler(
      DappLib.DAPP_STATE_CONTRACT_WS,
      "Approval",
      params,
      callback
    );
  }

  static async onTransfer(callback) {
    let params = {};
    DappLib.addEventHandler(
      DappLib.DAPP_STATE_CONTRACT_WS,
      "Transfer",
      params,
      callback
    );
  }

/*>>>>>>>>>>>>>>>>>>>>>>>>>>>>> ACCESS CONTROL: CONTRACT ACCESS  <<<<<<<<<<<<<<<<<<<<<<<<<<<*/

    static async isContractAuthorized(data) {

        let result = await Blockchain.get({
                config: DappLib.getConfig(),
                contract: DappLib.DAPP_STATE_CONTRACT,
                params: {
                    from: null
                }
            },
            'isContractAuthorized',
            data.account
        );
        return {
            type: DappLib.DAPP_RESULT_BOOLEAN,
            label: 'Is Contract Authorized',
            result: result.callData,
            hint: null
        }
    }

    static async authorizeContract(data) {

        let result = await Blockchain.post({
                config: DappLib.getConfig(),
                contract: DappLib.DAPP_STATE_CONTRACT,
                params: {
                    from: null
                }
            },
            'authorizeContract',
            data.account
        );
        return {
            type: DappLib.DAPP_RESULT_TX_HASH,
            label: 'Transaction Hash',
            result: DappLib.getTransactionHash(result.callData),
            hint: `Verify ${DappLib.formatAccount(data.account)} is authorized by using "Is Contract Authorized."`
        }
    }

    static async deauthorizeContract(data) {

        let result = await Blockchain.post({
                config: DappLib.getConfig(),
                contract: DappLib.DAPP_STATE_CONTRACT,
                params: {
                    from: null
                }
            },
            'deauthorizeContract',
            data.account
        );
        return {
            type: DappLib.DAPP_RESULT_TX_HASH,
            label: 'Transaction Hash',
            result: DappLib.getTransactionHash(result.callData),
            hint: `Verify ${DappLib.formatAccount(data.account)} is no longer authorized by using "Is Contract Authorized."`
        }
    }

/*>>>>>>>>>>>>>>>>>>>>>>>>>>> ACCESS CONTROL: CONTRACT RUN STATE  <<<<<<<<<<<<<<<<<<<<<<<<<<*/

    static async isContractRunStateActive(data) {

        let result = await Blockchain.get({
                config: DappLib.getConfig(),
                contract: DappLib.DAPP_STATE_CONTRACT,
                params: {
                    from: null
                }
            },
            'isContractRunStateActive'
        );
        return {
            type: DappLib.DAPP_RESULT_BOOLEAN,
            label: 'Is Contract Run State Active',
            result: result.callData,
            hint: null
        }
    }

    static async setContractRunState(data) {
        let result = await Blockchain.post({
                config: DappLib.getConfig(),
                contract: DappLib.DAPP_STATE_CONTRACT,
                params: {
                    from: null
                }
            },
            'setContractRunState',
            data.mode
        );
        return {
            type: DappLib.DAPP_RESULT_TX_HASH,
            label: 'Transaction Hash',
            result: DappLib.getTransactionHash(result.callData),    
            hint: `Verify contract run state is ${data.mode ? 'active' : 'inactive'} by calling contract functions that use requireContractRunStateActive().`
        }
    }

    static async onContractRunStateChange(callback) {
        let params = {};
        DappLib.addEventHandler(DappLib.DAPP_STATE_CONTRACT_WS, 'ChangeContractRunState', params, callback);
    }

  /*>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> NFT: COMPOSER  <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<*/

  static async getURI(data) {
    let result = await Blockchain.get(
      {
        config: DappLib.getConfig(),
        contract: DappLib.DAPP_STATE_CONTRACT,
        params: {
          from: data.from,
        },
      },
      "getURI"
    );
    return {
      type: DappLib.DAPP_RESULT_STRING,
      label: "Result is",
      result: result.callData,
      hint: null,
    };
  }

  static async supportsInterface(data) {
    let result = await Blockchain.get(
      {
        config: DappLib.getConfig(),
        contract: DappLib.DAPP_STATE_CONTRACT,
        params: {
          from: data.from,
        },
      },
      "supportsInterface",
      data.interfaceId
    );
    return {
      type: DappLib.DAPP_RESULT_BOOLEAN,
      label: "Is supported",
      result: result.callData,
      hint: null,
    };
  }

  static async safeTransferFrom(data) {
    let result = await Blockchain.post(
      {
        config: DappLib.getConfig(),
        contract: DappLib.DAPP_STATE_CONTRACT,
        params: {
          from: data.authorized,
        },
      },
      "safeTransferFrom",
      data.from,
      data.to,
      data.id,
      data.amount,
      data.data
    );
    return {
      type: DappLib.DAPP_RESULT_TX_HASH,
      label: "Transaction Hash",
      result: DappLib.getTransactionHash(result.callData),
      raw: result.callData,
      hint: `Verify transfer by using "Balance for Account" to check the balance of ${DappLib.formatAccount(
        data.to
      )}.`,
    };
  }

  static async safeBatchTransferFrom(data) {
    let idsArray = [data.id1, data.id2, data.id3];
    let amountsArray = [data.amount1, data.amount2, data.amount3];

    if (typeof data.ids === "undefined") {
      data.ids = idsArray;
    }

    if (typeof data.amounts === "undefined") {
      data.amounts = amountsArray;
    }

    let result = await Blockchain.post(
      {
        config: DappLib.getConfig(),
        contract: DappLib.DAPP_STATE_CONTRACT,
        params: {
          from: data.authorized,
          gas: 2000000
        },
      },
      "safeBatchTransferFrom",
      data.from,
      data.to,
      data.ids,
      data.amounts,
      data.data
    );
    return {
      type: DappLib.DAPP_RESULT_TX_HASH,
      label: "Transaction Hash",
      raw: result.callData,
      result: DappLib.getTransactionHash(result.callData)
    };
  }

  static async balanceOf(data) {
    let result = await Blockchain.get(
      {
        config: DappLib.getConfig(),
        contract: DappLib.DAPP_STATE_CONTRACT,
        params: {
          from: data.from,
        },
      },
      "balanceOf",
      data.account,
      data.id
    );
    let balance = result.callData;
    return {
      type: DappLib.DAPP_RESULT_STRING,
      label: "Result is",
      result: result.callData,
      hint: null,
    };
  }

  static async balanceOfBatch(data) {
    let accountsArray = [data.account1, data.account2, data.account3];
    let idsArray = [data.id1, data.id2, data.id3];

    if (typeof data.ids === "undefined") {
      data.ids = idsArray;
    }

    if (typeof data.accounts === "undefined") {
      data.accounts = accountsArray;
    }

    let result = await Blockchain.get(
      {
        config: DappLib.getConfig(),
        contract: DappLib.DAPP_STATE_CONTRACT,
        params: {
          from: data.from,
        },
      },
      "balanceOfBatch",
      data.accounts,
      data.ids
    );
    return {
      type: DappLib.DAPP_RESULT_ARRAY,
      label: 'Batch balances',
      result: result.callData
    }
  }

  static async setApprovalForAll(data) {
    let result = await Blockchain.post(
      {
        config: DappLib.getConfig(),
        contract: DappLib.DAPP_STATE_CONTRACT,
        params: {
          from: data.from,
        },
      },
      "setApprovalForAll",
      data.operator,
      data.approved
    );
    return {
      type: DappLib.DAPP_RESULT_TX_HASH,
      label: "Transaction Hash",
      raw: result.callData,
      result: DappLib.getTransactionHash(result.callData)
    };
  }

  static async isApprovedForAll(data) {
    let result = await Blockchain.get(
      {
        config: DappLib.getConfig(),
        contract: DappLib.DAPP_STATE_CONTRACT,
        params: {
          from: data.from,
        },
      },
      "isApprovedForAll",
      data.account,
      data.operator
    );
    return {
      type: DappLib.DAPP_RESULT_BOOLEAN,
      label: "Is approved for all",
      result: result.callData,
      hint: null,
    };
  }

  static async setURI(data) {
    let result = await Blockchain.post(
      {
        config: DappLib.getConfig(),
        contract: DappLib.DAPP_STATE_CONTRACT,
        params: {
          from: data.authorized,
        },
      },
      "setURI",
      data.newURI
    );
    return {
      type: DappLib.DAPP_RESULT_TX_HASH,
      label: "Transaction Hash",
      result: DappLib.getTransactionHash(result.callData)
    };
  }

  static async mint(data) {
    let result = await Blockchain.post(
      {
        config: DappLib.getConfig(),
        contract: DappLib.DAPP_STATE_CONTRACT,
        params: {
          from: data.authorized,
        },
      },
      "mint",
      data.account,
      data.id,
      data.amount,
      data.data
    );
    return {
      type: DappLib.DAPP_RESULT_TX_HASH,
      label: "Transaction Hash",
      raw: result.callData,
      result: DappLib.getTransactionHash(result.callData)
    };
  }


  static async mintNFT(data) {
    console.log("DappLib Input: ", { data });
    let result = await Blockchain.post(
      {
        config: DappLib.getConfig(),
        contract: DappLib.DAPP_STATE_CONTRACT,
        params: {
          from: data.authorized,
          gas: 2000000
        },
      },
      "mintNFT",
      data.account,
      data.id,
      1,
      data.metaData
    );
    return {
      type: DappLib.DAPP_RESULT_TX_HASH,
      label: "Transaction Hash",
      raw: result.callData,
      result: DappLib.getTransactionHash(result.callData)
    };
  }

  static async mintBatch(data) {

    let idsArray = [data.id1, data.id2, data.id3];
    let amountsArray = [data.amount1, data.amount2, data.amount3];

    if (typeof data.ids === "undefined") {
      data.ids = idsArray;
    }

    if (typeof data.amounts === "undefined") {
      data.amounts = amountsArray;
    }

    let result = await Blockchain.post(
      {
        config: DappLib.getConfig(),
        contract: DappLib.DAPP_STATE_CONTRACT,
        params: {
          from: data.authorized,
          gas: 2000000
        },
      },
      "mintBatch",
      data.account,
      data.ids,
      data.amounts,
      data.data
    );
    return {
      type: DappLib.DAPP_RESULT_TX_HASH,
      label: "Transaction Hash",
      raw: result.callData,
      result: DappLib.getTransactionHash(result.callData)
    };
  }

  static async burn(data) {
    let result = await Blockchain.post(
      {
        config: DappLib.getConfig(),
        contract: DappLib.DAPP_STATE_CONTRACT,
        params: {
          from: data.authorized,
        },
      },
      "burn",
      data.account,
      data.id,
      data.amount
    );
    return {
      type: DappLib.DAPP_RESULT_TX_HASH,
      label: "Transaction Hash",
      raw: result.callData,
      result: DappLib.getTransactionHash(result.callData)
    };
  }

  static async burnBatch(data) {
    let idsArray = [data.id1, data.id2, data.id3];
    let amountsArray = [data.amount1, data.amount2, data.amount3];

    if (typeof data.ids === "undefined") {
      data.ids = idsArray;
    }

    if (typeof data.amounts === "undefined") {
      data.amounts = amountsArray;
    }

    let result = await Blockchain.post(
      {
        config: DappLib.getConfig(),
        contract: DappLib.DAPP_STATE_CONTRACT,
        params: {
          from: data.authorized,
          gas: 2000000
        },
      },
      "burnBatch",
      data.account,
      data.ids,
      data.amounts
    );
    return {
      type: DappLib.DAPP_RESULT_TX_HASH,
      label: "Transaction Hash",
      raw: result.callData,
      result: DappLib.getTransactionHash(result.callData)
    };
  }
    /*>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> FILE STORAGE: SIA  <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<*/

    static async addSiaDocument(data) {

        let folder = data.mode === 'folder';
        let config = DappLib.getConfig();

        // Push files to SIA
        let siaResult = await DappLib.siaUpload(config, data.files, folder);
        let results = [];
        for (let f = 0; f < siaResult.length; f++) {
            let file = siaResult[f];
            let result = await Blockchain.post({
                config: config,
                contract: DappLib.DAPP_STATE_CONTRACT,
                params: {
                    from: null,
                    gas: 2000000
                }
            },
                'addSiaDocument',
                file.docId,
                DappLib.fromAscii(data.label || '', 32)
            );
            results.push({
                transactionHash: DappLib.getTransactionHash(result.callData),
                docId: file.docId
            });
        }

        return {
            type: DappLib.DAPP_RESULT_SIA_HASH_ARRAY,
            result: results
        }
    }

    static async getSiaDocument(data) {

        let result = await Blockchain.get({
            config: DappLib.getConfig(),
            contract: DappLib.DAPP_STATE_CONTRACT,
            params: {
                from: null
            }
        },
            'getSiaDocument',
            data.id
        );

        if (result.callData && result.callData.docId) {            
            result.callData.docUrl = DappLib.formatSiaHash(result.callData.docId);
            result.callData.label = DappLib.toAscii(result.callData.label);
        } else {
            result.callData = {
                docId: '',
                docUrl: '',
                label: ''
            }
        }
        return {
            type: DappLib.DAPP_RESULT_OBJECT,
            label: 'Document Information',
            result: result.callData
        }
    }

    static async getSiaDocumentsByOwner(data) {

        let result = await Blockchain.get({
            config: DappLib.getConfig(),
            contract: DappLib.DAPP_STATE_CONTRACT,
            params: {
                from: null
            }
        },
            'getSiaDocumentsByOwner',
            data.account
        );

        return {
            type: DappLib.DAPP_RESULT_ARRAY,
            label: 'Documents',
            result: result.callData,
            formatter: ['Text-20-5']
        }
    }


    static async onAddSiaDocument(callback) {
        let params = {};
        DappLib.addEventHandler(DappLib.DAPP_STATE_CONTRACT_WS, 'AddSiaDocument', params, callback);
    }

    static async siaUpload(config, files, wrapWithDirectory) {

        // wrapWithDirectory is not supported

        let result = [];
        let apiUrl = `${config.sia.protocol}://${config.sia.host}/skynet/skyfile`;
        for (let f = 0; f < files.length; f++) {

            let formData = new FormData();
            formData.append('file', files[f]);

            let response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                },
                body: formData
            });

            let data = await response.json();
            result.push({
                docId: data.skylink
            });
        };
        return result;
    }

    static formatSiaHash(a) {
        let config = DappLib.getConfig();
        let url = `${config.sia.protocol}://${config.sia.host}/${a}`;
        return `<strong class="teal lighten-5 p-1 black-text number copy-target" title="${url}"><a href="${url}" target="_new">${a.substr(0, 6)}...${a.substr(a.length - 4, 4)}</a></strong>${DappLib.addClippy(a)}`;
    }

    /*>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> COLLECTION: ENTITY  <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<*/
    
        static async getEntity(data) {
            let result = await Blockchain.get({
                    config: DappLib.getConfig(),
                    contract: DappLib.DAPP_STATE_CONTRACT,
                    params: {
                        from: null
                    }
                },
                'getEntity',
                DappLib.fromAscii(data.id, 32)
            ); 

            if (result.callData) {
                result.callData.title = DappLib.toAscii(result.callData.title);
                result.callData.count = (new BN(result.callData.count)).toString(10);
            }
            return {
                type: DappLib.DAPP_RESULT_OBJECT,
                label: 'Get Entity',
                result: result.callData
            }
        }
        
        static async getEntityCount() {
            let result = await Blockchain.get({
                    config: DappLib.getConfig(),
                    contract: DappLib.DAPP_STATE_CONTRACT,
                    params: {
                        from: null
                    }
                },
                'getEntityCount'
            ); 
            if (result.callData) {
                result.callData = (new BN(result.callData)).toString(10);
            }
            return {
                type: DappLib.DAPP_RESULT_BIG_NUMBER,
                label: 'Get Entity Count',
                result: result.callData
            }
        }

        static async getEntitiesByCreator(data) {
            let result = await Blockchain.get({
                    config: DappLib.getConfig(),
                    contract: DappLib.DAPP_STATE_CONTRACT,
                    params: {
                        from: null
                    }
                },
                'getEntitiesByCreator',
                data.account
            );

            let resultArray = [];
            if (result.callData && Array.isArray(result.callData)) {
                result.callData.forEach((item) => {
                    resultArray.push(DappLib.toAscii(item));
                });
            }
            return {
                type: DappLib.DAPP_RESULT_ARRAY,
                label: 'Entities',
                result: resultArray,
                formatter: ['Text-20-5'] 
            }
        }

        static async getEntitiesByPage(data) {
            let result = await Blockchain.get({
                config: DappLib.getConfig(),
                contract: DappLib.DAPP_STATE_CONTRACT,
                params: {
                    from: null
                }
            },
            'getEntitiesByPage',
            data.page,
            data.resultsPerPage
            );

            let resultArray = [];
            result.callData.forEach((item) => {
                if(item != "0x0000000000000000000000000000000000000000000000000000000000000000"){
                    resultArray.push(item);
                };
            });

            return {
                type: DappLib.DAPP_RESULT_ARRAY,
                label: 'Entities By Page',
                result: resultArray,
                formatter: ['Text-20-5']
            }

        }
    
    
        static async setEntity(data) {
            let id = data.id ? data.id : DappLib.getUniqueId();
            let result = await Blockchain.post({
                    config: DappLib.getConfig(),
                    contract: DappLib.DAPP_STATE_CONTRACT,
                    params: {
                        from: data.from,
                        gas: 2000000
                    }
                },
                'setEntity',
                DappLib.fromAscii(id, 32),
                DappLib.fromAscii(data.title, 32),
                new BN(data.count)
            );
            return {
                type: DappLib.DAPP_RESULT_OBJECT,
                label: 'Transaction Hash',
                result: {
                    transactionHash: DappLib.getTransactionHash(result.callData),
                    id: id
                },
                hint: `Verify Entity was added by using "Get Entity."`
            }
        }



    /*>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> DAPP LIBRARY  <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<*/

    static get DAPP_STATE_CONTRACT() {
        return 'dappStateContract'
    }
    static get DAPP_CONTRACT() {
        return 'dappContract'
    }

    static get DAPP_STATE_CONTRACT_WS() {
        return 'dappStateContractWs'
    }
    static get DAPP_CONTRACT_WS() {
        return 'dappContractWs'
    }

    static get DAPP_RESULT_BIG_NUMBER() {
        return 'big-number'
    }

    static get DAPP_RESULT_ACCOUNT() {
        return 'account'
    }

    static get DAPP_RESULT_TX_HASH() {
        return 'tx-hash'
    }

    static get DAPP_RESULT_IPFS_HASH_ARRAY() {
        return 'ipfs-hash-array'
    }

    static get DAPP_RESULT_SIA_HASH_ARRAY() {
        return 'sia-hash-array'
    }

    static get DAPP_RESULT_ARRAY() {
        return 'array'
    }

    static get DAPP_RESULT_OBJECT() {
        return 'object'
    }

    static get DAPP_RESULT_STRING() {
        return 'string'
    }

    static get DAPP_RESULT_ERROR() {
        return 'error'
    }

    static async addEventHandler(contract, event, params, callback) {
        Blockchain.handleEvent({
            config: DappLib.getConfig(),
            contract: contract,
            params: params || {}
        },
            event,
            (error, result) => {
                if (error) {
                    callback({
                        event: event,
                        type: DappLib.DAPP_RESULT_ERROR,
                        label: 'Error Message',
                        result: error
                    });
                } else {
                    callback({
                        event: event,
                        type: DappLib.DAPP_RESULT_OBJECT,
                        label: 'Event ' + event,
                        result: DappLib.getObjectNamedProperties(result)
                    });
                }
            }
        );
    }

    static getTransactionHash(t) {
        if (!t) { return ''; }
        let value = '';
        if (typeof t === 'string') {
            value = t;
        } else if (typeof t === 'object') {
            if (t.hasOwnProperty('transactionHash')) {
                value = t.transactionHash;       // Ethereum                
            } else {
                value = JSON.stringify(t);
            }
        }
        return value;
    }

    static formatHint(hint) {
        if (hint) {
            return `<p class="mt-3 grey-text"><strong>Hint:</strong> ${hint}</p>`;
        } else {
            return '';
        }
    }

    static formatNumber(n) {
        var parts = n.toString().split(".");
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return `<strong class="p-1 blue-grey-text number copy-target" style="font-size:1.1rem;" title="${n}">${parts.join(".")}</strong>`;
    }

    static formatAccount(a) {
        return `<strong class="green accent-1 p-1 blue-grey-text number copy-target" title="${a}">${DappLib.toCondensed(a, 6, 4)}</strong>${DappLib.addClippy(a)}`;
    }

    static formatTxHash(a) {
        let value = DappLib.getTransactionHash(a);
        return `<strong class="teal lighten-5 p-1 blue-grey-text number copy-target" title="${value}">${DappLib.toCondensed(value, 6, 4)}</strong>${DappLib.addClippy(value)}`;
    }

    static formatBoolean(a) {
        return (a ? 'YES' : 'NO');
    }

    static formatText(a, copyText) {
        if (!a) { return; }
        if (a.startsWith('<')) {
            return a;
        }
        return `<span class="copy-target" title="${copyText ? copyText : a}">${a}</span>${DappLib.addClippy(copyText ? copyText : a)}`;
    }

    static formatStrong(a) {
        return `<strong>${a}</strong>`;
    }

    static formatPlain(a) {
        return a;
    }

    static formatObject(a) {
        let data = [];
        let labels = ['Item', 'Value'];
        let keys = ['item', 'value'];
        let formatters = ['Strong', 'Text-20-5']; // 'Strong': Bold, 'Text-20-5': Compress a 20 character long string down to 5
        let reg = new RegExp('^\\d+$'); // only digits
        for (let key in a) {
            if (!reg.test(key)) {
                data.push({
                    item: key.substr(0, 1).toUpperCase() + key.substr(1),
                    value: a[key]
                });
            }
        }
        return DappLib.formatArray(data, formatters, labels, keys);
    }

    static formatArray(h, dataFormatters, dataLabels, dataKeys) {

        let output = '<table class="table table-striped">';

        if (dataLabels) {
            output += '<thead><tr>';
            for (let d = 0; d < dataLabels.length; d++) {
                output += `<th scope="col">${dataLabels[d]}</th>`;
            }
            output += '</tr></thead>';
        }
        output += '<tbody>';
        h.map((item) => {
            output += '<tr>';
            for (let d = 0; d < dataFormatters.length; d++) {
                let text = String(dataKeys && dataKeys[d] ? item[dataKeys[d]] : item);
                let copyText = dataKeys && dataKeys[d] ? item[dataKeys[d]] : item;
                if (text.startsWith('<')) {
                    output += (d == 0 ? '<th scope="row">' : '<td>') + text + (d == 0 ? '</th>' : '</td>');
                } else {
                    let formatter = 'format' + dataFormatters[d];
                    if (formatter.startsWith('formatText')) {
                        let formatterFrags = formatter.split('-');
                        if (formatterFrags.length === 3) {
                            text = DappLib.toCondensed(text, Number(formatterFrags[1]), Number(formatterFrags[2]));
                        } else if (formatterFrags.length === 2) {
                            text = DappLib.toCondensed(text, Number(formatterFrags[1]));
                        }
                        formatter = formatterFrags[0];
                    }
                    output += (d == 0 ? '<th scope="row">' : '<td>') + DappLib[formatter](text, copyText) + (d == 0 ? '</th>' : '</td>');
                }
            }
            output += '</tr>';
        })
        output += '</tbody></table>';
        return output;
    }

    static getFormattedResultNode(retVal, key) {

        let returnKey = 'result';
        if (key && (key !== null) && (key !== 'null') && (typeof (key) === 'string')) {
            returnKey = key;
        }
        let formatted = '';
        switch (retVal.type) {
            case DappLib.DAPP_RESULT_BIG_NUMBER:
                formatted = DappLib.formatNumber(retVal[returnKey].toString(10));
                break;
            case DappLib.DAPP_RESULT_TX_HASH:
                formatted = DappLib.formatTxHash(retVal[returnKey]);
                break;
            case DappLib.DAPP_RESULT_ACCOUNT:
                formatted = DappLib.formatAccount(retVal[returnKey]);
                break;
            case DappLib.DAPP_RESULT_BOOLEAN:
                formatted = DappLib.formatBoolean(retVal[returnKey]);
                break;
            case DappLib.DAPP_RESULT_IPFS_HASH_ARRAY:
                formatted = DappLib.formatArray(
                    retVal[returnKey],
                    ['TxHash', 'IpfsHash', 'Text-10-5'], //Formatter
                    ['Transaction', 'IPFS URL', 'Doc Id'], //Label
                    ['transactionHash', 'ipfsHash', 'docId'] //Values
                );
                break;
            case DappLib.DAPP_RESULT_SIA_HASH_ARRAY:
                formatted = DappLib.formatArray(
                    retVal[returnKey],
                    ['TxHash', 'SiaHash', 'Text-10-5'], //Formatter
                    ['Transaction', 'Sia URL', 'Doc Id'], //Label
                    ['transactionHash', 'docId', 'docId'] //Values
                );
                break;
            case DappLib.DAPP_RESULT_ARRAY:
                formatted = DappLib.formatArray(
                    retVal[returnKey],
                    retVal.formatter ? retVal.formatter : ['Text'],
                    null,
                    null
                );
                break;
            case DappLib.DAPP_RESULT_STRING:
                formatted = DappLib.formatPlain(
                    retVal[returnKey]
                );
                break;
            case DappLib.DAPP_RESULT_OBJECT:
                formatted = DappLib.formatObject(retVal[returnKey]);
                break;
            default:
                formatted = retVal[returnKey];
                break;
        }

        let resultNode = document.createElement('div');
        resultNode.className = `note text-xs ${retVal.type === DappLib.DAPP_RESULT_ERROR ? 'bg-red-400' : 'bg-green-400'} m-3 p-3`;
        let closeMarkup = '<div class="float-right" onclick="this.parentNode.parentNode.removeChild(this.parentNode)" title="Dismiss" class="text-right mb-1 mr-2" style="cursor:pointer;">X</div>';
        resultNode.innerHTML = `<span class='text-xl break-words'>${closeMarkup} ${retVal.type === DappLib.DAPP_RESULT_ERROR ? '☹️' : '👍️'} ${(Array.isArray(retVal[returnKey]) ? 'Result' : retVal.label)} : ${formatted} ${DappLib.formatHint(retVal.hint)}</span>`
        // Wire-up clipboard copy
        new ClipboardJS('.copy-target', {
            text: function (trigger) {
                return trigger.getAttribute('data-copy');
            }
        });

        return resultNode;
    }

    static getObjectNamedProperties(a) {
        let reg = new RegExp('^\\d+$'); // only digits
        let newObj = {};
        for (let key in a) {
            if (!reg.test(key)) {
                newObj[key] = a[key];
            }
        }
        return newObj;
    }

    static addClippy(data) {
        return `
        <svg data-copy="${data}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
             viewBox="0 0 22.1 23.5" style="enable-background:new 0 0 22.1 23.5;cursor:pointer;" class="copy-target" width="19px" height="20.357px" xml:space="preserve">
        <style type="text/css">
            .st99{fill:#777777;stroke:none;stroke-linecap:round;stroke-linejoin:round;}
        </style>
        <path class="st99" d="M3.9,17.4h5.4v1.4H3.9V17.4z M10.7,9.2H3.9v1.4h6.8V9.2z M13.4,13.3v-2.7l-4.1,4.1l4.1,4.1V16h6.8v-2.7H13.4z
             M7.3,12H3.9v1.4h3.4V12z M3.9,16h3.4v-1.4H3.9V16z M16.1,17.4h1.4v2.7c0,0.4-0.1,0.7-0.4,1c-0.3,0.3-0.6,0.4-1,0.4H2.6
            c-0.7,0-1.4-0.6-1.4-1.4V5.2c0-0.7,0.6-1.4,1.4-1.4h4.1c0-1.5,1.2-2.7,2.7-2.7s2.7,1.2,2.7,2.7h4.1c0.7,0,1.4,0.6,1.4,1.4V12h-1.4
            V7.9H2.6v12.2h13.6V17.4z M3.9,6.5h10.9c0-0.7-0.6-1.4-1.4-1.4h-1.4c-0.7,0-1.4-0.6-1.4-1.4s-0.6-1.4-1.4-1.4S8,3.1,8,3.8
            S7.4,5.2,6.6,5.2H5.3C4.5,5.2,3.9,5.8,3.9,6.5z"/>
        </svg>
        `;
    }

    static getAccounts() {
        let accounts = dappConfig.accounts;
        return accounts;
    }

    static fromAscii(str, padding) {

        if (Array.isArray(str)) {
            return DappLib.arrayToHex(str);
        }

        if (str.startsWith('0x') || !padding) {
            return str;
        }

        if (str.length > padding) {
            str = str.substr(0, padding);
        }

        var hex = '0x';
        for (var i = 0; i < str.length; i++) {
            var code = str.charCodeAt(i);
            var n = code.toString(16);
            hex += n.length < 2 ? '0' + n : n;
        }
        return hex + '0'.repeat(padding * 2 - hex.length + 2);
    };


    static toAscii(hex) {
        var str = '',
            i = 0,
            l = hex.length;
        if (hex.substring(0, 2) === '0x') {
            i = 2;
        }
        for (; i < l; i += 2) {
            var code = parseInt(hex.substr(i, 2), 16);
            if (code === 0) continue; // this is added
            str += String.fromCharCode(code);
        }
        return str;
    };

    static arrayToHex(bytes) {
        if (Array.isArray(bytes)) {
            return '0x' +
                Array.prototype.map.call(bytes, function (byte) {
                    return ('0' + (byte & 0xFF).toString(16)).slice(-2);
                }).join('')
        } else {
            return bytes;
        }
    }

    static hexToArray(hex) {
        if ((typeof hex === 'string') && (hex.beginsWith('0x'))) {
            let bytes = [];
            for (let i = 0; i < hex.length; i += 2) {
                bytes.push(parseInt(hex.substr(i, 2), 16));
            }
            return bytes;
        } else {
            return hex;
        }
    }

    static toCondensed(s, begin, end) {
        if (!s) { return; }
        if (s.length && s.length <= begin + end) {
            return s;
        } else {
            if (end) {
                return `${s.substr(0, begin)}...${s.substr(s.length - end, end)}`;
            } else {
                return `${s.substr(0, begin)}...`;
            }
        }
    }

    static getManifest() {
        return manifest;
    }

    // https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
    static getUniqueId() {
        return 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'.replace(/[x]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    static getConfig() {
        return dappConfig;
    }

    // Return value of this function is used to dynamically re-define getConfig()
    // for use during testing. With this approach, even though getConfig() is static
    // it returns the correct contract addresses as its definition is re-written
    // before each test run. Look for the following line in test scripts to see it done:
    //  DappLib.getConfig = Function(`return ${ JSON.stringify(DappLib.getTestConfig(testDappStateContract, testDappContract, testAccounts))}`);
    static getTestConfig(testDappStateContract, testDappContract, testAccounts) {

        return Object.assign(
            {},
            dappConfig,
            {
                dappStateContractAddress: testDappStateContract.address,
                dappContractAddress: testDappContract.address,
                accounts: testAccounts,
                owner: testAccounts[0],
                admins: [
                    testAccounts[1],
                    testAccounts[2],
                    testAccounts[3]
                ],
                users: [
                    testAccounts[4],
                    testAccounts[5],
                    testAccounts[6],
                    testAccounts[7],
                    testAccounts[8]
                ]
                                , siaTestFiles: [
        "bAAxym_7nhgJ2ik4bigtaAijSE6MPlcxxaPi3Am6860izw",
        "TABXJcGMxah8uHvHc0EbjPPZs6PprUZoQYdTw8y7cRpywg",
        "TADiaX-_OmVbuXGr7P1qO4eZtbaIH9U10yRAFBDz8ByEQQ",
        "nABE5aTWpvRIHRMjWQ-FfPm8oRYwk1K9Fe34SYdXL62qGQ",
        "VAAEYFNbyjwMBb2u7CAHUhhB0s9mzHtVj-r5GeS0Wyb_Ng",
        "nAA6F_yfhc8l1cyPziOM0_v8ID810lejD41uJGIs2-wK7g",
        "XADuEUu7x2LZhMQAMcujCw4b8h9EbzaykKZjtWX9uQnRmQ",
        "ZAAWYFA9MJn4F7kcczddEfe7i4h_o4-J6SPKJAPkjzXbRA",
        "ZABYXqcExzRdbkhF4dLP8RZk4HdGcxfCSnteUGs_6H6uYQ",
        "rABpV_5o0NVE1bweOL0M-ne2TZe60lXIRLQyhn-Hc9FX5g"
    ]

            }
        );
    }

}