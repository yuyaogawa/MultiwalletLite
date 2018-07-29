/*******************************************************/
// 2018-04-21 by Yuya Ogawa
//
// To implement Litecoin, there are something that you have to know.
// * This Litecoin wallet is used BitcoinJS library instead of Litecore-lib which does
//   not support pure Javascript. Litecore-lib can be run on only Node.js.
// * Chain.so is used for APIs( get Balacne, send Transaction, get LTC price and realtime update).
// * The mining fee is 200 litoshis per byte. There is no Api to get the litecoin fee.
// * OP_Return is available but there are few information how to deal with it.
//   So, I removed this function from Litecoin wallet.
// * There is no validatation for Litecoin address currently.
// * dustThreshold is 54600 which is $0.04USD (2017/11/20)
// * Realtime update is available if you use Pusher JavaScript Library v2.1.6.
//   Do not use latest version of pusher library because it does not support for chain.so server...
// * Only Non P2SH address is supported.
//
// @TODO
// * Bitcoin.address.fromBase58Check : When does it return 48. What does 48 mean?
//                                     What litecoin address does it support?
// * Send function                   : Sometimes it does not work...
// * Reduce response time            : As my research for the slow response time, it is caused by DXW_APP.php
//
/*******************************************************/


    const ERROR = "ERROR";
    const SUCCESS = "SUCCESS";
    const WRONGPASSWORD = "WRONGPASSWORD";
    
    const url_currency = 'https://blockchain.info/ticker';
    var url_utxo = 'https://chain.so/api/v2/get_tx_unspent/LTC/';
    var url_send = 'https://chain.so//api/v2/send_tx/LTC';
    var logo = './css/litecoin-logo.png';
    var logoLTC = './css/litecoin-logo.png';
    var logoBTC = './css/Bitcoin1.png';
    var logoETH = './css/coin-eth.png';
    var url_addrLTC = 'https://api.blockcypher.com/v1/ltc/main/addrs/'
    //var url_addrBTC = 'https://api.blockcypher.com/v1/btc/main/addrs/'
    var url_addrBTC = 'https://api.blockcypher.com/v1/btc/main/addrs/'
    var url_addrETH = 'https://api.blockcypher.com/v1/eth/main/addrs/'
    var url_feeBTC = 'https://api.blockcypher.com/v1/btc/main';
    var url_feeLTC = 'https://api.blockcypher.com/v1/ltc/main';
    var url_feeETH = 'https://api.blockcypher.com/v1/eth/main';
    var url_sendETH = 'https://api.etherscan.io/api?module=proxy&action=eth_sendRawTransaction&hex=0x';
    var apikey = '&apikey=6DXXSKW9TX3WJ7SQTEH7KWT3YAABIJVVKJ';
    const url_prices = 'https://min-api.cryptocompare.com/data/pricemulti?fsyms=ETH,LTC&tsyms=BTC';
    const url_qr = "https://chart.googleapis.com/chart?cht=qr&chs=200x200&chl=http://dexcoin.ca/litecoin/index.html%23";
    const url_receiving = "https://chart.googleapis.com/chart?cht=qr&chs=200x200&chl=bitcoin%3A";
    const url_dex = "https://dexcoin.ca/api/DXW_API.php";
    
    const MSG_BALANCE = "Sorry, we can't show your bitcoin balance at this moment because the third party didn't reply. Try to refresh your browser.";
    const MSG_HISTORY = "Sorry, we can't show your transaction history at this moment because the third party didn't reply. Try to refresh your browser.";
    const MSG_SOCKET = "Sorry, we can't connect the third party at this moment because the third party didn't reply. Try to refresh your browser.";
    const MSG_FEE = "Sorry, we can't show recommended mining fees at this moment because the third party didn't reply. Try to refresh your browser.";
    const MSG_CURRENCY = "Sorry, we can't show currency at this moment because the third party didn't reply. Try to refresh your browser.";
    const MSG_INVALIDADDR = "Receiving address is invalid.";
    const MSG_MEMOPOOL = "One of outputs is dust.";
    const MSG_UNKNOWN_ERROR1 = "Sorry, we can't estimate the transaction fee at this moment because the third party didn't reply.";
    const MSG_UNKNOWN_ERROR2 = "Sorry, we can't make the transaction at this moment because the third party didn't reply.";
    const MSG_INEFFICIENT_FUNDS = "Inefficient funds"
    const MSG_NOFEE = "Not enougth BTC";
    const TIMEOUT = 10000 // timeout for APIs and 10000 = 10 secounds
    var Mnemonic = require('bitcore-mnemonic');
    var address;
    var wif;
    var keyPairBTC;
    var keyPairLTC;
    var keyPairETH;
    var addrBTC;
    var addrLTC;
    var addrETH;
    var balanceBTC;
    var balanceLTC;
    var balanceETH;
    var tx;
    var nonce;

    var useFiat = false;
    var currency;
    var fiatvalue;
    var objCurrency;
    var sym;
    //var balance = 0;
    var estsize;
    var message;
    var password = "";
    var hash;
    var newurl;
    var code;
    var Mseed;
    var passChksum;
    var fee = 50;// We use a API to get mining fees. 50 satoshis per byte is the fee just in case that the API won't return the fess.
    var feeLTC = 0;
    var feeBTC = 0;
    var feeETH = 0;
    var lat = 0;
    var lng = 0;
    var alt = 0;
    var jsonString = '{"Documentation":{"REQ":"INITIALIZE","REP":" ","LOG":"Login"}}' ;
    var jsonArray = JSON.parse ( jsonString );
    jsonArray.Documentation.REQ='INITIALIZE';
    //Litecoin
    var network;
    var keyPair;
    const FEE_PER_BYTE = 200;
    var txsize = 250;// Dummy txsize in order to calc
    var price_btc;
    const dustThreshold = 54600;

    var myCrypto = "LTC";
    var mySymbol = "Ł";
    var historyLTCFlg = false;
    var historyBTCFlg = false;
    var historyETHFlg = false;
    var feeLTC_high = 0;
    var feeLTC_medium = 0;
    var feeLTC_low = 0;
    var feeBTC_high = 0;
    var feeBTC_medium = 0;
    var feeBTC_low = 0;
    var feeETH_high = 0;
    var feeETH_medium = 0;
    var feeETH_low = 0;
    var redeemScriptBTC;
    var redeemScriptLTC;
    var txb;

    //Ethereum
    //var hdkey = new ethereumjs.WalletHD;

    // We use cookie to just store your currency. USD is the default currency.
    if (readCookie("currency") != ""){
        this.currency = readCookie("currency");
    }else{
        this.currency = 'USD';
    }
    // Set up Global functions
    dex = window.dex = {
        "useFiat": false,
        "useFiat2": false,
        "regExp": function(str){
            var regex = /^[a-z_]*$/;
            if(str.match(regex)){
                return true;
            }else{
                return false;
            }
        },
        "setCurrency": function (currency){
            setCookie("currency", currency, 100);
        },
        "getFiatPrefix": function(){
            switch ( currency )
            {
                case "AUD":
                case "USD":
                case "CAD":
                case "CLP":
                case "HKD":
                case "NZD":
                case "SGD":
                    return "$";
                    break;
                case "BRL":
                    return "R$"; 
                case "CHF":
                    return "CHF";
                case "CNY":
                    return "¥";
                case "DKK":
                    return "kr";
                case "EUR":
                    return "€";
                case "GBP":
                    return "£";
                case "INR":
                    return "";
                case "ISK":
                    return "kr";
                case "JPY":
                    return "¥";
                case "KRW":
                    return "₩";
                case "PLN":
                    return "zł";
                case "RUB":
                    return "RUB";
                case "SEK":
                    return "kr";
                case "THB":
                    return "TŁ";
                case "TWD":
                    return "NT$";
                default:
                    return "$";
            }
        },
        "amountFiatValue": function (){
            var amount = $("#txtAmount").val();
            amount = parseFloat(amount);

            if (!amount){
                amount = 0;
            }
            if ( dex.useFiat ){
                var btcValue = amount / fiatvalue;
                $("#fiatPrice").html("(" + mySymbol + btcFormat( btcValue ) + ")");
            } else {
                var fiatValue = fiatvalue * amount;
                fiatValue = fiatValue.toFixed(2);
                $("#fiatPrice").html("(" + this.getFiatPrefix() + formatMoney(fiatValue) + currency + ")");
            }
        },
        "amountFiatValue2": function (){
            var amount = $("#Recamount").val();
            amount = parseFloat(amount);

            if (!amount){
                amount = 0;
            }
            if ( dex.useFiat2 ){
                var btcValue = amount / fiatvalue;
                $("#fiatPrice2").html("(" + mySymbol + btcFormat( btcValue ) + ")");
            } else {
                var fiatValue = fiatvalue * amount;
                fiatValue = fiatValue.toFixed(2);
                $("#fiatPrice2").html("(" + this.getFiatPrefix() + formatMoney(fiatValue) + currency + ")");
            }
        },
        "amountFiatValue3": function (btc){
            var amount = btc;
            amount = parseFloat(amount);

            if (!amount){
                amount = 0;
            }
            var fiatValue = fiatvalue * amount;
            fiatValue = fiatValue.toFixed(2);
            $("#fiatPrice3").html("(" + this.getFiatPrefix() + formatMoney(fiatValue) + currency + ")");
        },
        "checkAddress": function (address){
            try
            {
                Bitcoin.address.toOutputScript(address, network);
                return true;
                /**
                var res = Bitcoin.address.fromBase58Check(address);
                var version = res.version;
                if (myCrypto == 'BTC'){
                    if(version == 0|| version == 5 )
                      return true;
                }else if(myCrypto == 'LTC'){
                    // 5  is for addresses start with 3( p2sh address)
                    // 48 is for addresses start with L( standard address)
                    // 50 is for addresses start with M( segwit address)
                    // Also, p2sh and segwit are interchangable
                    if(version == 5 || version == 48 || version == 50 )
                        return true;
                }
                */
            }
            catch (err)
            {
                return false;
            }
        },
        "changeType": function (){
            if ( $("#changeType .addonBox").html() == mySymbol )
            {
                $("#changeType .addonBox").html( dex.getFiatPrefix() );
                dex.useFiat = true;
                dex.amountFiatValue();
                $("#txtAmount").focus();
            } else {
                $("#changeType .addonBox").html(mySymbol);
                dex.useFiat = false;
                dex.amountFiatValue();
                $("#txtAmount").focus();
            }
            if ( $("#changeType2 .addonBox").html() == mySymbol )
            {
                $("#changeType2 .addonBox").html( dex.getFiatPrefix() );
                dex.useFiat = true;
                dex.amountFiatValue();
                $("#Recamount").focus();
            } else {
                $("#changeType2 .addonBox").html(mySymbol);
                dex.useFiat = false;
                dex.amountFiatValue();
                $("#Recamount").focus();
            }
        }
    };
    // Set up EventListener
    $(document).on("click", '#choiceCurrency', function (event){
        $("#settingsCurrency").show();
        $("#settingsChoices").hide();
        //$("#settingsTitleText").html( "Set Currency" );
    });
    $(document).on("click", '#settings', function (event){
        //$("#defaultFeePlaceholder").text(0);
        $("#settingsChoices").show();
        $("#settingsModal").modal("show");
        $("#settingsCurrency, #settingsBackup").hide();
        //$("#settingsTitleText").html( "Settings" );
        //$("#settingModal").modal("show");
    }); 
    $(document).on("change", '#currencySelect', function (event){
        currency = $(this).val();
        if ( dex.useFiat ){
            $(".addonBox").html( dex.getFiatPrefix() );
        }
        dex.setCurrency(currency);
        fiatvalue = objCurrency[currency].last;
        sym = objCurrency[currency].symbol;
        //$('#currency').text(' ≈ ' + sym + (balance*fiatvalue).toFixed(2) + currency);
        $('#currencyLTC').text(' ≈ ' + sym + (balanceLTC*objCurrency[currency].ltc).toFixed(2) + currency);
        $('#currencyBTC').text(' ≈ ' + sym + (balanceBTC*objCurrency[currency].btc).toFixed(2) + currency);
        $('#currencyETH').text(' ≈ ' + sym + (balanceETH*objCurrency[currency].eth).toFixed(2) + currency);
        $('#currencyLTC2').text(' ≈ ' + sym + (balanceLTC*objCurrency[currency].ltc).toFixed(2) + currency);
        $('#currencyBTC2').text(' ≈ ' + sym + (balanceBTC*objCurrency[currency].btc).toFixed(2) + currency);
        $('#currencyETH2').text(' ≈ ' + sym + (balanceETH*objCurrency[currency].eth).toFixed(2) + currency);
        $('#currencyALL').text(' ≈ ' + sym + (balanceLTC*objCurrency[currency].ltc+ balanceBTC*objCurrency[currency].btc + balanceETH*objCurrency[currency].eth).toFixed(2) + currency);
    }); 
    $(document).on("change", '#feeSelect', function (event){
        var feeSelect = parseInt($(this).val());
        fee = parseFloat(feeSelect);
        /*
        if(myCrypto == 'LTC'){
            feeLTC = parseFloat(feeSelect);
        }else if(myCrypto == 'BTC'){
            feeBTC = parseFloat(feeSelect);
        }else{
            feeETH = parseFloat(feeSelect);
        }
        */
    });
    $(document).on("click", '#choiceBackup', function (event){
        var url = window.location.hash.substring(1);
        var arr = url.split('!');
        // If a user sets up password, go to the first api.
        // If not, go to the second api.
        if(arr.length > 1){
            $("#qrUrl4Bk").attr("src", url_qr + arr[0] + "%21" + arr[1] + "&chld=H|0");
        }else{
            $("#qrUrl4Bk").attr("src", url_qr + arr[0] + "&chld=H|0");
        }
        
        $("#settingsBackup").show();
        $("#settingsChoices").hide();

        $("#txtMnemonic4Bk").val( code );
        $("#txtPassword4Bk").val( password );
        $("#backupUrl").val( window.location );
        $("#backupPubkeyBTC").val( addrBTC.toString() );
        $("#backupPubkeyLTC").val( addrLTC.toString() );
        $("#backupPubkeyETH").val( addrETH.toString() );
    });
    $(document).on("click", '#changeType', function (e){
        if ( $("#changeType .addonBox").html() == mySymbol )
        {
            $("#changeType .addonBox").html( dex.getFiatPrefix() );
            dex.useFiat = true;
            dex.amountFiatValue();
            $("#txtAmount").focus();
        } else {
            $("#changeType .addonBox").html(mySymbol);
            dex.useFiat = false;
            dex.amountFiatValue();
            $("#txtAmount").focus();
        }
    });
    $(document).on("click", '#changeType2', function (e){
        if ( $("#changeType2 .addonBox").html() == mySymbol )
        {
            $("#changeType2 .addonBox").html( dex.getFiatPrefix() );
            dex.useFiat2 = true;
            dex.amountFiatValue2();
            $("#Recamount").focus();
        } else {
            $("#changeType2 .addonBox").html(mySymbol);
            dex.useFiat2 = false;
            dex.amountFiatValue2();
            $("#Recamount").focus();
        }
    });
    $(document).on("keyup", '#txtAmount', function (event){
        amount = $(this).val();
        if ( dex.useFiat ){
            amount = parseFloat(amount) / fiatvalue;
            amount = btcFormat(amount);
        }
        if ( $(this).val().length > 0 ){
            dex.amountFiatValue();
        }else{
            $("#fiatPrice").html("");
            $(this).css({"font-size":"14px"});
        }
        if(validateInputs()){
            $("#sendBtn").removeAttr("disabled");
        }else{
            $("#sendBtn").attr("disabled", "disabled").html("CONFIRM");
        }
    });
    $(document).on("keyup", '#sendAddr', function (event){
        if(validateInputs()){
            $("#sendBtn").removeAttr("disabled");
        }else{
            $("#sendBtn").attr("disabled", "disabled").html("CONFIRM");
        }
    });
    $(document).on("keyup", '#Recamount', function (event){
        amount = $(this).val();

        if ( dex.useFiat2 )
        {
            amount = parseFloat( amount ) / fiatvalue;
            amount = btcFormat( amount );
        }
        if ( $(this).val().length > 0 )
        {
            dex.amountFiatValue2();
        }
        else
        {
            $("#fiatPrice2").html("");
            $(this).css({"font-size":"14px"});
        }
    });
    $(document).on("click", '#openSend', function (event){
        $("#receive").collapse('hide');
    }); 
    $(document).on("click", '#openReceive', function (event){
        $("#send").collapse('hide');
    }); 
    $(document).on("click", '#sendBtn', function (event){
        $("#fee").text(fee);
        $("#miningfee").text((fee * 200 * 1e-8).toFixed(8) + myCrypto);
        if(myCrypto == 'ETH'){
            calcFeeETH();
        }else{
            calcFee();
        }
    });
    $(document).on("click", '#confrim', function (event){
        if(myCrypto == 'ETH'){
            sendEthereum();
        }else{
            sendBitcoin();
        }
    });
    $(document).on("click", '#setupPassword', function (event){
        $("#passwordBox").show();
        $("#txtPassword").focus();
    });
    $(document).on("click", '#btnPrint', function (event){
        var elem = document.getElementById("settingsBackup");
        var domClone = elem.cloneNode(true);
        var $printSection = document.getElementById("printSection");
        if (!$printSection) {
            var $printSection = document.createElement("div");
            $printSection.id = "printSection";
            document.body.appendChild($printSection);
        }
        $printSection.innerHTML = "";
        $printSection.appendChild(domClone);
        window.print();
    });
    $(document).on("click", "[data-hide]", function(event){
        $(this).closest("." + $(this).attr("data-hide")).hide();
    });
    $(document).on("click", '#infoFee', function(event){
        $("#infoModal").modal("show");
        openTab(event, 'SEND');
    });
    $(document).on("keypress", "#txtPassword", function(event){
      if(event.keyCode == 13){
        $('#loginBtn').click();
      }
    });
    $(document).on("keypress","#chkPassword", function(event){
      if(event.keyCode == 13){
        $('#loginBtn2').click();
      }
    });

    //getLocation();

    // Login process starts from here.
    // Look at the documentation for login process(Login.xls).
    // window.location is a function to get strings of URL
    // Code for "If # exists"
    hash = window.location.hash.substring(1);
    if(hash.length > 0){
        // Code for "If ! exists"
        if (hash.indexOf("!") > 0){
            // (1) Show password view
            $(document).ready(function(){
                $("#enterPassword").modal("show");
                $('#enterPassword').on('shown.bs.modal', function () {
                    $('#chkPassword').focus();
                })
            });
        }else{
            // (3) Generate an address with Mnemonic( which retrieved from URL after #tag).
            generateAddress3();
        }
    }else{
        // Ask a user if they want to set up password
        // If they say Yes, (4) Show setup password view and after setting up it (5) Generate an address with new Mnemonic + password.
        // If they say No,  (6) Generate and address with new Mnemonic + password.
        $(document).ready(function(){
            $("#passwordModal").modal("show");
            //$("#passwordModal").draggable({
            //  handle: ".modal-header"
            //});
        });
    }

/********************** Functions*********************************/
    // This function controls logins to generate addresses.
    // Use "Promise" to call createAddress() so that left of functions will be pending until an address is created.
    // This is a good example to use "Promise" and "Then" function.
    // Do not wirte code looks like below because there is no promise that getBalance will be excuted after creating an address.
    // Bad example is here
    //    createAddress();
    //    getBalance(address);
    //    getTxHistory(address); 
    function generateAddress2(){
        /**if(dex.regExp(hash)){
            js_GetEncryption("ENCRYPT2",hash);
        }else{
            js_GetEncryption("DECRYPT",hash);
        }**/
        //js_GetServerInfo("LOGIN");
        $.when(createAddress()).then(
            getCurrency(),
            getFeeLTC(),
            getFeeBTC(),
            getFeeETH()
        );
    }
    function generateAddress3(){
        /**if(dex.regExp(hash)){
            js_GetEncryption("ENCRYPT2",hash);
        }else{
            js_GetEncryption("DECRYPT",hash);
        }**/
        //js_GetServerInfo("LOGIN");
        $.when(createAddress()).then(
            getCurrency(),
            getFeeLTC(),
            getFeeBTC(),
            getFeeETH()
        );
    }
    function generateAddress5(){
        // (5) Generate an address with new Mnemonic + password.
        password = $("#txtPassword").val();
        $.when(createAddress()).then(
            getCurrency(),
            getFeeLTC(),
            getFeeBTC(),
            getFeeETH()
        );
        //js_GetEncryption("ENCRYPT",newurl);
        //js_GetServerInfo("CREATE");
    }
    function generateAddress6(){
        // Code for (6)
        $.when(createAddress()).then(
                getCurrency(),
                getFeeLTC(),
                getFeeBTC(),
                getFeeETH()
            );
        //js_GetEncryption("ENCRYPT",newurl);
        //js_GetServerInfo("CREATE");
    }
    // Check the password and if it is correct, (2) Generate an address with Mnemonic + password.
    function checkPassword(){
        var hashArr = hash.split("!");
        password = $("#chkPassword").val();
        var userPassHash = Bitcoin.crypto.sha256(new buffer.Buffer(password) );
        var passChk = userPassHash.toString('hex').substring(0, 10);
        if (passChk == hashArr[1]){
            hash = hashArr[0];
            passChksum = passChk;
            generateAddress2();
            $("#enterPassword").modal("hide");
        }else{
            showMessage(WRONGPASSWORD,"Incorrect!");
        }
    }

    function createAddress(){
        var dfd = jQuery.Deferred();

        if(hash.length > 0 ){
            hash = hash.replace(/_/g, " ");
            code = new Mnemonic(hash);
            //If a user has the password, (2) Generate an address with Mnemonic + password.
            //If no, (3) Generate an address with Mnemonics
            if(password.length>0){
                Mseed = code.toHDPrivateKey(password);
            }else{
                Mseed = code.toHDPrivateKey();
            }
        }else{
            // Create a new address
            // If a user wants to set up password, (5) generate an address with new Mnemonic + password
            // If no, (6) Generate an address with new Mnemonic
            if(password.length > 0 ){
                code = new Mnemonic();
                newurl = (code.toString()).replace(/ /g, "_");
                // Codes for Password
                //var userPassHash =  bitcore.crypto.Hash.sha256(new buffer.Buffer(password) );
                // deal with Litecoin
                var userPassHash =  Bitcoin.crypto.sha256(new buffer.Buffer(password) );
                passChksum = userPassHash.toString('hex').substring(0, 10);
                location.replace("#" + newurl + "!" + passChksum);
                Mseed = code.toHDPrivateKey(password);
            }else{
                code = new Mnemonic();
                newurl = (code.toString()).replace(/ /g, "_");
                location.replace("#" + newurl);
                Mseed = code.toHDPrivateKey();
            }
        }

        // We followed the BIP44(https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki)
        var path1 = "m/44'/0'/0'/0/0"
        var path2 = "m/44'/2'/0'/0/0"
        var path3 = "m/44'/60'/0'/0/0"
        var M = code.toSeed();

        var r1 = Bitcoin.HDNode.fromSeedBuffer(M,Bitcoin.networks.bitcoin);
        keyPairBTC = r1.derivePath(path1);
        addrBTC = keyPairBTC.getAddress();
        // Generate SegWit address via P2SH
        var pubKey = keyPairBTC.getPublicKeyBuffer();
        redeemScriptBTC = Bitcoin.script.witnessPubKeyHash.output.encode(Bitcoin.crypto.hash160(pubKey));
        var scriptPubKey = Bitcoin.script.scriptHash.output.encode(Bitcoin.crypto.hash160(redeemScriptBTC));
        var address = Bitcoin.address.fromOutputScript(scriptPubKey,Bitcoin.networks.bitcoin);
        addrBTC = address;

        var r2 = Bitcoin.HDNode.fromSeedBuffer(M,Bitcoin.networks.litecoin);
        keyPairLTC = r2.derivePath(path2);
        addrLTC = keyPairLTC.getAddress();
        // Generate SegWit address via P2SH
        var pubKey2 = keyPairLTC.getPublicKeyBuffer();
        redeemScriptLTC = Bitcoin.script.witnessPubKeyHash.output.encode(Bitcoin.crypto.hash160(pubKey2));
        var scriptPubKey2 = Bitcoin.script.scriptHash.output.encode(Bitcoin.crypto.hash160(redeemScriptLTC));
        var address2 = Bitcoin.address.fromOutputScript(scriptPubKey2,Bitcoin.networks.litecoin);
        addrLTC = address2;

        var r3 = new ethereumjs.WalletHD.fromMasterSeed(M);
        keyPairETH = r3.derivePath(path3);
        addrETH = keyPairETH.getWallet().getAddressString();

        console.log(addrBTC.toString());
        console.log(addrLTC.toString());
        console.log(addrETH);
        getBalanceBTC(addrBTC);
        getBalanceETH(addrETH);
        getBalanceLTC(addrLTC);
        address = addrLTC;

        $(document).ready(function(){
            $('#qrcodeLTC').qrcode({                       //Litecoin Address
                 width:100,
                 height:100,
                 text:addrLTC.toString()
            });
            $('#publicKeyLTC').text(addrLTC.toString());
            $('#cryptoLTC').attr('src', logoLTC);
            $('#qrcodeBTC').qrcode({                       //Bitcoin Address
                 width:100,
                 height:100,
                 text:addrBTC.toString()
            });
            $('#publicKeyBTC').text(addrBTC.toString());
            $('#cryptoBTC').attr('src', logoBTC);
            $('#qrcodeETH').qrcode({                       //Ethereum Address
                 width:100,
                 height:100,
                 text:addrETH.toString()
            });
            $('#publicKeyETH').text(addrETH.toString().substring(2));
            $('#cryptoETH').attr('src', logoETH);

            var hs = '<hr><a target="_blank" href="https://blockchain.info/address/' + addrBTC + '">History</a><hr>';
            $('#historyBTC').append(hs);
            var hs = '<hr><a target="_blank" href="https://insight.litecore.io/address/' + addrLTC + '">History</a></hr>';
            $('#historyLTC').append(hs);
            var hs = '<hr><a target="_blank" href="https://etherscan.io/address/' + addrETH + '">History</a><hr>';
            $('#historyETH').append(hs);

        });

        //dex.pusher(addrLTC);
        //dex.pusher(addrBTC);
        //dex.pusher(addrETH);

        return dfd.promise();
    }
    // No calcFee for Litecoin
    // Calculate mining fees before broadcasting.
    // This fee is not exact same amount of fee when you actually broadcast because we can't calculate before you sign the transaction.
    function calcFee(){
        var send_address = document.getElementById("sendAddr").value;
        var amount = document.getElementById("txtAmount").value;
        var address_tmp;
        if(myCrypto == 'LTC'){
            address_tmp = convert(address);
        }else{
            address_tmp = address;
        }
        // Convert BTC to satoshi;
        if(dex.useFiat){
            amount = parseFloat( amount ) / fiatvalue;
            amount = btcFormat( amount );
        }
        amount = parseInt((amount * 1e8).toFixed(0));
        //Check unspentUtxos
        $.ajax({
            type: "GET",
            //url: url_utxo  + address,
            url: url_utxo  + address_tmp,
            async: true,
            dataType: "json",
        })
        .done(function( json ) {
            var unspents = json.data.txs;
            if(unspents.length > 0){
                // Sum of utxos that you have had so far.
                var balance = 0;
                for (var i=0;i<unspents.length;i++){
                    balance += parseInt((unspents[i]['value'] * 1e8).toFixed(0));
                }
                    // Fee Calc
                    txb = new Bitcoin.TransactionBuilder(network);
                    var sum = 0;
                    var i = 0;
                    while(sum < amount){
                        sum += parseInt((unspents[i]['value'] * 1e8).toFixed(0));
                        txb.addInput(unspents[i].txid, unspents[i].output_no);
                        i++;
                    }
                    txb.addOutput(send_address, amount);// receiving address
                    txb.addOutput(address, (balance - amount));//change address but dummy to deal with uncertain fee.
                    for(var j =0;j<i;j++){
                        //txb.sign(j, keyPair.keyPair);
                        txb.sign(j, keyPair.keyPair,redeemScript,null,parseInt((unspents[j]['value'] * 1e8).toFixed(0)));
                    }
                    txsize = txb.build().toHex().length/2;
                    console.log(txsize);
                    var tx = new Bitcoin.Transaction.fromHex(txb.build().toHex());
                    console.log(tx.virtualSize());
                    txsize = tx.virtualSize();
                    console.log(txb.build().toHex());
                    


                    // Build a transcation
                    // Before building a tx, it has to chech if the balance covers the fee.
                    // Balance >= amount + (fee * txsize)
                    if(balance >= amount + (fee * txsize)){
                        txb = new Bitcoin.TransactionBuilder(network);
                        sum = 0;
                        i = 0;
                        while(sum < amount + (fee * txsize)){
                            sum += parseInt((unspents[i]['value'] * 1e8).toFixed(0));
                            txb.addInput(unspents[i].txid, unspents[i].output_no);
                            i++;
                        }
                        txb.addOutput(send_address, amount);// receiving address
                        txb.addOutput(address, (sum - (amount + (fee * txsize))));//change address
                        for(var j =0;j<i;j++){
                            //txb.sign(j, keyPair.keyPair);
                            txb.sign(j, keyPair.keyPair,redeemScript,null,parseInt((unspents[j]['value'] * 1e8).toFixed(0)));
                        }
                        console.log(txb.build().toHex());
                        $("#sendModal").modal("show");

                        $("#miningfee").text((fee * txsize * 1e-8).toFixed(8));
                        var fiatValue = fiatvalue * fee * txsize * 1e-8;
                        fiatValue = fiatValue.toFixed(2);
                        $("#fiatfeePrice").html("(" + dex.getFiatPrefix() + formatMoney(fiatValue) + currency + ")");
                    }else{
                        //$("#sendModal").modal("hide");
                        showMessage(ERROR,MSG_INEFFICIENT_FUNDS);
                        //removeLoading();
                    }
            }else{
                showMessage(ERROR,MSG_NOFEE);
            }
          })
        .fail(function( xhr, status, errorThrown ) {
            //alert( "Sorry, there was a problem!" );
            //console.log( "Error: " + errorThrown );
            //console.log( "Status: " + status );
            $("#sendModal").modal("hide");
            showMessage(ERROR,MSG_UNKNOWN_ERROR1);
            removeLoading();
          })
          // Code to run regardless of success or failure;
        .always(function( xhr, status ) {
            //alert( "The request is complete!" );
          });
    }
    function calcFeeETH(){
        var send_address = document.getElementById("sendAddr").value;
        var amount = document.getElementById("txtAmount").value;
        // Convert BTC to satoshi;
        if(dex.useFiat){
            amount = parseFloat( amount ) / fiatvalue;
            amount = btcFormat( amount );
        }
        amount = parseInt((amount * 1e18).toFixed(0));
        //amount = amount * 1e-18 // 1ETH = 1e-18wei
        tx = new ethereumjs.Tx(null, 1);
        //console.log(tx);
        // So now we have created a blank transaction but Its not quiet valid yet. We
        // need to add some things to it. Lets start:
        // notice we don't set the `to` field because we are creating a new contract.
        tx.nonce = nonce + 1;
        var gasPrice = fee;
        var gasLimit = 21000;
        var costFee = gasPrice * gasLimit;
        tx.gasPrice = gasPrice;
        tx.gasLimit =  gasLimit;
        tx.value = amount;
        tx.to = new buffer.Buffer(send_address, 'hex');
        console.log(keyPairETH.getWallet().getPrivateKeyString());
        console.log(keyPairETH.getWallet().getAddressString());
        const privateKey = new buffer.Buffer(keyPairETH.getWallet().getPrivateKey(), 'hex');
        tx.sign(privateKey);

        console.log('---Serialized TX----');
        console.log(tx.serialize().toString('hex'));
        console.log('---------------------');
        if(balanceETH * 1e18 >= amount + costFee){
            $("#sendModal").modal("show");
            $("#miningfee").text(costFee * 1e-18 + myCrypto);
            var fiatValue = fiatvalue * costFee * 1e-18;
            fiatValue = fiatValue.toFixed(2);
            $("#fiatfeePrice").html("(" + dex.getFiatPrefix() + formatMoney(fiatValue) + currency + ")");
        }else{
            showMessage(ERROR,MSG_INEFFICIENT_FUNDS);
        }
    }
    function sendEthereum(){
        console.log(tx);
        dispLoading();
        $.ajax({
            type: "POST",
            url: url_sendETH + tx.serialize().toString('hex') + apikey,
            async: true,
            //data: tx.serialize().toString('hex') + apikey
        })
        .done(function( json ) {
            console.log(json);
            removeLoading();
            if(json.hasOwnProperty('error')){
                showMessage(ERROR,json.error.message);
            }else {
                showMessage(SUCCESS,"You successfully sent!");
                console.log(json.result);
                updateBalances();
            }
        })
        .fail(function( xhr, status, errorThrown ) {
            showMessage(ERROR,MSG_MEMOPOOL);
            removeLoading();
        })
        .always(function( xhr, status ) {
            //alert( "The request is complete!" );
            console.log(xhr);
            removeLoading();
        });
    }
    // Send Bitcoin to another address
    function sendBitcoin() {
        dispLoading();
        $.ajax({
                        type: "POST",
                        url: url_send,
                        //url: 'https://api.ei8ht.com.au:9443/3/pushtx',
                        async: true,
                        data: "tx_hex="+txb.build().toHex()
        })
        .done(function( json ) {
            console.log(json);
            removeLoading();
            showMessage(SUCCESS,"You successfully sent!");
            console.log(json.data.txid);
            updateBalances();
        })
        .fail(function( xhr, status, errorThrown ) {
            showMessage(ERROR,MSG_MEMOPOOL);
            removeLoading();
        })
        .always(function( xhr, status ) {
            console.log(xhr);
            removeLoading();
        });
    }
    // Get currency with API
    function getCurrency(){
            var price_ltc;
            var price_eth;
            $.ajax({
                type: "GET",
                url: url_prices,
                async: true,
                dataType: "json",
                timeout:TIMEOUT,
            })
            .done(function( json ) {
                price_ltc = json.LTC.BTC;
                price_eth = json.ETH.BTC;
                $.ajax({
                    type: "GET",
                    url: url_currency,
                    async: true,
                    dataType: "json",
                    timeout:TIMEOUT,
                })
                .done(function( json ) {
                    // Convert BTC to LTC of price
                        $.each(json, function (i, fb) {
                        fb.btc = fb.last;
                        fb.ltc = fb.last * price_ltc;
                        fb.eth = fb.last * price_eth;
                        });
                    objCurrency = json;// Store the json to use settingCurrecny.
                    fiatvalue = json[currency].last;
                    sym = json[currency].symbol;
                    $(document).ready(function(){
                        //$('#currency').text(' ≈ ' + sym + (balance*fiatvalue).toFixed(2) + currency);
                        $('#balanceLTC').text(balanceLTC + ' LTC');
                        $('#balanceBTC').text(balanceBTC + ' BTC');
                        $('#balanceETH').text(balanceETH + ' ETH');
                        $('#currencyLTC').text(' ≈ ' + sym + (balanceLTC*json[currency].ltc).toFixed(2) + currency);
                        $('#currencyBTC').text(' ≈ ' + sym + (balanceBTC*json[currency].btc).toFixed(2) + currency);
                        $('#currencyETH').text(' ≈ ' + sym + (balanceETH*json[currency].eth).toFixed(2) + currency);
                        $('#balanceLTC2').text(balanceLTC + ' LTC');
                        $('#balanceBTC2').text(balanceBTC + ' BTC');
                        $('#balanceETH2').text(balanceETH + ' ETH');
                        $('#currencyLTC2').text(' ≈ ' + sym + (balanceLTC*json[currency].ltc).toFixed(2) + currency);
                        $('#currencyBTC2').text(' ≈ ' + sym + (balanceBTC*json[currency].btc).toFixed(2) + currency);
                        $('#currencyETH2').text(' ≈ ' + sym + (balanceETH*json[currency].eth).toFixed(2) + currency);
                        $('#currencyALL').text(' ≈ ' + sym + (balanceLTC*json[currency].ltc+ balanceBTC*json[currency].btc + balanceETH*json[currency].eth).toFixed(2) + currency);
                        var i;
                        $('#currencySelect').empty();
                        for ( i in json ){
                            $("#currencySelect").append( "<option value='" + i + "'>" + i + "</option>" );
                        }
                    });
                  })
                .fail(function( xhr, status, errorThrown ) {
                    showMessage(ERROR,MSG_CURRENCY);
                  })
                .always(function( xhr, status ) {
                    //alert( "The request is complete!" );
                  });
                })
            .fail(function( xhr, status, errorThrown ) {
                showMessage(ERROR,MSG_CURRENCY);
              })
            .always(function( xhr, status ) {
                //alert( "The request is complete!" );
              });
    }
    // GenerateQRcode by using GoogleAPI
    function generateQRcode(){
        var amount = $("#Recamount").val();
        if ( dex.useFiat2 )
        {
            amount = parseFloat( amount ) / fiatvalue;
            amount = btcFormat( amount );
        }
        $("#receiveQR").attr("src", url_receiving + this.address + "%3Famount%3D" + amount + "&chld=H|0");
        $("#generateAmount").html(amount + myCrypto);
        $("#generateAddress").html(this.address.toString());
        dex.amountFiatValue3(amount);
    }
    //Validate inputs
    function validateInputs(){
        //return true;
            var amount = $("#txtAmount").val();
            var send_address = $("#sendAddr").val();
            var chk;
            var balance = 0;
            if(myCrypto == 'LTC'){
                balance = balanceLTC;
            }else if(myCrypto == 'BTC'){
                balance = balanceBTC;
            }else{
                balance = balanceETH;
            }
            if(send_address.length > 0){
                if(myCrypto != 'ETH'){
                    chk = dex.checkAddress(send_address);
                }else{
                    // Here should be checkEthAddress
                    chk = true;
                }
            }else{
                return false;
            }
            if(chk){
                if ( dex.useFiat ){
                    amount = parseFloat(amount) / fiatvalue;
                    amount = btcFormat(amount);
                }
                if ( amount.length > 0 ){
                    dex.amountFiatValue();
                }else{
                    $("#fiatPrice").html("");
                    $(this).css({"font-size":"14px"});
                }
                if ( parseFloat(amount) > 0 && parseFloat(amount) <= balance){
                    return true;
                } else {
                    return false;
                }
            }else{
                return false;
            }
    }
