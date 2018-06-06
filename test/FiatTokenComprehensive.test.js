
import {
  setupAccountsFromTestRPC,
  setToken,
  checkVariables,
  setMinter,
  mint,
  mintRaw
} from './TokenTestUtils';

import {
  name, symbol, currency, decimals, bigZero, bigHundred, debugLogging,
  arbitraryAccount, masterMinterAccount, minterAccount, pauserAccount, blacklisterAccount,
  roleAddressChangerAccount, upgraderAccount, owner, token
} from './TokenTestUtils';

import expectThrow from '../node_modules/zeppelin-solidity/test/helpers/expectThrow';

contract('FiatToken', function (accounts) {
  const util = require('util');
  var _ = require('lodash');
  var FiatToken = artifacts.require('FiatToken');
  var EternalStorage = artifacts.require('EternalStorage');
  var name = 'Sample Fiat Token';
  var symbol = 'C-USD';
  var currency = 'USD';
  var decimals = 2;
  var BigNumber = require('bignumber.js');
  var bigZero = new BigNumber(0);
  // used as arbitrary number
  var bigHundred = new BigNumber(100);
  // TODO: test really big numbers

  const should = require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber')(BigNumber))
    .should()

  var BigNumber = require('bignumber.js');

  setupAccountsFromTestRPC(accounts)

  beforeEach(async function checkBefore() {
    let newToken = await FiatToken.new("0x0", name, symbol, currency, decimals, masterMinterAccount, pauserAccount, blacklisterAccount, upgraderAccount, roleAddressChangerAccount);
    setToken(newToken)
    let tokenAddress = token.address;

    let dataContractAddress = await token.getDataContractAddress();
    let storage = EternalStorage.at(dataContractAddress);
    assert.equal(await storage.owner.call(), tokenAddress)

    await checkVariables([]);
  });

  // Test template
  /*  it('<DESCRIPTION>', async function () {
    let actual = await token.<FUNCTION>();
    customVars = [{'variable': '<VARIABLE NAME>', 'expectedValue': actual}];
    await checkVariables(token, customVars);
  }); */

  //  it('should have correct contractStorage after contract initialization', async function () {
  //    let actual = await token.getDataContractAddress();
  //    var customVars = {'contractStorage': actual};
  //    await checkVariables(token, customVars);
  //  });

  it('should have correct blacklister after contract initialization', async function checkBlacklister() {
    let actual = await token.blacklister.call();
    var customVars = [{ 'variable': 'blacklister', 'expectedValue': actual }];
    await checkVariables(customVars);
  });

  it('should have correct pauser after contract initialization', async function checkPauser() {
    let actual = await token.pauser.call();
    var customVars = [{ 'variable': 'pauser', 'expectedValue': actual }];
    await checkVariables(customVars);
  });

  it('should have correct upgrader after contract initialization', async function checkUpgrader() {
    let actual = await token.upgrader.call();
    var customVars = [{ 'variable': 'upgrader', 'expectedValue': actual }];
    await checkVariables(customVars);
  });

  it('should have correct roleAddressChanger after updateRoleAddress', async function checkRoleAddressChanger() {
    await token.updateRoleAddress(arbitraryAccount, 'roleAddressChanger', { from: roleAddressChangerAccount });
    var customVars = [{ 'variable': 'roleAddressChanger', 'expectedValue': arbitraryAccount }];
    await checkVariables(customVars);
  });

  it('should have correct blacklister after updateRoleAddress', async function () {
    await token.updateRoleAddress(arbitraryAccount, 'blacklister', { from: roleAddressChangerAccount });
    var customVars = [{ 'variable': 'blacklister', 'expectedValue': arbitraryAccount }];
    await checkVariables(customVars);
  });

  it('should have correct pauser after updateRoleAddress', async function () {
    await token.updateRoleAddress(arbitraryAccount, 'pauser', { from: roleAddressChangerAccount });
    var customVars = [{ 'variable': 'pauser', 'expectedValue': arbitraryAccount }];
    await checkVariables(customVars);
  });

  it('should pause and set paused to true', async function () {
    await token.pause({ from: pauserAccount });
    var customVars = [{ 'variable': 'paused', 'expectedValue': true }];
    await checkVariables(customVars);
  });

  it('should unpause and set paused to false', async function () {
    await token.pause({ from: pauserAccount });
    var customVars = [{ 'variable': 'paused', 'expectedValue': true }];
    await checkVariables(customVars);
    await token.unpause({ from: pauserAccount });
    customVars = [{ 'variable': 'paused', 'expectedValue': false }];
    await checkVariables(customVars);
  });

  it('should approve a spend and set allowed amount', async function () {
    await token.approve(minterAccount, 100, { from: arbitraryAccount });
    var customVars = [{ 'variable': 'allowance.arbitraryAccount.minterAccount', 'expectedValue': bigHundred }];
    await checkVariables(customVars)
  });

  it('should blacklist and set blacklisted to true', async function () {
    await token.blacklist(arbitraryAccount, { from: blacklisterAccount });
    var customVars = [{ 'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true }]
    await checkVariables(customVars)
  });

  it('should blacklist and set blacklisted to true, then unblacklist and set blacklisted to false', async function () {
    await token.blacklist(arbitraryAccount, { from: blacklisterAccount });
    var customVars = [{ 'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true }]
    await checkVariables(customVars)

    await token.unBlacklist(arbitraryAccount, { from: blacklisterAccount });
    customVars = [{ 'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': false }]
    await checkVariables(customVars)
  });

  it('should burn amount of tokens and reduce balance and total supply by amount', async function () {
    var amount = 100;

    // mint tokens to arbitraryAccount
    await mint(minterAccount, amount);
    var customVars = [
      { 'variable': 'totalSupply', 'expectedValue': new BigNumber(amount) },
      { 'variable': 'balances.minterAccount', 'expectedValue': new BigNumber(amount) },
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true }
    ]
    await checkVariables(customVars);

    await token.burn(amount, { from: minterAccount });

    var customVars = [{ 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true }]
    // (tests that totalSupply and balance are returned to defaults after burn)
    await checkVariables(customVars);
  });

  it('should configureMinter, setting the minter to true and mintingAllowance to amount', async function () {
    var amount = 100;

    // configure minter
    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    var customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': amount }
    ]
    await checkVariables(customVars);
  });

  it('should mint the amount, increasing balance of recipient by amount, increasing total supply by amount, and decreasing minterAllowed by amount', async function () {
    var amount = 100

    // configure minter
    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    var customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount) }
    ]
    await checkVariables(customVars);

    await token.mint(arbitraryAccount, 50, { from: minterAccount });

    customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(50) },
      { 'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(50) },
      { 'variable': 'totalSupply', 'expectedValue': new BigNumber(50) }
    ]

    await checkVariables(customVars);
  });

  it('should removeMinter, setting the minter to false and minterAllowed to 0', async function () {
    var amount = 100

    // configure minter
    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });

    var customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount) }
    ]
    await checkVariables(customVars);

    // remove minter
    await token.removeMinter(minterAccount, { from: masterMinterAccount });

    // TODO: decide whether, in general, returning to defaults should be passed in explicitly or empty array
    customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': false },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': bigZero }
    ]
    await checkVariables(customVars);
  });

  it('should transfer, reducing sender balance by amount and increasing recipient balance by amount', async function () {
    var amount = 100

    // configure minter
    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    var customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount) }
    ]
    await checkVariables(customVars);

    await token.mint(arbitraryAccount, 50, { from: minterAccount });

    customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(50) },
      { 'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(50) },
      { 'variable': 'totalSupply', 'expectedValue': new BigNumber(50) }
    ]
    await checkVariables(customVars);

    await token.transfer(pauserAccount, 50, { from: arbitraryAccount })

    customVars = [
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(50) },
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'balances.arbitraryAccount', 'expectedValue': bigZero },
      { 'variable': 'balances.pauserAccount', 'expectedValue': new BigNumber(50) },
      { 'variable': 'totalSupply', 'expectedValue': new BigNumber(50) }
    ]
    await checkVariables(customVars);
  });

  it('should transferFrom, reducing sender balance by amount and increasing recipient balance by amount', async function () {
    var amount = 100;

    // configure minter
    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    var customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount) }
    ]
    await checkVariables(customVars);

    await token.mint(arbitraryAccount, 50, { from: minterAccount });

    customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(50) },
      { 'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(50) },
      { 'variable': 'totalSupply', 'expectedValue': new BigNumber(50) }
    ]
    await checkVariables(customVars);

    await token.approve(upgraderAccount, 50, { from: arbitraryAccount });

    await token.transferFrom(arbitraryAccount, pauserAccount, 50, { from: upgraderAccount })

    customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(50) },
      { 'variable': 'balances.arbitraryAccount', 'expectedValue': bigZero },
      { 'variable': 'balances.pauserAccount', 'expectedValue': new BigNumber(50) },
      { 'variable': 'totalSupply', 'expectedValue': new BigNumber(50) }
    ]
    await checkVariables(customVars);
  });

  it('configureMinter', async function () {
    // make sure not a minter and set up pre-conditions
    let amount = 11;
    var notAMinter = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': false },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': 0 },
      { 'variable': 'paused', 'expectedValue': false },
      { 'variable': 'totalSupply', 'expectedValue': 0 }
    ]
    await checkVariables(notAMinter);

    // now make into a minter
    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    var isAMinter = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': amount },
      { 'variable': 'totalSupply', 'expectedValue': 0 }
    ]
    // verify it worked
    await checkVariables(isAMinter);
  });

  it('configureMinter whilePaused', async function () {
    let amount = 6;

    // pause contract and make sure not a minter
    await token.pause({ from: pauserAccount })
    var notAMinter = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': false },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': 0 },
      { 'variable': 'paused', 'expectedValue': true }
    ]
    await checkVariables(notAMinter);

    // now make into a minter - this will throw
    await expectThrow(token.configureMinter(minterAccount, amount, { from: masterMinterAccount }));

    // state should be unchanged
    await checkVariables(notAMinter)
  });

  it('configureMinter from bad masterMinter', async function () {
    let amount = 6;

    // make sure not a minter, and sender is not a masterMinter
    var notAMinter = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': false },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': 0 },
      { 'variable': 'paused', 'expectedValue': false },
      { 'variable': 'masterMinter', 'expectedValue': masterMinterAccount }
    ]
    assert.isFalse(arbitraryAccount == masterMinterAccount)
    await checkVariables(notAMinter);

    // now make into a minter - this will throw
    await expectThrow(token.configureMinter(minterAccount, amount, { from: arbitraryAccount }));

    // state should be unchanged
    await checkVariables(notAMinter)
  });

  it('configureMinter when masterMinter is blacklisted', async function () {
    // set up pre-conditions
    let amount = 11;
    await token.blacklist(masterMinterAccount, { from: blacklisterAccount });
    var setup = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': false },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': 0 },
      { 'variable': 'isAccountBlacklisted.masterMinterAccount', 'expectedValue': true },
      { 'variable': 'paused', 'expectedValue': false }
    ]
    await checkVariables(setup);

    // now configure minter
    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    var result = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': amount },
      { 'variable': 'isAccountBlacklisted.masterMinterAccount', 'expectedValue': true },
      { 'variable': 'paused', 'expectedValue': false }
    ]
    // verify it worked
    await checkVariables(result);
  });

  it('configureMinter when minter is blacklisted', async function () {
    // set up pre-conditions
    let amount = 11;
    await token.blacklist(minterAccount, { from: blacklisterAccount });
    var setup = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': false },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': 0 },
      { 'variable': 'isAccountBlacklisted.minterAccount', 'expectedValue': true },
      { 'variable': 'paused', 'expectedValue': false }
    ]
    await checkVariables(setup);

    // now configure minter
    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    var result = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': amount },
      { 'variable': 'isAccountBlacklisted.minterAccount', 'expectedValue': true },
      { 'variable': 'paused', 'expectedValue': false }
    ]
    // verify it worked
    await checkVariables(result);
  });

  it('removeMinter', async function () {
    // set up pre-conditions
    let amount = 11;
    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    var isAMinter = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': amount },
      { 'variable': 'paused', 'expectedValue': false }
    ]
    await checkVariables(isAMinter);

    // now remove minter
    await token.removeMinter(minterAccount, { from: masterMinterAccount });
    var notAMinter = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': false },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': 0 },
      { 'variable': 'paused', 'expectedValue': false }
    ]
    // verify it worked
    await checkVariables(notAMinter);
  });

  it('removeMinter does not affect totalSupply or balances', async function () {
    // set up pre-conditions
    let amount = 11;
    let totalSupply = 10;
    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    await token.mint(minterAccount, totalSupply, { from: minterAccount })
    var isAMinter = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': amount - totalSupply },
      { 'variable': 'balances.minterAccount', 'expectedValue': totalSupply },
      { 'variable': 'totalSupply', 'expectedValue': totalSupply }
    ]
    await checkVariables(isAMinter);

    // now remove minter
    await token.removeMinter(minterAccount, { from: masterMinterAccount });
    var notAMinter = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': false },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': 0 },
      { 'variable': 'balances.minterAccount', 'expectedValue': totalSupply },
      { 'variable': 'totalSupply', 'expectedValue': totalSupply }
    ]
    // verify it worked
    await checkVariables(notAMinter);
  });

  it('removeMinter whilePaused', async function () {
    // set up pre-conditions
    let amount = 6;
    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    await token.pause({ from: pauserAccount })
    var isAMinter = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': amount },
      { 'variable': 'paused', 'expectedValue': true }
    ]
    await checkVariables(isAMinter);

    // now remove minter
    await token.removeMinter(minterAccount, { from: masterMinterAccount });
    var notAMinter = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': false },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': 0 },
      { 'variable': 'paused', 'expectedValue': true }
    ]
    // verify it worked
    await checkVariables(notAMinter);
  });

  it('removeMinter from bad masterMinter', async function () {
    // set up pre-conditions
    let amount = 11;
    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    var isAMinter = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': amount },
      { 'variable': 'paused', 'expectedValue': false }
    ]
    await checkVariables(isAMinter);

    // now remove minter - this will throw
    await expectThrow(token.removeMinter(minterAccount, { from: arbitraryAccount }));

    // state should be unchanged
    await checkVariables(isAMinter)
  });

  it('removeMinter when masterMinter is blacklisted', async function () {
    // set up pre-conditions
    let amount = 11;
    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    await token.blacklist(masterMinterAccount, { from: blacklisterAccount });
    var setup = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': amount },
      { 'variable': 'isAccountBlacklisted.masterMinterAccount', 'expectedValue': true },
      { 'variable': 'paused', 'expectedValue': false }
    ]
    await checkVariables(setup);

    // now remove minter
    await token.removeMinter(minterAccount, { from: masterMinterAccount });
    var notAMinter = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': false },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': 0 },
      { 'variable': 'paused', 'expectedValue': false }
    ]
    // verify it worked
    await checkVariables(notAMinter);
  });

  it('removeMinter when minter is blacklisted', async function () {
    // set up pre-conditions
    let amount = 11;
    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    await token.blacklist(minterAccount, { from: blacklisterAccount });
    var setup = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': amount },
      { 'variable': 'isAccountBlacklisted.minterAccount', 'expectedValue': true },
      { 'variable': 'paused', 'expectedValue': false }
    ]
    await checkVariables(setup);

    // now remove minter
    await token.removeMinter(minterAccount, { from: masterMinterAccount });
    var notAMinter = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': false },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': 0 },
      { 'variable': 'paused', 'expectedValue': false }
    ]
    // verify it worked
    await checkVariables(notAMinter);
  });

  it('burn', async function () {
    // set up pre-conditions
    var amount = 11;
    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    await token.mint(minterAccount, amount, { from: minterAccount });
    var setup = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': 0 },
      { 'variable': 'balances.minterAccount', 'expectedValue': amount },
      { 'variable': 'totalSupply', 'expectedValue': amount },
      { 'variable': 'paused', 'expectedValue': false },
    ]
    await checkVariables(setup);

    // now burn the tokens
    await token.burn(amount, { from: minterAccount })

    var afterBurn = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': 0 },
      { 'variable': 'balances.minterAccount', 'expectedValue': 0 },
      { 'variable': 'totalSupply', 'expectedValue': 0 },
      { 'variable': 'paused', 'expectedValue': false }
    ]

    // state should be unchanged
    await checkVariables(afterBurn)
  });

  it('burn some', async function () {
    // set up pre-conditions
    var amount = 11;
    var burnAmount = 10;
    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    await token.mint(minterAccount, amount, { from: minterAccount });
    var setup = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': 0 },
      { 'variable': 'balances.minterAccount', 'expectedValue': amount },
      { 'variable': 'totalSupply', 'expectedValue': amount },
      { 'variable': 'paused', 'expectedValue': false }
    ]
    await checkVariables(setup);

    // now burn the tokens
    await token.burn(burnAmount, { from: minterAccount })

    var afterBurn = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': 0 },
      { 'variable': 'balances.minterAccount', 'expectedValue': amount - burnAmount },
      { 'variable': 'totalSupply', 'expectedValue': amount - burnAmount },
      { 'variable': 'paused', 'expectedValue': false }
    ]

    // state should be unchanged
    await checkVariables(afterBurn)
  });

  it('burn too many', async function () {
    // set up pre-conditions
    var amount = 11;
    var burnAmount = 12;
    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    await token.mint(minterAccount, amount, { from: minterAccount });
    var setup = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': 0 },
      { 'variable': 'balances.minterAccount', 'expectedValue': amount },
      { 'variable': 'totalSupply', 'expectedValue': amount },
      { 'variable': 'paused', 'expectedValue': false }
    ]
    await checkVariables(setup);

    // now burn the tokens
    await expectThrow(token.burn(burnAmount, { from: minterAccount }))

    // state should be unchanged
    await checkVariables(setup)
  });

  it('burn -1', async function () {
    // set up pre-conditions
    var amount = 11;
    var burnAmount = -1;
    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    await token.mint(minterAccount, amount, { from: minterAccount });
    var setup = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': 0 },
      { 'variable': 'balances.minterAccount', 'expectedValue': amount },
      { 'variable': 'totalSupply', 'expectedValue': amount },
      { 'variable': 'paused', 'expectedValue': false }
    ]
    await checkVariables(setup);

    // now burn the tokens
    await expectThrow(token.burn(burnAmount, { from: minterAccount }))

    // state should be unchanged
    await checkVariables(setup)
  });

  it('burn sender is mallory', async function () {
    // set up pre-conditions
    var amount = 11;
    var burnAmount = -1;
    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    await token.mint(minterAccount, amount, { from: minterAccount });
    var setup = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': 0 },
      { 'variable': 'balances.minterAccount', 'expectedValue': amount },
      { 'variable': 'totalSupply', 'expectedValue': amount },
      { 'variable': 'paused', 'expectedValue': false }
    ]
    await checkVariables(setup);

    // now burn the tokens
    await expectThrow(token.burn(burnAmount, { from: arbitraryAccount }))

    // state should be unchanged
    await checkVariables(setup)
  });

  it('burn while paused', async function () {
    // set up pre-conditions
    var amount = 11;
    var burnAmount = 11;
    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    await token.mint(minterAccount, amount, { from: minterAccount });
    await token.pause({ from: pauserAccount });
    var setup = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': 0 },
      { 'variable': 'balances.minterAccount', 'expectedValue': amount },
      { 'variable': 'totalSupply', 'expectedValue': amount },
      { 'variable': 'paused', 'expectedValue': true }
    ]
    await checkVariables(setup);

    // now burn the tokens
    await expectThrow(token.burn(burnAmount, { from: minterAccount }))

    // state should be unchanged
    await checkVariables(setup)
  });

  it('burn while minter blacklisted', async function () {
    // set up pre-conditions
    var amount = 11;
    var burnAmount = 11;
    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    await token.mint(minterAccount, amount, { from: minterAccount });
    await token.blacklist(minterAccount, { from: blacklisterAccount })
    var setup = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': 0 },
      { 'variable': 'balances.minterAccount', 'expectedValue': amount },
      { 'variable': 'paused', 'expectedValue': false },
      { 'variable': 'totalSupply', 'expectedValue': amount },
      { 'variable': 'isAccountBlacklisted.minterAccount', 'expectedValue': true },
    ]
    await checkVariables(setup);

    // now burn the tokens
    await expectThrow(token.burn(burnAmount, { from: minterAccount }))

    // state should be unchanged
    await checkVariables(setup)
  });

  it('burn after removeMinter', async function () {
    // set up pre-conditions
    var amount = 11;
    var burnAmount = 11;
    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    await token.mint(minterAccount, amount, { from: minterAccount });
    await token.removeMinter(minterAccount, { from: masterMinterAccount });
    var setup = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': false },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': 0 },
      { 'variable': 'balances.minterAccount', 'expectedValue': amount },
      { 'variable': 'totalSupply', 'expectedValue': amount },
      { 'variable': 'paused', 'expectedValue': false },
    ]
    await checkVariables(setup);

    // now burn the tokens
    await expectThrow(token.burn(burnAmount, { from: minterAccount }))

    // state should be unchanged
    await checkVariables(setup)
  });

});