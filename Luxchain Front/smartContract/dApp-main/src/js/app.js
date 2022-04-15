App = {
  web3Provider: null,
  contracts: {},
  account: "0x0",

  init: async function() {
    // Load Anything for the website
    return await App.initWeb3();
  },

  initWeb3: async function() {
    // Modern dapp browsers...
    if (window.ethereum) {
      App.web3Provider = window.ethereum;
      try {
        // Request account access
        const accounts = await ethereum.request({
          method: "eth_requestAccounts",
        });
        App.account = accounts[0];
      } catch (error) {
        // User denied account access...
        console.error("User denied account access");
      }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
      App.web3Provider = window.web3.currentProvider;
    }
    // If no injected web3 instance is detected, fall back to Ganache
    else {
      App.web3Provider = new Web3.providers.HttpProvider(
        "http://localhost:7545"
      );
    }
    web3 = new Web3(App.web3Provider);

    web3.eth.getCoinbase(function(err, account) {
      if (err === null) {
        App.account = account;
        // console.log(account);
      }
    });

    return App.initContract();
  },

  initContract: function() {
    $.getJSON("LuxChain.json", function(data) {
      // Get the necessary contract artifact file and instantiate it with truffle-contract
      var LuxChainArtifact = data;
      App.contracts.LuxChain = TruffleContract(LuxChainArtifact);

      // Set the provider for our contract
      App.contracts.LuxChain.setProvider(App.web3Provider);
      App.listernForEvent();
      return App.bindEvents();
    });
  },

  listernForEvent: function() {
    App.contracts.LuxChain.deployed().then(function(instance) {
      instance
        .mintToken(
          {},
          {
            fromBlock: "latest",
            toBlock: "latest",
          }
        )
        .watch(function(error, event) {
          console.log("event triggered", event.args);
        });
    });
  },

  bindEvents: function() {
    $(document).on("click", "#btn-mint", App.mintToken);
    $(document).on("click", "#btn-owner", App.tokenOwner);
    $(document).on("click", "#btn-tran", App.transferToken);
    $(document).on("click", "#btn-serial", App.tokenSerial);
    $(document).on("click", "#btn-supply", App.getSupply);
    $(document).on("click", "#btn-id", App.getTokenId);
    $(document).on("click", "#btn-report", App.reportLost);
    $(document).on("click", "#btn-check", App.checkState);
    $(document).on("click", "#btn-invalid", App.invalidateToken);
    $(document).on("click", "#btn-restore", App.restoreToken);
    $(document).on("click", "#btn-list", App.listTokens);
    $(document).on("click", "#btn-invalidated", App.invalidatedToken);
    window.ethereum.on('accountsChanged', function (accounts) {
      window.location.reload();
    })
  },
  getSupply: async function() {
    App.contracts.LuxChain.deployed().
    then((instance) => {
      return instance.getTotalSupply()
    })
    .then((res) => {
      document.getElementById("supply").innerHTML = res;
    })
  },
  restoreToken: async function() {
    var tkid = document.getElementById("restore").value;
    App.contracts.LuxChain.deployed().
    then((instance) => {
      return instance.restoreToken(tkid, { from: App.account})
    })
    .then((mess) => {
      // console.log(mess)
      alert("Restore the lost Token")
    })
  },
  invalidateToken: async function() {
    var tkid = document.getElementById("invalidate").value;
    App.contracts.LuxChain.deployed().
    then((instance) => {
      return instance.invalidateToken(tkid, { from: App.account})
    })
    .then((mess) => {
      console.log(mess)
      alert("Invalidate Token")
    })
  },
  invalidatedToken: async function() {
    var tkid = document.getElementById("invalidated").value;
    App.contracts.LuxChain.deployed().
    then((instance) => {
      return instance.invalidated(tkid, { from: App.account})
    })
    .then((mess) => {
      console.log(mess)
      alert("Token is invalidated")
    })
  },
  checkState: async function() {
    var tkid = document.getElementById("check").value;
    const states = ["normal", "lost", "invalidating", "invalidate"]
    App.contracts.LuxChain.deployed()
    .then(function(instance) {
      return instance.checkState(tkid)
    })
    .then((state) => {
      console.log(state)
      alert("State of token is " + states[state])
    })
  },
  reportLost: async function() {
    var tkid = document.getElementById("report").value;
    App.contracts.LuxChain.deployed().
    then((instance) => {
      return instance.reportlost(tkid, { from: App.account})
    })
    .then((mess) => {
      console.log(mess)
      alert("Report lost")
    })
  },
  getTokenId: async function() {
    var tkser = document.getElementById("idof").value;
    App.contracts.LuxChain.deployed()
    .then(function(instance) {
      console.log(instance)
      return instance.viewTokenId(tkser)
    })
    .then((add) => {
      (document.getElementById("tkid").innerHTML =
          "The token id is:" + add);
    })
  },

  mintToken: async function() {
    var luxInstance;
    App.contracts.LuxChain.deployed()
      .then(function(instance) {
        luxInstance = instance;
        var tkname = document.getElementById("tk-name").value;
        var tkto = document.getElementById("tk-to").value;
        var tkser = document.getElementById("tk-ser").value;
        return instance.mint(tkto, tkser, tkname, {
          from: App.account,
        });
      })
      .then((mess) => {
        document.getElementById("tk-name").value = " ";
        document.getElementById("tk-to").value = " ";
        document.getElementById("tk-ser").value = " ";
        return luxInstance.getTotalSupply()
      })
      .then((res) => {
        alert("A token is minted, id is " + (res-1))
      })
      .catch(function(err) {
        console.log(err.message);
      });
  },

  tokenOwner: async function() {
    var tkid = document.getElementById("ownerof").value;

    App.contracts.LuxChain.deployed()
      .then(function(instance) {
        return instance.ownerOf(tkid);
      })
      .then(function(add) {
        // console.log(add);
        return (document.getElementById("tk-owner").innerHTML =
          "The owner address is:" + add);
      })
      .catch(function(err) {
        if (err.message === "Internal JSON-RPC error.") {
          alert("There is no such token.");
          document.getElementById("ownerof").value = " ";
        }
        console.log(err);
      });
  },

  tokenSerial: async function() {
    var tkid = document.getElementById("serof").value;

    App.contracts.LuxChain.deployed()
      .then(function(instance) {
        return instance.viewSerialNumber(tkid);
      })
      .then(function(ser) {
        return (document.getElementById("tk-serial").innerHTML =
          "The token serial number is: " + ser);
      })
      .catch(function(err) {
        console.log(err.message);
      });
  },

  transferToken: async function() {
    var tkto = document.getElementById("tk-tranto").value;
    var tkid = document.getElementById("tk-id").value;
    App.contracts.LuxChain.deployed()
      .then(function(instance) {
        console.log(tkto);
        console.log(tkid);
        return instance.transferFrom(App.account, tkto, tkid, {
          from: App.account,
          to: tkto,
        });
      })
      .catch(function(err) {
        console.log(err.message);
      });
  },

  listTokens: async function() {
    var luxInstance;
    const mytokens = [];
    document.getElementById("listToken").innerHTML = "";
    App.contracts.LuxChain.deployed().then(function(instance) {
      luxInstance = instance;
      return instance.getTotalSupply()
    }).then(async(instance) => {
      for (var i = 0; i < instance; i++) {
        var add = await luxInstance.ownerOf(i)
          if (add == App.account) {
            listItem = document.createElement('li')
            listItem.innerHTML = "Token " + i;
            document.getElementById("listToken").appendChild(listItem)
          }
        }
        })

    
    
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
