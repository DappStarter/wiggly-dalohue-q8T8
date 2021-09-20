require('@babel/register');
({
    ignore: /node_modules/
});
require('@babel/polyfill');

const HDWalletProvider = require('@truffle/hdwallet-provider');

let mnemonic = 'jazz enroll supply suggest name rate mad mistake half private equal gas'; 
let testAccounts = [
"0x29a857f55838cfe19dd7b34fef969ca7ed05e88eb642d34b2dcbe7baa6e97dff",
"0xe3e70bfa37f14bf08569a03dfb79c7f42ea0fe7cad4aec52b089548697e8aae0",
"0xf77c9978e3101ae6d7dea6fa456484a553b13f512661d5ca0572ccf56f6089da",
"0x51a8e8182eeade887fe3c15d2719241439829d8b149d338f0a27aa51e79103dd",
"0x831d08458f9a26cb47697f2beb4c25c2a929aee0042c6130cb2395dbbfba1d25",
"0x0acc2679213e29ee6df5734a42599c4cb4d4e5faac61787f60c1ea838360f959",
"0x00a6aad9ff395aa681f1a847f736454c12c9254caf1bac296e4b1508bcfd1692",
"0x953697bd3d0be79448f2acb607c3192be1711b6e2dd8492f8348db2639132871",
"0x7539f9499385abd5dcdda98bf4cd6bfff81a76feb79d725ac388d5b10e1d67dd",
"0x7a08e77ecf23125be6315d4ca21a52bf2c40bd6feff47346f79dd007bfd52a00"
]; 
let devUri = 'http://127.0.0.1:7545/';

module.exports = {
    testAccounts,
    mnemonic,
    networks: {
        development: {
            uri: devUri,
            provider: () => new HDWalletProvider(
                mnemonic,
                devUri, // provider url
                0, // address index
                10, // number of addresses
                true, // share nonce
                `m/44'/60'/0'/0/` // wallet HD path
            ),
            network_id: '*'
        }
    },
    compilers: {
        solc: {
            version: '^0.8.0'
        }
    }
};

