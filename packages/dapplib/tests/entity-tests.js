const TestHelpers = require('@openzeppelin/test-helpers');
const BN = TestHelpers.BN;
const DappLib = require('../src/dapp-lib.js');
const DappContract = artifacts.require('Dapp');
const DappStateContract = artifacts.require('DappState');

///+imports

contract('Dapp Contract Tests', async (testAccounts) => {

    let config = null;

    before('setup contract', async () => {

        let testDappStateContract = await DappStateContract.new();
        let testDappContract = await DappContract.new(testDappStateContract.address);

        // Swap the definition of the DappLib.getConfig() function so it returns
        // dynamic contract addresses from the deployment above instead of the static
        // addresses from the last migration script run. Also, inject test accounts 
        // for contracts and IPFS. The testAccounts variable is initialized by Truffle
        // so we get whatever accounts are provided via the provider in truffle config.
        DappLib.getConfig = Function(`return ${ JSON.stringify(DappLib.getTestConfig(testDappStateContract, testDappContract, testAccounts))}`);

        // Call the re-written function to get the test config values
        config = DappLib.getConfig();
        config.testDappStateContract = testDappStateContract;
        config.testDappContract = testDappContract;
    });


// it(`has correct total supply of tokens using totalSupply()`, async function () {
//     try {
//         let testData1 = {
//             from: config.owner
//         }
//         let supply = (await DappLib.totalSupply(testData1)).result;
//         assert.equal(supply.toString(10), initialSupply.toString(10), "Incorrect total supply");    
//     }
//     catch(e) {
//         assert.fail(e.message);
//     }
// });

it(`can add a new entity using setEntity()`, async function () {
    try {
        // arrange
        let entity = {
            title: "Hello World",
            count:  42,
            from: config.owner
        }

        // act
        let txValue = await DappLib.setEntity(entity);
        entity.id = txValue.result.id;
        
        // assert
        let returnValue = (await DappLib.getEntity(entity)).result;

        assert.equal(entity.from, returnValue.creator, "Incorrect creator value");
        assert.equal(entity.title, returnValue.title, "Incorrect title value");
        assert.equal(entity.count.toString(10), returnValue.count.toString(10), "Incorrect count value");

    }
    catch(e) {
        assert.fail(e.message);
    }
});




it(`can update an entity using setEntity()`, async function () {
    try {
        // arrange
        let entity = {
            title: "Hello World",
            count:  42,
            from: config.owner
        }

        let updatedEntity = {
            title: "GoodBye World",
            count: 24,
            from: config.owner
        }

        // act
        let txValue = await DappLib.setEntity(entity);
        entity.id = txValue.result.id;
        updatedEntity.id = txValue.result.id;

        // assert
        await DappLib.setEntity(updatedEntity);

        let returnValue = (await DappLib.getEntity(entity)).result;

        assert.equal(updatedEntity.from, returnValue.creator, "Incorrect creator value");
        assert.equal(updatedEntity.title, returnValue.title, "Incorrect title value");
        assert.equal(updatedEntity.count.toString(10), returnValue.count.toString(10), "Incorrect count value");

    }
    catch(e) {
        assert.fail(e.message);
    }
});




});